/**
 * SMWS Distillery Code Display - content script
 *
 * ページ内のSMWSボトルコード（例: 29.273, G1.12, B3.4）を検出し、
 * 蒸留所名をインラインバッジまたはホバーツールチップとして表示する。
 *
 * 対応サイト: smwsjapan.com / smws.com / smwsamerica.com
 */

// ── 定数 ────────────────────────────────────────────────────────────────────

const BOTTLE_CODE_PATTERN = /(?:^|\s)(([BbGg]\d{1,2}|\d{1,3})[.．]\d+)(?:\s|$)/;
const BADGE_CLASS = "smws-distillery-badge";

const SITE_KEY_MAP = {
  "smws.com":          "uk",
  "smws.eu":           "eu",
  "smwsa.com":         "usa",
  "smws.ca":           "canada",
  "smws.com.au":       "australia",
  "smws.co.nz":        "nz",
  "smws.ch":           "switzerland",
  "smws.dk":           "denmark",
  "smwssg.com":        "singapore",
  "smws.com.tw":       "taiwan",
  "smwskr.com":        "korea",
  "smwsmalaysia.com":  "malaysia",
  "smws.ph":           "philippines",
  "th.smws.com":       "thailand",
  "smws.co.za":        "southafrica",
  "smws.mx":           "mexico",
  "smws.vn":           "vietnam",
  "smwsjapan.com":     "japan",
  "shop.smwsjapan.com":"japan",
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
  if (document.getElementById(BADGE_CLASS)) return;
  const style = document.createElement("style");
  style.id = BADGE_CLASS;
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
      --hover-opacity: 1; /* :root のCSS変数をこの要素以下で再定義して継承を遮断 */
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
    /* ツールチップ本体は JS で body 直下に固定配置するため CSS では非表示のみ定義 */
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

// ── バッジ / ツールチップ生成 ─────────────────────────────────────────────────

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

  // アイコンの中央上に配置
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

  // バッジ（デフォルト）
  const badge = document.createElement("span");
  badge.className = BADGE_CLASS;
  badge.dataset.smwsBadge = "1";
  badge.textContent = name;
  return badge;
}

// ── テキストノード処理 ────────────────────────────────────────────────────────

/**
 * バッジの挿入先となる要素と挿入位置を返す。
 * テキストの親が <a> の場合は <a> の外側（後）に挿入する。
 * それ以外はテキストノードの直後に挿入する。
 *
 * @param {Text} textNode
 * @returns {{ target: Node, isBefore: boolean }}
 *   target: insertAfter の対象ノード
 */
function resolveInsertionPoint(textNode) {
  let node = textNode.parentElement;
  // <a> タグを祖先に持つ場合、その <a> の直後を挿入先にする
  while (node && node !== document.body) {
    if (node.tagName === "A") return { target: node };
    node = node.parentElement;
  }
  // <a> 以外はテキストノードの直後
  return { target: textNode };
}

/** @param {Text} textNode */
function processTextNode(textNode) {
  const text = textNode.textContent ?? "";
  const match = text.match(BOTTLE_CODE_PATTERN);
  if (!match) return;

  const name = resolveDistilleryName(match[2]);
  if (!name) return;

  const parent = textNode.parentElement;
  if (!parent) return;

  const { target } = resolveInsertionPoint(textNode);

  // 挿入先の直後に既にバッジがあれば二重挿入しない
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

// ── 設定変更メッセージの受信 ─────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message) => {
  if (message.type !== "SETTINGS_UPDATED") return;
  currentSettings = message.settings;
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
