// ============================================================
// OctoMobile · CommitDetailPage
// — diff, stats, navegación prev/next y acceso al código
//   tal como estaba en ese commit exacto.
// ============================================================
import React, { useEffect, useState } from 'react';
import TopBar from '../ui/TopBar';
import { git, type Commit } from '../api/github';
import { useRouter } from '../state/router';
import { toast } from '../ui/Toast';
import { timeAgo } from './IssuesPage';

interface Props {
  owner: string;
  repo: string;
  sha: string;
  /** Lista de SHAs del historial desde el que se llegó (opcional) */
  commitList?: string[];
  /** Índice del SHA actual dentro de commitList (opcional) */
  commitIdx?: number;
}

export default function CommitDetailPage({
  owner, repo, sha, commitList = [], commitIdx = -1,
}: Props) {
  const router = useRouter();
  const [c, setC]         = useState<Commit | null>(null);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    setLoading(true);
    setC(null);
    git.commit(owner, repo, sha)
      .then(setC)
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [owner, repo, sha]);

  // ── navegación prev / next ───────────────────────────────
  const hasPrev = commitIdx > 0;
  const hasNext = commitIdx >= 0 && commitIdx < commitList.length - 1;

  const goPrev = () => {
    if (!hasPrev) return;
    router.replace({
      name: 'commit', owner, repo,
      sha: commitList[commitIdx - 1],
      commitList,
      commitIdx: commitIdx - 1,
    });
  };
  const goNext = () => {
    if (!hasNext) return;
    router.replace({
      name: 'commit', owner, repo,
      sha: commitList[commitIdx + 1],
      commitList,
      commitIdx: commitIdx + 1,
    });
  };

  // ── copiar SHA ────────────────────────────────────────────
  const copySha = async () => {
    try {
      await navigator.clipboard.writeText(sha);
      setCopying(true);
      setTimeout(() => setCopying(false), 1500);
    } catch { toast.error('No se pudo copiar'); }
  };

  // ── estado de carga ──────────────────────────────────────
  if (loading) {
    return (
      <>
        <TopBar title="Commit" sub={`${owner}/${repo}`} />
        <div className="loading"><span className="spinner" /> Cargando…</div>
      </>
    );
  }
  if (!c) return null;

  const firstLine = c.commit.message.split('\n')[0];
  const body      = c.commit.message.split('\n').slice(1).join('\n').trim();
  const parentSha = c.parents[0]?.sha;

  return (
    <>
      <TopBar
        title={sha.slice(0, 7)}
        sub={`${owner}/${repo}`}
        actions={
          /* botones prev / next solo si venimos del historial */
          commitList.length > 0 ? (
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                className="btn btn-sm"
                disabled={!hasPrev}
                onClick={goPrev}
                title="Commit más nuevo"
              >◀</button>
              <button
                className="btn btn-sm"
                disabled={!hasNext}
                onClick={goNext}
                title="Commit más antiguo"
              >▶</button>
            </div>
          ) : undefined
        }
      />

      <div className="scroll-area scroll">

        {/* ── tarjeta resumen ── */}
        <div className="card" style={{ margin: 12 }}>
          <div className="strong" style={{ fontSize: 15 }}>{firstLine}</div>
          {body && (
            <pre className="mt-2 small" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              <code>{body}</code>
            </pre>
          )}

          {/* autor + fecha */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            {c.author?.avatar_url && (
              <img
                src={c.author.avatar_url}
                alt=""
                style={{ width: 24, height: 24, borderRadius: '50%' }}
              />
            )}
            <span className="muted small">
              {c.author?.login || c.commit.author.name}
              {' · '}
              {timeAgo(c.commit.author.date)}
            </span>
          </div>

          {/* SHA + copiar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <code className="mono small" style={{ color: 'var(--text-muted)' }}>
              {sha.slice(0, 40)}
            </code>
            <button className="btn btn-sm" onClick={copySha} style={{ flexShrink: 0 }}>
              {copying ? '✓' : '📋'}
            </button>
          </div>

          {/* stats */}
          {c.stats && (
            <div className="flex gap-2" style={{ marginTop: 10 }}>
              <span className="badge success">+{c.stats.additions}</span>
              <span className="badge danger">−{c.stats.deletions}</span>
              <span className="badge">{c.stats.total} cambios</span>
              <span className="badge">{c.files?.length || 0} archivos</span>
            </div>
          )}
        </div>

        {/* ── acciones principales ── */}
        <div style={{ padding: '0 12px 4px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* 🕐 VER CÓDIGO EN ESTE COMMIT — la feature pedida */}
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={() => router.push({ name: 'files', owner, repo, ref: sha })}
          >
            🕐 Ver código en este commit
          </button>

          {/* comparar con su padre */}
          {parentSha && (
            <button
              className="btn"
              style={{ flex: 1 }}
              onClick={() => router.push({
                name: 'web-view',
                url: `https://github.com/${owner}/${repo}/commit/${sha}`,
                title: `Diff ${sha.slice(0, 7)}`,
              })}
            >
              🔀 Ver diff completo
            </button>
          )}
        </div>

        {/* ── crear rama desde este commit ── */}
        <div style={{ padding: '4px 12px 12px', display: 'flex', gap: 8 }}>
          <button
            className="btn"
            style={{ flex: 1 }}
            onClick={async () => {
              const name = prompt(`Nombre de la nueva rama (desde ${sha.slice(0,7)}):`);
              if (!name) return;
              try {
                await git.createBranch(owner, repo, name, sha);
                toast.success(`Rama "${name}" creada desde ${sha.slice(0,7)}`);
              } catch (e: any) { toast.error(e.message); }
            }}
          >
            🌿 Crear rama desde aquí
          </button>
        </div>

        {/* ── archivos modificados ── */}
        <div className="section-title" style={{ paddingLeft: 16 }}>
          Archivos modificados ({c.files?.length || 0})
        </div>

        <div className="list" style={{ paddingBottom: 24 }}>
          {c.files?.map(f => (
            <div key={f.filename} className="card" style={{ margin: '0 12px 8px' }}>
              {/* cabecera del archivo */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <span
                  className="mono small truncate strong"
                  style={{ flex: 1, cursor: 'pointer', color: 'var(--link)' }}
                  onClick={() => {
                    if (f.status !== 'removed') {
                      router.push({ name: 'file', owner, repo, path: f.filename, ref: sha });
                    }
                  }}
                >
                  {statusIcon(f.status)} {f.filename}
                </span>
                <span className="muted tiny" style={{ flexShrink: 0 }}>
                  <span style={{ color: 'var(--success)' }}>+{f.additions}</span>
                  {' '}
                  <span style={{ color: 'var(--danger)' }}>−{f.deletions}</span>
                </span>
              </div>

              {/* badge de estado */}
              <div className="muted tiny" style={{ marginTop: 2 }}>
                <span className={`badge ${statusBadge(f.status)}`}>{f.status}</span>
                {f.previous_filename && (
                  <span className="muted tiny" style={{ marginLeft: 6 }}>
                    ← {f.previous_filename}
                  </span>
                )}
              </div>

              {/* patch (diff coloreado) */}
              {f.patch && (
                <pre
                  style={{
                    marginTop: 8,
                    maxHeight: 280,
                    overflow: 'auto',
                    fontSize: 11,
                    lineHeight: 1.4,
                    borderRadius: 6,
                    background: 'var(--bg-0)',
                    padding: '8px 6px',
                    whiteSpace: 'pre',
                  }}
                >
                  {f.patch.split('\n').map((line, i) => (
                    <span
                      key={i}
                      style={{
                        display: 'block',
                        color: line.startsWith('+')
                          ? 'var(--success)'
                          : line.startsWith('-')
                          ? 'var(--danger)'
                          : line.startsWith('@@')
                          ? 'var(--accent-2)'
                          : 'var(--text-muted)',
                        background: line.startsWith('+')
                          ? 'rgba(63,185,80,0.08)'
                          : line.startsWith('-')
                          ? 'rgba(248,81,73,0.08)'
                          : 'transparent',
                      }}
                    >
                      {line || ' '}
                    </span>
                  ))}
                </pre>
              )}

              {/* si el archivo no fue eliminado, botón para verlo */}
              {f.status !== 'removed' && (
                <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                  <button
                    className="btn btn-sm"
                    onClick={() => router.push({ name: 'file', owner, repo, path: f.filename, ref: sha })}
                  >
                    📄 Ver archivo
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function statusIcon(s: string) {
  return { added: '🟢', removed: '🔴', modified: '🟡', renamed: '🔵', copied: '🟣' }[s] ?? '⚪';
}
function statusBadge(s: string) {
  return { added: 'success', removed: 'danger', modified: 'warn', renamed: '', copied: '' }[s] ?? '';
}
