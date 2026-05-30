/**
 * popup.js
 * ポップアップUIのロジック。
 * - 設定を chrome.storage.sync に保存
 * - 変更時は content script に通知
 * - UIの表示言語（日本語 / English）を切り替え
 */

// ── i18n テキスト定義 ────────────────────────────────────────────────────────

const I18N = {
  ja: {
    subtitle:          "蒸留所コードを蒸留所名に変換",
    masterLabel:       "拡張機能を有効にする",
    masterSub:         "全サイトへの適用をまとめて切り替え",
    distLangLabel:     "蒸留所名の表示言語",
    langEnBtn:         "English",
    langJaBtn:         "日本語",
    displayStyleLabel: "表示スタイル",
    styleBadge:        "インラインバッジ",
    styleTooltip:      "ホバーツールチップ",
    tooltipHint:       "ホバーで表示",
    sitesLabel:        "対応サイト",
  },
  en: {
    subtitle:          "Show distillery names for bottle codes",
    masterLabel:       "Enable extension",
    masterSub:         "Toggle all sites at once",
    distLangLabel:     "Distillery name language",
    langEnBtn:         "English",
    langJaBtn:         "Japanese",
    displayStyleLabel: "Display style",
    styleBadge:        "Inline badge",
    styleTooltip:      "Hover tooltip",
    tooltipHint:       "Hover to show",
    sitesLabel:        "Supported sites",
  },
};

// ── デフォルト設定 ────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  enabled:      true,
  uiLang:       "ja",
  language:     "en",
  displayStyle: "badge",
  sites: {
    japan: true,
  },
};

// ── 要素の取得 ────────────────────────────────────────────────────────────────

const masterEnabled = document.getElementById("masterEnabled");
const uiLangJaBtn   = document.getElementById("uiLangJa");
const uiLangEnBtn   = document.getElementById("uiLangEn");
const langEnBtn     = document.getElementById("langEn");
const langJaBtn     = document.getElementById("langJa");
const styleRadios   = document.querySelectorAll("input[name='displayStyle']");
const optBadge      = document.getElementById("opt-badge");
const optTooltip    = document.getElementById("opt-tooltip");
const siteJapan     = document.getElementById("siteJapan");

// ── i18n 適用 ─────────────────────────────────────────────────────────────────

/** @param {"ja"|"en"} lang */
function applyUiLang(lang) {
  const t = I18N[lang];
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (t[key] !== undefined) el.textContent = t[key];
  });
  uiLangJaBtn.classList.toggle("active", lang === "ja");
  uiLangEnBtn.classList.toggle("active", lang === "en");
  document.documentElement.lang = lang;
}

// ── UIへの設定反映 ────────────────────────────────────────────────────────────

/** @param {typeof DEFAULT_SETTINGS} settings */
function applyToUI(settings) {
  masterEnabled.checked = settings.enabled;
  updateBodyDisabled(settings.enabled);
  applyUiLang(settings.uiLang);
  langEnBtn.classList.toggle("active", settings.language === "en");
  langJaBtn.classList.toggle("active", settings.language === "ja");
  styleRadios.forEach((r) => { r.checked = r.value === settings.displayStyle; });
  optBadge.classList.toggle("active",   settings.displayStyle === "badge");
  optTooltip.classList.toggle("active", settings.displayStyle === "tooltip");
  siteJapan.checked = settings.sites.japan;
}

// ── 設定の保存・通知 ──────────────────────────────────────────────────────────

function saveSettings() {
  const settings = {
    enabled:      masterEnabled.checked,
    uiLang:       uiLangJaBtn.classList.contains("active") ? "ja" : "en",
    language:     langEnBtn.classList.contains("active") ? "en" : "ja",
    displayStyle: [...styleRadios].find((r) => r.checked)?.value ?? "badge",
    sites: {
      japan: siteJapan.checked,
    },
  };

  chrome.storage.sync.set(settings);

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]?.id) return;
    chrome.tabs.sendMessage(
      tabs[0].id,
      { type: "SETTINGS_UPDATED", settings },
      () => void chrome.runtime.lastError
    );
  });
}

// ── 補助 ─────────────────────────────────────────────────────────────────────

/** @param {boolean} enabled */
function updateBodyDisabled(enabled) {
  document.body.classList.toggle("disabled", !enabled);
}

// ── イベントリスナー ──────────────────────────────────────────────────────────

masterEnabled.addEventListener("change", () => {
  updateBodyDisabled(masterEnabled.checked);
  saveSettings();
});

uiLangJaBtn.addEventListener("click", () => { applyUiLang("ja"); saveSettings(); });
uiLangEnBtn.addEventListener("click", () => { applyUiLang("en"); saveSettings(); });

langEnBtn.addEventListener("click", () => {
  langEnBtn.classList.add("active");
  langJaBtn.classList.remove("active");
  saveSettings();
});
langJaBtn.addEventListener("click", () => {
  langJaBtn.classList.add("active");
  langEnBtn.classList.remove("active");
  saveSettings();
});

styleRadios.forEach((radio) => {
  radio.addEventListener("change", () => {
    optBadge.classList.toggle("active",   radio.value === "badge"   && radio.checked);
    optTooltip.classList.toggle("active", radio.value === "tooltip" && radio.checked);
    saveSettings();
  });
});

siteJapan.addEventListener("change", saveSettings);

// ── 初期ロード ────────────────────────────────────────────────────────────────

chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
  applyToUI(settings);
});
