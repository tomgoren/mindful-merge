# Chrome Web Store Submission

## Store Listing

### Name

Mindful Merge

### Summary

Warns reviewers before approving a GitHub pull request with auto-merge enabled.

### Detailed Description

Mindful Merge adds a compact warning to GitHub's review dialog when both of these conditions are true:

- Auto-merge is enabled for the pull request.
- The reviewer selects Approve.

The warning explains that approving the pull request may cause it to merge automatically once its remaining requirements pass.

Mindful Merge is informational only. It does not block or delay review submission, modify GitHub's merge process, require additional confirmation, or contact an external service.

The extension:

- Runs only on GitHub pull request pages.
- Supports GitHub's current and legacy review interfaces.
- Uses the GitHub page DOM and a same-origin GitHub page request to detect auto-merge.
- Requires no GitHub token, OAuth authorization, account setup, or backend.
- Stores no browsing history, review content, credentials, or personal data.

GitHub does not publish a stable page DOM API, so GitHub UI changes may occasionally require an extension update.

Mindful Merge is an independent project and is not affiliated with or endorsed by GitHub, Inc.

### Category

Developer Tools

### Language

English

## Privacy Tab

### Single Purpose

Warn a GitHub pull request reviewer when approving a pull request that currently has auto-merge enabled.

### Permission Justification

The content script is limited to `https://github.com/*/*/pull/*`. Access to GitHub pull request pages is required to inspect the review dialog, determine whether Approve is selected, detect the pull request's auto-merge state, and display the warning inline.

The extension declares no optional permissions, storage permission, tabs permission, identity permission, or externally accessible host permissions.

### Remote Code

No. All executable code is included in the extension package. The extension does not load or execute remote code.

### Data Use

The extension reads page content on GitHub pull request pages solely to provide its warning. When Approve is selected and the auto-merge control is not available in the current view, it requests the same pull request's Conversation page from `github.com` using the user's existing GitHub session and inspects the returned HTML locally.

No user data is collected, stored, logged, sold, or transmitted to the developer or any third party. No review comments, credentials, authentication tokens, browsing history, or personally identifiable information leave the user's browser.

### Data Usage Certification

The extension's use of page data is limited to its disclosed single purpose. Data is not sold, used for advertising, used for creditworthiness or lending, or transferred to third parties.

### Privacy Policy

The extension does not collect or retain user data. If the dashboard requires a public privacy policy URL, publish `PRIVACY.md` at a stable public URL and use that URL.

## Distribution Tab

- Visibility: Public, or Unlisted for an initial soft launch.
- Regions: All regions.
- Item is free.

Unlisted items undergo the same Chrome Web Store policy review as public items.

## Test Instructions

No special account credentials are provided or required by the extension. A GitHub account with permission to review a test pull request is needed to exercise the complete workflow.

1. Open a GitHub pull request that has auto-merge enabled and still requires review.
2. Open the Files changed view.
3. Click Submit review to open the review dialog.
4. Select Approve.
5. Confirm that an inline yellow warning appears beside the approval option.
6. Select Comment or Request changes and confirm that the warning disappears.
7. Confirm that the extension does not block or delay review submission.

Diagnostic mode is available by adding `?mindful_merge_debug=1` to the pull request URL. It displays the extension version, review-control discovery, auto-merge state source, and warning state in the lower-right corner. Diagnostic information remains in the page and is not transmitted.

## Required Listing Assets

Before submission, provide:

- Store icon: `icons/mindful-merge-128.png`.
- At least one 1280x800 or 640x400 screenshot showing the Approve warning. The successful test screenshot can be cropped to remove unrelated browser chrome and the diagnostic panel.
- Optional small promotional tile: 440x280.
- Optional marquee promotional tile: 1400x560.

Do not use GitHub's logo as the extension icon or imply official GitHub affiliation.
