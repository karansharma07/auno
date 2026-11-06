/** Dependency-free static release validation, no network or external credentials. */
import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';
const fail=(msg)=>{console.error('FAIL: '+msg);process.exitCode=1};
for (const [folder,endpoint] of [['docs',''],['static','/static/']]) {
  const html=readFileSync(path.join(folder,'index.html'),'utf8');
  for (const file of ['styles.css','suite.css','app.js','suite.js','insights.js','theme.js','favicon.svg','manifest.webmanifest']) {
    const expected=endpoint+file;
    if(!html.includes(expected))fail(`${folder} HTML missing ${expected}`);
    if(!existsSync(path.join(folder,file)))fail(`${folder} missing file ${file}`);
  }
  const manifest=JSON.parse(readFileSync(path.join(folder,'manifest.webmanifest'),'utf8'));
  for(const icon of manifest.icons){const iconPath=path.join(folder,path.basename(icon.src));if(!existsSync(iconPath))fail(`${folder} missing icon ${icon.src}`)}
}
const docs=readFileSync('docs/index.html','utf8');
if(!docs.includes('demo-api.js'))fail('Public Pages site must use browser-only API');
if(!docs.includes('suite.js')||!docs.includes('suite.css'))fail('AUNO signature feature assets missing');
if(docs.includes('service_role'))fail('Service role text unexpectedly present in demo HTML');
const live=readFileSync('live/index.html','utf8');
if(!live.includes('type="module" src="./app.js"') || !existsSync('supabase/migrations/202611060001_foundation.sql') || !existsSync('supabase/migrations/202611060002_experience_suite.sql'))fail('Live alpha incomplete');
if(!process.exitCode)console.log('PASS: static artifacts, app entrypoints, icon assets and live-alpha scaffold');
