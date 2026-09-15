import './setup.mjs'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  findOrCreateUser,
  setUserPlan,
  createProject,
  getAccountPlanInfo,
  getProjectPlanInfo,
  addProjectMembersWithLimit,
} from '../src/data.js'

let googleIdSeq = 0
async function makeUser(email, plan) {
  googleIdSeq += 1
  await findOrCreateUser({ googleId: `g-${googleIdSeq}`, email, name: email })
  if (plan) await setUserPlan(email, plan)
}

test('free plan: exactly 2 projects are allowed, a 3rd would exceed the limit', async () => {
  const email = 'free-projects@example.com'
  await makeUser(email) // 既定でfree

  let info = await getAccountPlanInfo(email)
  assert.equal(info.plan, 'free')
  assert.equal(info.projectsMax, 2)
  assert.equal(info.projectsUsed, 0)
  assert.equal(info.projectsUsed >= info.limits.maxProjects, false, '0件目は上限未満（作成できる）')

  await createProject({ name: 'P1', imageUrl: null, gameEngine: '', creatorEmail: email })
  info = await getAccountPlanInfo(email)
  assert.equal(info.projectsUsed >= info.limits.maxProjects, false, '1件目は上限未満（まだ作成できる）')

  await createProject({ name: 'P2', imageUrl: null, gameEngine: '', creatorEmail: email })

  info = await getAccountPlanInfo(email)
  assert.equal(info.projectsUsed, 2)
  // 上限ちょうど: これ以上は作成不可という判定になるはず（ルート側はこの値で403にする）
  assert.equal(info.projectsUsed >= info.limits.maxProjects, true, '上限ちょうどに達したら以降は不可')
})

test('micro plan: exactly 3 projects are allowed, the 4th exceeds the limit', async () => {
  const email = 'micro-projects@example.com'
  await makeUser(email, 'micro')

  for (let i = 1; i <= 3; i++) {
    const before = await getAccountPlanInfo(email)
    assert.equal(before.projectsUsed >= before.limits.maxProjects, false, `${i}件目は作成できるはず`)
    await createProject({ name: `Micro ${i}`, imageUrl: null, gameEngine: '', creatorEmail: email })
  }

  const after = await getAccountPlanInfo(email)
  assert.equal(after.projectsUsed, 3)
  assert.equal(after.projectsUsed >= after.limits.maxProjects, true, '4件目は上限超えで不可')
})

test('pro plan: project count has no limit', async () => {
  const email = 'pro-projects@example.com'
  await makeUser(email, 'pro')

  for (let i = 1; i <= 5; i++) {
    await createProject({ name: `Pro ${i}`, imageUrl: null, gameEngine: '', creatorEmail: email })
  }

  const info = await getAccountPlanInfo(email)
  assert.equal(info.projectsUsed, 5)
  assert.equal(info.projectsMax, null) // 無制限はnullで表す
  assert.equal(info.limits.maxProjects, Infinity)
})

test('free plan: member cap is 3 per project (owner counts as one), the 4th is rejected', async () => {
  const ownerEmail = 'free-members-owner@example.com'
  await makeUser(ownerEmail) // free

  const project = await createProject({
    name: 'Team Project',
    imageUrl: null,
    gameEngine: '',
    creatorEmail: ownerEmail,
  })

  let info = await getProjectPlanInfo(project.id)
  assert.equal(info.membersMax, 3)
  assert.equal(info.membersUsed, 1, 'オーナー自身が最初のメンバー')

  // ちょうど上限まで（オーナー1人 + 2人 = 3人）は追加できる
  const result1 = await addProjectMembersWithLimit(
    project.id,
    ['a@example.com', 'b@example.com'],
    info.limits.maxMembersPerProject
  )
  assert.deepEqual(result1.added.sort(), ['a@example.com', 'b@example.com'])

  info = await getProjectPlanInfo(project.id)
  assert.equal(info.membersUsed, 3, '上限ちょうど')

  // 4人目（1人追加）は上限超えで拒否される
  const result2 = await addProjectMembersWithLimit(project.id, ['c@example.com'], info.limits.maxMembersPerProject)
  assert.deepEqual(result2, { error: 'limit_exceeded', current: 3, max: 3 })

  // 拒否された場合、実際には追加されていないことも確認する
  info = await getProjectPlanInfo(project.id)
  assert.equal(info.membersUsed, 3)
})

test('member limit check does not double-count emails that are already members', async () => {
  const ownerEmail = 'micro-members-owner@example.com'
  await makeUser(ownerEmail, 'micro') // maxMembersPerProject: 10

  const project = await createProject({
    name: 'Micro Team',
    imageUrl: null,
    gameEngine: '',
    creatorEmail: ownerEmail,
  })

  // オーナー自身を含む配列を渡しても、既存メンバーとして重複カウントされない
  const result = await addProjectMembersWithLimit(project.id, [ownerEmail, 'x@example.com'], 10)
  assert.deepEqual(result.added, ['x@example.com'])

  const info = await getProjectPlanInfo(project.id)
  assert.equal(info.membersUsed, 2)
})
