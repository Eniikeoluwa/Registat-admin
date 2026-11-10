"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAccount } from "@/components/auth/AccountIdentity";
import { can } from "@/lib/auth/permissions";
import { api, useApi } from "@/lib/api/client";
import type { AdminCatalogResponse, AdminCatalogCountryResponse, AdminComplianceRequirementResponse } from "@/lib/api/types";
import { countryFlag, currencies, jurisdictionEntityOptions, makeJurisdictionService, newJurisdiction, type Jurisdiction } from "@/data/admin/jurisdictions";
import { LoadState } from "@/components/applications/UI";
import JurisdictionsWorkspace from "../JurisdictionsWorkspace";
import CountrySetup from "../CountrySetup";
const cadenceNames: Record<string,string> = {annual:"Annually",quarterly:"Quarterly",monthly:"Monthly",one_off:"One-time"};
const cadenceValues: Record<string,string> = {Annually:"annual",Quarterly:"quarterly",Monthly:"monthly","One-time":"one_off"};
export default function JurisdictionsDesign() {
 const account=useAccount(),path=usePathname(),router=useRouter();const parts=path.split("/"),mode=parts[3],editing=mode==="edit",id=editing?parts[4]:parts[3];
 const writable=can(account,"catalog:write");
 const catalog=useApi<AdminCatalogResponse>(can(account,"catalog:read")?"catalog/admin":null);
 const [requirements,setRequirements]=useState<AdminComplianceRequirementResponse[]>([]),[requirementError,setRequirementError]=useState(""),[requirementLoading,setRequirementLoading]=useState(can(account,"compliance:read")),[revision,setRevision]=useState(0);
 const [local,setLocal]=useState<Record<string,Jurisdiction>>({});
 const storageKey=`registat:country-design:${account?._id}`;
 const savedId=useRef<string|undefined>(undefined),requirementIds=useRef(new Map<string,string>());
 useEffect(()=>{const read=()=>{try{setLocal(JSON.parse(localStorage.getItem(storageKey)||"{}"));}catch{setLocal({});}}; const timer=window.setTimeout(read,0);window.addEventListener("storage",read);return()=>{clearTimeout(timer);window.removeEventListener("storage",read);};},[storageKey]);
 useEffect(()=>{if(!can(account,"compliance:read"))return;const abort=new AbortController();(async()=>{await Promise.resolve();if(abort.signal.aborted)return;setRequirementLoading(true);setRequirementError("");const rows:AdminComplianceRequirementResponse[]=[];let page=1;while(true){const result=await api<AdminComplianceRequirementResponse[]>(`compliance/admin/requirements?limit=100&page=${page}`,{signal:abort.signal});rows.push(...result.data);if(!result.meta?.pagination?.hasNextPage)break;page++;}if(!abort.signal.aborted)setRequirements(rows);})().catch(error=>{if(!abort.signal.aborted)setRequirementError(error.message);}).finally(()=>{if(!abort.signal.aborted)setRequirementLoading(false);});return()=>abort.abort();},[account,revision]);
 function countryView(country:AdminCatalogCountryResponse):Jurisdiction {
  const extra=local[country._id];
  const base:Jurisdiction={...newJurisdiction(),...extra,id:country._id,name:country.name,code:country.code,flag:countryFlag(country.code),currency:country.currency,currencyName:currencies.find(c=>c.code===country.currency)?.name||country.currency,region:country.region||extra?.region||"",website:country.governmentWebsite||"",regulator:country.localRegulator||"",notes:country.notes||"",status:extra?.status==="Coming soon"&&!country.isActive?"Coming soon":country.isActive?"Active":"Inactive",dateAdded:country.createdAt,updated:country.updatedAt,entities:country.entityTypes?.filter(e=>e.isActive).map(e=>e.key)||extra?.entities||[],services:extra?.services||catalog.data!.services.filter(s=>s.supportedCountries.includes(country.code)).map(s=>({...makeJurisdictionService(s._id,s.name,s.description||"",catalog.data!.fees.filter(f=>f.serviceId===s._id&&f.country===country.code&&f.currency===country.currency&&f.isActive).reduce((sum,f)=>sum+f.amountMinor,0)/100),enabled:s.isActive})),requirements:extra?.requirements||[]};
  const live=requirements.filter(r=>r.country===country.code);
  base.requirements=[...live.map(r=>{const saved=extra?.requirements.find(item=>item.id===r._id);return {id:r._id,name:r.title,description:r.description||"",regulator:r.authority||"",entityIds:r.entityTypes,frequency:saved?.frequency==="As required"?saved.frequency:cadenceNames[r.cadence],dueRule:saved?.dueRule||"",dueDetail:saved?.dueDetail||"",documents:saved?.documents||[],enabled:r.isActive};}),...base.requirements.filter(r=>!live.some(l=>l._id===r.id)&&! /^[a-f0-9]{24}$/i.test(r.id))];return base;
 }
 const countries=catalog.data?.countries.map(countryView)||[],selected=countries.find(c=>c.id===id);
 async function persist(country:Jurisdiction):Promise<string> {
  if(!writable)throw new Error("You do not have permission to save countries.");
  const original=catalog.data?.countries.find(c=>c._id===country.id);
  const countryId=original?._id||savedId.current;
  const entityTypes=jurisdictionEntityOptions.filter(e=>country.entities.includes(e.id)).map(e=>({...original?.entityTypes?.find(v=>v.key===e.id),key:e.id,name:e.name,description:e.description,isActive:true}));
  for(const entity of original?.entityTypes||[])if(!entityTypes.some(e=>e.key===entity.key))entityTypes.push({...entity,isActive:country.entities.includes(entity.key),description:entity.description||""});
  const values={name:country.name.trim(),currency:country.currency,region:country.region,...(country.website?{governmentWebsite:country.website}:{}),localRegulator:country.regulator,notes:country.notes,entityTypes,isActive:country.status==="Active"};
  const saved=await api<AdminCatalogCountryResponse>(`catalog/admin/countries${countryId?`/${countryId}`:""}`,{method:countryId?"PATCH":"POST",body:countryId?values:{...values,code:country.code}});savedId.current=saved.data._id;
  // Keep the designed configuration even where the API has no equivalent fields.
  const record={...country,id:saved.data._id};
  function store(){const next={...local,[record.id]:record};localStorage.setItem(storageKey,JSON.stringify(next));setLocal(next);}
  store();
  try {
   for(const service of country.services){const live=catalog.data?.services.find(s=>s._id===service.id||s.name===service.name);if(!live)continue;const supported=live.supportedCountries.includes(country.code);if(supported===service.enabled)continue;await api(`catalog/admin/services/${live._id}`,{method:"PATCH",body:{supportedCountries:service.enabled?[...live.supportedCountries,country.code]:live.supportedCountries.filter(c=>c!==country.code)}});}
   if(can(account,"compliance:write")) {
    for(const requirement of record.requirements){const cadence=cadenceValues[requirement.frequency];if(!cadence)continue;const live=requirements.find(r=>r._id===requirement.id),existingId=live?._id||requirementIds.current.get(requirement.id);const body={title:requirement.name,description:requirement.description,entityTypes:requirement.entityIds,cadence,isActive:requirement.enabled,...(requirement.regulator?{authority:requirement.regulator}:{})};const result=await api<AdminComplianceRequirementResponse>(`compliance/admin/requirements${existingId?`/${existingId}`:""}`,{method:existingId?"PATCH":"POST",body:existingId?body:{...body,country:country.code,code:"requirement-"+crypto.randomUUID().slice(0,8)}});requirementIds.current.set(requirement.id,result.data._id);requirement.id=result.data._id;}
    for(const removed of requirements.filter(r=>r.country===country.code&&!record.requirements.some(v=>v.id===r._id)))await api(`compliance/admin/requirements/${removed._id}`,{method:"PATCH",body:{isActive:false}});
   }
   store();savedId.current=undefined;catalog.reload();setRevision(r=>r+1);return record.id;
  }catch(error){store();throw new Error(`${error instanceof Error?error.message:"Unable to finish saving."} Country details and the setup draft were saved. Retry to finish the remaining updates.`);}
 }
 if(!can(account,"catalog:read"))return <p className="p-6">You do not have permission to view jurisdictions.</p>;
 return <><LoadState {...catalog} retry={catalog.reload}/>{requirementError&&<p className="jurisdiction-error" role="alert">Compliance requirements could not load: {requirementError} <button onClick={()=>setRevision(r=>r+1)}>Retry</button></p>}{catalog.data&&((mode==="new"||editing)?writable?(!editing||selected)&&!requirementLoading&&!requirementError?<CountrySetup services={catalog.data.services.map(s=>({id:s._id,name:s.name,shortDescription:s.description||"",price:0}))} existingId={editing?id:undefined} record={selected} onPersist={persist}/>:<p className="p-6">{requirementLoading?"Loading compliance requirements…":requirementError?"Reload requirements before editing this country.":"Country not found."}</p>:<p className="p-6">You do not have permission to edit countries.</p>:<JurisdictionsWorkspace records={countries} writable={writable&&!requirementLoading&&!requirementError} onUpdate={async country=>{savedId.current=undefined;await persist(country);router.refresh();}}/>)}</>;
}
