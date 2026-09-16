import express from 'express'
import path from 'node:path'
import fs from 'node:fs'
import { execSync } from 'node:child_process'
import { ZipArchive } from 'archiver'
import { asyncHandler } from '../asyncHandler.js'

const router = express.Router()

// server/src/routes -> server/src -> server -> リポジトリルート
const REPO_ROOT = path.join(import.meta.dirname, '..', '..', '..')

// ダウンロードしたSDKが本当に最新の修正を含んでいるか、手元で見て分かるようにするための
// バージョン情報。デプロイのたびに変わるgit commit hashをそのまま埋め込む（プロセス起動時に
// 一度だけ取得。リクエストのたびにgitを呼ぶ必要はない）。
// Renderのビルド環境に.gitが無い場合など取得に失敗しても、SDK配布自体は止めたくないので
// 'unknown'にフォールバックする。
const SDK_VERSION = (() => {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: REPO_ROOT }).toString().trim()
  } catch {
    return 'unknown'
  }
})()

// ヘルプページの「SDK連携の使い方」からダウンロードできるようにする、SDKフォルダの実体。
// unity-sdk/godot-sdkはserver/の外（リポジトリ直下）にあるため、Renderのデプロイが
// リポジトリ全体をクローンしていることが前提（Root Directoryはビルド/起動コマンドの
// 実行場所を変えるだけで、他のフォルダも一緒にクローンされる）。
// Godotは今後対応予定でまだ配布していない。godot-sdk/自体はリポジトリに残っているが、
// 未完成のものを配ってしまわないよう配布経路（このAPIとヘルプページのボタン）だけ塞ぐ。
const SDK_SOURCES = {
  unity: {
    dir: path.join(REPO_ROOT, 'unity-sdk', 'Glank'),
    filename: 'glank-unity-sdk.zip',
  },
}

/** 指定ディレクトリをzip化してそのままレスポンスに流す（SDK配布・サンプルプロジェクト配布で共用）。 */
async function sendDirectoryAsZip(res, dir, filename) {
  res.setHeader('Content-Type', 'application/zip')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

  const archive = new ZipArchive({ zlib: { level: 9 } })
  archive.on('error', (err) => {
    // ヘッダーを送信済みのため、エラー時もJSONは返せない。接続を切って諦める。
    console.error('[Glank] zip download error:', err)
    res.destroy(err)
  })
  archive.pipe(res)
  archive.directory(dir, path.basename(dir))
  archive.append(`commit: ${SDK_VERSION}\nbuilt: ${new Date().toISOString()}\n`, {
    name: path.join(path.basename(dir), 'VERSION.txt'),
  })
  await archive.finalize()
}

router.get(
  '/sdk/:engine',
  asyncHandler(async (req, res) => {
    const source = SDK_SOURCES[req.params.engine]
    if (!source) {
      return res.status(404).json({ error: 'unknown engine' })
    }
    if (!fs.existsSync(source.dir)) {
      return res.status(500).json({ error: 'SDK source not found on server' })
    }
    await sendDirectoryAsZip(res, source.dir, source.filename)
  })
)

// 「プロジェクト: GlankSampleGame」からダウンロードできるサンプルUnityプロジェクト一式。
// unity-sample-project/はまだプレースホルダーの中身（README.txtのみ）だが、実際の
// プロジェクトファイル一式に差し替えれば、このエンドポイントはコード変更なしにそのまま
// zipを配布するようになる。
const SAMPLE_PROJECT_DIR = path.join(REPO_ROOT, 'unity-sample-project')

router.get(
  '/sample-project/download',
  asyncHandler(async (req, res) => {
    if (!fs.existsSync(SAMPLE_PROJECT_DIR)) {
      return res.status(500).json({ error: 'sample project source not found on server' })
    }
    await sendDirectoryAsZip(res, SAMPLE_PROJECT_DIR, 'glank-sample-game-unity-project.zip')
  })
)

export default router
