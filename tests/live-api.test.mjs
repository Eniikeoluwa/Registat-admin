import test from 'node:test';
import assert from 'node:assert/strict';
import { harness, request, context } from './helpers/api-harness.mjs';

const reference = 'REGPAY-' + 'a'.repeat(32);
for (const [method, path] of [
  ['GET', 'payments/admin?currency=NGN&status=pending&page=2&limit=20'],
  ['GET', `payments/admin/${reference}`],
  ['POST', `payments/admin/${reference}/verify`],
  ['GET', 'notifications?page=1&limit=3'],
  ['PATCH', 'notifications/507f1f77bcf86cd799439011/read'],
  ['PATCH', 'notifications/read-all'],
]) {
  test(`${method} ${path} forwards the new live contract with server-held credentials`, async () => {
    const { handle, calls } = harness([{ body: { success: true, data: {} } }], 'admin');
    const response = await handle(request(path, method), context(path));
    assert.equal(response.status, 200);
    assert.equal(calls.at(-1).url, `https://backend.test/v1/${path}`);
    assert.equal(calls.at(-1).headers.Authorization, 'Bearer access-token');
    assert.equal(calls.at(-1).method, method);
  });
}

test('new payment routes reject customer sessions and malformed filters', async () => {
  const customer = harness([], 'user');
  assert.equal((await customer.handle(request('payments/admin'), context('payments/admin'))).status, 403);
  for (const path of ['payments/admin?status=paid', 'payments/admin?currency=EUR', 'payments/admin?userId=invalid']) {
    const { handle, calls } = harness([], 'admin');
    assert.equal((await handle(request(path), context(path))).status, 422);
    assert.equal(calls.length, 1);
  }
});

test('public catalogue uses configured live base without requiring a session', async () => {
  const { handle, calls } = harness([{ body: { success: true, data: {} } }], 'admin', { API_URL: ' https://registat-be.onrender.com/v1/// ' });
  const response = await handle(request('catalog', 'GET', undefined, false), context('catalog'));
  assert.equal(response.status, 200);
  assert.equal(calls[0].url, 'https://registat-be.onrender.com/v1/catalog');
  assert.equal(calls[0].headers.Authorization, undefined);
});

test('server environment takes precedence over the legacy public fallback', async () => {
  const { load, calls } = harness([{ body: { success: true } }], 'admin', { API_URL: 'https://server.test/v1', NEXT_PUBLIC_API_URL: 'https://legacy.test/v1' });
  await load('src/lib/auth/server.ts').backend('/catalog');
  assert.equal(calls[0].url, 'https://server.test/v1/catalog');
});

test('missing or invalid backend configuration fails before sending a request', async () => {
  for (const env of [{}, { API_URL: 'file:///tmp/backend' }, { API_URL: 'https://name:password@backend.test/v1' }]) {
    const { load, calls } = harness([], 'admin', env);
    await assert.rejects(load('src/lib/auth/server.ts').backend('/catalog'));
    assert.equal(calls.length, 0);
  }
});
