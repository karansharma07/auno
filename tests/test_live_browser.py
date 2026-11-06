"""Actual live frontend rendering without a Supabase project; no fabricated users or reservations."""
from pathlib import Path
import shutil
import pytest
ROOT=Path(__file__).resolve().parents[1]

def test_live_home_without_credentials():
    sync=pytest.importorskip('playwright.sync_api')
    executable=shutil.which('chromium') or shutil.which('chromium-browser')
    if not executable:
        pytest.skip('Chromium not installed')
    live=ROOT/'live'
    html=(live/'index.html').read_text()
    for css in ('styles.css','experiences.css'):
        html=html.replace(f'<link rel="stylesheet" href="./{css}"/>',f'<style>{(live/css).read_text()}</style>')
    html=html.replace('<script src="./theme.js"></script>',f'<script>{(live/"theme.js").read_text()}</script>')
    html=html.replace('<script src="./config.js"></script>','<script>window.AUNO_CONFIG={};</script>')
    suite=(live/'suite.js').read_text().replace('export const ','const ').replace('export async function ','async function ').replace('export function ','function ')
    app=(live/'app.js').read_text().replace("import {loadSuite,suiteRoutes,isSuiteRoute,pageSuite,operatorSuite,privacyPanel,setNowFilters,suiteClick,suiteSubmit} from './suite.js';",'')
    names='loadSuite,suiteRoutes,isSuiteRoute,pageSuite,operatorSuite,privacyPanel,setNowFilters,suiteClick,suiteSubmit'
    js=f'const {{{names}}}=(()=>{{{suite}\nreturn {{{names}}};}})();\n{app}'
    html=html.replace('<script type="module" src="./app.js"></script>',f'<script type="module">{js}</script>')
    with sync.sync_playwright() as pw:
        browser=pw.chromium.launch(executable_path=executable,headless=True,args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':1440,'height':850})
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(html,wait_until='domcontentloaded')
        page.wait_for_selector('.life-banner')
        assert 'Make the most of your city' in page.locator('h1').inner_text()
        assert page.locator('.experience-tile').count()==8
        assert 'real bookings' in page.locator('main').inner_text().lower()
        page.locator('[data-appearance="dark"]').click()
        assert page.locator('html').get_attribute('data-theme')=='dark'
        page.set_viewport_size({'width':390,'height':844})
        assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+1')
        assert not errors,errors
        browser.close()
