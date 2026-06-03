// ============================================================
// OctoMobile · CommitsPage — historial con paginación infinita
// y filtro por rama/tag
// ============================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import TopBar from '../ui/TopBar';
import { git, repos, type Commit, type Branch, type Repo } from '../api/github';
import { useRouter } from '../state/router';
import { toast } from '../ui/Toast';
import { timeAgo } from './IssuesPage';

const PER_PAGE = 30;

interface Props { owner: string; repo: string; ref?: string; }

export default function CommitsPage({
  owner, repo, ref,
}: Props) {
  const router = useRouter();

  // ── estado ──────────────────────────────────────────────
  const [items, setItems]       = useState<Commit[]>([]);
  const [loading, setLoading]   = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage]         = useState(1);
  const [hasMore, setHasMore]   = useState(true);

  // filtro de rama
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selRef, setSelRef]     = useState<string>(ref || '');
  const [showFilter, setShowFilter] = useState(false);

  // repo info & pull-to-refresh
  const [info, setInfo]         = useState<Repo | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // ref del sentinel para infinite-scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // ── carga de ramas (para el filtro) ─────────────────────
  useEffect(() => {
    git.branches(owner, repo, 100)
      .then(setBranches)
      .catch(() => {});
    repos.get(owner, repo).then(setInfo).catch(() => {});
  }, [owner, repo]);

  // ── carga inicial / cuando cambia la ref seleccionada ───
  const loadFirst = useCallback(async () => {
    setLoading(true);
    setItems([]);
    setPage(1);
    setHasMore(true);
    try {
      const data = await git.commits(owner, repo, {
        sha: selRef || undefined,
        per_page: PER_PAGE,
        page: 1,
      });
      setItems(data);
      setHasMore(data.length === PER_PAGE);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [owner, repo, selRef]);

  useEffect(() => { loadFirst(); }, [loadFirst]);

  // ── cargar más páginas ───────────────────────────────────
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const data = await git.commits(owner, repo, {
        sha: selRef || undefined,
        per_page: PER_PAGE,
        page: nextPage,
      });
      setItems(prev => [...prev, ...data]);
      setPage(nextPage);
      setHasMore(data.length === PER_PAGE);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoadingMore(false);
    }
  }, [owner, repo, selRef, page, loadingMore, hasMore]);

  // ── IntersectionObserver para scroll infinito ────────────
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore(); },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loadMore]);

  // ── pull-to-refresh ─────────────────────────────────────
  const doRefresh = async () => {
    setRefreshing(true);
    await loadFirst();
    setRefreshing(false);
    toast.success('Actualizado');
  };

  // ── helpers UI ───────────────────────────────────────────
  const refLabel = selRef || 'default branch';

  return (
    <>
      <TopBar
        title="Commits"
        sub={`${owner}/${repo} · ${refLabel}`}
        actions={
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              className="btn-icon"
              onClick={() => setShowFilter(v => !v)}
              title="Filtrar por rama"
            >
              🌿
            </button>
            {info?.permissions?.push && (
              <button className="btn-icon" onClick={() => router.push({ name: 'compare', owner, repo })} title="Compare">🔀</button>
            )}
          </div>
        }
      />

      {/* ── panel de filtro de ramas ── */}
      {showFilter && (
        <div style={{
          background: 'var(--bg-1)',
          borderBottom: '1px solid var(--border)',
          padding: '8px 12px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          maxHeight: 140,
          overflowY: 'auto',
        }}>
          <button
            className={`btn btn-sm ${selRef === '' ? 'btn-primary' : ''}`}
            onClick={() => { setSelRef(''); setShowFilter(false); }}
          >
            default
          </button>
          {branches.map(b => (
            <button
              key={b.name}
              className={`btn btn-sm ${selRef === b.name ? 'btn-primary' : ''}`}
              onClick={() => { setSelRef(b.name); setShowFilter(false); }}
            >
              {b.name}
            </button>
          ))}
        </div>
      )}

      <div className="scroll-area scroll" onTouchStart={handleTouchStart} onTouchEnd={(e) => handleTouchEnd(e, doRefresh)}>
        <div className="list">
          {loading && (
            <div className="loading"><span className="spinner" /> Cargando…</div>
          )}

          {items.map((c, idx) => (
            <div
              key={c.sha}
              className="card-row"
              onClick={() => router.push({
                name: 'commit',
                owner,
                repo,
                sha: c.sha,
                commitList: items.map(x => x.sha),
                commitIdx:  idx,
              })}
            >
              <div className="avatar">
                <img src={c.author?.avatar_url || ''} alt="" />
              </div>
              <div className="body">
                <div className="title truncate">
                  {c.commit.message.split('\n')[0]}
                </div>
                <div className="sub truncate">
                  {c.author?.login || c.commit.author.name} · {timeAgo(c.commit.author.date)}
                </div>
                <div className="sub mono small">{c.sha.slice(0, 7)}</div>
              </div>
              {/* botón rápido para explorar archivos en este SHA */}
              <button
                className="btn btn-sm"
                style={{ flexShrink: 0 }}
                title="Ver archivos en este commit"
                onClick={e => {
                  e.stopPropagation();
                  router.push({ name: 'files', owner, repo, ref: c.sha });
                }}
              >
                📁
              </button>
              {/* reset branch button for push users */}
              {info?.permissions?.push && (
                <button
                  className="btn btn-sm btn-danger"
                  style={{ flexShrink: 0 }}
                  title="Reset a este commit"
                  onClick={e => {
                    e.stopPropagation();
                    router.push({ name: 'reset-branch', owner, repo, sha: c.sha, branch: selRef || info.default_branch });
                  }}
                >
                  ⏪
                </button>
              )}
            </div>
          ))}

          {/* sentinel para infinite-scroll */}
          {!loading && hasMore && (
            <div ref={sentinelRef} style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {loadingMore
                ? <><span className="spinner" style={{ marginRight: 8 }} /> Cargando más…</>
                : <span className="muted small">↓ Desplaza para cargar más</span>}
            </div>
          )}

          {!loading && !hasMore && items.length > 0 && (
            <div className="muted small center" style={{ padding: 16 }}>
              {items.length} commits cargados · fin del historial
            </div>
          )}
        </div>
      </div>
    </>
  );
}

let touchStartY = 0;
function handleTouchStart(e: React.TouchEvent) { touchStartY = e.touches[0].clientY; }
function handleTouchEnd(e: React.TouchEvent, onRefresh: () => void) {
  const diff = touchStartY - e.changedTouches[0].clientY;
  const el = e.currentTarget as HTMLElement;
  if (diff < -80 && el.scrollTop <= 0) onRefresh();
}
