(() => {
  "use strict";

  const WARNING_ID = "mindful-merge-warning";
  const DEBUG_ID = "mindful-merge-debug";
  const VERSION = "1.3.0";
  const WARNING_TEXT =
    "Auto-merge is enabled. Approving this PR may cause it to merge automatically once remaining requirements pass.";
  const PR_PATH = /^\/[^/]+\/[^/]+\/pull\/\d+(?:\/|$)/;
  const REVIEW_CONTAINERS = [
    '[role="dialog"][aria-label="Review changes"]',
    '[role="dialog"][aria-modal="true"]',
    '#review-changes-modal[role="dialog"]',
  ].join(",");
  const APPROVE_INPUTS = [
    'input[type="radio"][name="reviewEvent"][value="approve"]',
    'input[type="radio"][name="pull_request_review[event]"][value="approve"]',
  ].join(",");
  const AUTO_MERGE_LABEL = "Disable auto-merge";
  const AUTO_MERGE_ENABLE_LABEL = "Enable auto-merge";
  const AUTO_MERGE_ENABLED_TEXT = "enabled auto-merge";
  const AUTO_MERGE_DISABLED_TEXT = "disabled auto-merge";
  const CACHE_MS = 5000;

  let scheduled = false;
  let observedPath = location.pathname;
  let updateVersion = 0;
  let autoMergeVersion = 0;
  let autoMergeCache = null;
  let autoMergeRequest = null;
  const debugEnabled = new URLSearchParams(location.search).has(
    "mindful_merge_debug",
  );
  const debugState = {
    version: VERSION,
    path: location.pathname,
    reviewContainers: 0,
    approveInputs: 0,
    globalApproveInputs: 0,
    approveChecked: false,
    autoMerge: "not checked",
    warning: "hidden",
  };

  function debug(changes) {
    Object.assign(debugState, changes);
    document.documentElement.dataset.mindfulMergeDebug = JSON.stringify(debugState);
    if (!debugEnabled) return;

    let panel = document.getElementById(DEBUG_ID);
    if (!panel) {
      panel = document.createElement("pre");
      panel.id = DEBUG_ID;
      panel.className = "mindful-merge-debug";
      document.documentElement.append(panel);
    }
    const text = `Mindful Merge diagnostics\n${JSON.stringify(debugState, null, 2)}`;
    if (panel.textContent !== text) panel.textContent = text;
  }

  function isVisible(element) {
    return Boolean(element && element.getClientRects().length);
  }

  function hasAutoMergeControl(root, requireVisible = false) {
    return [...root.querySelectorAll("button")].some(
      (button) =>
        (!requireVisible || isVisible(button)) &&
        button.textContent.trim() === AUTO_MERGE_LABEL,
    );
  }

  function hasLatestAutoMergeEventEnabled(root) {
    let enabled = false;
    let found = false;

    for (const event of root.querySelectorAll('[id^="event-"]')) {
      const text = event.textContent.replace(/\s+/g, " ").trim();
      if (text.includes(AUTO_MERGE_ENABLED_TEXT)) {
        enabled = true;
        found = true;
      } else if (text.includes(AUTO_MERGE_DISABLED_TEXT)) {
        enabled = false;
        found = true;
      }
    }

    return found && enabled;
  }

  function getPullRequestPath() {
    const match = location.pathname.match(
      /^(\/[^/]+\/[^/]+\/pull\/\d+)(?:\/|$)/,
    );
    return match?.[1] || null;
  }

  function containsAutoMergeControl(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return false;
    const text = node.textContent.replace(/\s+/g, " ").trim();
    const timelineEvents = node.matches('[id^="event-"]')
      ? [node]
      : [...node.querySelectorAll('[id^="event-"]')];
    return (
      text === AUTO_MERGE_LABEL ||
      text === AUTO_MERGE_ENABLE_LABEL ||
      timelineEvents.some((event) => {
        const eventText = event.textContent.replace(/\s+/g, " ").trim();
        return (
          eventText.includes(AUTO_MERGE_ENABLED_TEXT) ||
          eventText.includes(AUTO_MERGE_DISABLED_TEXT)
        );
      }) ||
      [...node.querySelectorAll("button")].some((button) => {
        const label = button.textContent.trim();
        return label === AUTO_MERGE_LABEL || label === AUTO_MERGE_ENABLE_LABEL;
      })
    );
  }

  function invalidateAutoMergeState() {
    autoMergeVersion++;
    autoMergeCache = null;
    autoMergeRequest = null;
  }

  async function hasAutoMergeEnabled() {
    if (hasAutoMergeControl(document, true)) {
      debug({ autoMerge: "enabled: visible control" });
      return true;
    }

    const path = getPullRequestPath();
    if (!path) {
      debug({ autoMerge: "unknown: PR path not found" });
      return false;
    }

    const now = Date.now();
    if (
      autoMergeCache?.path === path &&
      now - autoMergeCache.time < CACHE_MS
    ) {
      debug({ autoMerge: `${autoMergeCache.enabled ? "enabled" : "disabled"}: cache` });
      return autoMergeCache.enabled;
    }

    if (autoMergeRequest?.path === path) return autoMergeRequest.promise;

    const requestVersion = autoMergeVersion;
    const promise = (async () => {
      try {
        const response = await fetch(path, {
          credentials: "same-origin",
          headers: { Accept: "text/html" },
        });
        if (!response.ok) {
          debug({ autoMerge: `unknown: conversation HTTP ${response.status}` });
          return false;
        }

        const page = new DOMParser().parseFromString(
          await response.text(),
          "text/html",
        );
        const control = hasAutoMergeControl(page);
        const timeline = hasLatestAutoMergeEventEnabled(page);
        const enabled = control || timeline;
        if (requestVersion !== autoMergeVersion) return false;
        autoMergeCache = { path, enabled, time: Date.now() };
        debug({
          autoMerge: `${enabled ? "enabled" : "disabled"}: ${control ? "conversation control" : "timeline"}`,
        });
        return enabled;
      } catch (error) {
        debug({ autoMerge: `unknown: ${error.message}` });
        return false;
      } finally {
        if (autoMergeRequest?.promise === promise) autoMergeRequest = null;
      }
    })();

    autoMergeRequest = { path, promise };
    return promise;
  }

  function getActiveReview() {
    const containers = [...document.querySelectorAll(REVIEW_CONTAINERS)];
    const approveInputs = containers.flatMap((container) =>
      [...container.querySelectorAll(APPROVE_INPUTS)].map((approve) => ({
        container,
        approve,
      })),
    );
    const globalApproveInputs = [...document.querySelectorAll(APPROVE_INPUTS)];
    debug({
      reviewContainers: containers.length,
      approveInputs: approveInputs.length,
      globalApproveInputs: globalApproveInputs.length,
      approveChecked: approveInputs.some(({ approve }) => approve.checked),
    });

    const checked = approveInputs.find(
      ({ container, approve }) => approve.checked && isVisible(container),
    );
    if (checked) return checked;

    for (const { container, approve } of approveInputs) {
      if (approve && isVisible(container)) return { container, approve };
    }

    for (const approve of globalApproveInputs) {
      const container = approve.closest(
        '[role="dialog"], #review-changes-modal, anchored-position',
      );
      if (container && (approve.checked || isVisible(container))) {
        return { container, approve };
      }
    }

    return null;
  }

  function removeWarning() {
    document.getElementById(WARNING_ID)?.remove();
    debug({ warning: "hidden" });
  }

  async function update() {
    scheduled = false;
    const version = updateVersion;

    if (!PR_PATH.test(location.pathname)) {
      removeWarning();
      return;
    }

    const review = getActiveReview();
    if (!review?.approve.checked) {
      removeWarning();
      return;
    }

    const autoMergeEnabled = await hasAutoMergeEnabled();
    if (version !== updateVersion) return;

    const currentReview = getActiveReview();
    if (!autoMergeEnabled || !currentReview?.approve.checked) {
      removeWarning();
      return;
    }

    const existing = document.getElementById(WARNING_ID);
    if (existing && currentReview.container.contains(existing)) return;
    existing?.remove();

    const warning = document.createElement("div");
    warning.id = WARNING_ID;
    warning.className = "mindful-merge-warning";
    warning.setAttribute("role", "status");
    warning.textContent = WARNING_TEXT;

    const approveRow =
      currentReview.approve.closest("label") || currentReview.approve.parentElement;
    const insertionPoint = approveRow?.parentElement || currentReview.container;
    insertionPoint.append(warning);
    debug({ warning: "shown" });
  }

  function scheduleUpdate() {
    if (!PR_PATH.test(location.pathname)) return;
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => void update());
  }

  const observer = new MutationObserver((mutations) => {
    if (location.pathname !== observedPath) {
      handleNavigation();
      return;
    }

    const pageMutations = mutations.filter(
      (mutation) => {
        if (mutation.target.closest?.(`#${DEBUG_ID}`)) return false;
        if (mutation.type !== "childList") return true;
        const changedNodes = [...mutation.addedNodes, ...mutation.removedNodes];
        return (
          changedNodes.length === 0 ||
          !changedNodes.every(
            (node) => node.id === DEBUG_ID || node.closest?.(`#${DEBUG_ID}`),
          )
        );
      },
    );
    if (pageMutations.length === 0) return;

    if (
      pageMutations.some(
        (mutation) =>
          containsAutoMergeControl(mutation.target) ||
          [...mutation.addedNodes, ...mutation.removedNodes].some(
            containsAutoMergeControl,
          ),
      )
    ) {
      invalidateAutoMergeState();
    }

    scheduleUpdate();
  });

  function handleNavigation() {
    const pathChanged = location.pathname !== observedPath;
    observedPath = location.pathname;
    debug({ path: observedPath });
    observer.disconnect();

    if (!PR_PATH.test(observedPath)) {
      scheduled = false;
      updateVersion++;
      invalidateAutoMergeState();
      removeWarning();
      return;
    }

    if (pathChanged) {
      updateVersion++;
      invalidateAutoMergeState();
      removeWarning();
    }
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["checked", "disabled", "hidden", "open"],
    });
    scheduleUpdate();
  }

  document.addEventListener(
    "change",
    (event) => {
      if (event.target.matches?.(APPROVE_INPUTS)) invalidateAutoMergeState();
      scheduleUpdate();
    },
    true,
  );
  document.addEventListener("input", scheduleUpdate, true);
  document.addEventListener(
    "click",
    (event) => {
      const button = event.target.closest?.("button");
      const label = button?.textContent.trim();
      if (label === AUTO_MERGE_LABEL || label === AUTO_MERGE_ENABLE_LABEL) {
        invalidateAutoMergeState();
      }
    },
    true,
  );
  document.addEventListener("turbo:load", handleNavigation);
  document.addEventListener("pjax:end", handleNavigation);
  window.addEventListener("popstate", handleNavigation);

  debug({ status: "content script loaded" });
  handleNavigation();
})();
