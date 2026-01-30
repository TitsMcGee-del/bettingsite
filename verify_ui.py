import os
import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        file_path = os.path.abspath("benchmark.html")
        await page.goto(f"file://{file_path}")

        # Wait for rendering to complete (benchmark runs after 1000ms + exec time)
        await page.wait_for_selector("#user-betting-odds .match-row", timeout=5000)

        # Take screenshot of the optimized container
        element = await page.query_selector("#user-betting-odds")
        await element.screenshot(path="verification.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())