"""AUNO 3 browser integration: eight modules, theme, persona, responsive layouts."""
from pathlib import Path
import json, shutil
import pytest
ROOT=Path(__file__).resolve().parents[1]

def test_v3_suite_in_chromium():
    sync=pytest.importorskip('playwright.sync_api')
    chromium=shutil.which('chromium') or shutil.which('chromium-browser')
    if not chromium: pytest.skip('Chromium not installed')
    seed=json.loads((ROOT/'demo-static/seed.json').read_text())
    with sync.sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=chromium, headless=True, args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':1320,'height':900})
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content('<!doctype html><html><head></head><body><div id="app"></div><div id="toast-root"></div></body></html>')
        page.evaluate('''(seed)=>{
          const m=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v))}});
          window.fetch=async url=>{if(url==='seed.json')return new Response(JSON.stringify(seed),{status:200});throw Error('Unexpected fetch '+url)};
        }''',seed)
        for css in ['styles.css','suite.css']: page.add_style_tag(path=str(ROOT/'demo-static'/css))
        for js in ['theme.js','demo-api.js','insights.js','suite.js','app.js']: page.add_script_tag(path=str(ROOT/'demo-static'/js))
        page.wait_for_selector('.sidebar')
        page.locator('[data-page="life"]').first.click()
        assert 'AUNO Together' in page.locator('main').inner_text()
        assert page.locator('.auno-feature-tile').count()==8
        page.locator('.auno-feature-tile [data-page="together"]').click()
        assert page.locator('.auno-community-card').count()==4
        page.locator('[data-suite-action="toggle-circle"]').first.click()
        assert '1' in page.locator('.auno-mini-stat strong').first.inner_text()
        page.locator('[data-suite-action="toggle-rsvp"]').first.click()
        assert '1' in page.locator('.auno-mini-stat strong').nth(1).inner_text()
        page.locator('.topbar [data-modal="personas"]').first.click() if page.locator('.topbar [data-modal="personas"]').count() else page.locator('[data-modal="personas"]').first.click()
        page.locator('[data-persona="2"]').click()
        page.locator('[data-page="hostos"]').first.click()
        assert 'Reusable event templates' in page.locator('main').inner_text()
        page.locator('form[data-suite-form="template"] input[name="name"]').fill('Friday Sport Social')
        page.locator('form[data-suite-form="template"] input[name="venue"]').fill('Sample Padel Venue')
        page.locator('form[data-suite-form="template"] input[name="area"]').fill('Dubai Marina')
        page.locator('form[data-suite-form="template"] textarea[name="description"]').fill('A welcoming sport session with rotating partners and a host.')
        page.locator('form[data-suite-form="template"] button[type="submit"]').click()
        assert page.locator('[data-suite-action="use-template"]').count()==1
        page.locator('[data-suite-action="use-template"]').click()
        assert page.locator('form[data-form="create-event"] input[name="title"]').input_value()=='Friday Sport Social'
        page.locator('[data-close-modal]').first.click()
        page.locator('[data-modal="personas"]').first.click()
        page.locator('[data-persona="1"]').click()
        # Passport reflects existing joined communities plus new Together membership
        page.evaluate("setPage('passport')")
        assert page.locator('.auno-stamp').count()==8
        assert 'Better Together' in page.locator('main').inner_text()
        page.evaluate("setPage('lens')")
        page.locator('[data-suite-action="save-place"]').first.click()
        assert page.locator('.auno-mini-stat strong').nth(1).inner_text()=='1'
        page.locator('form[data-suite-form="recommend"] input[name="name"]').fill('Sample Gardens Corner')
        page.locator('form[data-suite-form="recommend"] input[name="area"]').fill('Al Quoz')
        page.locator('form[data-suite-form="recommend"] textarea[name="tip"]').fill('An example of a relaxed local meetup suggestion with clear accessibility notes.')
        page.locator('form[data-suite-form="recommend"] button[type="submit"]').click()
        assert 'Sample Gardens Corner' in page.locator('main').inner_text()
        page.evaluate("setPage('concierge')")
        page.locator('form[data-suite-form="trip"] button[type="submit"]').click()
        assert page.locator('.auno-day').count()==3
        page.locator('[data-suite-action="remove-stop"]').first.click()
        assert page.locator('.auno-day').count()==3
        page.evaluate("setPage('homebase')")
        page.locator('[data-suite-task="settle"]').check()
        assert '10%' in page.locator('.auno-home-overview h2').inner_text()
        page.evaluate("setPage('business')")
        page.locator('form[data-suite-form="business"] input[name="name"]').fill('Demo Marina Residence')
        page.locator('form[data-suite-form="business"] textarea[name="notes"]').fill('Help neighbours welcome new residents and organise a weekly gathering.')
        page.locator('form[data-suite-form="business"] button[type="submit"]').click()
        assert 'Demo Marina Residence' in page.locator('main').inner_text()
        page.locator('[data-modal="personas"]').first.click()
        page.locator('[data-persona="4"]').click()
        page.evaluate("setPage('business')")
        page.locator('[data-suite-action="review-business"][data-suite-id$=":approved"]').first.click()
        assert 'No sample business requests pending.' in page.locator('main').inner_text()
        page.locator('[data-theme-choice="dark"]').first.click()
        assert page.locator('html').get_attribute('data-theme')=='dark'
        page.set_viewport_size({'width':390,'height':844})
        assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1'), 'mobile overflow'
        assert not errors, errors
        browser.close()
