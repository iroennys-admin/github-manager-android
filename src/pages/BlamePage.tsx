// ============================================================
// OctoMobile · Blame View
// ============================================================

import React, { useEffect, useState } from 'react';
import TopBar from '../ui/TopBar';
import { blame, type Commit } from '../api/github';
import { useRouter } from '../state/router';
import { toast } from '../ui/Toast';
import { timeAgo } from './IssuesPage';

interface Props { owner: string; repo: string; path: string; refSpec?: string }

interface BlameLine {
  line: number;
  content: string;
  commit: Commit | null;
}

export default function BlamePage({ owner, repo, path, refSpec }: Props) {
  const router = useRouter();
  const [lines, setLines] = useState<BlameLine[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [wrap, setWrap] = useState(false);

  useEffect(() => {
    setLoading(true);
    blame.raw(owner, repo, path, refSpec).then(r => {
      setLines(r.lines);
      setCommits(r.commits);
    }).catch(e => toast.error(e?.message || 'Error loading blame'))
    .finally(() => setLoading(false));
  }, [owner, repo, path, refSpec]);

  // Group consecutive lines by the same commit
  const groups: { commit: Commit | null; startLine: number; endLine: number; lines: string[] }[] = [];
  let currentGroup: typeof groups[0] | null = null;

  for (const l of lines) {
    const cKey = l.commit?.sha || 'none';
    const gKey = currentGroup?.commit?.sha || 'none';
    if (cKey === gKey) {
      currentGroup!.endLine = l.line;
      currentGroup!.lines.push(l.content);
    } else {
      if (currentGroup) groups.push(currentGroup);
      currentGroup = { commit: l.commit, startLine: l.line, endLine: l.line, lines: [l.content] };
    }
  }
  if (currentGroup) groups.push(currentGroup);

  const fileName = path.split('/').pop() || path;

  return (
    <>
      <TopBar title={`Blame: ${fileName}`} sub={`${owner}/${repo}`}
        actions={
          <button className="btn-icon" onClick={() => setWrap(!wrap)} title="Toggle wrap">
            {wrap ? '↩️' : '➡️'}
          </button>
        } />
      <div className="scroll-area scroll" style={{ padding: 0 }}>
        {loading && <div className="loading"><span className="spinner" /> Cargando blame…</div>}
        {!loading && lines.length === 0 && (
          <div className="empty">
            <div className="ico">🔍</div>
            <div className="title">Sin datos de blame</div>
            <div className="muted small">No se pudo cargar la información de blame para este archivo.</div>
          </div>
        )}
        {!loading && groups.map((g, gi) => (
          <div key={gi} className={gi % 2 === 0 ? 'blame-group' : 'blame-group-alt'}>
            {g.lines.map((line, li) => (
              <div key={li} className="blame-row">
                {li === 0 ? (
                  <div className="blame-info">
                    {g.commit ? (
                      <>
                        <div className="author">{g.commit.author?.login || g.commit.commit.author.name}</div>
                        <div className="date">{timeAgo(g.commit.commit.author.date)}</div>
                        <div className="sha" onClick={() => router.push({ name: 'commit', owner, repo, sha: g.commit!.sha })}>
                          {g.commit.sha.slice(0, 7)}
                        </div>
                      </>
                    ) : (
                      <div className="muted tiny">—</div>
                    )}
                  </div>
                ) : (
                  <div className="blame-info" style={{ visibility: li === 0 ? 'visible' : 'hidden' }}>
                    <div className="author">&nbsp;</div>
                  </div>
                )}
                <div className="blame-line" style={{ whiteSpace: wrap ? 'pre-wrap' : 'pre', wordBreak: wrap ? 'break-all' : 'normal' }}>
                  <span className="muted tiny" style={{ marginRight: 8, userSelect: 'none' }}>{g.startLine + li}</span>
                  {line}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
