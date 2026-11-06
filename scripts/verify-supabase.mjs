/** Optional LIVE project smoke checks. Requires the user's Supabase project variables.
 * Does NOT create or mutate records; never includes service-role credentials. */
const base=(process.env.SUPABASE_URL||'').replace(/\/$/,'');
const key=process.env.SUPABASE_PUBLISHABLE_KEY||'';
if(!base||!key){console.log('SKIP: set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY to test the provisioned project');process.exit(0)}
if(!/^https:\/\/[a-z0-9.-]+\.supabase\.co$/i.test(base)||/service_role|sb_secret_/i.test(key)){
 console.error('Use an official Supabase project URL and a publishable/anon key, never a service-role key');process.exit(2);
}
async function check(route){
 const res=await fetch(base+'/rest/v1/'+route,{headers:{apikey:key,Accept:'application/json'}});
 const text=await res.text();let data;try{data=JSON.parse(text)}catch{data=text.slice(0,300)}
 return{status:res.status,ok:res.ok,data};
}
let failed=false;
for(const route of ['communities?select=id,status&limit=3','events?select=id,status&limit=3']){
 const result=await check(route);
 if(!result.ok||!Array.isArray(result.data)||result.data.some(x=>x.status!=='approved'&&x.status!=='published')){
  console.error('FAIL public catalogue response '+route,result);failed=true;
 }else console.log('PASS anonymous public catalogue: '+route);
}
for(const route of ['operator_accounts?select=user_id&limit=1','audit_events?select=id&limit=1','event_bookings?select=id&limit=1','privacy_requests?select=id&limit=1']){
 const result=await check(route);
 // RLS may return 200 [] for protected tables or 401/403 with table grants revoked.
 if(result.ok&&(!Array.isArray(result.data)||result.data.length>0)){
  console.error('FAIL anonymous user could read protected content '+route,result);failed=true;
 }else console.log('PASS anonymous restriction: '+route+' (HTTP '+result.status+')');
}
if(failed){console.error('Live smoke checks failed. Do not launch.');process.exit(1)}
console.log('PASS: anonymous read-policy smoke checks. Not a substitute for multi-user role and concurrency tests.');
