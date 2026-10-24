import test from 'node:test';
import assert from 'node:assert/strict';
import { harness, NextRequest, user } from './helpers/api-harness.mjs';

async function login(reply) {
  const { load } = harness([reply]);
  const request = new NextRequest('http://localhost:3000/api/auth/login', {
    method: 'POST', headers: { origin: 'http://localhost:3000', 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', password: 'test-password' }),
  });
  return load('src/app/api/auth/[action]/route.ts').POST(request, { params: Promise.resolve({ action: 'login' }) });
}

test('login preserves backend account rejection instead of reporting an outage', async () => {
  const response = await login({ status: 403, body: { success: false, message: 'Please verify your email.', meta: { id: 'diagnostic-id' } } });
  assert.equal(response.status, 403);
  assert.equal((await response.json()).message, 'Please verify your email.');
});

test('customer login explains the admin requirement', async () => {
  const response = await login({ body: { success: true, data: { user, accessToken: 'access', refreshToken: 'refresh' } } });
  assert.equal(response.status, 403);
  assert.equal((await response.json()).message, 'Admin access is required.');
  assert.equal(response.headers.get('set-cookie'), null);
});

test('admin login stores credentials in cookies without exposing tokens in the response', async () => {
  const response = await login({ body: { success: true, data: { user: { ...user, role: 'admin' }, accessToken: 'access', refreshToken: 'refresh' } } });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.data.role, 'admin');
  assert.equal(body.data.accessToken, undefined);
  assert.match(response.headers.get('set-cookie'), /HttpOnly/i);
});

test('connection failure returns a safe error without exposing transport details', async () => {
  const response = await login(new TypeError('fetch failed with private transport details', { cause: { code: 'ECONNRESET' } }));
  assert.equal(response.status, 503);
  assert.equal((await response.json()).message, 'The authentication service is unavailable. Please try again shortly.');
});
