"""Drive the 3D game through its states and capture screenshots for review."""

import os
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = os.environ.get("BODEGA_SMOKE_URL", "http://localhost:62800/") + "?debug=1"
OUT = Path(__file__).parent / "artifacts"
OUT.mkdir(exist_ok=True)

ZONES = ["delivery", "register", "queue", "aisles", "revenue"]


def frame(page, ms=450):
    page.evaluate("window.__bodega && window.__bodega.requestFrame()")
    page.wait_for_timeout(ms)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 900, "height": 1000}, device_scale_factor=2)
    page = ctx.new_page()
    page.goto(BASE, wait_until="networkidle")
    # Force explore mode.
    page.evaluate(
        "() => { const b=window.__bodega; if(b.state.mode!=='explore'){document.getElementById('btn-mode').click();} }"
    )
    frame(page, 700)
    page.screenshot(path=str(OUT / "check-00-overview.png"))

    for i, z in enumerate(ZONES):
        page.evaluate(f"window.__bodega.selectZone('{z}')")
        frame(page, 900)
        page.screenshot(path=str(OUT / f"check-{i+1:02d}-{z}-beacon.png"))
        page.evaluate(f"window.__bodega.inspectChallenge('{z}')")
        frame(page, 500)
        page.evaluate(f"window.__bodega.applyFix('{z}')")
        frame(page, 700)
        page.screenshot(path=str(OUT / f"check-{i+1:02d}-{z}-fixed.png"))
        page.evaluate("window.__bodega.backOverview()")
        frame(page, 900)

    page.screenshot(path=str(OUT / "check-99-complete.png"))
    ctx.close()
    browser.close()

print("visual check screenshots written")
