import './setup.mjs'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { app } from '../src/app.js'
import { findOrCreateUser, listProjectsForUser, regenerateProjectApiKey } from '../src/data.js'
import { db } from '../src/db.js'

// POST /reportsはAPIキー（X-Glank-Keyヘッダー）だけでプロジェクトを特定する。以前は
// metadata.projectIdも別途要求していたが、キーがプロジェクトを一意に決められるため廃止した。
// ここでは、metadataにprojectIdを含めなくても送信できること、および無効なキーは401になることを確認する。

function buildMultipart(metadata) {
  const form = new FormData()
  form.append('metadata', JSON.stringify(metadata))
  form.append('video', new Blob([new Uint8Array([1, 2, 3])], { type: 'video/mp4' }), 'clip.mp4')
  return form
}

async function withServer(fn) {
  const server = app.listen(0)
  try {
    await new Promise((resolve) => server.once('listening', resolve))
    const { port } = server.address()
    await fn(`http://127.0.0.1:${port}/api/v1`)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

test('POST /reports: projectIdをmetadataに含めなくても、有効なAPIキーだけで報告できる', async () => {
  const email = 'reports-apikey-owner@example.com'
  await findOrCreateUser({ googleId: 'g-reports-apikey-1', email, name: 'Owner' })
  const [project] = await listProjectsForUser(email)
  const apiKey = await regenerateProjectApiKey(project.id)
  // self_hostedのままだとTurso/R2が未設定で409になるため、テストではmanaged
  // （R2未設定時はローカルディスクへフォールバックする開発用の経路）を使ってDB/保存先を揃える。
  await db.execute({ sql: "UPDATE projects SET storageMode = 'managed' WHERE id = ?", args: [project.id] })

  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/reports`, {
      method: 'POST',
      headers: { 'X-Glank-Key': apiKey },
      body: buildMultipart({
        title: 'テスト報告',
        tags: ['quick'],
        desc: '',
        who: 'tester',
        build: '1.0.0',
        platform: 'PC',
        fps: 30,
        durationFrames: 60,
        inputs: [],
      }),
    })
    assert.equal(res.status, 201)
    const body = await res.json()
    assert.equal(body.title, 'テスト報告')
  })
})

test('POST /reports: X-Glank-Keyが無いと401', async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/reports`, {
      method: 'POST',
      body: buildMultipart({
        title: 'キー無し',
        tags: ['quick'],
        desc: '',
        who: 'tester',
        build: '1.0.0',
        platform: 'PC',
        fps: 30,
        durationFrames: 60,
        inputs: [],
      }),
    })
    assert.equal(res.status, 401)
  })
})

test('POST /reports: 存在しない/不正なAPIキーは401', async () => {
  await withServer(async (baseUrl) => {
    const res = await fetch(`${baseUrl}/reports`, {
      method: 'POST',
      headers: { 'X-Glank-Key': 'this-key-does-not-exist' },
      body: buildMultipart({
        title: '不正キー',
        tags: ['quick'],
        desc: '',
        who: 'tester',
        build: '1.0.0',
        platform: 'PC',
        fps: 30,
        durationFrames: 60,
        inputs: [],
      }),
    })
    assert.equal(res.status, 401)
  })
})
