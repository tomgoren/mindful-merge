const assert = require("node:assert/strict");
const test = require("node:test");
const vm = require("node:vm");
const fs = require("node:fs");

const source = fs.readFileSync(`${__dirname}/content.js`, "utf8");

function makeElement(properties = {}) {
  return {
    children: [],
    textContent: "",
    checked: false,
    getClientRects: () => [1],
    querySelectorAll: () => [],
    querySelector: () => null,
    matches: () => false,
    closest: () => null,
    contains(element) {
      return this.children.includes(element);
    },
    append(element) {
      this.children.push(element);
      element.parentElement = this;
    },
    remove() {
      this.parentElement?.children.splice(this.parentElement.children.indexOf(this), 1);
      this.removed = true;
    },
    setAttribute(name, value) {
      this[name] = value;
    },
    ...properties,
  };
}

async function runScenario({ control = false, events = [], replaceApprove = false } = {}) {
  const listeners = new Map();
  const warningHost = makeElement();
  const label = makeElement({ parentElement: warningHost });
  let approve = makeElement({
    checked: true,
    closest: () => label,
    matches: () => true,
  });
  const dialog = makeElement({
    querySelector: () => approve,
    querySelectorAll: () => [approve],
    contains: (element) => warningHost.children.includes(element),
  });
  const document = makeElement({
    documentElement: makeElement({ dataset: {} }),
    querySelectorAll(selector) {
      if (selector === "button") return [];
      if (selector.includes('input[type="radio"]')) return [approve];
      if (selector.includes('[role="dialog"]')) return [dialog];
      return [];
    },
    getElementById(id) {
      return warningHost.children.find((element) => element.id === id) || null;
    },
    createElement: () => makeElement(),
    addEventListener(name, listener) {
      listeners.set(name, listener);
    },
  });
  let fetchedPath;

  const responseDocument = makeElement({
    querySelectorAll(selector) {
      if (selector === "button" && control) {
        return [makeElement({ textContent: "Disable auto-merge" })];
      }
      if (selector === '[id^="event-"]') {
        return events.map((textContent) => makeElement({ textContent }));
      }
      return [];
    },
  });

  vm.runInNewContext(source, {
    document,
    location: { pathname: "/owner/repo/pull/2/files", search: "" },
    window: { addEventListener() {} },
    Node: { ELEMENT_NODE: 1 },
    URLSearchParams,
    MutationObserver: class {
      observe() {}
      disconnect() {}
    },
    requestAnimationFrame: (callback) => callback(),
    DOMParser: class {
      parseFromString() {
        return responseDocument;
      }
    },
    fetch: async (path) => {
      fetchedPath = path;
      if (replaceApprove) {
        approve = makeElement({
          checked: true,
          closest: () => label,
          matches: () => true,
        });
      }
      return { ok: true, text: async () => "<html></html>" };
    },
    Date,
  });

  await new Promise((resolve) => setImmediate(resolve));
  return { approve, fetchedPath, listeners, warningHost };
}

test("warns from the Files review dialog using the Conversation control", async () => {
  const scenario = await runScenario({ control: true });

  assert.equal(scenario.fetchedPath, "/owner/repo/pull/2");
  assert.equal(scenario.warningHost.children.length, 1);
  assert.match(scenario.warningHost.children[0].textContent, /Auto-merge is enabled/);

  scenario.approve.checked = false;
  scenario.listeners.get("change")({ target: scenario.approve });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(scenario.warningHost.children.length, 0);
});

test("does not warn when the Conversation page has no active auto-merge control", async () => {
  const scenario = await runScenario();

  assert.equal(scenario.fetchedPath, "/owner/repo/pull/2");
  assert.equal(scenario.warningHost.children.length, 0);
});

test("warns when the latest timeline state enables auto-merge", async () => {
  const scenario = await runScenario({
    events: ["disabled auto-merge", "enabled auto-merge"],
  });

  assert.equal(scenario.warningHost.children.length, 1);
});

test("does not warn when the latest timeline state disables auto-merge", async () => {
  const scenario = await runScenario({
    events: ["enabled auto-merge", "disabled auto-merge"],
  });

  assert.equal(scenario.warningHost.children.length, 0);
});

test("warns after React replaces the checked approve input during detection", async () => {
  const scenario = await runScenario({
    events: ["enabled auto-merge"],
    replaceApprove: true,
  });

  assert.equal(scenario.warningHost.children.length, 1);
});
