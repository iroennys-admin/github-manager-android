// ============================================================
// OctoMobile · Repo Search (search within a repo)
// ============================================================

import React, { useState } from 'react';
import TopBar from '../ui/TopBar';
import { search } from '../api/github';
import { useRouter } from '../state/router';
import { toast } from '../ui/Toast';

interface Props { owner: string; repo: string; }

type Kind = 'code' | 'issues' | 'commits';

export default function RepoSearchPage({ owner, repo }: Props) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<Kind>('code');
  const [results, setResults] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [total, setTotal] = useState(0);

  const go = async () => {
    if (!q.trim()) return;
    setBusy(true); setResults([]);
    const repoQ = `repo:${owner}/${repo} ${q.trim()}`;
    try {
      let r: any;
      if (kind === 'code') r = await search.code(repoQ);
      else if (kind === 'issues') r = await search.issues(repoQ);
      else r = await search.commits(repoQ);
      setResults(r.items || []); setTotal(r.total_count || 0);
    } catch (e: any) { toast.error(e?.message); }
    finally { setBusy(false); }
  };

  return (
    <>
      <TopBar title="Buscar en repo" sub={`${owner}/${repo}`} />
      <div style={{ padding: 8 }}>
        <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && go()}
          placeholder={`Buscar en ${repo}…`} autoFocus />
      </div>
      <div className="toolbar">
        {(['code', 'issues', 'commits'] as Kind[]).map(k => (
          <button key={k} className={`chip ${kind === k ? 'active' : ''}`} onClick={() => { setKind(k); setResults([]); }}>{k}</button>
        ))}
        <button className="chip" onClick={go}>🔎</button>
      </div>
      <div className="scroll-area scroll">
        {busy && <div className="loading"><span className="spinner" /> Buscando…</div>}
        {!busy && total > 0 && <div className="muted small" style={{ padding: '6px 14px' }}>{total} resultado(s)</div>}
        <div className="list">
          {kind === 'code' && results.map((r: any, i: number) => (
            <div key={i} className="card-row" onClick={() => router.push({ name: 'file', owner: r.repository.owner.login, repo: r.repository.name, path: r.path })}>
              <div style={{ fontSize: 18 }}>📄</div>
              <div className="body">
                <div className="title truncate">{r.name}</div>
                <div className="sub truncate">{r.path}</div>
              </div>
            </div>
          ))}
          {kind === 'issues' && results.map((r: any, i: number) => {
            const m = (r.html_url || '').match(/github\.com\/([^/]+)\/([^/]+)\/(issues|pull)\/(\d+)/);
            return (
              <div key={i} className="issue-row" onClick={() => m && router.push({ name: m[3] === 'pull' ? 'pr' : 'issue', owner: m[1], repo: m[2], number: Number(m[4]) })}>
                <div className="ico">{r.state === 'open' ? '🟢' : '🟣'}</div>
                <div className="meta">
                  <div className="title">{r.title}</div>
                  <div className="sub">#{r.number}</div>
                </div>
              </div>
            );
          })}
          {kind === 'commits' && results.map((r: any, i: number) => {
            const sha = r.sha || '';
            return (
              <div key={i} className="card-row" onClick={() => sha && router.push({ name: 'commit', owner, repo, sha })}>
                <div style={{ fontSize: 18 }}>🟢</div>
                <div className="body">
                  <div className="title truncate">{r.commit?.message?.split('\n')[0] || sha.slice(0, 7)}</div>
                  <div className="sub">{r.commit?.author?.name} · {sha.slice(0, 7)}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ height: 24 }} />
      </div>
    </>
  );
}
