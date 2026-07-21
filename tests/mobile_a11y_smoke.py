"""Mobile accessibility and responsive smoke test for the local preview."""

import os
from pathlib import Path
from playwright.sync_api import sync_playwright


BASE_URL = os.environ.get("BODEGA_SMOKE_URL", "http://localhost:54213/")
ARTIFACTS = Path(__file__).parent / "artifacts"
ARTIFACTS.mkdir(exist_ok=True)


def assert_mobile_layout(page, name, width, height, reduced_motion=False):
    errors = []
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    page.set_viewport_size({"width": width, "height": height})
    page.emulate_media(reduced_motion="reduce" if reduced_motion else "no-preference")
    page.goto(BASE_URL, wait_until="networkidle")

    assert page.locator("#zone-list .zone-btn").count() == 5
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
    assert page.locator("#mission-progress").get_attribute("aria-valuenow") == "0"
    assert page.locator(".skip-link").evaluate(
        "(element) => getComputedStyle(element).transform !== 'none'"
    )

    targets = page.locator("button")
    for index in range(targets.count()):
        box = targets.nth(index).bounding_box()
        if box:
            assert box["height"] >= 44, f"{name}: button {index} is under 44px"

    if reduced_motion:
        assert page.locator("body").get_attribute("data-view-mode") == "list"
        panel_box = page.locator(".panel").bounding_box()
        assert panel_box and panel_box["height"] >= height - 90

    page.screenshot(path=str(ARTIFACTS / f"{name}.png"))
    assert not errors, f"{name}: console errors: {errors}"


def test_explore_keeps_scene_visible(page):
    page.set_viewport_size({"width": 375, "height": 667})
    page.goto(BASE_URL, wait_until="networkidle")
    # Force explore mode even if reduced-motion defaults would flip it.
    page.evaluate("document.body.dataset.viewMode = 'explore'")
    page.locator("#btn-mode").evaluate(
        """(btn) => {
          if (btn.getAttribute('aria-pressed') === 'true') btn.click();
        }"""
    )
    page.wait_for_timeout(300)
    page.locator("#zone-delivery").tap()
    page.wait_for_timeout(400)
    panel = page.locator(".panel").bounding_box()
    assert panel is not None
    assert panel["height"] <= 667 * 0.45, f"panel too tall: {panel['height']}"
    assert page.locator("#c").is_visible()
    page.screenshot(path=str(ARTIFACTS / "iphone-se-selected.png"))


def test_touch_completion(page):
    page.set_viewport_size({"width": 375, "height": 667})
    page.goto(BASE_URL, wait_until="networkidle")
    # Prefer list mode for AT / keyboard completion path.
    page.locator("#btn-mode").evaluate(
        """(btn) => {
          if (btn.getAttribute('aria-pressed') !== 'true') btn.click();
        }"""
    )
    page.wait_for_timeout(200)
    page.locator("#zone-delivery").tap()
    assert page.locator("#zone-detail").is_visible()
    assert page.locator("#detail-problem").is_visible()
    page.locator("#btn-apply").tap()  # apply fix
    page.wait_for_timeout(400)
    assert page.locator("#m-receiving").inner_text() == "Scan-first gate"
    # Primary button now advances straight to the next zone.
    assert "Next" in page.locator("#btn-apply").inner_text()
    assert page.locator("#zone-register").get_attribute("aria-disabled") is None
    page.locator("#btn-apply").tap()  # advance to next issue
    page.wait_for_timeout(300)
    assert page.locator("#zone-register").get_attribute("aria-pressed") == "true"
    assert page.locator("#zone-detail").is_visible()


def test_restart_resets_mission(page):
    page.set_viewport_size({"width": 390, "height": 844})
    page.goto(BASE_URL + "?debug=1", wait_until="networkidle")
    page.wait_for_function("() => !!window.__bodega")
    # Solve everything via debug hooks.
    for z in ["delivery", "register", "queue", "aisles", "revenue"]:
        page.evaluate(
            "(id) => { const b=window.__bodega; b.selectZone(id); b.inspectChallenge(id); b.applyFix(id); }",
            z,
        )
    page.wait_for_timeout(200)
    assert page.locator("#mission-progress").get_attribute("aria-valuenow") == "5"
    assert page.locator("#btn-replay").is_visible()
    page.locator("#btn-replay").click()
    page.wait_for_timeout(200)
    assert page.locator("#mission-progress").get_attribute("aria-valuenow") == "0"
    assert page.locator("#m-receiving").text_content() == "Shelf first"
    assert page.locator("#btn-restart").is_hidden()


def test_explore_challenge_gates_apply(page):
    page.set_viewport_size({"width": 390, "height": 844})
    page.goto(BASE_URL, wait_until="networkidle")
    page.locator("#btn-mode").evaluate(
        """(btn) => {
          if (btn.getAttribute('aria-pressed') === 'true') btn.click();
        }"""
    )
    page.wait_for_timeout(300)
    page.locator("#zone-delivery").tap()
    page.wait_for_timeout(400)
    assert page.locator("#detail-challenge").is_visible()
    assert page.locator("#btn-apply").is_disabled()
    page.screenshot(path=str(ARTIFACTS / "challenge-gated.png"))


def test_text_spacing(page):
    page.set_viewport_size({"width": 320, "height": 568})
    page.goto(BASE_URL, wait_until="networkidle")
    page.add_style_tag(
        content="""
        * {
          line-height: 1.5 !important;
          letter-spacing: 0.12em !important;
          word-spacing: 0.16em !important;
        }
        p { margin-bottom: 2em !important; }
        """
    )
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth")
    assert page.locator("#zone-list").is_visible()


def test_fallback_does_not_block_controls(page):
    page.set_viewport_size({"width": 375, "height": 667})
    page.goto(BASE_URL, wait_until="networkidle")
    page.locator("#fallback").evaluate("(element) => element.classList.add('is-on')")
    assert page.locator("#fallback").is_visible()
    assert page.locator("#zone-delivery").is_visible()
    page.locator("#zone-delivery").tap()
    assert page.locator("#zone-detail").is_visible()


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(
        has_touch=True,
        is_mobile=True,
        device_scale_factor=2,
    )
    page = context.new_page()

    assert_mobile_layout(page, "iphone-se", 375, 667)
    assert_mobile_layout(page, "narrow-phone", 320, 568)
    assert_mobile_layout(page, "phone-landscape", 667, 375)
    assert_mobile_layout(page, "reduced-motion-list", 375, 667, reduced_motion=True)
    test_explore_keeps_scene_visible(page)
    test_touch_completion(page)
    test_explore_challenge_gates_apply(page)
    test_restart_resets_mission(page)
    test_text_spacing(page)
    test_fallback_does_not_block_controls(page)

    context.close()
    browser.close()

print("mobile accessibility smoke tests passed")
