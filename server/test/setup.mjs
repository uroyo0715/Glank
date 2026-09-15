// 各テストファイルの一番最初にimportする（`import '../test/setup.mjs'`）。db.jsは
// importされた時点でトップレベルawaitでマイグレーションを実行してしまうため、それより前に
// 環境変数を設定しておく必要がある。`node --test`はデフォルトでテストファイルごとに
// 別プロセスを起動するため、ファイルごとに一意なDBパスにすれば他のテストと干渉しない。
import crypto from 'node:crypto'
import path from 'node:path'
import os from 'node:os'

process.env.GLANK_DB_PATH = path.join(
  os.tmpdir(),
  `glank-test-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite`
)
process.env.GLANK_ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64')
// 本番のTurso/managed R2に間違って繋がないよう、テストでは常に未設定にしておく
// （db.jsはTURSO_DATABASE_URL未設定ならローカルsqliteファイルを使う）。
delete process.env.TURSO_DATABASE_URL
delete process.env.TURSO_AUTH_TOKEN
delete process.env.R2_ACCOUNT_ID
delete process.env.R2_ACCESS_KEY_ID
delete process.env.R2_SECRET_ACCESS_KEY
delete process.env.R2_BUCKET
