// アカウント（Googleログインのメールアドレス）のサブスクリプションプランを手動で切り替えるスクリプト。
// 決済機能がまだ無いため、今のところ運営が手動でここを叩いて切り替える想定
// （server/scripts/set-managed-allowed.mjsと同じ考え方）。
//
// 使い方: node server/scripts/set-plan.mjs <email> <free|micro|pro>
import { setUserPlan } from '../src/data.js'
import { VALID_PLANS } from '../src/plans.js'

const [, , email, plan] = process.argv

if (!email || !VALID_PLANS.includes(plan)) {
  console.error(`使い方: node server/scripts/set-plan.mjs <email> <${VALID_PLANS.join('|')}>`)
  process.exit(1)
}

const result = await setUserPlan(email, plan)
if (!result) {
  console.error(`ユーザー ${email} が見つかりません（一度もログインしていないメールアドレスは切り替えられません）`)
  process.exit(1)
}
console.log(`${result.email} のプランを ${result.plan} にしました`)
