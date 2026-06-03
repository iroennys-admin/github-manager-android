// ============================================================
// OctoMobile · Repo Settings (edit description, topics, archive)
// ============================================================

import React, { useEffect, useState } from 'react';
import TopBar from '../ui/TopBar';
import { repos, type Repo } from '../api/github';
import { useRouter } from '../state/router';
import { toast } from '../ui/Toast';

interface Props { owner: string; repo: string; }

export default function RepoSettingsPage({ owner, repo }: Props) {
  const router = useRouter();
  const [info, setInfo] = useState<Repo | null>(null);
  const [description, setDescription] = useState('');
  const [homepage, setHomepage] = useState('');
  const [topicsStr, setTopicsStr] = useState('');
  const [hasIssues, setHasIssues] = useState(true);
  const [hasWiki, setHasWiki] = useState(true);
  const [hasDiscussions, setHasDiscussions] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    repos.get(owner, repo).then(r => {
      setInfo(r);
      setDescription(r.description || '');
      setHomepage(r.homepage_url || r.owner.html_url || '');
      setTopicsStr((r.topics || []).join(', '));
      setHasIssues(r.has_issues);
      setHasWiki(r.has_wiki);
      setHasDiscussions(!!r.has_discussions);
    }).catch(e => toast.error(e.message));
  }, [owner, repo]);

  const save = async () => {
    setBusy(true);
    try {
      const topics = topicsStr.split(',').map(t => t.trim()).filter(Boolean);
      // Update repo details
      const updated = await repos.update(owner, repo, {
        description: description || null,
        homepage: homepage || null,
        has_issues: hasIssues,
        has_wiki: hasWiki,
        has_discussions: hasDiscussions,
      });
      // Update topics separately
      await repos.setTopics(owner, repo, topics);
      setInfo(updated);
      toast.success('✅ Guardado');
    } catch (e: any) { toast.error(e?.message); }
    finally { setBusy(false); }
  };

  const archive = async () => {
    if (!confirm(`¿Archivar ${owner}/${repo}?\nUn repo archivado es de solo lectura.`)) return;
    setBusy(true);
    try {
      const updated = await repos.update(owner, repo, { archived: true });
      setInfo(updated);
      toast.success('📦 Repo archivado');
    } catch (e: any) { toast.error(e?.message); }
    finally { setBusy(false); }
  };

  if (!info) return (<><TopBar title="Repo Settings" /><div className="loading"><span className="spinner" /> Cargando…</div></>);

  return (
    <>
      <TopBar title="Repo Settings" sub={`${owner}/${repo}`} />
      <div className="scroll-area scroll">
        <div className="card" style={{ margin: 12 }}>
          <div className="field">
            <label>Descripción</label>
            <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe tu repo…" />
          </div>
          <div className="field">
            <label>Homepage</label>
            <input value={homepage} onChange={e => setHomepage(e.target.value)} placeholder="https://…" />
          </div>
          <div className="field">
            <label>Topics (separados por coma)</label>
            <input value={topicsStr} onChange={e => setTopicsStr(e.target.value)} placeholder="react, android, github" />
            {topicsStr && (
              <div className="flex gap-1 mt-1" style={{ flexWrap: 'wrap' }}>
                {topicsStr.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                  <span key={t} className="badge">{t}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ margin: 12 }}>
          <div className="row-between" style={{ padding: '6px 0' }}>
            <div><div className="strong">Issues</div><div className="muted tiny">Habilitar issues</div></div>
            <div className={`toggle ${hasIssues ? 'on' : ''}`} onClick={() => setHasIssues(!hasIssues)} />
          </div>
          <div className="row-between" style={{ padding: '6px 0' }}>
            <div><div className="strong">Wiki</div><div className="muted tiny">Habilitar wiki</div></div>
            <div className={`toggle ${hasWiki ? 'on' : ''}`} onClick={() => setHasWiki(!hasWiki)} />
          </div>
          <div className="row-between" style={{ padding: '6px 0' }}>
            <div><div className="strong">Discussions</div><div className="muted tiny">Habilitar discussions</div></div>
            <div className={`toggle ${hasDiscussions ? 'on' : ''}`} onClick={() => setHasDiscussions(!hasDiscussions)} />
          </div>
        </div>

        <div style={{ padding: '0 12px' }}>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={save} disabled={busy}>
            {busy ? <span className="spinner" /> : '💾 Guardar cambios'}
          </button>
        </div>

        {!info.archived && info.permissions?.admin && (
          <div className="card" style={{ margin: 12 }}>
            <div className="section-title" style={{ padding: '0 0 6px' }}>Zona peligrosa</div>
            <button className="btn btn-ghost" style={{ width: '100%' }} onClick={archive} disabled={busy}>
              📦 Archivar repo
            </button>
            <button className="btn btn-danger mt-2" style={{ width: '100%' }} onClick={async () => {
              if (!confirm(`¿BORRAR ${owner}/${repo}?\nIRREVERSIBLE.`)) return;
              if (prompt(`Escribe "${repo}" para confirmar:`) !== repo) return;
              setBusy(true);
              try { await repos.delete(owner, repo); toast.success('Repo eliminado'); router.back(); }
              catch (e: any) { toast.error(e?.message); } finally { setBusy(false); }
            }} disabled={busy}>🗑 Borrar repo</button>
          </div>
        )}
        <div style={{ height: 24 }} />
      </div>
    </>
  );
}
