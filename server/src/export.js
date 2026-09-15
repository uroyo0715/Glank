// Pro限定のエクスポート機能。GET /reports と同じフィルター条件で絞り込んだ一覧を
// そのままCSV/PDFで出力する。
import path from 'node:path'
import PDFDocument from 'pdfkit'

// pdfkitの組み込みフォント（Helvetica等）は日本語グリフを含まないため、そのままでは
// タイトル等の日本語が表示できない。Apache-2.0ライセンスのKosugi（Google Fonts）を同梱して埋め込む
// （server/assets/fonts/LICENSE.txt参照）。
const JP_FONT_PATH = path.join(import.meta.dirname, '..', 'assets', 'fonts', 'Kosugi-Regular.ttf')

const CSV_COLUMNS = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: 'タイトル' },
  { key: 'status', label: '状況' },
  { key: 'priority', label: '優先度' },
  { key: 'tags', label: 'タグ' },
  { key: 'who', label: '報告者' },
  { key: 'assignee', label: '対応者' },
  { key: 'build', label: 'ビルド' },
  { key: 'platform', label: 'プラットフォーム' },
  { key: 'createdAt', label: '報告日時' },
]

function csvEscape(value) {
  const s = value == null ? '' : String(value)
  // カンマ・改行・ダブルクォートのいずれかを含む場合だけダブルクォートで囲む（RFC4180）。
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function fieldValue(bug, key) {
  if (key === 'tags') return (bug.tags ?? []).join(' / ')
  return bug[key]
}

/** @returns {string} UTF-8 BOM付き（Excelで開いたときに文字化けしないように）のCSVテキスト */
export function bugsToCsv(bugs) {
  const header = CSV_COLUMNS.map((c) => csvEscape(c.label)).join(',')
  const rows = bugs.map((bug) => CSV_COLUMNS.map((c) => csvEscape(fieldValue(bug, c.key))).join(','))
  return '﻿' + [header, ...rows].join('\r\n')
}

/** @returns {Promise<Buffer>} */
export function bugsToPdf(bugs, { projectName } = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 36 })
    const chunks = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.font(JP_FONT_PATH)
    doc.fontSize(16).text(`バグ報告一覧${projectName ? `（${projectName}）` : ''}`, { align: 'left' })
    doc.moveDown(0.5)
    doc.fontSize(9).fillColor('#666').text(`出力日時: ${new Date().toLocaleString('ja-JP')} / ${bugs.length}件`)
    doc.moveDown(1)

    for (const bug of bugs) {
      doc
        .fillColor('#000')
        .fontSize(11)
        .text(`#${bug.id} ${bug.title}`, { continued: false })
      doc
        .fontSize(9)
        .fillColor('#333')
        .text(
          `状況: ${bug.status} / 優先度: ${bug.priority} / タグ: ${(bug.tags ?? []).join(', ')}\n` +
            `報告者: ${bug.who} / 対応者: ${bug.assignee || '未割り当て'} / ` +
            `ビルド: ${bug.build} / プラットフォーム: ${bug.platform} / 報告日時: ${bug.createdAt || '不明'}`
        )
      doc.moveDown(0.6)
      // ページをまたぐ表組みは崩れやすいので、罫線だけの単純な区切りにしている。
      doc
        .moveTo(doc.x, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .strokeColor('#ddd')
        .stroke()
      doc.moveDown(0.6)
    }

    doc.end()
  })
}
