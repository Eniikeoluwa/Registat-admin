import test from 'node:test';
import assert from 'node:assert/strict';
import { harness, request, NextRequest, user } from './helpers/api-harness.mjs';
import { money } from '../src/lib/api/money.ts';
const identity = { ...user, role: 'subAdmin', subAdminRole: 'finance' };
const permissions = ['dashboard:read', 'payments:read', 'payments:reconcile'];

test('staff login uses admin-login and returns the effective permission list', async () => {
  const { load, calls } = harness([{ body: { success: true, data: { user: identity, accessToken: 'access', refreshToken: 'refresh', permissions } } }]);
  const response = await load('src/app/api/auth/[action]/route.ts').POST(new NextRequest('http://localhost:3000/api/auth/login', { method: 'POST', body: JSON.stringify({ email: user.email, password: 'Example1234!' }) }), { params: Promise.resolve({ action: 'login' }) });
  assert.equal(calls[0].url, 'https://backend.test/v1/auth/admin-login');
  assert.deepEqual((await response.json()).data.permissions, permissions);
  assert.equal(response.cookies.get('registat_permissions').httpOnly, true);
});

test('session restores backend-issued permissions bound to the current staff identity', async () => {
  const { load } = harness([], 'subAdmin', undefined, { subAdminRole: 'finance' });
  const current = await load('src/lib/auth/server.ts').session(request('payments/admin', 'GET', undefined, true, 'http://localhost:3000', identity, permissions));
  assert.equal(current.status, 200);
  assert.deepEqual(Array.from(current.user.permissions), permissions);
});

test('tampered or absent permission snapshots require fresh login', async () => {
  for (const cookie of ['registat_access=access-token; registat_refresh=refresh-token', 'registat_access=access-token; registat_refresh=refresh-token; registat_permissions=tampered.signature']) {
    const { load } = harness([], 'subAdmin', undefined, { subAdminRole: 'finance' });
    const current = await load('src/lib/auth/server.ts').session(new NextRequest('http://localhost:3000/api/auth/session', { headers: { cookie } }));
    assert.equal(current.status, 401); assert.equal(current.user, null);
  }
});

test('changing the backend role assignment invalidates an old permission snapshot', async () => {
  const { load } = harness([], 'subAdmin', undefined, { subAdminRole: 'support' });
  const current = await load('src/lib/auth/server.ts').session(request('payments/admin', 'GET', undefined, true, 'http://localhost:3000', identity, permissions));
  assert.equal(current.status, 401);
});

test('token rotation re-signs the permission snapshot for the new refresh token', async () => {
  const { load, calls } = harness([{ body: { success: true, data: { accessToken: 'rotated-access', refreshToken: 'rotated-refresh' } } }], 'subAdmin', undefined, { subAdminRole: 'finance', profileReplies: [{ status: 401, body: { success: false, message: 'Expired access' } }] });
  const current = await load('src/lib/auth/server.ts').session(request('payments/admin', 'GET', undefined, true, 'http://localhost:3000', identity, permissions));
  assert.equal(current.status, 200); assert.equal(current.tokens.refreshToken, 'rotated-refresh');
  assert.equal(calls[1].headers.Authorization, 'Bearer refresh-token');
  const { NextResponse } = await import('next/server.js');
  const response = NextResponse.json({ success: true }); load('src/lib/auth/server.ts').writeTokens(response, current.tokens);
  const cookie = response.cookies.getAll().map(value => `${value.name}=${value.value}`).join('; ');
  const second = await load('src/lib/auth/server.ts').session(new NextRequest('http://localhost:3000/api/auth/session', { headers: { cookie } }));
  assert.equal(second.status, 200); assert.deepEqual(Array.from(second.user.permissions), permissions);
});

test('verification and password reset forward the UUID/email/code contract', async () => {
  const token = '12345678-1234-1234-1234-123456789012';
  for (const [action, body] of [['verify', { email: user.email, token, code: '123456' }], ['reset-password', { email: user.email, token, code: '123456', password: 'Example1234!' }]]) {
    const { load, calls } = harness([{ body: { success: true, message: 'Completed.' } }]);
    const response = await load('src/app/api/auth/[action]/route.ts').POST(new NextRequest(`http://localhost:3000/api/auth/${action}`, { method: 'POST', body: JSON.stringify(body) }), { params: Promise.resolve({ action }) });
    assert.equal(response.status, 200); assert.deepEqual(JSON.parse(calls[0].body), body);
  }
});

test('unverified staff challenge is preserved without creating a login session', async () => {
  const challenge = { token: '12345678-1234-1234-1234-123456789012', email: user.email, type: 'email' };
  const { load } = harness([{ status: 403, body: { success: false, message: 'Verify email.', data: challenge } }]);
  const response = await load('src/app/api/auth/[action]/route.ts').POST(new NextRequest('http://localhost:3000/api/auth/login', { method: 'POST', body: JSON.stringify({ email: user.email, password: 'Example1234!' }) }), { params: Promise.resolve({ action: 'login' }) });
  assert.equal(response.status, 403); assert.deepEqual((await response.json()).data, challenge); assert.equal(response.headers.get('set-cookie'), null);
});

test('dashboard currency strings keep integer precision beyond Number limits', () => {
  assert.equal(money('900719925474099199', 'USD'), '$9,007,199,254,740,991.99');
  assert.equal(money(1250, 'NGN'), 'NGN 12.50');
  assert.equal(money('bad', 'USD'), 'Amount unavailable');
  assert.equal(money(1250, 'invalid'), 'invalid 12.50');
});
