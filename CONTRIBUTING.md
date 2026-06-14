# コントリビューションガイドライン

スムーズに作業を進めるため、以下のルールに従ってください。

---

## ブランチ戦略

```
main
 └── feature/add-distillery-code   ← 機能追加
 └── fix/tooltip-position-bug      ← バグ修正
 └── chore/update-dependencies     ← 雑務・設定変更
 └── docs/update-readme            ← ドキュメント修正
```

### ブランチ命名規則

| 種別 | プレフィックス | 例 |
|------|--------------|-----|
| 機能追加 | `feature/` | `feature/add-smws-uk-support` |
| バグ修正 | `fix/` | `fix/badge-not-showing` |
| ドキュメント | `docs/` | `docs/update-contributing` |
| 雑務・設定 | `chore/` | `chore/update-manifest` |
| リファクタリング | `refactor/` | `refactor/content-script` |

- ブランチ名はすべて **小文字・ハイフン区切り** にする
- 作業内容が一目でわかる名前にする
- 日本語は使用しない

---

## 開発フロー

1. `main` から新しいブランチを作成する
2. 変更をコミットする（コミットメッセージのルールは後述）
3. Google Web Store Storeに申請
4. 承認後、`main` へ Pull Request を作成する
5. レビュー後にマージする

```bash
# 例: 機能追加の場合
git switch main
git pull origin main
git switch -c feature/add-smws-uk-support

# 作業・コミット後
git push origin feature/add-smws-uk-support
# → GitHub で Pull Request を作成
```

---

## コミットメッセージ

以下の形式に従う（[Conventional Commits](https://www.conventionalcommits.org/) 準拠）:

```
<type>: <変更内容の要約>
```

### type 一覧

| type | 用途 |
|------|------|
| `feat` | 新機能の追加 |
| `fix` | バグ修正 |
| `docs` | ドキュメントのみの変更 |
| `chore` | ビルド・設定・依存関係の変更 |
| `refactor` | 機能を変えないコード整理 |
| `style` | フォーマット修正（スペース・セミコロン等） |

### 例

```
feat: SMWS UKサイトへの対応を追加
fix: ツールチップが画面外にはみ出る問題を修正
docs: 蒸留所コード一覧にG17を追記
chore: manifest.json のバージョンを更新
```

- 1行目は50文字以内を目安にする
- 日本語・英語どちらでも可
- 現在形で書く（「追加した」ではなく「追加する」または「追加」）

---

## `main` ブランチの保護ルール

- **`main` への直接 push は禁止** — 必ずブランチ経由で Pull Request を作成すること
- マージ前に動作確認を行う
- マージ方法は **Squash merge** を推奨（コミット履歴をきれいに保つため）

---

## Pull Request のルール

- タイトルはコミットメッセージと同じ形式（`feat: ...` / `fix: ...`）にする
- 変更内容・動作確認方法をできるだけ記載する
- スクリーンショットがあると確認しやすい（UI変更の場合）
- WIPの場合は `[WIP]` をタイトルに付ける

---

## ファイル構成

```
src/
 ├── manifest.json       # 拡張機能の設定
 ├── content.js          # ページへの注入スクリプト
 ├── distilleries.js     # 蒸留所コード → 蒸留所名のマッピング
 ├── popup.html          # ポップアップUI
 ├── popup.js            # ポップアップのロジック
 └── icons/              # アイコン画像
```

### 蒸留所データを追加・修正する場合

`distilleries.js` のみを変更する。  
フォーマットは既存エントリに従い、`en`（英語名）と `ja`（日本語名）の両方を必ず記載すること。

```js
"166": { en: "Example Distillery", ja: "エグザンプル蒸留所" },
```

---

## ライセンス

このリポジトリは [MIT License](./LICENSE) のもとで公開されています。  
コントリビュートすることで、あなたの変更も同ライセンスで提供されることに同意したものとみなします。