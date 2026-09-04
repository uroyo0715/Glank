// サーバー側で生成されるISO文字列（タイムゾーン情報が無ければUTCとみなす）を、
// 分単位までのローカル日時表記に変換する。
export function formatCreatedAt(iso) {
  const d = new Date(iso.includes('T') || iso.endsWith('Z') ? iso : `${iso}Z`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('ja-JP', { dateStyle: 'short', timeStyle: 'short' })
}
