import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { startServer, stopServer, getBaseUrl, createAuthCookie } from './helpers.js'

before(startServer)
after(stopServer)

test('GET /auth/me without a session returns 401', async () => {
  const res = await fetch(`${getBaseUrl()}/auth/me`)
  assert.equal(res.status, 401)
})

test('GET /auth/me with a valid session returns the public user shape', async () => {
  const { cookie, user } = await createAuthCookie({ email: 'me@example.com', name: '確認太郎' })
  const res = await fetch(`${getBaseUrl()}/auth/me`, { headers: { Cookie: cookie } })
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.deepEqual(body, { email: user.email, displayName: user.displayName, imageUrl: null })
  assert.equal(body.googleId, undefined) // googleIdは公開レスポンスに含めない
})

test('PATCH /auth/me updates displayName and requires auth', async () => {
  const unauth = await fetch(`${getBaseUrl()}/auth/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName: 'x' }),
  })
  assert.equal(unauth.status, 401)

  const { cookie } = await createAuthCookie()
  const res = await fetch(`${getBaseUrl()}/auth/me`, {
    method: 'PATCH',
    headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName: '新しい名前' }),
  })
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.displayName, '新しい名前')

  const confirmRes = await fetch(`${getBaseUrl()}/auth/me`, { headers: { Cookie: cookie } })
  assert.equal((await confirmRes.json()).displayName, '新しい名前')
})

test('PATCH /auth/me rejects an empty displayName', async () => {
  const { cookie } = await createAuthCookie()
  const res = await fetch(`${getBaseUrl()}/auth/me`, {
    method: 'PATCH',
    headers: { Cookie: cookie, 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName: '   ' }),
  })
  assert.equal(res.status, 400)
})

test('PATCH /auth/me/avatar uploads and sets imageUrl, requires auth and a file', async () => {
  const unauth = await fetch(`${getBaseUrl()}/auth/me/avatar`, { method: 'PATCH', body: new FormData() })
  assert.equal(unauth.status, 401)

  const { cookie } = await createAuthCookie()

  const noFile = await fetch(`${getBaseUrl()}/auth/me/avatar`, {
    method: 'PATCH',
    headers: { Cookie: cookie },
    body: new FormData(),
  })
  assert.equal(noFile.status, 400)

  const form = new FormData()
  form.set('image', new Blob([Buffer.from('fake image bytes')], { type: 'image/png' }), 'avatar.png')
  const res = await fetch(`${getBaseUrl()}/auth/me/avatar`, { method: 'PATCH', headers: { Cookie: cookie }, body: form })
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.ok(body.imageUrl)

  const confirmRes = await fetch(`${getBaseUrl()}/auth/me`, { headers: { Cookie: cookie } })
  assert.equal((await confirmRes.json()).imageUrl, body.imageUrl)
})

test('DELETE /auth/me/avatar clears imageUrl and requires auth', async () => {
  const unauth = await fetch(`${getBaseUrl()}/auth/me/avatar`, { method: 'DELETE' })
  assert.equal(unauth.status, 401)

  const { cookie } = await createAuthCookie()
  const form = new FormData()
  form.set('image', new Blob([Buffer.from('fake image bytes')], { type: 'image/png' }), 'avatar.png')
  await fetch(`${getBaseUrl()}/auth/me/avatar`, { method: 'PATCH', headers: { Cookie: cookie }, body: form })

  const res = await fetch(`${getBaseUrl()}/auth/me/avatar`, { method: 'DELETE', headers: { Cookie: cookie } })
  assert.equal(res.status, 200)
  assert.equal((await res.json()).imageUrl, null)
})

test('POST /auth/logout clears the session so subsequent requests are unauthenticated', async () => {
  const { cookie } = await createAuthCookie()
  const beforeLogout = await fetch(`${getBaseUrl()}/auth/me`, { headers: { Cookie: cookie } })
  assert.equal(beforeLogout.status, 200)

  const logoutRes = await fetch(`${getBaseUrl()}/auth/logout`, { method: 'POST', headers: { Cookie: cookie } })
  assert.equal(logoutRes.status, 204)

  const afterLogout = await fetch(`${getBaseUrl()}/auth/me`, { headers: { Cookie: cookie } })
  assert.equal(afterLogout.status, 401)
})
