/** Build AUNO public routes: /auno/ live + /auno/demo/ legacy demonstration. */
import fs from 'node:fs';import path from 'node:path';
const root=process.cwd(),out=path.join(root,'docs');
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
const input=path.join(root,'live');
for(const entry of fs.readdirSync(input,{withFileTypes:true})){
 if(entry.name==='config.js'||entry.name==='config.example.js')continue;
 const from=path.join(input,entry.name),to=path.join(out,entry.name);
 if(entry.isDirectory())fs.cpSync(from,to,{recursive:true});else fs.copyFileSync(from,to);
}
fs.cpSync(path.join(root,'demo-static'),path.join(out,'demo'),{recursive:true});
const man=path.join(out,'demo','manifest.webmanifest');
if(fs.existsSync(man)){
 const data=JSON.parse(fs.readFileSync(man,'utf8'));
 data.id='/auno/demo/';data.start_url='./';data.scope='./';
 fs.writeFileSync(man,JSON.stringify(data,null,2)+'\n');
}
const worker=path.join(out,'demo','sw.js');
if(fs.existsSync(worker)){
 let body=fs.readFileSync(worker,'utf8');
 body=body.replace(/const VERSION='[^']+'/,"const VERSION='auno-preserved-demo-v3-20261106'");
 fs.writeFileSync(worker,body);
}
fs.writeFileSync(path.join(out,'.nojekyll'),'');
const url=(process.env.SUPABASE_URL||'').trim();
const key=(process.env.SUPABASE_PUBLISHABLE_KEY||'').trim();
if(url||key){
 if(!/^https:\/\/[a-z0-9.-]+\.supabase\.co\/?$/i.test(url))throw Error('SUPABASE_URL must be the exact HTTPS project URL');
 if(!key||/service_role|sb_secret_|secret|password/i.test(key))throw Error('Use only the Supabase public publishable/anon key in SUPABASE_PUBLISHABLE_KEY');
}
fs.writeFileSync(path.join(out,'config.js'),`// Public frontend configuration; no database password or service role keys.\nwindow.AUNO_CONFIG = ${JSON.stringify({supabaseUrl:url,supabaseAnonKey:key})};\n`);
fs.writeFileSync(path.join(out,'sw.js'),`// Replaces the old root demo service worker, and unregisters it to prevent stale content.\nself.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));\nself.addEventListener('activate',event=>event.waitUntil((async()=>{for(const k of await caches.keys()){if(k.startsWith('auno-static-demo-'))await caches.delete(k)}await self.registration.unregister();await self.clients.claim();})()));\n`);
const index=path.join(out,'index.html');let html=fs.readFileSync(index,'utf8');
html=html.replace('</body>','<script>if("serviceWorker" in navigator && location.protocol==="https:")navigator.serviceWorker.register("./sw.js").catch(()=>{});</script></body>');
fs.writeFileSync(index,html);
console.log('Built AUNO live at /auno/ and preserved demo at /auno/demo/');
console.log(url&&key?'Supabase publishable key configured':'No Supabase project configured: root displays setup instructions and does not simulate transactions');
