"""Optional real-Chromium smoke test for the static UI. No network or live credentials.

If Playwright / Chromium is unavailable (e.g. minimal CI), skip cleanly. Manual
release QA should still run a full browser, mobile and accessibility pass.
"""
from pathlib import Path
import json
import shutil
import pytest

ROOT=Path(__file__).resolve().parents[1]


def test_v2_browser_journeys():
    sync=pytest.importorskip('playwright.sync_api')
    browser_path=shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome')
    if not browser_path:
        pytest.skip('Chromium is not installed')
    seed=json.loads((ROOT/'docs/seed.json').read_text())
    with sync.sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=browser_path,headless=True,args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':1350,'height':900})
        failures=[]
        page.on('pageerror',lambda err:failures.append(str(err)))
        page.set_content('<!doctype html><html><head><meta name="theme-color" content="#fff"></head><body><div id="app"></div><div id="toast-root"></div></body></html>')
        page.evaluate('''(seed)=>{
          const map=new Map();
          Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,String(v))}});
          window.fetch=async url=>{if(url==='seed.json')return new Response(JSON.stringify(seed),{status:200});throw new Error('Unexpected fetch: '+url)};
        }''',seed)
        page.add_style_tag(path=str(ROOT/'docs/styles.css'))
        for source in ['theme.js','demo-api.js','insights.js','app.js']:
            page.add_script_tag(path=str(ROOT/'docs'/source))
        page.wait_for_selector('.sidebar',timeout=5000)
        assert 'Hello, Maya' in page.locator('h1').first.inner_text()
        page.locator('.sidebar [data-page="now"]').click()
        assert page.locator('.now-place').count()>0
        page.locator('[data-now-mood="explore"]').click()
        page.locator('[data-now-hours]').select_option('2')
        assert page.locator('[data-now-mood="explore"]').get_attribute('aria-pressed')=='true'
        page.locator('[data-theme-choice="dark"]').first.click()
        assert page.locator('html').get_attribute('data-theme')=='dark'
        page.locator('[data-modal="personas"]').first.click()
        page.locator('[data-persona="4"]').click()
        page.wait_for_selector('.insight-svg',timeout=5000)
        assert 'Mission Control' in page.locator('main h1').first.inner_text()
        page.locator('[data-insights-days="7"]').click()
        assert page.locator('[data-insights-days="7"]').get_attribute('aria-pressed')=='true'
        assert page.locator('.insight-kpi').count()>=4
        page.set_viewport_size({'width':390,'height':844})
        assert page.evaluate('document.body.scrollWidth<=window.innerWidth+1')
        assert page.locator('.mobile-nav [data-page="insights"]').is_visible()
        assert not failures,failures
        browser.close()
