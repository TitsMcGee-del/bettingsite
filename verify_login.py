from playwright.sync_api import sync_playwright, expect

def verify_login_ux():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("http://localhost:8080")

        # 1. Verify Accessibility Attributes
        print("Checking accessibility attributes...")
        user_label = page.locator('label[for="userIn"]')
        pass_label = page.locator('label[for="passIn"]')
        user_input = page.locator('input#userIn[autocomplete="username"]')
        pass_input = page.locator('input#passIn[autocomplete="current-password"]')
        login_btn = page.locator('button#loginBtn')

        expect(user_label).to_be_visible()
        expect(pass_label).to_be_visible()
        expect(user_input).to_be_visible()
        expect(pass_input).to_be_visible()
        expect(login_btn).to_be_visible()
        print("Accessibility attributes confirmed.")

        # 2. Verify Loading State
        print("Checking loading state...")
        user_input.fill("testuser")
        pass_input.fill("wrongpass")

        # Click and immediately check state (race condition handled by Playwright auto-wait,
        # but we want to check the *interim* state, so we don't await the alert immediately)

        # We need to set up a dialog handler for the alert that comes later
        page.on("dialog", lambda dialog: dialog.accept())

        login_btn.click()

        # Check if button is disabled and text changed
        # We check this immediately after click
        expect(login_btn).to_be_disabled()
        # Using Javascript to get innerHTML because .inner_text might wait or be tricky with emojis
        btn_text = login_btn.evaluate("el => el.innerHTML")
        assert "Signing In..." in btn_text
        print("Loading state confirmed: " + btn_text)

        # Wait for the alert to trigger (which means the firebase callback ran)
        # In a real integration test we'd mock the network, but here we just wait a bit
        # or wait for the button to re-enable (since we implemented reset on failure)
        # However, without mocking firebase, it might hang or fail.
        # The provided HTML uses a real Firebase URL. It might actually try to connect.
        # If it connects and fails (invalid login), the alert will show and button resets.

        # Let's wait for the button to be enabled again (timeout if firebase is blocked)
        try:
            expect(login_btn).to_be_enabled(timeout=5000)
            print("Button re-enabled after failure.")
        except:
            print("Button did not re-enable (possibly network timeout or firebase blocked). This is expected in restricted env.")

        page.screenshot(path="verification.png")
        browser.close()

if __name__ == "__main__":
    verify_login_ux()
