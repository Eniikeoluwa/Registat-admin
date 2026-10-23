import fs from 'node:fs';

// Accept a saved specification so syncing can also run without network access.
const spec = process.argv[2]
  ? JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
  : await fetch('https://registat-be.onrender.com/v1/registat/openapi.json').then(response => {
    if (!response.ok) throw new Error(`OpenAPI download failed: ${response.status}`);
    return response.json();
  });
const file = new URL('../src/lib/api/contracts.json', import.meta.url);
const contracts = JSON.parse(fs.readFileSync(file, 'utf8'));
// Keep the portal's explicit allowlist; include the newly supported admin modules.
const allowed = new Set(contracts.routes.map(route => `${route.method} ${route.path}`));
const routes = [];
for (const [path, operations] of Object.entries(spec.paths)) {
  if (!path.startsWith('/v1/')) continue;
  const localPath = path.slice(4);
  for (const [method, operation] of Object.entries(operations)) {
    const verb = method.toUpperCase();
    if (!allowed.has(`${verb} ${localPath}`) && !localPath.startsWith('notifications') && !localPath.startsWith('payments/admin')) continue;
    const parameters = [...(operations.parameters || []), ...(operation.parameters || [])].filter(parameter => parameter.in === 'query');
    routes.push({ path: localPath, method: verb, admin: operation['x-access'] === 'admin', public: operation.security?.length === 0, schema: operation.requestBody?.content?.['application/json']?.schema || null, query: { type: 'object', properties: Object.fromEntries(parameters.map(parameter => [parameter.name, parameter.schema])), ...(parameters.some(parameter => parameter.required) ? { required: parameters.filter(parameter => parameter.required).map(parameter => parameter.name) } : {}), additionalProperties: false } });
  }
}
for (const route of contracts.routes) {
  if (!routes.some(item => item.path === route.path && item.method === route.method)) throw new Error(`Documented endpoint missing: ${route.method} ${route.path}`);
}
const schemas = {};
function includeSchema(name) {
  if (schemas[name]) return;
  const schema = spec.components.schemas[name];
  if (!schema) throw new Error(`Documented schema missing: ${name}`);
  schemas[name] = schema;
  includeReferences(schema);
}
function includeReferences(value) {
  if (!value || typeof value !== 'object') return;
  if (value.$ref?.startsWith('#/components/schemas/')) includeSchema(value.$ref.split('/').pop());
  for (const child of Object.values(value)) includeReferences(child);
}
for (const name of Object.keys(contracts.schemas)) includeSchema(name);
for (const route of routes) includeReferences(route);
fs.writeFileSync(file, JSON.stringify({ routes, schemas }, null, 2) + '\n');
