import test from 'node:test';
import assert from 'node:assert/strict';
import { companyMinorUnits, selectCompanyFields } from '../src/components/admin/design/companyForm.ts';
test('company capital keeps decimal precision and rejects unsafe or invalid input',()=>{
  assert.equal(companyMinorUnits('0.29'),29);
  assert.equal(companyMinorUnits('1000000.01'),100000001);
  assert.equal(companyMinorUnits('90071992547409.91'),Number.MAX_SAFE_INTEGER);
  for(const value of ['-1','1.005','1e6','NaN','','90071992547409.92']) assert.throws(()=>companyMinorUnits(value));
});
test('company wizard step validation includes only the selected contract fields',()=>{
  const schema={type:'object',required:['name','ownerUserId'],properties:{name:{type:'string'},ownerUserId:{type:'string'},people:{type:'array'}}};
  assert.deepEqual(selectCompanyFields(schema,['name','people']),{type:'object',properties:{name:{type:'string'},people:{type:'array'}},required:['name'],additionalProperties:false});
});
