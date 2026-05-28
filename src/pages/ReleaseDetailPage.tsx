import React, { useEffect, useState } from 'react';
import TopBar from '../ui/TopBar';
import { releases, type Release } from '../api/github';
import Markdown from '../ui/Markdown';
import { toast } from '../ui/Toast';
import { prettySize } from './FilesPage';

export default function ReleaseDetailPage({ owner, repo, id }: { owner: string; repo: string; id: number }) {
  const [r, setR] = useState<Release | null>(null);
  useEffect(() => { releases.get(owner, repo, id).then(setR).catch(e => toast.error(e.message)); }, [owner, repo, id]);
  if (!r) return (<><TopBar title="Release" /><div className="loading"><span className="spinner" /> Cargando…</div></>);
  return (
    <>
      <TopBar title={r.name || r.tag_name} sub={`${owner}/${repo}`} />
      <div className="scroll-area scroll">
        <div className="card" style={{ margin: 12 }}>
          <div className="muted small">{r.tag_name}{r.prerelease && ' · pre-release'}{r.draft && ' · draft'}</div>
          {r.body && <div className="mt-2"><Markdown text={r.body} /></div>}
        </div>
        <div className="section-title">Assets ({r.assets.length})</div>
        <div className="list">
          {r.assets.map(a => (
            <a key={a.id} className="card-row" href={a.browser_download_url} target="_blank" rel="noreferrer">
              <div style={{ fontSize: 22 }}>⬇️</div>
              <div className="body">
                <div className="title truncate">{a.name}</div>
                <div className="sub small">{prettySize(a.size)} · {a.download_count} downloads</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
