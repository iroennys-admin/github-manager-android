// ============================================================
// OctoMobile · Reset Branch (Git Reset)
// ============================================================

import React, { useEffect, useState } from 'react';
import TopBar from '../ui/TopBar';
import { git, refs, repos, type Repo, type Branch, type Commit } from '../api/github';
import { useRouter } from '../state/router';
import { toast } from '../ui/Toast';
import { timeAgo } from './IssuesPage';

interface Props { owner: string; repo: string; sha: string; branch?: string; }

export default function ResetBranchPage({ owner, repo, sha, branch }: Props) {
  const router = useRouter();
  const [info, setInfo] = useState<Repo | null>(null);
  const [commit, setCommit] = useState<Commit | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState(branch || '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    repos.get(owner, repo).then(r => {
      setInfo(r);
      if (!selectedBranch) setSelectedBranch(r.default_branch);
    }).catch(e => toast.error(e.message));
    git.commit(owner, repo, sha).then(setCommit).catch(e => toast.error(e.message));
    git.branches(owner, repo, 100).then(setBranches).catch(() => {});
  }, [owner, repo, sha]);

  const doReset = async () => {
    if (!selectedBranch) { toast.error('Selecciona una rama'); return; }
    if (!confirm(`⚠️ ¿RESET de ${selectedBranch} al commit ${sha.slice(0, 7)}?\n\nEsto moverá el puntero de la rama a este commit. Los commits posteriores se perderán de la rama.`)) return;
    if (prompt(`Escribe "${selectedBranch}" para confirmar:`) !== selectedBranch) { toast.error('Confirmación incorrecta'); return; }
    setBusy(true);
    try {
      await refs.update(owner, repo, `heads/${selectedBranch}`, sha, true);
      toast.success(`✅ ${selectedBranch} reseteada a ${sha.slice(0, 7)}`);
      router.back();
    } catch (e: any) { toast.error(e?.message || 'Error al hacer reset'); }
    finally { setBusy(false); }
  };

  return (
    <>
      <TopBar title="Git Reset" sub={`${owner}/${repo}`} />
      <div className="scroll-area scroll">
        <div className="card" style={{ margin: 12 }}>
          <div className="strong" style={{ fontSize: 16 }}>⏪ Reset Branch</div>
          <div className="muted small mt-2">
            Mueve el puntero de una rama al commit seleccionado. Esto es equivalente a <code>git reset --hard</code> seguido de <code>git push --force</code>.
          </div>
          <div className="card mt-3" style={{ background: 'rgba(248,81,73,0.08)', borderColor: 'rgba(248,81,73,0.3)' }}>
            <div className="strong" style={{ color: 'var(--danger)' }}>⚠️ Operación destructiva</div>
            <div className="muted small mt-1">Los commits posteriores a este punto se perderán de la rama seleccionada. Otros colaboradores pueden verse afectados.</div>
          </div>
        </div>

        {commit && (
          <div className="card" style={{ margin: '0 12px' }}>
            <div className="section-title" style={{ padding: '0 0 6px' }}>Commit destino</div>
            <div className="mono small strong" style={{ color: 'var(--accent)' }}>{sha.slice(0, 7)}</div>
            <div className="small mt-1">{commit.commit.message.split('\n')[0]}</div>
            <div className="muted tiny mt-1">
              {commit.author?.login || commit.commit.author.name} · {timeAgo(commit.commit.author.date)}
            </div>
            {commit.stats && (
              <div className="flex gap-2 mt-2">
                <span className="badge success">+{commit.stats.additions}</span>
                <span className="badge danger">-{commit.stats.deletions}</span>
              </div>
            )}
          </div>
        )}

        <div className="card" style={{ margin: 12 }}>
          <div className="field">
            <label>Rama a resetear</label>
            <select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}>
              <option value="">Selecciona una rama…</option>
              {branches.filter(b => !b.protected).map(b => (
                <option key={b.name} value={b.name}>{b.name} {b.name === info?.default_branch ? '(default)' : ''}</option>
              ))}
            </select>
            {branches.find(b => b.name === selectedBranch)?.protected && (
              <div className="muted tiny" style={{ color: 'var(--danger)' }}>Esta rama está protegida. No se puede hacer reset.</div>
            )}
          </div>

          {selectedBranch && info && (
            <div className="mt-2">
              <div className="muted tiny">Rama actual: <span className="strong">{selectedBranch}</span></div>
              <div className="muted tiny">Se moverá al commit: <span className="strong mono">{sha.slice(0, 7)}</span></div>
            </div>
          )}
        </div>

        <div style={{ padding: '0 12px' }}>
          <button
            className="btn btn-danger"
            style={{ width: '100%', padding: '14px' }}
            onClick={doReset}
            disabled={busy || !selectedBranch || !!branches.find(b => b.name === selectedBranch)?.protected}
          >
            {busy ? <span className="spinner" /> : '⏪ Hacer Git Reset'}
          </button>
          <button className="btn mt-2" style={{ width: '100%' }} onClick={() => router.back()} disabled={busy}>
            Cancelar
          </button>
        </div>
        <div style={{ height: 24 }} />
      </div>
    </>
  );
}
