/**
 * SMWS Distillery Code Display - content script
 *
 * ページ内のSMWSボトルコード（例: 29.273, G1.12, B3.4）を検出し、
 * 蒸留所名をインラインバッジまたはホバーツールチップとして表示する。
 *
 * 対応サイト: smwsjapan.com
 */

// ── 定数 ────────────────────────────────────────────────────────────────────

const BOTTLE_CODE_PATTERN = /(?:^|\s)(([BbGg]\d{1,2}|\d{1,3})[.．]\d+)(?:\s|$)/;
const BADGE_CLASS = "smws-distillery-badge";
// style 要素用の固有ID（クラス名と混同しない）
const STYLE_ELEMENT_ID = "smws-distillery-style";

const SITE_KEY_MAP = {
  "smwsjapan.com": "japan",
};

const DEFAULT_SETTINGS = {
  enabled:      true,
  uiLang:       "ja",
  language:     "en",
  displayStyle: "badge",
  sites: {
    japan: true,
  },
};

// ── 現在の設定 ────────────────────────────────────────────────────────────────

let currentSettings = { ...DEFAULT_SETTINGS };

// ── サイト判定 ────────────────────────────────────────────────────────────────

function getCurrentSiteKey() {
  const host = location.hostname.replace(/^www\./, "");
  return SITE_KEY_MAP[host] ?? null;
}

function isActive() {
  if (!currentSettings.enabled) return false;
  const siteKey = getCurrentSiteKey();
  if (!siteKey) return false;
  return currentSettings.sites[siteKey] ?? false;
}

// ── スタイル注入 ──────────────────────────────────────────────────────────────

function injectStyles() {
  if (document.getElementById(STYLE_ELEMENT_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ELEMENT_ID;
  style.textContent = `
    /* ── インラインバッジ ── */
    .${BADGE_CLASS} {
      display: inline-block;
      background: #dbeafe;
      color: #1e40af;
      font-size: 0.75em;
      font-weight: 600;
      padding: 1px 7px;
      border-radius: 99px;
      margin-left: 5px;
      vertical-align: middle;
      white-space: nowrap;
      font-family: sans-serif;
      line-height: 1.6;
      letter-spacing: 0.01em;
    }

    /* ── ホバーツールチップ ── */
    .${BADGE_CLASS}--tooltip-wrap {
      display: inline-block;
      position: relative;
      margin-left: 4px;
      vertical-align: middle;
      --hover-opacity: 1;
    }
    .${BADGE_CLASS}--tooltip-icon {
      display: inline-block;
      width: 15px;
      height: 15px;
      border-radius: 50%;
      background: #378ADD;
      color: white;
      font-size: 10px;
      font-weight: 700;
      text-align: center;
      line-height: 15px;
      font-family: sans-serif;
      cursor: default;
    }
    #smws-tooltip-singleton {
      position: fixed;
      display: none;
      background: #1e40af;
      color: white;
      font-size: 12px;
      font-family: sans-serif;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 6px;
      white-space: nowrap;
      z-index: 2147483647;
      pointer-events: none;
    }
    #smws-tooltip-singleton::after {
      content: "";
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 5px solid transparent;
      border-top-color: #1e40af;
    }
  `;
  document.head.appendChild(style);
}

// ── 蒸留所名の解決 ────────────────────────────────────────────────────────────

/** @param {string} rawCode @returns {string | null} */
function resolveDistilleryName(rawCode) {
  const normalized = rawCode.trim().replace(/^([bgBG])/, (c) => c.toUpperCase());
  const entry = DISTILLERIES[normalized];
  if (!entry) return null;
  return currentSettings.language === "ja" ? entry.ja : entry.en;
}

// ── グローバルツールチップ（body直下に1つだけ・fixed配置） ─────────────────────

function ensureTooltipSingleton() {
  if (document.getElementById("smws-tooltip-singleton")) return;
  const el = document.createElement("div");
  el.id = "smws-tooltip-singleton";
  document.body.appendChild(el);
}

/** @param {string} name @param {HTMLElement} icon */
function showTooltip(name, icon) {
  const tip = document.getElementById("smws-tooltip-singleton");
  if (!tip) return;
  tip.textContent = name;
  tip.style.display = "block";
  const rect = icon.getBoundingClientRect();
  const tipW = tip.offsetWidth;
  tip.style.left = `${rect.left + rect.width / 2 - tipW / 2}px`;
  tip.style.top  = `${rect.top - tip.offsetHeight - 8}px`;
}

function hideTooltip() {
  const tip = document.getElementById("smws-tooltip-singleton");
  if (tip) tip.style.display = "none";
}

/** @param {string} name @returns {HTMLElement} */
function createIndicator(name) {
  if (currentSettings.displayStyle === "tooltip") {
    const wrap = document.createElement("span");
    wrap.className = `${BADGE_CLASS}--tooltip-wrap`;
    wrap.dataset.smwsBadge = "1";

    const icon = document.createElement("span");
    icon.className = `${BADGE_CLASS}--tooltip-icon`;
    icon.textContent = "?";
    icon.addEventListener("mouseenter", () => showTooltip(name, icon));
    icon.addEventListener("mouseleave", hideTooltip);

    wrap.appendChild(icon);
    return wrap;
  }

  const badge = document.createElement("span");
  badge.className = BADGE_CLASS;
  badge.dataset.smwsBadge = "1";
  badge.textContent = name;
  return badge;
}

// ── テキストノード処理 ────────────────────────────────────────────────────────

function resolveInsertionPoint(textNode) {
  let node = textNode.parentElement;
  while (node && node !== document.body) {
    if (node.tagName === "A") return { target: node };
    node = node.parentElement;
  }
  return { target: textNode };
}

/** @param {Text} textNode */
function processTextNode(textNode) {
  const text = textNode.textContent ?? "";
  // 軽微な最適化: ドットが含まれないテキストは蒸留所コードでない可能性が高い
  if (!text.includes('.') && !text.includes('．')) return;
  const match = text.match(BOTTLE_CODE_PATTERN);
  if (!match) return;

  const name = resolveDistilleryName(match[2]);
  if (!name) return;

  const parent = textNode.parentElement;
  if (!parent) return;

  const { target } = resolveInsertionPoint(textNode);

  if (target.nextSibling?.dataset?.smwsBadge) return;

  target.after(createIndicator(name));
}

// ── DOM 走査 ─────────────────────────────────────────────────────────────────

/** @param {Node} root */
function walkAndProcess(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const tag = node.parentElement?.tagName;
      if (tag === "SCRIPT" || tag === "STYLE") return NodeFilter.FILTER_REJECT;
      if (node.parentElement?.dataset.smwsBadge) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const targets = [];
  while (walker.nextNode()) targets.push(walker.currentNode);
  targets.forEach(processTextNode);
}

// ── バッジの全削除 ────────────────────────────────────────────────────────────

function removeAllBadges() {
  document.querySelectorAll("[data-smws-badge]").forEach((el) => el.remove());
}

// ── 動的コンテンツ対応 ────────────────────────────────────────────────────────

function observeDynamicContent() {
  const observer = new MutationObserver((mutations) => {
    if (!isActive()) return;
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        if (addedNode.nodeType === Node.ELEMENT_NODE) {
          walkAndProcess(addedNode);
        }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

// ── 設定変更の監視（chrome.storage.onChanged） ────────────────────────────────

chrome.storage.onChanged.addListener((changes) => {
  const updated = {};
  for (const key in changes) {
    updated[key] = changes[key].newValue;
  }
  currentSettings = { ...currentSettings, ...updated };
  removeAllBadges();
  if (isActive()) walkAndProcess(document.body);
});

// ── エントリポイント ──────────────────────────────────────────────────────────

chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
  currentSettings = settings;
  injectStyles();
  ensureTooltipSingleton();
  if (isActive()) walkAndProcess(document.body);
  observeDynamicContent();
});