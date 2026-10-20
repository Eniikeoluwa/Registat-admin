import test from 'node:test';
import assert from 'node:assert/strict';
import { harness, request, context, user } from './helpers/api-harness.mjs';
const id = '507f1f77bcf86cd799439012';
for (const [method, path, body] of [['GET', 'users/me'], ['GET', 'users/admin?search=Ada&role=user&accountStatus=active&page=2&limit=10&joinedAfter=2026-10-01T00%3A00%3A00Z&joinedBefore=2026-10-18T23%3A59%3A59Z'], ['GET', `users/admin/${id}`], ['PATCH', `users/admin/${id}/status`, { status: 'suspended' }], ['POST', 'users/change-password', { oldPassword: 'CurrentPassword123!', newPassword: 'NewPassword123!' }]]) test(`${method} ${path} forwards the Users contract securely`, async () => {
  const { handle, calls } = harness([{ body: { success: true, data: user } }], 'admin');
  const response = await handle(request(path, method, body), context(path));
  assert.equal(response.status, 200); assert.equal(calls.at(-1).url, `https://backend.test/v1/${path}`); assert.equal(calls.at(-1).headers.Authorization, 'Bearer access-token');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  if (body) assert.deepEqual(JSON.parse(calls.at(-1).body), body);
  if (path === 'users/change-password') for (const name of ['registat_access', 'registat_refresh']) assert.match(response.headers.get('set-cookie'), new RegExp(`${name}=;`));
});
test('admin Users endpoints reject customers and unauthenticated requests', async () => {
  for (const [path, method, body] of [['users/admin', 'GET'], [`users/admin/${id}`, 'GET'], [`users/admin/${id}/status`, 'PATCH', { status: 'banned' }]]) {
    for (const authenticated of [true, false]) {
      const { handle, calls } = harness([]); assert.equal((await handle(request(path, method, body, authenticated), context(path))).status, authenticated ? 403 : 401); assert.equal(calls.length, authenticated ? 1 : 0);
    }
  }
});
test('Users filters reject invalid roles, status, pagination, duplicate and inverted dates', async () => {
  for (const query of ['role=owner', 'accountStatus=inactive', 'page=0', 'limit=101', 'search=', 'search=' + 'a'.repeat(101), 'role=user&role=admin', 'joinedAfter=yesterday', 'joinedAfter=2026-10-19T00%3A00%3A00Z&joinedBefore=2026-10-18T00%3A00%3A00Z']) {
    const path = `users/admin?${query}`; const { handle, calls } = harness([], 'admin'); assert.equal((await handle(request(path), context(path))).status, 422, query); assert.equal(calls.length, 1);
  }
});
test('account status accepts only the documented status field', async () => {
  for (const body of [{}, { status: 'inactive' }, { status: 'active', role: 'admin' }, { status: 'banned', reason: 'example' }]) {
    const { handle, calls } = harness([], 'admin'); const path = `users/admin/${id}/status`;
    assert.equal((await handle(request(path, 'PATCH', body), context(path))).status, 422); assert.equal(calls.length, 1);
  }
});
test('status mutation enforces origin and preserves backend fresh-login/rate-limit failures', async () => {
  const path = `users/admin/${id}/status`;
  const { handle, calls } = harness([], 'admin'); assert.equal((await handle(request(path, 'PATCH', { status: 'active' }, true, 'https://attacker.test'), context(path))).status, 403); assert.equal(calls.length, 0);
  for (const status of [403, 404, 409, 429]) {
    const { handle } = harness([{ status, body: { success: false, message: 'Action denied' }, headers: { 'Retry-After': '60' } }], 'admin');
    const response = await handle(request(path, 'PATCH', { status: 'banned' }), context(path)); assert.equal(response.status, status); assert.equal(response.headers.get('Retry-After'), '60'); assert.equal((await response.json()).message, 'Action denied'); assert.equal(response.headers.has('set-cookie'), false);
  }
});
test('revoking the current admin account clears local session cookies', async () => {
  const path = `users/admin/${user._id}/status`; const { handle } = harness([{ body: { success: true, data: { ...user, accountStatus: 'suspended' } } }], 'admin');
  const response = await handle(request(path, 'PATCH', { status: 'suspended' }), context(path)); assert.equal(response.status, 200); assert.match(response.headers.get('set-cookie'), /registat_access=;/); assert.match(response.headers.get('set-cookie'), /registat_refresh=;/);
});
test('malformed user IDs cannot reach the backend', async () => {
  for (const path of ['users/admin/invalid', 'users/admin/invalid/status']) { const { handle, calls } = harness([], 'admin'); assert.equal((await handle(request(path, path.endsWith('status') ? 'PATCH' : 'GET'), context(path))).status, 404); assert.equal(calls.length, 0); }
});
