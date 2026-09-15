// 動画保存期間（プランごとの日数）を過ぎた報告の動画を今すぐ削除する。通常は
// server/src/index.jsが定期実行しているが、動作確認や手動でのやり直しにはこのスクリプトを使う。
//
// 使い方: node server/scripts/cleanup-old-videos.mjs
import { runVideoRetentionCleanup } from '../src/videoRetention.js'

const result = await runVideoRetentionCleanup()
console.log(
  `${result.projectsChecked}プロジェクトを確認、${result.videosDeleted}件の動画を削除、` +
    `${result.errors}件エラー`
)
