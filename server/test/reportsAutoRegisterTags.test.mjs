import './setup.mjs'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { app } from '../src/app.js'
import {
  findOrCreateUser,
  listProjectsForUser,
  regenerateProjectApiKey,
  getProjectById,
  addProjectCustomOption,
  ensureProjectCustomTags,
  MAX_AUTO_REGISTERED_TAG_LENGTH,
  MAX_CUSTOM_TAGS_PER_PROJECT,
} from '../src/data.js'
import { db } from '../src/db.js'

// SDK（POST /reports）の報告に、Webアプリ側の選択肢（customFieldOptions.tag）に無いタグが
// 付いていた場合、そのタグをWebアプリ側に用意（自動登録）することを確認する。

function buildMultipart(metadata) {
  const form = new FormData()
  form.append('metadata', JSON.stringify(metadata))
  form.append('video', new Blob([new Uint8Array([1, 2, 3])], { type: 'video/mp4' }), 'clip.mp4')
  return form
}

function reportMetadata(tags) {
  return {
    title: 'タグ自動登録のテスト',
    tags,
    desc: '',
    who: 'tester',
    build: '1.0.0',
    platform: 'PC',
    fps: 30,
    durationFrames: 60,
    inputs: [],
  }
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

async function createProjectWithApiKey(suffix) {
  const email = `auto-tags-${suffix}@example.com`
  await findOrCreateUser({ googleId: `g-auto-tags-${suffix}`, email, name: 'Owner' })
  const [project] = await listProjectsForUser(email)
  const apiKey = await regenerateProjectApiKey(project.id)
  // self_hostedのままだとTurso/R2が未設定で409になるため、テストではmanagedを使う。
  await db.execute({ sql: "UPDATE projects SET storageMode = 'managed' WHERE id = ?", args: [project.id] })
  return { project, apiKey }
}

async function postReport(baseUrl, apiKey, tags) {
  return fetch(`${baseUrl}/reports`, {
    method: 'POST',
    headers: { 'X-Glank-Key': apiKey },
    body: buildMultipart(reportMetadata(tags)),
  })
}

test('Webアプリ側に無いタグが付いた報告が来ると、そのタグが独自項目として追加される', async () => {
  const { project, apiKey } = await createProjectWithApiKey('new-tag')
  assert.deepEqual((await getProjectById(project.id)).customFieldOptions.tag, [])

  await withServer(async (baseUrl) => {
    const res = await postReport(baseUrl, apiKey, ['バランス', 'crash'])
    assert.equal(res.status, 201)
  })

  assert.deepEqual((await getProjectById(project.id)).customFieldOptions.tag, ['バランス', 'crash'])
})

test('既にある項目は重複して追加されず、既存の項目も消えない', async () => {
  const { project, apiKey } = await createProjectWithApiKey('existing-tag')
  await addProjectCustomOption(project.id, 'tag', '見た目')

  await withServer(async (baseUrl) => {
    assert.equal((await postReport(baseUrl, apiKey, ['見た目', '新タグ'])).status, 201)
    assert.equal((await postReport(baseUrl, apiKey, ['新タグ'])).status, 201)
  })

  assert.deepEqual((await getProjectById(project.id)).customFieldOptions.tag, ['見た目', '新タグ'])
})

test('長すぎるタグは登録されないが、報告自体は受け付ける', async () => {
  const { project, apiKey } = await createProjectWithApiKey('long-tag')
  const tooLong = 'あ'.repeat(MAX_AUTO_REGISTERED_TAG_LENGTH + 1)

  await withServer(async (baseUrl) => {
    const res = await postReport(baseUrl, apiKey, [tooLong, 'ok'])
    assert.equal(res.status, 201)
    const body = await res.json()
    assert.deepEqual(body.tags, [tooLong, 'ok'])
  })

  assert.deepEqual((await getProjectById(project.id)).customFieldOptions.tag, ['ok'])
})

test('ensureProjectCustomTags: 項目数が上限に達していたら、それ以上は追加しない', async () => {
  const { project } = await createProjectWithApiKey('cap')
  const many = Array.from({ length: MAX_CUSTOM_TAGS_PER_PROJECT + 5 }, (_, i) => `tag-${i}`)

  const added = await ensureProjectCustomTags(project.id, many)
  assert.equal(added.length, MAX_CUSTOM_TAGS_PER_PROJECT)
  assert.deepEqual(await ensureProjectCustomTags(project.id, ['もう入らない']), [])
  assert.equal((await getProjectById(project.id)).customFieldOptions.tag.length, MAX_CUSTOM_TAGS_PER_PROJECT)
})

test('ensureProjectCustomTags: 同時に複数の報告が来ても、追加したタグが片方だけ消えない', async () => {
  const { project } = await createProjectWithApiKey('concurrent')

  await Promise.all([
    ensureProjectCustomTags(project.id, ['a']),
    ensureProjectCustomTags(project.id, ['b']),
    ensureProjectCustomTags(project.id, ['c']),
  ])

  const tags = (await getProjectById(project.id)).customFieldOptions.tag
  assert.deepEqual([...tags].sort(), ['a', 'b', 'c'])
})
