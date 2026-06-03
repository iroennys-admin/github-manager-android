import React, { useEffect, useState } from 'react';
import TopBar from '../ui/TopBar';
import { auth, repos as reposApi, social, type Repo, type User } from '../api/github';
import { useRouter } from '../state/router';
import { useApp } from '../state/store';
import { toast } from '../ui/Toast';

export default function ProfilePage({ login }: { login?: string }) {
  const app = useApp();
  const router = useRouter();
  const target = login || app.me?.login;
  const [user, setUser] = useState<User | null>(null);
  const [topRepos, setTopRepos] = useState<Repo[]>([]);
  const [following, setFollowing] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!target) return;
    auth.user(target).then(setUser).catch(e => toast.error(e.message));
    reposApi.userRepos(target, 6).then(rs => setTopRepos(rs.sort((a, b) => b.stargazers_count - a.stargazers_count))).catch(() => {});
    if (target !== app.me?.login) social.isFollowing(target).then(setFollowing).catch(() => {});
  }, [target, app.me?.login]);

  const toggleFollow = async () => {
    if (!target) return; setBusy(true);
    try {
      if (following) { await social.unfollow(target); setFollowing(false); toast.info(`Dejaste de seguir a ${target}`); }
      else { await social.follow(target); setFollowing(true); toast.success(`Siguiendo a ${target}`); }
    } catch (e: any) { toast.error(e?.message); } finally { setBusy(false); }
  };

  if (!user) return (<><TopBar title="Perfil" showBack={!!login} /><div className="loading"><span className="spinner" /> Cargando…</div></>);

  const isMe = target === app.me?.login;

  return (
    <>
      <TopBar title={user.login} sub={user.name || ''} showBack={!!login}
        actions={isMe ? <button className="btn-icon" onClick={() => app.logout()}>⏏</button> : undefined} />
      <div className="scroll-area scroll">
        <div className="card" style={{ margin: 12, textAlign: 'center' }}>
          <img src={user.avatar_url} alt="" className="avatar-lg" style={{ margin: '0 auto' }} />
          <div className="strong mt-2" style={{ fontSize: 20 }}>{user.name || user.login}</div>
          <div className="muted">@{user.login}</div>
          {user.bio && <div className="mt-2 small">{user.bio}</div>}
          <div className="muted small mt-2 flex gap-2" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
            {user.company && <span>🏢 {user.company}</span>}
            {user.location && <span>📍 {user.location}</span>}
            {user.email && <a href={`mailto:${user.email}`} style={{ color: 'var(--link)' }}>📧 {user.email}</a>}
            {user.blog && <a href={user.blog.startsWith('http') ? user.blog : `https://${user.blog}`} target="_blank" style={{ color: 'var(--link)' }} rel="noreferrer">🔗 {user.blog}</a>}
            {user.twitter_username && <span>🐦 @{user.twitter_username}</span>}
          </div>
          <div className="flex gap-2 mt-3" style={{ justifyContent: 'center' }}>
            <Stat n={user.public_repos} l="Repos" onClick={() => isMe ? router.push({ name: 'repos' }) : undefined} />
            <Stat n={user.followers} l="Followers" onClick={() => router.push({ name: 'followers', login: user.login })} />
            <Stat n={user.following} l="Following" onClick={() => router.push({ name: 'following', login: user.login })} />
            <Stat n={user.public_gists} l="Gists" onClick={() => isMe ? router.push({ name: 'gists' }) : undefined} />
          </div>
          <div className="flex gap-2 mt-3" style={{ justifyContent: 'center' }}>
            {!isMe && (
              <button className={`btn ${following ? '' : 'btn-primary'} btn-sm`} onClick={toggleFollow} disabled={busy}>
                {following ? '✓ Following' : '+ Follow'}
              </button>
            )}
            <button className="btn btn-sm" onClick={() => router.push({ name: 'web-view', url: user.html_url, title: user.login })}>🌐 Ver en GitHub</button>
          </div>
        </div>

        <div className="section-title">Top repos</div>
        <div className="list">
          {topRepos.map(r => (
            <div key={r.id} className="card-row" onClick={() => router.push({ name: 'repo', owner: r.owner.login, repo: r.name })}>
              <div className="avatar"><img src={r.owner.avatar_url} alt="" /></div>
              <div className="body">
                <div className="title truncate">{r.name}</div>
                <div className="sub truncate">{r.description || '—'}</div>
                <div className="sub small">★ {r.stargazers_count} · {r.language || '—'}</div>
              </div>
            </div>
          ))}
          {topRepos.length === 0 && <div className="muted small center" style={{ padding: 12 }}>Sin repos públicos</div>}
        </div>
        <div style={{ height: 24 }} />
      </div>
    </>
  );
}

function Stat({ n, l, onClick }: { n: number; l: string; onClick?: () => void }) {
  return (
    <div onClick={onClick} style={{ textAlign: 'center', cursor: onClick ? 'pointer' : 'default', minWidth: 64 }}>
      <div className="strong" style={{ fontSize: 18 }}>{n}</div>
      <div className="muted tiny">{l}</div>
    </div>
  );
}
