import React, { useEffect, useState } from 'react';
import TopBar from '../ui/TopBar';
import { repos as reposApi, git, checks, type Repo, type ContentEntry, type CheckRun, type CommitStatus } from '../api/github';
import { useRouter } from '../state/router';
import { useApp, type FavoriteRepo } from '../state/store';
import { toast } from '../ui/Toast';
import Markdown from '../ui/Markdown';
import { timeAgo } from './IssuesPage';

interface Props { owner: string; repo: string; }

const TABS = ['code', 'issues', 'pulls', 'actions', 'releases', 'about'] as const;
type Tab = typeof TABS[number];

export default function RepoPage({ owner, repo }: Props) {
  const router = useRouter();
  const app = useApp();
  const [info, setInfo] = useState<Repo | null>(null);
  const [readme, setReadme] = useState<string>('');
  const [tab, setTab] = useState<Tab>('code');
  const [isStar, setIsStar] = useState(false);
  const [busy, setBusy] = useState(false);
  const [langs, setLangs] = useState<Record<string, number>>({});
  const [lastCommit, setLastCommit] = useState<{ sha: string; message: string; date: string; author: string } | null>(null);
  const [checkRuns, setCheckRuns] = useState<CheckRun[]>([]);
  const [commitStatuses, setCommitStatuses] = useState<CommitStatus[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const r = await reposApi.get(owner, repo);
      setInfo(r);
      reposApi.isStarred(owner, repo).then(setIsStar).catch(() => {});
      reposApi.languages(owner, repo).then(setLangs).catch(() => {});
      try {
        const rm = await reposApi.readme(owner, repo);
        const e = rm as ContentEntry;
        setReadme(git.decodeContent(e));
      } catch { setReadme(''); }
      // Load last commit and checks
      try {
        const commits = await git.commits(owner, repo, { sha: r.default_branch, per_page: 1 });
        if (commits.length > 0) {
          const c = commits[0];
          setLastCommit({ sha: c.sha, message: c.commit.message.split('\n')[0], date: c.commit.author.date, author: c.author?.login || c.commit.author.name });
          // Load CI checks
          checks.runs(owner, repo, c.sha).then(r => setCheckRuns(r.check_runs || [])).catch(() => {});
          checks.combinedStatus(owner, repo, c.sha).then(r => setCommitStatuses(r.statuses || [])).catch(() => {});
        }
      } catch {}
    } catch (e: any) { toast.error(e?.message); }
  };

  useEffect(() => { load(); }, [owner, repo]);

  const doRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
    toast.success('Actualizado');
  };

  const toggleStar = async () => {
    if (!info) return;
    setBusy(true);
    try {
      if (isStar) { await reposApi.unstar(owner, repo); setIsStar(false); toast.success('Sin estrella'); }
      else       { await reposApi.star(owner, repo);   setIsStar(true);  toast.success('⭐ Estrella'); }
      setInfo({ ...info, stargazers_count: info.stargazers_count + (isStar ? -1 : 1) });
    } catch (e: any) { toast.error(e?.message); }
    finally { setBusy(false); }
  };

  const doFork = async () => {
    if (!confirm(`¿Hacer fork de ${owner}/${repo}?`)) return;
    setBusy(true);
    try { const f = await reposApi.fork(owner, repo); toast.success(`Fork creado: ${f.full_name}`); }
    catch (e: any) { toast.error(e?.message); } finally { setBusy(false); }
  };

  // Overall CI status
  const ciStatus = checkRuns.length > 0
    ? checkRuns.every(c => c.status === 'completed' && c.conclusion === 'success')
      ? 'success'
      : checkRuns.some(c => c.status === 'completed' && (c.conclusion === 'failure' || c.conclusion === 'timed_out'))
        ? 'failure'
        : checkRuns.some(c => c.status === 'in_progress' || c.status === 'queued')
          ? 'pending'
          : 'neutral'
    : commitStatuses.length > 0
      ? commitStatuses.every(s => s.state === 'success') ? 'success'
        : commitStatuses.some(s => s.state === 'failure' || s.state === 'error') ? 'failure'
        : 'pending'
      : null;

  return (
    <>
      <TopBar title={repo} sub={owner} actions={
        <div className="flex gap-1">
          <button className="btn-icon" onClick={doRefresh} disabled={refreshing}>
            {refreshing ? <span className="spinner" /> : '🔄'}
          </button>
          <button className="fav-star" onClick={() => {
            if (!info) return;
            if (app.isFavorite(info.id)) {
              app.removeFavorite(info.id);
              toast.success('Eliminado de favoritos');
            } else {
              app.addFavorite({ id: info.id, full_name: info.full_name, owner: info.owner.login, repo: info.name, avatar_url: info.owner.avatar_url, addedAt: Date.now() });
              toast.success('⭐ Agregado a favoritos');
            }
          }}>
            {info && app.isFavorite(info.id) ? '⭐' : '☆'}
          </button>
          <button className="btn-icon" onClick={toggleStar} disabled={busy}>
            {isStar ? '⭐' : '☆'}
          </button>
        </div>
      } />
      <div className="scroll-area scroll" onTouchStart={handleTouchStart} onTouchEnd={(e) => handleTouchEnd(e, doRefresh)}>
        {info ? (
          <>
            <div className="card" style={{ margin: 12 }}>
              <div className="flex gap-2" style={{ alignItems: 'center' }}>
                <img src={info.owner.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="strong" style={{ fontSize: 16 }}>{info.full_name}</div>
                  <div className="muted small">
                    {info.private && <span className="badge">🔒 private</span>}
                    {info.fork && <span className="badge" style={{ marginLeft: 4 }}>fork</span>}
                    {info.archived && <span className="badge warn" style={{ marginLeft: 4 }}>archived</span>}
                  </div>
                </div>
              </div>
              {info.description && <div className="mt-2 small">{info.description}</div>}
              <div className="flex gap-2 mt-3" style={{ flexWrap: 'wrap' }}>
                <span className="badge">★ {info.stargazers_count}</span>
                <span className="badge">{info.forks_count} forks</span>
                <span className="badge">👁 {info.watchers_count}</span>
                {info.language && <span className="badge">{info.language}</span>}
                {info.license && <span className="badge">{info.license.name}</span>}
                {ciStatus && <span className={`badge ${ciStatus === 'success' ? 'success' : ciStatus === 'failure' ? 'danger' : 'warn'}`}>
                  {ciStatus === 'success' ? '✅ CI' : ciStatus === 'failure' ? '❌ CI' : '⏳ CI'}
                </span>}
              </div>

              {/* Quick actions */}
              <div className="flex gap-2 mt-3" style={{ flexWrap: 'wrap' }}>
                <button className="btn btn-sm" onClick={doFork} disabled={busy}>🍴 Fork</button>
                <button className="btn btn-sm" onClick={() => router.push({ name: 'web-view', url: info.html_url, title: info.full_name })}>🌐 Abrir</button>
                <button className="btn btn-sm" onClick={() => router.push({ name: 'repo-search', owner, repo })}>🔍 Buscar</button>
                <button className="btn btn-sm" onClick={() => router.push({ name: 'repo-settings', owner, repo })}>⚙️ Settings</button>
              </div>

              {Object.keys(langs).length > 0 && (
                <div className="mt-3">
                  <div className="muted tiny">Lenguajes</div>
                  <LangBar langs={langs} />
                </div>
              )}
            </div>

            {/* CI Checks summary */}
            {(checkRuns.length > 0 || commitStatuses.length > 0) && (
              <div className="card" style={{ margin: '0 12px' }}>
                <div className="section-title" style={{ padding: '0 0 6px' }}>CI / Checks</div>
                {checkRuns.map(cr => (
                  <div key={cr.id} className="row-between" style={{ padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                    <div className="flex gap-2" style={{ alignItems: 'center' }}>
                      <span>{cr.status === 'completed' ? (cr.conclusion === 'success' ? '✅' : cr.conclusion === 'failure' ? '❌' : '⚪') : cr.status === 'in_progress' ? '🔄' : '⏳'}</span>
                      <span className="small">{cr.name}</span>
                    </div>
                    <button className="btn btn-sm" onClick={() => window.open(cr.html_url, '_blank')}>Ver</button>
                  </div>
                ))}
                {commitStatuses.slice(0, 5).map(cs => (
                  <div key={cs.id} className="row-between" style={{ padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                    <div className="flex gap-2" style={{ alignItems: 'center' }}>
                      <span>{cs.state === 'success' ? '✅' : cs.state === 'failure' || cs.state === 'error' ? '❌' : '⏳'}</span>
                      <span className="small">{cs.context}</span>
                    </div>
                    {cs.target_url && <button className="btn btn-sm" onClick={() => window.open(cs.target_url, '_blank')}>Ver</button>}
                  </div>
                ))}
              </div>
            )}

            <div className="tabs">
              {TABS.map(t => (
                <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                  {tabLabel(t)}
                </button>
              ))}
            </div>

            {tab === 'code' && (
              <div style={{ padding: 12 }}>
                <div className="card" style={{ marginBottom: 8, padding: 8 }}>
                  <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                    <button className="btn btn-sm" onClick={() => router.push({ name: 'files', owner, repo })}>📁 Files</button>
                    <button className="btn btn-sm" onClick={() => router.push({ name: 'branches', owner, repo })}>🌿 Branches</button>
                    <button className="btn btn-sm" onClick={() => router.push({ name: 'commits', owner, repo })}>📜 Historial</button>
                    <button className="btn btn-sm" onClick={() => router.push({ name: 'compare', owner, repo })}>🔀 Comparar</button>
                  </div>
                </div>
                {/* Last commit */}
                {lastCommit && (
                  <div className="card-row" style={{ marginBottom: 8 }} onClick={() => router.push({ name: 'commit', owner, repo, sha: lastCommit.sha })}>
                    <div style={{ fontSize: 18 }}>🟢</div>
                    <div className="body">
                      <div className="title truncate">{lastCommit.message}</div>
                      <div className="sub">{lastCommit.author} · {timeAgo(lastCommit.date)} · <span className="mono">{lastCommit.sha.slice(0, 7)}</span></div>
                    </div>
                    {info?.permissions?.push && (
                      <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); router.push({ name: 'reset-branch', owner, repo, sha: lastCommit.sha }); }}>⏪</button>
                    )}
                  </div>
                )}
                {readme ? <div className="card"><Markdown text={readme} /></div>
                        : <div className="muted small center" style={{ padding: 16 }}>Sin README.</div>}
              </div>
            )}
            {tab === 'issues' && (
              <div style={{ padding: 12 }}>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => router.push({ name: 'issues', owner, repo })}>
                  Ver issues ({info.open_issues_count} abiertos)
                </button>
                <button className="btn mt-2" style={{ width: '100%' }} onClick={() => router.push({ name: 'create-issue', owner, repo })}>
                  ➕ Nuevo issue
                </button>
              </div>
            )}
            {tab === 'pulls' && (
              <div style={{ padding: 12 }}>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => router.push({ name: 'pulls', owner, repo })}>
                  Ver pull requests
                </button>
                <button className="btn mt-2" style={{ width: '100%' }} onClick={() => router.push({ name: 'create-pr', owner, repo })}>
                  ➕ Crear PR
                </button>
              </div>
            )}
            {tab === 'actions' && (
              <div style={{ padding: 12 }}>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => router.push({ name: 'actions', owner, repo })}>⚙️ Workflows & runs</button>
              </div>
            )}
            {tab === 'releases' && (
              <div style={{ padding: 12 }}>
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => router.push({ name: 'releases', owner, repo })}>🎉 Releases</button>
              </div>
            )}
            {tab === 'about' && (
              <div style={{ padding: 12 }}>
                <div className="card">
                  <Row label="Owner" value={info.owner.login} />
                  <Row label="Default branch" value={info.default_branch} />
                  <Row label="Created"  value={new Date(info.created_at).toLocaleDateString()} />
                  <Row label="Updated"  value={new Date(info.updated_at).toLocaleDateString()} />
                  <Row label="Pushed"   value={new Date(info.pushed_at).toLocaleDateString()} />
                  <Row label="Size"     value={`${(info.size / 1024).toFixed(1)} MB`} />
                  <Row label="Visibility" value={info.visibility} />
                  {info.topics && info.topics.length > 0 && (
                    <div className="mt-2">
                      <div className="muted small">Topics</div>
                      <div className="flex gap-1 mt-1" style={{ flexWrap: 'wrap' }}>
                        {info.topics.map(t => <span key={t} className="badge">{t}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="loading"><span className="spinner" /> Cargando…</div>
        )}
        <div style={{ height: 24 }} />
      </div>
    </>
  );
}

// Pull-to-refresh touch handler
let touchStartY = 0;
function handleTouchStart(e: React.TouchEvent) { touchStartY = e.touches[0].clientY; }
function handleTouchEnd(e: React.TouchEvent, onRefresh: () => void) {
  const diff = touchStartY - e.changedTouches[0].clientY;
  const el = e.currentTarget as HTMLElement;
  if (diff < -80 && el.scrollTop <= 0) onRefresh();
}

function tabLabel(t: Tab) {
  return { code: 'Code', issues: 'Issues', pulls: 'PRs', actions: 'Actions', releases: 'Releases', about: 'About' }[t];
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="row-between" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
      <span className="muted small">{label}</span>
      <span className="small strong">{value}</span>
    </div>
  );
}

function LangBar({ langs }: { langs: Record<string, number> }) {
  const total = Object.values(langs).reduce((a, b) => a + b, 0) || 1;
  const colors = ['#58a6ff','#3fb950','#bc8cff','#ff7eb6','#f0883e','#d29922','#8957e5','#56d364'];
  const items = Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 8);
  return (
    <>
      <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', marginTop: 4 }}>
        {items.map(([k, v], i) => (
          <div key={k} style={{ width: `${(v / total) * 100}%`, background: colors[i % colors.length] }} />
        ))}
      </div>
      <div className="flex gap-2 mt-2" style={{ flexWrap: 'wrap' }}>
        {items.map(([k, v], i) => (
          <span key={k} className="tiny muted">
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: colors[i % colors.length], marginRight: 4 }} />
            {k} {((v / total) * 100).toFixed(1)}%
          </span>
        ))}
      </div>
    </>
  );
}
