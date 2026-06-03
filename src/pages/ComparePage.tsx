// ============================================================
// OctoMobile · Compare Branches
// ============================================================

import React, { useEffect, useState } from 'react';
import TopBar from '../ui/TopBar';
import { git, repos, type Repo, type Branch, type Commit, type FileChange } from '../api/github';
import { useRouter } from '../state/router';
import { toast } from '../ui/Toast';
import { timeAgo } from './IssuesPage';

interface Props { owner: string; repo: string; base?: string; head?: string; }

export default function ComparePage({ owner, repo, base, head }: Props) {
  const router = useRouter();
  const [info, setInfo] = useState<Repo | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [baseBranch, setBaseBranch] = useState(base || '');
  const [headBranch, setHeadBranch] = useState(head || '');
  const [result, setResult] = useState<{ status: string; ahead_by: number; behind_by: number; total_commits: number; commits: Commit[]; files: FileChange[] } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    repos.get(owner, repo).then(r => {
      setInfo(r);
      if (!baseBranch) setBaseBranch(r.default_branch);
      if (!headBranch) setHeadBranch(r.default_branch);
    }).catch(e => toast.error(e.message));
    git.branches(owner, repo, 100).then(setBranches).catch(() => {});
  }, [owner, repo]);

  const doCompare = async () => {
    if (!baseBranch || !headBranch) { toast.error('Selecciona ambas ramas'); return; }
    setLoading(true); setResult(null);
    try {
      const r = await git.compare(owner, repo, baseBranch, headBranch);
      setResult(r);
    } catch (e: any) { toast.error(e?.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (baseBranch && headBranch) doCompare(); }, [baseBranch, headBranch]);

  return (
    <>
      <TopBar title="Comparar" sub={`${owner}/${repo}`} />
      <div className="scroll-area scroll">
        <div className="card" style={{ margin: 12 }}>
          <div className="field">
            <label>Base</label>
            <select value={baseBranch} onChange={e => setBaseBranch(e.target.value)}>
              {branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
            </select>
          </div>
          <div className="center muted" style={{ padding: 4 }}>⬇️</div>
          <div className="field">
            <label>Head</label>
            <select value={headBranch} onChange={e => setHeadBranch(e.target.value)}>
              {branches.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
            </select>
          </div>
        </div>

        {loading && <div className="loading"><span className="spinner" /> Comparando…</div>}

        {result && (
          <>
            <div className="card" style={{ margin: '0 12px' }}>
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                <span className="badge success">↑{result.ahead_by} ahead</span>
                <span className="badge danger">↓{result.behind_by} behind</span>
                <span className="badge">{result.total_commits} commits</span>
                <span className="badge">{result.files?.length || 0} files changed</span>
              </div>
            </div>

            {result.commits.length > 0 && (
              <>
                <div className="section-title">Commits ({result.commits.length})</div>
                <div className="list">
                  {result.commits.map(c => (
                    <div key={c.sha} className="card-row" onClick={() => router.push({ name: 'commit', owner, repo, sha: c.sha })}>
                      <div className="avatar"><img src={c.author?.avatar_url || ''} alt="" /></div>
                      <div className="body">
                        <div className="title truncate">{c.commit.message.split('\n')[0]}</div>
                        <div className="sub">{c.author?.login || c.commit.author.name} · {timeAgo(c.commit.author.date)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {result.files && result.files.length > 0 && (
              <>
                <div className="section-title">Archivos cambiados</div>
                <div className="list">
                  {result.files.map(f => (
                    <div key={f.filename} className="card">
                      <div className="flex gap-2" style={{ alignItems: 'center' }}>
                        <span className={`badge ${f.status === 'added' ? 'success' : f.status === 'removed' ? 'danger' : 'warn'}`}>{f.status}</span>
                        <span className="mono small truncate strong" style={{ flex: 1 }}>{f.filename}</span>
                        <span className="muted tiny">+{f.additions} -{f.deletions}</span>
                      </div>
                      {f.patch && <DiffView patch={f.patch} />}
                    </div>
                  ))}
                </div>
              </>
            )}
            <div style={{ height: 16 }} />
          </>
        )}
        <div style={{ height: 24 }} />
      </div>
    </>
  );
}

function DiffView({ patch }: { patch: string }) {
  const [expanded, setExpanded] = useState(false);
  const lines = patch.split('\n');
  const preview = lines.slice(0, 8);
  const display = expanded ? lines : preview;
  const hasMore = lines.length > 8;

  return (
    <div className="mt-2">
      <pre className="diff-block" style={{ maxHeight: expanded ? 400 : 120, overflow: 'auto' }}>
        {display.map((line, i) => (
          <div key={i} className={line.startsWith('+') ? 'diff-add' : line.startsWith('-') ? 'diff-del' : line.startsWith('@@') ? 'diff-hunk' : ''}>
            {line}
          </div>
        ))}
      </pre>
      {hasMore && !expanded && (
        <button className="btn btn-sm mt-1" style={{ width: '100%' }} onClick={() => setExpanded(true)}>
          Ver diff completo ({lines.length} líneas)
        </button>
      )}
    </div>
  );
}
