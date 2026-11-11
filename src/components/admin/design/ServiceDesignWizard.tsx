"use client";
import { useRef, useState } from "react";
import ServiceWizard from "../ServiceWizard";
import { api } from "@/lib/api/client";
import { useAccount } from "@/components/auth/AccountIdentity";
import type { AdminCatalogResponse, CatalogServiceResponse } from "@/lib/api/types";
import { newEntities, type AdminService } from "@/data/admin/services";
import { countryName } from "./UI";
function presentation(service: CatalogServiceResponse, bundle: AdminCatalogResponse): AdminService {
 const fees=bundle.fees.filter(f=>f.serviceId===service._id&&f.isActive);
 return {id:service._id,name:service.name,description:service.description||"",shortDescription:service.description||"",category:(service.category||"Business Formation") as AdminService["category"],serviceType:"One-time service",processingTime:"5–10 business days",jurisdiction:countryName(service.supportedCountries[0]),additionalJurisdictions:service.supportedCountries.slice(1).map(countryName),status:service.isActive?"Active":"Inactive",created:service.createdAt,updated:service.updatedAt,features:[],entities:newEntities().map(entity=>({...entity,fees:fees.filter(f=>f.currency==="NGN").map(f=>({id:f._id,type:"Service fee",title:f.label,amount:f.amountMinor/100,description:"",timing:"included",required:true}))})),addons:bundle.addOns.filter(a=>a.applicableServiceIds.includes(service._id)).map(a=>({id:a._id,title:a.name,description:a.description||"",price:a.amountMinor/100,enabled:a.isActive,entityIds:[]}))};
}
export default function ServiceDesignWizard({bundle,existing,duplicate,writable,onClose,onSaved}:{bundle:AdminCatalogResponse;existing?:CatalogServiceResponse;duplicate:boolean;writable:boolean;onClose:()=>void;onSaved:(id:string)=>void}) {
 const account=useAccount();const key=`registat:service-design:${account?._id}:`;
 const [source]=useState(()=>{if(!existing)return undefined;const base=presentation(existing,bundle);try{const stored=JSON.parse(localStorage.getItem(key+existing._id)||"null");return stored?{...stored,...base,entities:stored.entities,addons:stored.addons,serviceType:stored.serviceType,processingTime:stored.processingTime}:base;}catch{return base;}});
 const feeIds=useRef(new Map<string,string>());
 const savedId=useRef<string|undefined>(!duplicate?existing?._id:undefined);
 async function persist(service:AdminService) {
  if(!writable)throw new Error("You do not have permission to save services.");
  const country=bundle.countries.find(c=>c.name===service.jurisdiction)?.code||existing?.supportedCountries[0]||"NG";
  const body={name:service.name,description:service.description,category:service.name==="Trademark Registration"?"Intellectual Property":service.category,supportedCountries:[...new Set([country,...(existing?.supportedCountries.slice(1)||[])])],isActive:service.status==="Active"};
  const result=await api<CatalogServiceResponse>(`catalog/admin/services${savedId.current?`/${savedId.current}`:""}`,{method:savedId.current?"PATCH":"POST",body:savedId.current?body:{...body,slug:service.name.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")+"-"+crypto.randomUUID().slice(0,8),workflowType:service.name==="Trademark Registration"?"trademark_registration":"company_registration",referencePrefix:"REG",totalSteps:5}});
  savedId.current=result.data._id;
  const selected=service.entities.filter(e=>e.selected);
  const shared=selected[0]?.fees||[];
  if(selected.every(e=>JSON.stringify(e.fees)===JSON.stringify(shared))) {
   for(const fee of shared) {
    const original=bundle.fees.find(f=>f._id===fee.id);
    if(original&&(original.currency!=="NGN"||original.country!==country))continue;
    const id=original?._id||feeIds.current.get(fee.id);
    const amountMinor=Math.round(fee.amount*100);
    if(!Number.isSafeInteger(amountMinor)||amountMinor<0)throw new Error("Enter a valid fee amount.");
    const values={label:fee.title,amountMinor,currency:"NGN",isActive:true};
    const saved=await api<{_id:string}>(`catalog/admin/fees${id?`/${id}`:""}`,{method:id?"PATCH":"POST",body:id?values:{...values,serviceId:result.data._id,country,code:"fee-"+crypto.randomUUID().slice(0,8),dueStage:fee.timing==="first"?"before_application":fee.timing==="later"?"after_application":"application"}});
    feeIds.current.set(fee.id,saved.data._id);
   }
  }
  localStorage.setItem(key+result.data._id,JSON.stringify({...service,id:result.data._id}));
  return result.data._id;
 }
 return <ServiceWizard existing={source} duplicate={duplicate} catalogue={bundle.services.map(s=>presentation(s,bundle))} onClose={onClose} onSaved={onSaved} onPersist={persist}/>;
}
