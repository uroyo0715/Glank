import './setup.mjs'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { findOrCreateUser, listProjectsForUser, ensureSampleProjectForUser, SAMPLE_PROJECT_NAME } from '../src/data.js'

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
