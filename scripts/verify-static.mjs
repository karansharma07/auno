/** Ensure production and demo routes are separate and no demo impersonation enters production. */
import{readFileSync as read,existsSync as exists}from'node:fs';
const fail=msg=>{console.error('FAIL: '+msg);process.exitCode=1};
for(const [folder,assets] of [
 ['docs',['index.html','app.js','suite.js','theme.js','styles.css','experiences.css','config.js','manifest.webmanifest']],
 ['docs/demo',['index.html','app.js','suite.js','demo-api.js','seed.json','styles.css','theme.js','manifest.webmanifest']]
]){for(const file of assets)if(!exists(folder+'/'+file))fail('Missing '+folder+'/'+file)}
const root=read('docs/index.html','utf8');
if(root.includes('demo-api.js')||root.includes('seed.json')||root.includes('X-Demo-User'))fail('Production route must never load simulation data or impersonation');
if(!root.includes('type="module" src="./app.js"'))fail('Production module not loaded');
const demo=read('docs/demo/index.html','utf8');
if(!demo.includes('demo-api.js'))fail('Demo route is missing preserved simulator');
const productionApp=read('docs/app.js','utf8');
if(productionApp.includes("localStorage.getItem('auno-demo-user')"))fail('Production app contains fake persona selection');
const cfg=read('docs/config.js','utf8');
if(/supabaseAnonKey\"\s*:\s*\"(?:sb_secret_|service_role)/i.test(cfg))fail('Secret in client configuration');
const schema='supabase/migrations/';
for(const m of ['202611060001_foundation.sql','202611060002_experience_suite.sql','202611060003_live_ops.sql'])if(!exists(schema+m))fail('Missing DB migration '+m);
if(!process.exitCode)console.log('PASS: live and demo route separation, no mock production API, public configuration and required SQL migrations');
