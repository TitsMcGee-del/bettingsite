## 2026-01-30 - Firebase Loading State Trap
**Learning:** Simple async UI patterns (like disabled buttons) can become soft-locks if error handling is omitted in the network callback. Users on flaky connections would be forced to refresh.
**Action:** Always pair success callbacks with error callbacks when modifying UI state based on network requests.
