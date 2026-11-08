import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { harness, request, context, user } from './helpers/api-harness.mjs';
const fixtures = JSON.parse(fs.readFileSync(new URL('./helpers/current-admin-requests.json', import.meta.url), 'utf8'));
for (const fixture of fixtures) {
  test(`current admin contract: ${fixture.method} ${fixture.path}`, async () => {
    const { handle, calls } = harness([{ body: { success: true, data: {} } }], 'superAdmin');
    let body = fixture.body;
    if (fixture.multipart) { body = new FormData(); for (const [key, value] of Object.entries(fixture.body)) body.set(key, value); body.set('file', new File(['document'], 'test.pdf', { type: 'application/pdf' })); }
    const response = await handle(request(fixture.path, fixture.method, body), context(fixture.path));
    assert.equal(response.status, 200, JSON.stringify(await response.json()));
    assert.equal(calls.at(-1).url, `https://backend.test/v1/${fixture.path}`);
    assert.equal(calls.at(-1).method, fixture.method);
    assert.equal(calls.at(-1).headers.Authorization, 'Bearer access-token');
    if (fixture.multipart) assert.equal(calls.at(-1).body.get('userId'), fixture.body.userId);
  });
}

test('staff permissions block unauthorized mutations before forwarding', async () => {
  for (const fixture of fixtures.filter(fixture => fixture.method !== 'GET' && fixture.path !== 'users/me')) {
    const identity = { ...user, role: 'subAdmin', subAdminRole: 'finance' };
    const { handle, calls } = harness([], 'subAdmin', undefined, { subAdminRole: 'finance' });
    const response = await handle(request(fixture.path, fixture.method, fixture.body, true, 'http://localhost:3000', identity, ['dashboard:read']), context(fixture.path));
    assert.equal(response.status, 403, `${fixture.method} ${fixture.path}`);
    assert.equal(calls.length, 1);
  }
});

test('request IDs are validated and cannot bypass the proxy allowlist', async () => {
  const path = 'applications/admin/507f1f77bcf86cd799439012/requests/invalid';
  const { handle, calls } = harness([], 'superAdmin');
  assert.equal((await handle(request(path, 'PATCH', { status: 'resolved', message: 'Reviewed.' }), context(path))).status, 404);
  assert.equal(calls.length, 0);
});

test('multipart delivery validates owner metadata and rejects unknown fields', async () => {
  for (const metadata of [{ category: 'certificate' }, { category: 'certificate', userId: 'invalid' }, { category: 'certificate', userId: user._id, role: 'superAdmin' }]) {
    const { handle, calls } = harness([], 'superAdmin');
    const form = new FormData(); form.set('file', new File(['pdf'], 'test.pdf', { type: 'application/pdf' }));
    for (const [key, value] of Object.entries(metadata)) form.set(key, value);
    const path = 'documents/admin/upload';
    assert.equal((await handle(request(path, 'POST', form), context(path))).status, 422);
    assert.equal(calls.length, 1);
  }
});

test('filing closing rules retain common required fields and conditional requirements', () => {
  const { validation } = harness([]);
  const schemas = validation.schemas;
  assert.ok(validation.validate(schemas.CreateComplianceFiling, { title: 'Annual filing' }).companyId);
  assert.ok(validation.validate(schemas.CreateComplianceFiling, { title: 'Annual filing' }).dueAt);
  assert.ok(validation.validate(schemas.UpdateComplianceFiling, { status: 'completed' }).completionNote);
  assert.ok(validation.validate(schemas.UpdateComplianceFiling, { status: 'archived' }).archiveReason);
  assert.deepEqual(Object.keys(validation.validate(schemas.UpdateComplianceFiling, { status: 'completed', completionNote: 'Manually confirmed.' })), []);
  assert.deepEqual(Object.keys(validation.validate(schemas.AdminCaseUpdate, { assignedTo: null, dueAt: null })), []);
});

test('trademark report publication needs both application and document write permissions', async () => {
  const identity = { ...user, role: 'subAdmin', subAdminRole: 'compliance' };
  const { handle, calls } = harness([], 'subAdmin', undefined, { subAdminRole: 'compliance' });
  const path = `applications/admin/${user._id}/trademark-search-report`;
  const response = await handle(request(path, 'POST', { summary: 'Search completed.', documentIds: [user._id], canProceed: false }, true, 'http://localhost:3000', identity, ['applications:write']), context(path));
  assert.equal(response.status, 403); assert.equal(calls.length, 1);
});

test('finance staff can send documented currency-rate updates for backend authorization', async () => {
  const identity = { ...user, role: 'subAdmin', subAdminRole: 'finance' };
  const { handle, calls } = harness([{ body: { success: true, data: {} } }], 'subAdmin', undefined, { subAdminRole: 'finance' });
  const path = 'catalog/admin/currency-settings';
  const response = await handle(request(path, 'PATCH', { usd_to_ngn: '1500', ngn_to_usd: '1600' }, true, 'http://localhost:3000', identity, ['currency-rates:write']), context(path));
  assert.equal(response.status, 200); assert.equal(calls.at(-1).method, 'PATCH');
});

test('the backend remains authoritative when a permitted action is rejected', async () => {
  const { handle } = harness([{ status: 403, body: { success: false, message: 'Staff permission changed. Sign in again.' } }], 'superAdmin');
  const path = 'compliance/admin';
  const response = await handle(request(path), context(path));
  assert.equal(response.status, 403); assert.equal((await response.json()).message, 'Staff permission changed. Sign in again.');
});
