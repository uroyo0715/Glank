import './setup.mjs'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { db } from '../src/db.js'
import { listBugsWithExpiredVideos, clearBugVideo } from '../src/data.js'
import { getPlanLimits } from '../src/plans.js'

async function insertBug(id, projectId, createdAt, videoUrl) {
  await db.execute({
    sql: `INSERT INTO bugs
            (id, projectId, title, tags, status, description, who, build, platform, priority,
             videoUrl, videoBytes, fps, durationFrames, createdAt)
          VALUES (?, ?, 'サンプル報告', '[]', 'todo', '', 'tester', '0.1', 'PC', 'low', ?, 100, 60, 60, ?)`,
    args: [id, projectId, videoUrl, createdAt],
  })
}

test('listBugsWithExpiredVideos: 動画保存期間（Freeは14日）を過ぎたものだけを対象にする', async () => {
  const projectId = 9001
  const now = Date.now()
  const oldEnoughIso = new Date(now - 20 * 24 * 60 * 60 * 1000).toISOString() // 20日前（14日超過）
  const stillWithinIso = new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString() // 5日前（14日以内）

  await insertBug(90001, projectId, oldEnoughIso, '/uploads/old.mp4')
  await insertBug(90002, projectId, stillWithinIso, '/uploads/recent.mp4')

  const freeRetentionDays = getPlanLimits('free').videoRetentionDays
  const cutoffIso = new Date(now - freeRetentionDays * 24 * 60 * 60 * 1000).toISOString()

  const expired = await listBugsWithExpiredVideos(db, projectId, cutoffIso)
  assert.deepEqual(
    expired.map((b) => b.id),
    [90001],
    '14日を超えた方だけが対象になる'
  )
})

test('videoUrlが空・createdAt未記録の報告は自動削除の対象にしない', async () => {
  const projectId = 9002
  const now = Date.now()
  const veryOldIso = new Date(now - 100 * 24 * 60 * 60 * 1000).toISOString()

  await insertBug(90003, projectId, veryOldIso, '') // 動画なし
  await insertBug(90004, projectId, '', '/uploads/no-createdat.mp4') // createdAt未記録（導入前の古いデータ）

  const cutoffIso = new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString()
  const expired = await listBugsWithExpiredVideos(db, projectId, cutoffIso)
  assert.deepEqual(expired, [], 'videoUrl空・createdAt空はどちらも対象外')
})

test('clearBugVideo: 動画への参照だけを消し、報告本体（タイトル等）は残す', async () => {
  const projectId = 9003
  await insertBug(90005, projectId, new Date().toISOString(), '/uploads/keep-report.mp4')

  await clearBugVideo(db, 90005)

  const { rows } = await db.execute({
    sql: 'SELECT title, videoUrl, videoBytes FROM bugs WHERE id = ?',
    args: [90005],
  })
  assert.equal(rows[0].videoUrl, '')
  assert.equal(rows[0].videoBytes, 0)
  assert.equal(rows[0].title, 'サンプル報告', '報告自体は削除されず残る')
})
