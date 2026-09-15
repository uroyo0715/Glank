// Pro限定のSlack/Discord通知連携。新規報告のたびに、タイトル・タグ・報告者・Glankの
// 詳細ページへのリンクだけを通知する（動画・操作ログの中身は含めない）。
// 通知の送信失敗が報告の作成自体を失敗させることはない（fire-and-forget、失敗時はログのみ）。
import { getProjectNotificationWebhooksDecrypted, getProjectOwnerPlan } from './data.js'
import { FRONTEND_URL } from './auth.js'

function buildReportUrl(projectId, bugId) {
  const base = FRONTEND_URL.endsWith('/') ? FRONTEND_URL : `${FRONTEND_URL}/`
  return `${base}projects/${projectId}/reports/${bugId}`
}

async function postWebhook(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`webhook returned ${res.status}`)
  }
}

/**
 * 新規報告作成後に呼ぶ。プランがProで、かつWebhookが設定されている場合だけ実際に送信する
 * （設定を保存できるのはProのみだが、契約が切れた後もURLが残っている可能性があるため送信時にも
 * 再確認する）。
 */
export async function notifyNewReport(project, bug) {
  const plan = await getProjectOwnerPlan(project.id)
  if (plan !== 'pro') return

  const { slackWebhookUrl, discordWebhookUrl } = await getProjectNotificationWebhooksDecrypted(project.id)
  if (!slackWebhookUrl && !discordWebhookUrl) return

  const reportUrl = buildReportUrl(project.id, bug.id)
  const tagsText = (bug.tags ?? []).join(', ')

  const tasks = []
  if (slackWebhookUrl) {
    tasks.push(
      postWebhook(slackWebhookUrl, {
        text: `新規バグ報告: ${bug.title}\nタグ: ${tagsText}\n報告者: ${bug.who}\n${reportUrl}`,
      }).catch((err) => console.error('[Glank] Slack通知の送信に失敗しました:', err.message))
    )
  }
  if (discordWebhookUrl) {
    tasks.push(
      postWebhook(discordWebhookUrl, {
        content: `**新規バグ報告**: ${bug.title}\nタグ: ${tagsText}\n報告者: ${bug.who}\n${reportUrl}`,
      }).catch((err) => console.error('[Glank] Discord通知の送信に失敗しました:', err.message))
    )
  }
  await Promise.all(tasks)
}
