"""Produce browser screenshots of the real static site for release QA."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
seed=json.loads((ROOT/'docs/seed.json').read_text())
shots=ROOT/'screenshots';shots.mkdir(exist_ok=True)
try:
 with sync_playwright() as pw:
  browser=pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':1440,'height':960},device_scale_factor=1)
  errors=[]
  page.on('pageerror',lambda err:errors.append(str(err)))
  page.set_content('<!doctype html><html><head></head><body><div id="app"></div><div id="toast-root"></div></body></html>')
  page.evaluate('''(seed)=>{
    const map=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,String(v))}});
    window.fetch=async url=>{if(url==='seed.json')return new Response(JSON.stringify(seed),{status:200});throw Error('Unexpected fetch '+url)};
  }''',seed)
  for css in ['styles.css','suite.css']: page.add_style_tag(path=str(ROOT/'docs'/css))
  for js in ['theme.js','demo-api.js','insights.js','suite.js','app.js']: page.add_script_tag(path=str(ROOT/'docs'/js))
  page.wait_for_selector('.sidebar')
  page.locator('[data-page="life"]').first.click()
  page.screenshot(path=str(shots/'AUNO_3_Life_Light.png'),full_page=True)
  page.locator('[data-theme-choice="dark"]').first.click()
  page.screenshot(path=str(shots/'AUNO_3_Life_Dark.png'),full_page=True)
  page.locator('.auno-feature-tile [data-page="together"]').click()
  page.screenshot(path=str(shots/'AUNO_3_Together_Dark.png'),full_page=True)
  page.locator('[data-page="life"]').first.click()
  page.locator('.auno-feature-tile [data-page="concierge"]').click()
  page.screenshot(path=str(shots/'AUNO_3_Concierge_Dark.png'),full_page=True)
  page.set_viewport_size({'width':390,'height':844})
  page.evaluate("setPage('life')")
  page.screenshot(path=str(shots/'AUNO_3_Mobile_Dark.png'),full_page=True)
  overflow=page.evaluate('document.documentElement.scrollWidth>window.innerWidth+1')
  assert not overflow,'mobile horizontal scroll'
  assert not errors,errors
  browser.close()
finally: pass
print('Screenshots created:',*(p.name for p in shots.iterdir()),sep='\n- ')
