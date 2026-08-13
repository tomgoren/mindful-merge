# Releasing Mindful Merge

## First Publication

1. Open the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/).
2. Register the publisher account, accept the developer agreement, and pay Google's one-time registration fee.
3. Complete publisher identity and contact-email verification.
4. Click **Add new item** and upload `dist/mindful-merge-1.3.0.zip`.
5. Complete the Store Listing, Privacy, Distribution, and Test instructions tabs using `STORE_LISTING.md`.
6. Upload `icons/mindful-merge-128.png` as the listing icon and at least one compliant screenshot.
7. Choose Public or Unlisted visibility and All regions.
8. Click **Submit for Review**.

For a cautious launch, select deferred publishing. Once review succeeds, Chrome allows up to 30 days to publish the staged release.

## Updates

1. Increase `version` in `manifest.json`; Chrome rejects uploads that reuse an existing version.
2. Run `node --test content.test.js`.
3. Build a new ZIP containing only `manifest.json`, `content.js`, `content.css`, `LICENSE`, and the runtime icon PNGs.
4. Upload the ZIP to the existing item and submit the update for review.

Never include test files, screenshots containing private information, editor metadata, secrets, or the previous ZIP inside a release package.
