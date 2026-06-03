import React, { useState } from 'react';
import TopBar from '../ui/TopBar';
import { search } from '../api/github';
import { useRouter } from '../state/router';
import { toast } from '../ui/Toast';

type Kind = 'repos' | 'issues' | 'users' | 'code';

export default function SearchPage() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<Kind>('repos');
  const [results, setResults] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [total, setTotal] = useState(0);

  const go = async () => {
    if (!q.trim()) return; setBusy(true); setResults([]);
    try {
      let r: any;
      if (kind === 'repos') r = await search.repos(q);
      else if (kind === 'issues') r = await search.issues(q);
      else if (kind === 'users') r = await search.users(q);
      else r = await search.code(q);
      setResults(r.items || []); setTotal(r.total_count || 0);
    } catch (e: any) { toast.error(e?.message); } finally { setBusy(false); }
  };

  return (
    <>
      <TopBar title="Buscar" showBack={false} />
      <div style={{ padding: 8 }}>
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && go()} placeholder="Busca en GitHub…" />
      </div>
      <div className="toolbar">
        {(['repos','issues','users','code'] as Kind[]).map(k => (
          <button key={k} className={`chip ${kind === k ? 'active' : ''}`} onClick={() => setKind(k)}>{k}</button>
        ))}
        <button className="chip" onClick={go}>🔎 Buscar</button>
      </div>
      <div className="scroll-area scroll">
        {busy && <div className="loading"><span className="spinner" /> Buscando…</div>}
        {!busy && total > 0 && <div className="muted small" style={{ padding: '6px 14px' }}>{total} resultado(s)</div>}
        <div className="list">
          {results.map((r, i) => {
            if (kind === 'repos') return (
              <div key={i} className="card-row" onClick={() => router.push({ name: 'repo', owner: r.owner.login, repo: r.name })}>
                <div className="avatar"><img src={r.owner.avatar_url} alt="" /></div>
                <div className="body">
                  <div className="title truncate">{r.full_name}</div>
                  <div className="sub" style={{ whiteSpace: 'normal' }}>{r.description}</div>
                  <div className="sub small">★ {r.stargazers_count} · {r.language || '—'}</div>
                </div>
              </div>
            );
            if (kind === 'users') return (
              <div key={i} className="card-row" onClick={() => router.push({ name: 'profile', login: r.login })}>
                <div className="avatar"><img src={r.avatar_url} alt="" /></div>
                <div className="body"><div className="title">{r.login}</div><div className="sub">{r.type}</div></div>
              </div>
            );
            if (kind === 'issues') {
              const m = (r.html_url || '').match(/github\.com\/([^/]+)\/([^/]+)\/(issues|pull)\/(\d+)/);
              return (
                <div key={i} className="issue-row" onClick={() => m && router.push({ name: m[3] === 'pull' ? 'pr' : 'issue', owner: m[1], repo: m[2], number: Number(m[4]) })}>
                  <div className="ico">{r.state === 'open' ? '🟢' : '🟣'}</div>
                  <div className="meta">
                    <div className="title">{r.title}</div>
                    <div className="sub">{r.repository_url?.split('/').slice(-2).join('/')}</div>
                  </div>
                </div>
              );
            }
            // code
            return (
              <div key={i} className="card-row" onClick={() => router.push({ name: 'file', owner: r.repository.owner.login, repo: r.repository.name, path: r.path })}>
                <div style={{ fontSize: 18 }}>📄</div>
                <div className="body">
                  <div className="title truncate">{r.name}</div>
                  <div className="sub truncate">{r.repository.full_name} · {r.path}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
