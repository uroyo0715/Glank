import express from 'express'
import { requireAuth, requireAdmin } from '../auth.js'
import { asyncHandler } from '../asyncHandler.js'
import { getAdminStats, getAccountPlanInfo, setUserPlan } from '../data.js'
import { isValidPlan, VALID_PLANS } from '../plans.js'

const router = express.Router()

router.get(
  '/admin/stats',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json(await getAdminStats())
  })
)

// 管理者は動作確認のため、自分自身のアカウントのプランだけは自由に切り替えられる
// （他人のプランはここからは変更できない。他アカウントの切替は引き続きset-plan.mjs運用）。
router.get(
  '/admin/my-plan',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json(await getAccountPlanInfo(req.user.email))
  })
)

router.patch(
  '/admin/my-plan',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { plan } = req.body ?? {}
    if (!isValidPlan(plan)) {
      return res.status(400).json({ error: `plan must be one of: ${VALID_PLANS.join(', ')}` })
    }
    await setUserPlan(req.user.email, plan)
    res.json(await getAccountPlanInfo(req.user.email))
  })
)

export default router
