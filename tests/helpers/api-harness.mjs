import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import assert from 'node:assert/strict';
const requireRuntime = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const { NextRequest } = requireRuntime('next/server');
export const user = { _id: '507f1f77bcf86cd799439011', name: 'Test User', email: 'test@example.com', role: 'user', isEmailVerified: true, accountStatus: 'active' };
export function harness(replies, role = 'user', env = { API_URL: 'https://backend.test/v1', NODE_ENV: 'test' }) {
  const calls = [], modules = new Map();
  const fetch = async (url, options) => {
    calls.push({ url, ...options });
    if (url.endsWith('/users/me')) return Response.json({ success: true, data: { ...user, role } });
    const reply = replies.shift(); assert.ok(reply, `Unexpected request ${url}`);
    if (reply instanceof Error) throw reply;
    return Response.json(reply.body, { status: reply.status || 200, headers: reply.headers });
  };
  function load(relative) {
    if (modules.has(relative)) return modules.get(relative);
    const filename = path.join(root, relative);
    if (relative.endsWith('.json')) return JSON.parse(fs.readFileSync(filename, 'utf8'));
    const compiledModule = { exports: {} }; modules.set(relative, compiledModule.exports);
    const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    const customRequire = id => id.startsWith('@/') ? load(`src/${id.slice(2)}.ts`) : id.startsWith('.') ? load(path.relative(root, path.resolve(path.dirname(filename), id.endsWith('.json') ? id : `${id}.ts`))) : requireRuntime(id);
    vm.runInNewContext(output, { module: compiledModule, exports: compiledModule.exports, require: customRequire, fetch, process: { env }, Response, Request, Headers, FormData, File, AbortSignal, URL, URLSearchParams, console }, { filename });
    return compiledModule.exports;
  }
  return { load, handle: load('src/app/api/registat/[...path]/route.ts').GET, validation: load('src/lib/api/validation.ts'), calls };
}
export function request(path, method = 'GET', body, authenticated = true, origin = 'http://localhost:3000') {
  return new NextRequest(`http://localhost:3000/api/registat/${path}`, { method, headers: { origin, ...(authenticated ? { cookie: 'registat_access=access-token' } : {}), ...(body !== undefined && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}) }, ...(body !== undefined ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}) });
}
export const context = path => ({ params: Promise.resolve({ path: path.split('?')[0].split('/') }) });
