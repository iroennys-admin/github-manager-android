import React, { useEffect, useState } from 'react';
import { useApp } from '../state/store';
import { useRouter } from '../state/router';
import { events, notifications, repos, type Notification, type Repo } from '../api/github';
import TopBar from '../ui/TopBar';
import { toast } from '../ui/Toast';
import { IconBell, IconRepo, IconStar, IconGit } from '../ui/Icons';

export default function HomePage() {
  const app = useApp();
  const router = useRouter();
  const [recent, setRecent] = useState<Repo[]>([]);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [rRecent, rNotifs, rFeed] = await Promise.allSettled([
        repos.myRepos({ sort: 'updated', per_page: 6 }),
        notifications.list({ per_page: 5 }),
        app.me ? events.received(app.me.login, 12) : Promise.resolve([]),
      ]);
      if (rRecent.status === 'fulfilled') setRecent(rRecent.value);
      if (rNotifs.status === 'fulfilled') setNotifs(rNotifs.value);
      if (rFeed.status === 'fulfilled') setFeed(rFeed.value);
    } catch (e: any) { toast.error(e?.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [app.me?.login]);

  return (
    <>
      <TopBar title={`Hola, ${app.me?.name || app.me?.login || ''} 👋`} sub="Resumen de tu actividad" showBack={false} />
      <div className="scroll-area scroll">
        {/* Profile card */}
        {app.me && (
          <div className="card" style={{ margin: 12 }} onClick={() => router.push({ name: 'profile' })}>
            <div className="flex gap-3" style={{ alignItems: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--accent)' }}>
                <img src={app.me.avatar_url} style={{ width: '100%', height: '100%' }} alt="" />
              </div>
              <div style={{ flex: 1 }}>
                <div className="strong" style={{ fontSize: 16 }}>{app.me.name || app.me.login}</div>
                <div className="muted small">@{app.me.login}</div>
                <div className="muted tiny mt-1">
                  {app.me.public_repos} repos · {app.me.followers} followers · {app.me.following} following
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick actions grid */}
        <div className="section-title">Acceso rápido</div>
        <div style={{ padding: '0 12px' }} className="flex gap-2">
          <QuickAction emoji="📦" label="Repos" onClick={() => router.push({ name: 'repos' })} />
          <QuickAction emoji="🔔" label="Inbox" onClick={() => router.push({ name: 'notifications' })} />
          <QuickAction emoji="⭐" label="Starred" onClick={() => router.push({ name: 'starred' })} />
          <QuickAction emoji="📋" label="Gists" onClick={() => router.push({ name: 'gists' })} />
        </div>
        <div style={{ padding: '8px 12px' }} className="flex gap-2">
          <QuickAction emoji="🏢" label="Orgs" onClick={() => router.push({ name: 'orgs' })} />
          <QuickAction emoji="🐛" label="Issues" onClick={() => router.push({ name: 'issues' })} />
          <QuickAction emoji="🔍" label="Search" onClick={() => router.push({ name: 'search' })} />
          <QuickAction emoji="➕" label="Nuevo" onClick={() => router.push({ name: 'create-repo' })} />
        </div>

        {/* Notifications preview */}
        <div className="section-title row-between" style={{ marginTop: 8 }}>
          <span>Notificaciones</span>
          {notifs.length > 0 && (
            <span className="badge open">{notifs.length}</span>
          )}
        </div>
        <div className="list">
          {loading && <div className="loading"><span className="spinner" /> Cargando…</div>}
          {!loading && notifs.length === 0 && (
            <div className="muted small center" style={{ padding: 12 }}>Sin notificaciones nuevas ✨</div>
          )}
          {notifs.slice(0, 5).map(n => (
            <div key={n.id} className="card-row" onClick={() => onNotificationClick(n, router)}>
              <div style={{ fontSize: 22 }}>{notifIcon(n)}</div>
              <div className="body">
                <div className="title truncate">{n.subject.title}</div>
                <div className="sub truncate">{n.repository.full_name} · {n.reason}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent repos */}
        <div className="section-title row-between">
          <span>Repos recientes</span>
          <span className="muted tiny" onClick={() => router.push({ name: 'repos' })} style={{ cursor: 'pointer' }}>Ver todos →</span>
        </div>
        <div className="list">
          {!loading && recent.length === 0 && <div className="muted small center">Sin repos</div>}
          {recent.map(r => (
            <div key={r.id} className="card-row" onClick={() => router.push({ name: 'repo', owner: r.owner.login, repo: r.name })}>
              <div className="avatar"><img src={r.owner.avatar_url} alt="" /></div>
              <div className="body">
                <div className="title truncate">{r.full_name}</div>
                <div className="sub truncate">
                  {r.private && '🔒 '}{r.language || '—'} · ★ {r.stargazers_count} · {r.forks_count} forks
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Activity feed */}
        <div className="section-title">Actividad</div>
        <div className="list">
          {!loading && feed.length === 0 && <div className="muted small center">Tu feed está vacío.</div>}
          {feed.slice(0, 20).map((e: any) => (
            <div key={e.id} className="card" style={{ padding: 10 }}>
              <div className="flex gap-2 small">
                <img src={e.actor?.avatar_url} alt="" style={{ width: 22, height: 22, borderRadius: '50%' }} />
                <div className="strong">{e.actor?.login}</div>
                <div className="muted">{describeEvent(e)}</div>
              </div>
              <div className="muted tiny mt-1" onClick={() => {
                const [o, r] = (e.repo?.name || '/').split('/'); if (o && r) router.push({ name: 'repo', owner: o, repo: r });
              }}>
                {e.repo?.name}
              </div>
            </div>
          ))}
        </div>
        <div style={{ height: 24 }} />
      </div>
    </>
  );
}

function QuickAction({ emoji, label, onClick }: { emoji: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '14px 6px', cursor: 'pointer' }}>
      <span style={{ fontSize: 22 }}>{emoji}</span>
      <span className="small strong">{label}</span>
    </button>
  );
}

function notifIcon(n: Notification): string {
  switch (n.subject.type) {
    case 'PullRequest': return '🔀';
    case 'Issue': return '🐛';
    case 'Release': return '🎉';
    case 'Commit': return '🟢';
    case 'Discussion': return '💬';
    default: return '🔔';
  }
}

function onNotificationClick(n: Notification, router: any) {
  const url = n.subject.url || '';
  const m = url.match(/repos\/([^/]+)\/([^/]+)\/(issues|pulls)\/(\d+)/);
  if (m) {
    const [, owner, repo, kind, num] = m;
    router.push({ name: kind === 'pulls' ? 'pr' : 'issue', owner, repo, number: Number(num) });
  } else {
    router.push({ name: 'repo', owner: n.repository.owner.login, repo: n.repository.name });
  }
}

function describeEvent(e: any): string {
  switch (e.type) {
    case 'PushEvent': return `pushed ${e.payload?.commits?.length || 0} commit(s) to`;
    case 'CreateEvent': return `created ${e.payload?.ref_type || ''}`;
    case 'WatchEvent': return 'starred';
    case 'ForkEvent': return 'forked';
    case 'IssuesEvent': return `${e.payload?.action} an issue in`;
    case 'PullRequestEvent': return `${e.payload?.action} a PR in`;
    case 'IssueCommentEvent': return 'commented on';
    case 'ReleaseEvent': return `released ${e.payload?.release?.tag_name || ''} on`;
    case 'PublicEvent': return 'made public';
    case 'DeleteEvent': return `deleted ${e.payload?.ref_type || ''}`;
    case 'MemberEvent': return 'joined';
    default: return e.type;
  }
}
