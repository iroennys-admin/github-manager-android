import React, { useState, useEffect } from 'react';
import TopBar from '../ui/TopBar';
import { repos as reposApi, misc, orgs } from '../api/github';
import { useApp } from '../state/store';
import { useRouter } from '../state/router';
import { toast } from '../ui/Toast';

export default function CreateRepoPage() {
  const app = useApp();
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [autoInit, setAutoInit] = useState(true);
  const [licenses, setLicenses] = useState<string[]>([]);
  const [gitignores, setGitignores] = useState<string[]>([]);
  const [license, setLicense] = useState('');
  const [gitignore, setGitignore] = useState('');
  const [orgList, setOrgList] = useState<{ login: string }[]>([]);
  const [owner, setOwner] = useState<string>('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    misc.licenses().then(l => setLicenses(l.map(x => x.key))).catch(() => {});
    misc.gitignoreTemplates().then(setGitignores).catch(() => {});
    orgs.mine(50).then(setOrgList).catch(() => {});
    if (app.me) setOwner(app.me.login);
  }, [app.me?.login]);

  const create = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const body: any = { name: name.trim(), description, private: isPrivate, auto_init: autoInit };
      if (license) body.license_template = license;
      if (gitignore) body.gitignore_template = gitignore;
      const r = owner === app.me?.login || !owner
        ? await reposApi.create(body)
        : await reposApi.createInOrg(owner, body);
      toast.success('Repo creado');
      router.replace({ name: 'repo', owner: r.owner.login, repo: r.name });
    } catch (e: any) { toast.error(e?.message); } finally { setBusy(false); }
  };

  return (
    <>
      <TopBar title="Nuevo repo" />
      <div className="scroll-area scroll" style={{ padding: 12 }}>
        <div className="field">
          <label>Owner</label>
          <select value={owner} onChange={e => setOwner(e.target.value)}>
            {app.me && <option value={app.me.login}>{app.me.login} (you)</option>}
            {orgList.map(o => <option key={o.login} value={o.login}>{o.login} (org)</option>)}
          </select>
        </div>
        <div className="field"><label>Nombre *</label><input value={name} onChange={e => setName(e.target.value)} placeholder="awesome-project" /></div>
        <div className="field"><label>Descripción</label><input value={description} onChange={e => setDescription(e.target.value)} /></div>

        <div className="row-between mt-2">
          <div className="strong">Privado</div>
          <div className={`toggle ${isPrivate ? 'on' : ''}`} onClick={() => setIsPrivate(p => !p)} />
        </div>
        <div className="row-between mt-2">
          <div className="strong">Inicializar con README</div>
          <div className={`toggle ${autoInit ? 'on' : ''}`} onClick={() => setAutoInit(p => !p)} />
        </div>

        {autoInit && (
          <>
            <div className="field">
              <label>License</label>
              <select value={license} onChange={e => setLicense(e.target.value)}>
                <option value="">(ninguna)</option>
                {licenses.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="field">
              <label>.gitignore template</label>
              <select value={gitignore} onChange={e => setGitignore(e.target.value)}>
                <option value="">(ninguno)</option>
                {gitignores.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </>
        )}

        <button className="btn btn-primary mt-3" style={{ width: '100%' }} onClick={create} disabled={busy || !name.trim()}>
          {busy ? <span className="spinner" /> : '🚀 Crear repo'}
        </button>
      </div>
    </>
  );
}
