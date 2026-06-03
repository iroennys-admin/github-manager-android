import React, { useEffect, useRef, useState } from 'react';
import TopBar from '../ui/TopBar';
import { notifications, type Notification } from '../api/github';
import { useRouter } from '../state/router';
import { toast } from '../ui/Toast';
import { timeAgo } from './IssuesPage';

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const load = async (pageNum: number, append = false) => {
    if (pageNum === 1) setLoading(true); else setLoadingMore(true);
    try {
      const data = await notifications.list({ all: showAll, per_page: 50, page: pageNum });
      if (append) setItems(prev => [...prev, ...data]);
      else setItems(data);
      setHasMore(data.length === 50);
      setPage(pageNum);
    } catch (e: any) { toast.error(e?.message); }
    finally { setLoading(false); setLoadingMore(false); }
  };

  useEffect(() => { load(1); }, [showAll]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loading && !loadingMore && hasMore) {
        load(page + 1, true);
      }
    }, { threshold: 0.1 });
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page]);

  const doRefresh = async () => {
    setRefreshing(true);
    await load(1);
    setRefreshing(false);
    toast.success('Actualizado');
  };

  const markAll = async () => {
    setBusy(true);
    try { await notifications.markAllRead(); setItems([]); toast.success('Todo leído'); }
    catch (e: any) { toast.error(e?.message); } finally { setBusy(false); }
  };

  const open = (n: Notification) => {
    notifications.markRead(n.id).catch(() => {});
    const m = (n.subject.url || '').match(/repos\/([^/]+)\/([^/]+)\/(issues|pulls)\/(\d+)/);
    if (m) { router.push({ name: m[3] === 'pulls' ? 'pr' : 'issue', owner: m[1], repo: m[2], number: Number(m[4]) }); }
    else router.push({ name: 'repo', owner: n.repository.owner.login, repo: n.repository.name });
  };

  return (
    <>
      <TopBar title="Notificaciones" sub={`${items.length} ${showAll ? 'totales' : 'sin leer'}`} showBack={false}
        actions={
          <button className="btn-icon" onClick={markAll} disabled={busy || items.length === 0} title="Marcar todo como leído">✓✓</button>
        } />
      <div className="toolbar">
        <button className={`chip ${!showAll ? 'active' : ''}`} onClick={() => setShowAll(false)}>Sin leer</button>
        <button className={`chip ${showAll ? 'active' : ''}`} onClick={() => setShowAll(true)}>Todas</button>
        <button className="chip" onClick={doRefresh}>↻ Refresh</button>
      </div>
      <div className="scroll-area scroll" onTouchStart={handleTouchStart} onTouchEnd={(e) => handleTouchEnd(e, doRefresh)}>
        <div className="list">
          {loading && <div className="loading"><span className="spinner" /> Cargando…</div>}
          {!loading && items.length === 0 && (
            <div className="empty"><div className="ico">🎉</div><div className="title">Sin notificaciones</div><div className="small muted">Estás al día</div></div>
          )}
          {items.map(n => (
            <div key={n.id} className="card-row" onClick={() => open(n)}>
              <div style={{ fontSize: 24 }}>{notifIcon(n)}</div>
              <div className="body">
                <div className="title truncate">{n.subject.title}</div>
                <div className="sub truncate">{n.repository.full_name} · {n.reason} · {timeAgo(n.updated_at)}</div>
              </div>
              {n.unread && <span className="badge open">●</span>}
            </div>
          ))}
          {/* Infinite scroll sentinel */}
          {hasMore && <div ref={sentinelRef} style={{ height: 1 }} />}
          {loadingMore && <div className="loading"><span className="spinner" /> Cargando más…</div>}
          {!hasMore && items.length > 0 && <div className="muted small center" style={{ padding: 16 }}>No hay más notificaciones</div>}
        </div>
      </div>
    </>
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

let touchStartY = 0;
function handleTouchStart(e: React.TouchEvent) { touchStartY = e.touches[0].clientY; }
function handleTouchEnd(e: React.TouchEvent, onRefresh: () => void) {
  const diff = touchStartY - e.changedTouches[0].clientY;
  const el = e.currentTarget as HTMLElement;
  if (diff < -80 && el.scrollTop <= 0) onRefresh();
}
