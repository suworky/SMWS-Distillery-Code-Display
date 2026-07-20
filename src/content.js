/**
 * SMWS Distillery Code Display - content script
 *
 * ページ内のSMWSボトルコード（例: 29.273, G1.12, B3.4, RW1.7, GN1.16）を検出し、
 * 蒸留所名をインラインバッジまたはホバーツールチップとして表示する。
 *
 * 対応サイト: smwsjapan.com, smws.com, smwsa.com
 */

// ── 定数 ────────────────────────────────────────────────────────────────────

const BOTTLE_CODE_PATTERN =
  /(?:^|[\s\u00A0])(((?:[GgCcRr][WwNn]|[A-Za-z])\d{1,2}|\d{1,3})[.．]\d+)(?:[\s\u00A0]|$)/;
const BADGE_CLASS = "smws-distillery-badge";
// style 要素用の固有ID（クラス名と混同しない）
const STYLE_ELEMENT_ID = "smws-distillery-style";

const SITE_KEY_MAP = {
  "smwsjapan.com": "japan",
  "smws.com": "uk",
  "smwsa.com": "usa",
};

const DEFAULT_SETTINGS = {
  enabled: true,
  uiLang: "ja",
  language: "en",
  displayStyle: "badge",
  sites: {
    japan: true,
    uk: true,
    usa: true,
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
      font-size: 0.70em;
      font-weight: 600;
      padding: 0.5px 7px;
      border-radius: 100px;
      margin: 4px 3px;
      vertical-align: 4px;
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
      vertical-align: 3px;
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
  const normalized = rawCode
    .trim()
    .replace(/^([A-Za-z]+)/, (s) => s.toUpperCase());
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
  tip.style.top = `${rect.top - tip.offsetHeight - 8}px`;
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

// テキストノード全体がボトルコードそのものである場合のパターン（UKサイト対応）
const BOTTLE_CODE_EXACT_PATTERN =
  /^((?:[GgCcRr][WwNn]|[A-Za-z])\d{1,2}|\d{1,3})[.．]\d+$/;

/** @param {Text} textNode */
function processTextNode(textNode) {
  const text = (textNode.textContent ?? "").replace(
    /^[\s\u00A0]+|[\s\u00A0]+$/g,
    "",
  );
  // 軽微な最適化: ドットが含まれないテキストは蒸留所コードでない可能性が高い
  if (!text.includes(".") && !text.includes("．")) return;

  // テキストノード全体がコードそのもの（例: "3.364"）の場合と
  // コードが前後のテキストに含まれる場合の両方に対応する
  const exactMatch = text.match(BOTTLE_CODE_EXACT_PATTERN);
  const match = exactMatch
    ? [null, text, text.split(/[.．]/)[0]]
    : text.match(BOTTLE_CODE_PATTERN);
  if (!match) return;

  const name = resolveDistilleryName(match[2]);
  if (!name) return;

  const parent = textNode.parentElement;
  if (!parent) return;

  if (textNode.nextSibling?.dataset?.smwsBadge) return;

  textNode.after(createIndicator(name));
}

// ── DOM 走査 ─────────────────────────────────────────────────────────────────

/** @param {Node} root */
function walkAndProcess(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const tag = node.parentElement?.tagName;
      if (tag === "SCRIPT" || tag === "STYLE") return NodeFilter.FILTER_REJECT;
      if (node.parentElement?.dataset.smwsBadge)
        return NodeFilter.FILTER_REJECT;
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
      // ノード追加
      for (const addedNode of mutation.addedNodes) {
        if (addedNode.nodeType === Node.ELEMENT_NODE) {
          walkAndProcess(addedNode);
        }
      }
      // .value の子ノード変化（BigCommerceがコードを流し込んだタイミング）
      if (
        mutation.type === "childList" &&
        mutation.target.nodeType === Node.ELEMENT_NODE &&
        mutation.target.classList.contains("value")
      ) {
        walkAndProcess(mutation.target);
      }
      // .value のテキストノード書き換え
      if (
        mutation.type === "characterData" &&
        mutation.target.parentElement?.classList.contains("value")
      ) {
        processTextNode(mutation.target);
      }
    }
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
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
