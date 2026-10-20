import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { harness, request, context } from './helpers/api-harness.mjs';

const applicationFixtures = JSON.parse(fs.readFileSync(new URL('./helpers/application-requests.json', import.meta.url), 'utf8'));
const moduleFixtures = JSON.parse(fs.readFileSync(new URL('./helpers/module-requests.json', import.meta.url), 'utf8'));
const adminFixtures = [...applicationFixtures, ...moduleFixtures].filter(item => item.admin);

for (const fixture of adminFixtures) {
  test(`${fixture.method} ${fixture.path} forwards an admin request`, async () => {
    const { handle, calls } = harness([{ body: { success: true, data: { _id: '507f1f77bcf86cd799439011' } } }], 'admin');
    const response = await handle(request(fixture.path, fixture.method, fixture.body ?? undefined), context(fixture.path));
    assert.equal(response.status, 200);
    assert.equal(calls.at(-1).url, `https://backend.test/v1/${fixture.path}`);
    assert.equal(calls.at(-1).headers.Authorization, 'Bearer access-token');
  });
}

test('customer sessions cannot use admin endpoints', async () => {
  for (const fixture of adminFixtures) {
    const { handle, calls } = harness([], 'user');
    const response = await handle(request(fixture.path, fixture.method, fixture.body ?? undefined), context(fixture.path));
    assert.equal(response.status, 403, `${fixture.method} ${fixture.path}`);
    assert.equal(calls.length, 1);
  }
});
