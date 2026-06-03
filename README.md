# 🐙 OctoMobile

> A complete native-feeling **GitHub client for Android** — manage your repos, issues, PRs, branches, commits, Actions, Releases, Gists, notifications and more.

[![Build](https://github.com/iroennys-admin/github-manager-android/actions/workflows/build.yml/badge.svg)](https://github.com/iroennys-admin/github-manager-android/actions/workflows/build.yml)

## ✨ Features

- 🔐 **Two login methods**:
  - **OAuth Device Flow** — type a code on github.com, no token to copy
  - **Personal Access Token** — paste and go
- 📦 **Full repos** — browse, star, watch, fork, create, delete, change topics
- 🌿 **Branches & commits** — create/delete branches, browse history, see diffs
- 📁 **File explorer + editor** — read, write, commit changes from your phone
- 🐛 **Issues** — list, filter, create, comment, label, assign, close/reopen, lock
- 🔀 **Pull Requests** — review (approve / request changes), merge (merge/squash/rebase), comment, view diffs
- ⚙️ **Actions** — list workflows, see run status, re-run, cancel, dispatch new runs
- 🎉 **Releases** — browse, download assets
- 📝 **Gists** — list mine + starred, create, edit, delete
- 🔔 **Notifications inbox** — read, mark-as-read, unsubscribe
- 🔍 **Search** — repos, issues, users, code
- 🏢 **Organizations**, ⭐ **Starred**, 👥 **Followers/Following**, 👤 **Profile**
- 📊 **Rate-limit monitor** in Settings
- 🎨 **5 themes** — GitHub Dark, GitHub Dimmed, Midnight, Aurora, Cyber
- 📱 **Home-screen widget** with notification count
- 📡 **In-app web view** for things the API doesn't cover

## 📥 Install

Grab the latest APK from [Releases](https://github.com/iroennys-admin/github-manager-android/releases) or from the [Actions](https://github.com/iroennys-admin/github-manager-android/actions) tab → latest run → **OctoMobile-APKs** artifact.

## 🛠 Build from source

```bash
git clone https://github.com/iroennys-admin/github-manager-android.git
cd github-manager-android
npm install
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
# APK at android/app/build/outputs/apk/debug/app-debug.apk
```

## 🏗 Stack

- **React 18 + TypeScript + Vite 5** — fast, lightweight UI
- **Capacitor 7** — native shell, plugins, Android packaging
- **Pure REST GitHub API client** (no Octokit, ~7 KB gzip), with rate-limit headers, pagination, ETag-friendly
- **AppWidget** (Java) for home-screen notifications

## 📜 License

MIT
