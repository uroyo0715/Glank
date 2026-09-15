// プランごとの動画保存期間（Free:14日 / Basic:30日 / Pro:90日、server/src/plans.js参照）を
// 過ぎた報告の動画を自動削除するジョブ。報告そのもの（タイトル・タグ・入力ログ等）は残し、
// 動画ファイルとbugs.videoUrlの参照だけを消す。
//
// self_hostedプロジェクトはバグデータがチーム自前の別DBに置かれるため、プロジェクトを1つずつ
// 巡回してそれぞれのDBクライアント・ストレージ接続先を解決する必要がある（reports.jsの
// requireProjectDbClientと同じ考え方）。1プロジェクトの処理が失敗しても他のプロジェクトを
// 止めないよう、プロジェクト単位でtry/catchする。
import { listAllProjectIds, getProjectRaw, getProjectPlanInfo, listBugsWithExpiredVideos, clearBugVideo } from './data.js'
import { resolveProjectDbClient, resolveProjectStorageConfig } from './projectDataAccess.js'
import { deleteFile } from './storage.js'

/** @returns {Promise<{ projectsChecked: number, videosDeleted: number, errors: number }>} */
export async function runVideoRetentionCleanup() {
  const projectIds = await listAllProjectIds()
  let videosDeleted = 0
  let errors = 0

  for (const projectId of projectIds) {
    try {
      const project = await getProjectRaw(projectId)
      if (!project) continue

      const dbAccess = await resolveProjectDbClient(project)
      if (!dbAccess.ready) continue // ストレージ/DB未設定のプロジェクトは何もない扱いでスキップ
      const storageTarget = resolveProjectStorageConfig(project)
      if (!storageTarget.ready) continue

      const { videoRetentionDays } = await getProjectPlanInfo(projectId)
      const cutoffIso = new Date(Date.now() - videoRetentionDays * 24 * 60 * 60 * 1000).toISOString()

      const expired = await listBugsWithExpiredVideos(dbAccess.client, projectId, cutoffIso)
      for (const bug of expired) {
        await deleteFile(storageTarget, bug.videoUrl)
        await clearBugVideo(dbAccess.client, bug.id)
        videosDeleted += 1
      }
    } catch (err) {
      errors += 1
      console.error(`[Glank] 動画保存期間の自動削除でエラー（projectId=${projectId}）:`, err)
    }
  }

  return { projectsChecked: projectIds.length, videosDeleted, errors }
}

/** server/src/backup.jsのstartBackupScheduleと同じ、setInterval + unrefでの定期実行。 */
export function startVideoRetentionSchedule(intervalMs = 24 * 60 * 60 * 1000) {
  const timer = setInterval(() => {
    runVideoRetentionCleanup()
      .then(({ projectsChecked, videosDeleted, errors }) => {
        if (videosDeleted > 0 || errors > 0) {
          console.log(
            `[Glank] 動画保存期間の自動削除: ${projectsChecked}プロジェクトを確認、` +
              `${videosDeleted}件削除、${errors}件エラー`
          )
        }
      })
      .catch((err) => console.error('[Glank] 動画保存期間の自動削除ジョブが失敗しました:', err))
  }, intervalMs)
  timer.unref()
  return timer
}
