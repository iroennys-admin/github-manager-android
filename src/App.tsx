// ============================================================
// OctoMobile · Root App
// ============================================================

import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { AppCtx, DEFAULT_SETTINGS, type AppSettings, type FavoriteRepo } from './state/store';
import { RouterCtx, type Route, type Router } from './state/router';
import { gh } from './api/client';
import { auth } from './api/github';

import ToastHost, { toast } from './ui/Toast';
import LoginScreen from './pages/LoginScreen';
import HomePage from './pages/HomePage';
import ReposPage from './pages/ReposPage';
import RepoPage from './pages/RepoPage';
import IssuesPage from './pages/IssuesPage';
import IssueDetailPage from './pages/IssueDetailPage';
import PRDetailPage from './pages/PRDetailPage';
import NotificationsPage from './pages/NotificationsPage';
import GistsPage from './pages/GistsPage';
import GistDetailPage from './pages/GistDetailPage';
import EditGistPage from './pages/EditGistPage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import SettingsPage from './pages/SettingsPage';
import AboutPage from './pages/AboutPage';
import BranchesPage from './pages/BranchesPage';
import CommitsPage from './pages/CommitsPage';
import CommitDetailPage from './pages/CommitDetailPage';
import FilesPage from './pages/FilesPage';
import FileViewPage from './pages/FileViewPage';
import EditFilePage from './pages/EditFilePage';
import ActionsPage from './pages/ActionsPage';
import RunDetailPage from './pages/RunDetailPage';
import ReleasesPage from './pages/ReleasesPage';
import ReleaseDetailPage from './pages/ReleaseDetailPage';
import CreateRepoPage from './pages/CreateRepoPage';
import CreateIssuePage from './pages/CreateIssuePage';
import CreatePRPage from './pages/CreatePRPage';
import OrgsPage from './pages/OrgsPage';
import StarredPage from './pages/StarredPage';
import FollowersPage from './pages/FollowersPage';
import WebViewPage from './pages/WebViewPage';
import RepoSearchPage from './pages/RepoSearchPage';
import ComparePage from './pages/ComparePage';
import RepoSettingsPage from './pages/RepoSettingsPage';
import ResetBranchPage from './pages/ResetBranchPage';
import BlamePage from './pages/BlamePage';
import PinLockScreen from './pages/PinLockScreen';

import { IconHome, IconRepo, IconBell, IconSearch, IconGear } from './ui/Icons';

const TOKEN_KEY = 'octomobile_token';
const SETTINGS_KEY = 'octomobile_settings';
const ME_KEY = 'octomobile_me';
const FAVORITES_KEY = 'octomobile_favorites';

function loadJson<T>(k: string, fb: T): T { try { const r = localStorage.getItem(k); return r ? JSON.parse(r) : fb; } catch { return fb; } }
function saveJson(k: string, v: any) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

export default function App() {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [me, setMe] = useState<any>(() => loadJson(ME_KEY, null));
  const [settings, setSettings] = useState<AppSettings>(() => ({ ...DEFAULT_SETTINGS, ...loadJson(SETTINGS_KEY, {}) }));
  const [favorites, setFavorites] = useState<FavoriteRepo[]>(() => loadJson(FAVORITES_KEY, []));
  const [stack, setStack] = useState<Route[]>([{ name: token ? 'home' : 'login' }]);
  const [unlocked, setUnlocked] = useState(!settings.pinLockEnabled);

  // Persist
  useEffect(() => {
    if (token) { localStorage.setItem(TOKEN_KEY, token); gh.setToken(token); }
    else { localStorage.removeItem(TOKEN_KEY); gh.setToken(null); }
  }, [token]);
  useEffect(() => { saveJson(SETTINGS_KEY, settings); }, [settings]);
  useEffect(() => { saveJson(ME_KEY, me); }, [me]);
  useEffect(() => { saveJson(FAVORITES_KEY, favorites); }, [favorites]);
  useEffect(() => { document.documentElement.setAttribute('data-theme', settings.theme); }, [settings.theme]);
  useEffect(() => { document.body.style.fontSize = `${settings.fontSize}px`; }, [settings.fontSize]);

  // Refresh user when token changes
  useEffect(() => {
    if (!token) { setMe(null); return; }
    gh.setToken(token);
    auth.me().then(setMe).catch(err => {
      if (err?.status === 401) {
        toast.error('Token inválido o expirado');
        setTokenState(null);
      } else {
        toast.error(err?.message || 'No se pudo cargar el perfil');
      }
    });
  }, [token]);

  // Router
  const router: Router = useMemo(() => ({
    get current() { return stack[stack.length - 1]; },
    stack,
    push: (r) => setStack(s => [...s, r]),
    replace: (r) => setStack(s => [...s.slice(0, -1), r]),
    back: () => {
      let popped = false;
      setStack(s => { if (s.length > 1) { popped = true; return s.slice(0, -1); } return s; });
      return popped;
    },
    reset: (r) => setStack([r]),
  }), [stack]);

  // Hardware back button on Android (Capacitor)
  useEffect(() => {
    const handler = (e: PopStateEvent) => { e.preventDefault?.(); router.back(); window.history.pushState(null, '', ''); };
    window.history.pushState(null, '', '');
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [router]);

  // Favorites management
  const addFavorite = useCallback((repo: FavoriteRepo) => {
    setFavorites(prev => {
      if (prev.some(f => f.id === repo.id)) return prev;
      return [repo, ...prev];
    });
  }, []);

  const removeFavorite = useCallback((id: number) => {
    setFavorites(prev => prev.filter(f => f.id !== id));
  }, []);

  const isFavorite = useCallback((id: number) => {
    return favorites.some(f => f.id === id);
  }, [favorites]);

  // App context value
  const appCtx = useMemo(() => ({
    token, me, settings, favorites,
    setToken: (t: string | null) => { setTokenState(t); if (t) router.reset({ name: 'home' }); else router.reset({ name: 'login' }); },
    setMe,
    updateSettings: (p: Partial<AppSettings>) => setSettings(s => ({ ...s, ...p })),
    addFavorite,
    removeFavorite,
    isFavorite,
    logout: () => { setTokenState(null); setMe(null); router.reset({ name: 'login' }); toast.info('Sesión cerrada'); },
  }), [token, me, settings, favorites, router, addFavorite, removeFavorite, isFavorite]);

  const current = stack[stack.length - 1];
  const showNav = !!token && ['home', 'repos', 'notifications', 'search', 'settings', 'gists', 'profile', 'starred', 'orgs'].includes(current.name);

  // PIN lock screen
  if (token && settings.pinLockEnabled && !unlocked) {
    return (
      <AppCtx.Provider value={appCtx as any}>
        <RouterCtx.Provider value={router}>
          <div className="app" data-theme={settings.theme}>
            <PinLockScreen onUnlock={() => setUnlocked(true)} />
            <ToastHost />
          </div>
        </RouterCtx.Provider>
      </AppCtx.Provider>
    );
  }

  return (
    <AppCtx.Provider value={appCtx as any}>
      <RouterCtx.Provider value={router}>
        <div className="app" data-theme={settings.theme}>
          <div className="main">
            {!token ? <LoginScreen /> : renderPage(current)}
          </div>
          {showNav && <BottomNav current={current} push={router.push} />}
          <ToastHost />
        </div>
      </RouterCtx.Provider>
    </AppCtx.Provider>
  );
}

function renderPage(r: Route): React.ReactNode {
  switch (r.name) {
    case 'login': return <LoginScreen />;
    case 'home': return <HomePage />;
    case 'repos': return <ReposPage />;
    case 'repo': return <RepoPage owner={r.owner} repo={r.repo} />;
    case 'issues': return <IssuesPage owner={r.owner} repo={r.repo} mode={r.mode} />;
    case 'issue': return <IssueDetailPage owner={r.owner} repo={r.repo} number={r.number} />;
    case 'pulls': return <IssuesPage owner={r.owner} repo={r.repo} mode="pr" />;
    case 'pr': return <PRDetailPage owner={r.owner} repo={r.repo} number={r.number} />;
    case 'notifications': return <NotificationsPage />;
    case 'gists': return <GistsPage />;
    case 'gist': return <GistDetailPage id={r.id} />;
    case 'edit-gist': return <EditGistPage id={r.id} />;
    case 'profile': return <ProfilePage login={r.login} />;
    case 'search': return <SearchPage />;
    case 'repo-search': return <RepoSearchPage owner={r.owner} repo={r.repo} />;
    case 'settings': return <SettingsPage />;
    case 'about': return <AboutPage />;
    case 'branches': return <BranchesPage owner={r.owner} repo={r.repo} />;
    case 'commits': return <CommitsPage owner={r.owner} repo={r.repo} ref={r.ref} />;
    case 'commit': return <CommitDetailPage owner={r.owner} repo={r.repo} sha={r.sha} commitList={r.commitList} commitIdx={r.commitIdx} />;
    case 'files': return <FilesPage owner={r.owner} repo={r.repo} path={r.path} ref={r.ref} />;
    case 'file': return <FileViewPage owner={r.owner} repo={r.repo} path={r.path} refSpec={r.ref} />;
    case 'edit-file': return <EditFilePage owner={r.owner} repo={r.repo} path={r.path} sha={r.sha} content={r.content} refSpec={r.ref} />;
    case 'actions': return <ActionsPage owner={r.owner} repo={r.repo} />;
    case 'run': return <RunDetailPage owner={r.owner} repo={r.repo} runId={r.runId} />;
    case 'releases': return <ReleasesPage owner={r.owner} repo={r.repo} />;
    case 'release': return <ReleaseDetailPage owner={r.owner} repo={r.repo} id={r.id} />;
    case 'create-repo': return <CreateRepoPage />;
    case 'create-issue': return <CreateIssuePage owner={r.owner} repo={r.repo} />;
    case 'create-pr': return <CreatePRPage owner={r.owner} repo={r.repo} />;
    case 'orgs': return <OrgsPage />;
    case 'org': return <ProfilePage login={r.login} />;
    case 'followers': return <FollowersPage login={r.login} mode="followers" />;
    case 'following': return <FollowersPage login={r.login} mode="following" />;
    case 'starred': return <StarredPage />;
    case 'compare': return <ComparePage owner={r.owner} repo={r.repo} base={r.base} head={r.head} />;
    case 'repo-settings': return <RepoSettingsPage owner={r.owner} repo={r.repo} />;
    case 'reset-branch': return <ResetBranchPage owner={r.owner} repo={r.repo} sha={r.sha} branch={r.branch} />;
    case 'blame': return <BlamePage owner={r.owner} repo={r.repo} path={r.path} refSpec={r.ref} />;
    case 'web-view': return <WebViewPage url={r.url} title={r.title} />;
  }
}

function BottomNav({ current, push }: { current: Route; push: (r: Route) => void }) {
  const items: { name: Route['name']; label: string; icon: any; route: Route }[] = [
    { name: 'home',          label: 'Home',    icon: IconHome,   route: { name: 'home' } },
    { name: 'repos',         label: 'Repos',   icon: IconRepo,   route: { name: 'repos' } },
    { name: 'notifications', label: 'Inbox',   icon: IconBell,   route: { name: 'notifications' } },
    { name: 'search',        label: 'Search',  icon: IconSearch, route: { name: 'search' } },
    { name: 'settings',      label: 'Me',      icon: IconGear,   route: { name: 'settings' } },
  ];
  return (
    <nav className="bottom-nav">
      {items.map(it => (
        <button key={it.name} className={current.name === it.name ? 'active' : ''} onClick={() => push(it.route)}>
          <span className="ico"><it.icon size={20} /></span>{it.label}
        </button>
      ))}
    </nav>
  );
}
