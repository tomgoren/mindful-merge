(() => {
  "use strict";

  const WARNING_ID = "mindful-merge-warning";
  const WARNING_TEXT =
    "Auto-merge is enabled. Approving this PR may cause it to merge automatically once remaining requirements pass.";
  const PR_PATH = /^\/[^/]+\/[^/]+\/pull\/\d+(?:\/|$)/;
  const REVIEW_CONTAINERS = [
    '[role="dialog"][aria-label="Review changes"]',
    '[role="dialog"][aria-modal="true"]',
    "#review-changes-modal[open]",
  ].join(",");
  const APPROVE_INPUTS = [
    'input[type="radio"][name="reviewEvent"][value="approve"]',
    'input[type="radio"][name="pull_request_review[event]"][value="approve"]',
  ].join(",");

  let scheduled = false;
  let observedPath = location.pathname;

  function isVisible(element) {
    return Boolean(element && element.getClientRects().length);
  }

  function hasAutoMergeEnabled() {
    return [...document.querySelectorAll("button")].some(
      (button) =>
        isVisible(button) &&
        button.textContent.trim() === "Disable auto-merge",
    );
  }

  function getActiveReview() {
    for (const container of document.querySelectorAll(REVIEW_CONTAINERS)) {
      if (!isVisible(container)) continue;

      const approve = container.querySelector(APPROVE_INPUTS);
      if (approve) return { container, approve };
    }

    return null;
  }

  function removeWarning() {
    document.getElementById(WARNING_ID)?.remove();
  }

  function update() {
    scheduled = false;

    if (!PR_PATH.test(location.pathname)) {
      removeWarning();
      return;
    }

    const review = getActiveReview();
    if (!review?.approve.checked || !hasAutoMergeEnabled()) {
      removeWarning();
      return;
    }

    const existing = document.getElementById(WARNING_ID);
    if (existing && review.container.contains(existing)) return;
    existing?.remove();

    const warning = document.createElement("div");
    warning.id = WARNING_ID;
    warning.className = "mindful-merge-warning";
    warning.setAttribute("role", "status");
    warning.textContent = WARNING_TEXT;

    const approveRow = review.approve.closest("label") || review.approve.parentElement;
    const insertionPoint = approveRow?.parentElement || review.container;
    insertionPoint.append(warning);
  }

  function scheduleUpdate() {
    if (!PR_PATH.test(location.pathname)) return;
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  }

  const observer = new MutationObserver(() => {
    if (location.pathname !== observedPath) {
      handleNavigation();
      return;
    }

    scheduleUpdate();
  });

  function handleNavigation() {
    const pathChanged = location.pathname !== observedPath;
    observedPath = location.pathname;
    observer.disconnect();

    if (!PR_PATH.test(observedPath)) {
      scheduled = false;
      removeWarning();
      return;
    }

    if (pathChanged) removeWarning();
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["checked", "disabled", "hidden", "open"],
    });
    scheduleUpdate();
  }

  document.addEventListener("change", scheduleUpdate, true);
  document.addEventListener("turbo:load", handleNavigation);
  document.addEventListener("pjax:end", handleNavigation);
  window.addEventListener("popstate", handleNavigation);

  handleNavigation();
})();
