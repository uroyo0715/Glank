// Glankの料金プラン定義。数値（プロジェクト数・メンバー数・動画保存日数）は
// 今後変更される可能性が高いと事前に伝えられているため、ここ一箇所を直せば
// サーバー側の判定・フロントエンドの表示すべてに反映されるようにしている。
// 決済（Stripe連携等）はまだ無く、planの値自体は運営がserver/scripts/set-plan.mjsで
// 手動で切り替える運用（server/scripts/set-managed-allowed.mjsと同じ考え方）。
export const PLAN_LIMITS = {
  free: {
    label: 'Free',
    maxProjects: 2,
    maxMembersPerProject: 3,
    videoRetentionDays: 14,
    proFeatures: false,
  },
  micro: {
    label: 'Micro',
    maxProjects: 3,
    maxMembersPerProject: 10,
    videoRetentionDays: 30,
    proFeatures: false,
  },
  pro: {
    label: 'Pro',
    maxProjects: Infinity,
    maxMembersPerProject: Infinity,
    videoRetentionDays: 90,
    proFeatures: true,
  },
}

export const VALID_PLANS = Object.keys(PLAN_LIMITS)
export const DEFAULT_PLAN = 'free'

/** 不正な値が紛れ込んだ場合もfreeとして扱う（DBの値を信頼しすぎない）。 */
export function getPlanLimits(plan) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS[DEFAULT_PLAN]
}

export function isValidPlan(plan) {
  return VALID_PLANS.includes(plan)
}
