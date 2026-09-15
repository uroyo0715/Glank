import './setup.mjs'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { getPlanLimits, isValidPlan, VALID_PLANS } from '../src/plans.js'

test('getPlanLimits returns the configured limits for each plan', () => {
  assert.equal(getPlanLimits('free').maxProjects, 1)
  assert.equal(getPlanLimits('free').maxMembersPerProject, 3)
  assert.equal(getPlanLimits('free').videoRetentionDays, 14)
  assert.equal(getPlanLimits('free').proFeatures, false)

  assert.equal(getPlanLimits('micro').maxProjects, 3)
  assert.equal(getPlanLimits('micro').maxMembersPerProject, 10)
  assert.equal(getPlanLimits('micro').videoRetentionDays, 30)
  assert.equal(getPlanLimits('micro').proFeatures, false)

  assert.equal(getPlanLimits('pro').maxProjects, Infinity)
  assert.equal(getPlanLimits('pro').maxMembersPerProject, Infinity)
  assert.equal(getPlanLimits('pro').videoRetentionDays, 90)
  assert.equal(getPlanLimits('pro').proFeatures, true)
})

test('getPlanLimits falls back to free for unknown/invalid plan values', () => {
  assert.deepEqual(getPlanLimits('bogus'), getPlanLimits('free'))
  assert.deepEqual(getPlanLimits(undefined), getPlanLimits('free'))
  assert.deepEqual(getPlanLimits(null), getPlanLimits('free'))
})

test('isValidPlan only accepts the three defined plans', () => {
  for (const plan of VALID_PLANS) assert.equal(isValidPlan(plan), true)
  assert.equal(isValidPlan('enterprise'), false)
  assert.equal(isValidPlan(''), false)
})
