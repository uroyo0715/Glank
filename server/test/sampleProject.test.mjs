import './setup.mjs'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  findOrCreateUser,
  listProjectsForUser,
  getProjectRaw,
  ensureSampleProjectForUser,
  saveNamedStorageConfig,
  SAMPLE_PROJECT_NAME,
} from '../src/data.js'
import { encryptTursoConfig, encryptR2Config } from '../src/projectDataAccess.js'

const ADMIN_STORAGE_OWNER_EMAIL = 'satoren20020530@gmail.com'

test('findOrCreateUser: a brand-new sign-in gets a GlankSampleGame project automatically', async () => {
  const email = 'new-signup@example.com'
  await findOrCreateUser({ googleId: 'g-sample-1', email, name: 'New User' })

  const projects = await listProjectsForUser(email)
  assert.equal(projects.length, 1)
  assert.equal(projects[0].name, SAMPLE_PROJECT_NAME)
  assert.equal(projects[0].gameEngine, 'unity')
})

test('findOrCreateUser: signing in again does not create a second sample project', async () => {
  const email = 'returning-user@example.com'
  await findOrCreateUser({ googleId: 'g-sample-2', email, name: 'Returning User' })
  await findOrCreateUser({ googleId: 'g-sample-2', email, name: 'Returning User' })

  const projects = await listProjectsForUser(email)
  assert.equal(projects.length, 1, '2回目のサインインでは既存ユーザーとして扱われ、追加作成はされない')
})

test('ensureSampleProjectForUser is idempotent even when called directly', async () => {
  const email = 'direct-call@example.com'
  await findOrCreateUser({ googleId: 'g-sample-3', email, name: 'Direct Call' })

  await ensureSampleProjectForUser(email)
  await ensureSampleProjectForUser(email)

  const projects = await listProjectsForUser(email)
  const sampleProjects = projects.filter((p) => p.name === SAMPLE_PROJECT_NAME)
  assert.equal(sampleProjects.length, 1)
})

test('GlankSampleGame is provisioned with the admin\'s "test" saved storage config, without leaking into other users\' saved-configs list', async () => {
  const tursoConfigEnc = encryptTursoConfig({ url: 'libsql://shared-sample.turso.io', authToken: 'shared-token' })
  const r2ConfigEnc = encryptR2Config({
    endpoint: 'https://shared.r2.cloudflarestorage.com',
    accessKeyId: 'shared-key',
    secretAccessKey: 'shared-secret',
    bucket: 'shared-bucket',
    publicUrl: 'https://pub-shared.r2.dev',
  })
  await saveNamedStorageConfig({ ownerEmail: ADMIN_STORAGE_OWNER_EMAIL, name: 'test', tursoConfigEnc, r2ConfigEnc })

  const email = 'fresh-signup-with-default-storage@example.com'
  await findOrCreateUser({ googleId: 'g-sample-default-storage', email, name: 'Fresh Signup' })

  const projects = await listProjectsForUser(email)
  const sampleProject = projects.find((p) => p.name === SAMPLE_PROJECT_NAME)
  const raw = await getProjectRaw(sampleProject.id)

  assert.equal(raw.tursoConfigEnc, tursoConfigEnc, '運営の「test」設定のTurso接続情報がそのまま複製される')
  assert.equal(raw.r2ConfigEnc, r2ConfigEnc, '運営の「test」設定のR2接続情報がそのまま複製される')
  assert.equal(raw.storageMode, 'self_hosted')
  assert.equal(raw.storageConfiguredFromSavedConfig, true)

  // 新規ユーザー自身の「保存済みの設定から呼び出す」一覧には、運営の設定は決して出てこない
  // （savedStorageConfigsテーブルへは書き込んでおらず、プロジェクト行に直接コピーしているだけのため）。
  const { rows: newUserSavedConfigs } = await (await import('../src/db.js')).db.execute({
    sql: 'SELECT * FROM savedStorageConfigs WHERE ownerEmail = ?',
    args: [email],
  })
  assert.equal(newUserSavedConfigs.length, 0)

  // 従来通り、本人は自分の接続情報で上書きできる。
  const { updateProjectStorageConfig } = await import('../src/data.js')
  const overwritten = await updateProjectStorageConfig(sampleProject.id, {
    tursoConfigEnc: encryptTursoConfig({ url: 'libsql://my-own.turso.io', authToken: 'my-own-token' }),
    storageConfiguredByEmail: email,
    storageConfiguredByName: 'Fresh Signup',
    storageConfiguredFromSavedConfig: false,
  })
  assert.notEqual(overwritten.tursoConfigEnc, tursoConfigEnc)
})
