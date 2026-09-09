import express from 'express'
import { requireAuth, requireAdmin } from '../auth.js'
import { asyncHandler } from '../asyncHandler.js'
import { getAdminStats } from '../data.js'

const router = express.Router()

router.get(
  '/admin/stats',
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    res.json(await getAdminStats())
  })
)

export default router
