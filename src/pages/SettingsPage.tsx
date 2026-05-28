import React, { useEffect, useState } from 'react';
import TopBar from '../ui/TopBar';
import { useApp, type Theme } from '../state/store';
import { useRouter } from '../state/router';
import { misc } from '../api/github';
import { toast } from '../ui/Toast';

const THEMES: { id: Theme; name: string }[] = [
  { id: 'github-dark',    name: 'GitHub Dark' },
  { id: 'github-dimmed',  name: 'GitHub Dimmed' },
  { id: 'midnight',       name: 'Midnight' },
  { id: 'aurora',         name: 'Aurora' },
  { id: 'cyber',          name: 'Cyber' },
];

export default function SettingsPage() {
  const app = useApp();
  const router = useRouter();
  const [rate, setRate] = useState<any>(null);

  useEffect(() => {
    misc.rateLimit().then(r => setRate(r.rate)).catch(() => {});
  }, []);

  return (
    <>
      <TopBar title="Ajustes / Cuenta" showBack={false}
        actions={<button className="btn-icon" onClick={() => router.push({ name: 'profile' })}>👤</button>} />
      <div className="scroll-area scroll">
        {/* Account */}
        {app.me && (
          <div className="card" style={{ margin: 12 }} onClick={() => router.push({ name: 'profile' })}>
            <div className="flex gap-3" style={{ alignItems: 'center' }}>
              <img src={app.me.avatar_url} className="avatar-lg" alt="" style={{ width: 56, height: 56 }} />
              <div style={{ flex: 1 }}>
                <div className="strong">{app.me.name || app.me.login}</div>
                <div className="muted small">@{app.me.login}</div>
              </div>
            </div>
          </div>
        )}

        <div className="section-title">Apariencia</div>
        <div className="card" style={{ margin: 12 }}>
          <div className="field">
            <label>Tema</label>
            <select value={app.settings.theme} onChange={e => app.updateSettings({ theme: e.target.value as Theme })}>
              {THEMES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Tamaño de fuente: {app.settings.fontSize}px</label>
            <input type="range" min="12" max="20" step="1" value={app.settings.fontSize}
                   onChange={e => app.updateSettings({ fontSize: Number(e.target.value) })} />
          </div>
        </div>

        <div className="section-title">Notificaciones</div>
        <div className="card" style={{ margin: 12 }}>
          <div className="row-between" style={{ padding: '6px 0' }}>
            <div>
              <div className="strong">Polling de notificaciones</div>
              <div className="muted tiny">Comprueba cada {app.settings.notificationsIntervalMin} min</div>
            </div>
            <div className={`toggle ${app.settings.notificationsEnabled ? 'on' : ''}`}
                 onClick={() => app.updateSettings({ notificationsEnabled: !app.settings.notificationsEnabled })} />
          </div>
          <div className="field">
            <label>Intervalo (min)</label>
            <input type="number" min={5} max={120} value={app.settings.notificationsIntervalMin}
                   onChange={e => app.updateSettings({ notificationsIntervalMin: Number(e.target.value) || 15 })} />
          </div>
          <div className="row-between" style={{ padding: '6px 0' }}>
            <div className="strong">Vibración</div>
            <div className={`toggle ${app.settings.hapticFeedback ? 'on' : ''}`}
                 onClick={() => app.updateSettings({ hapticFeedback: !app.settings.hapticFeedback })} />
          </div>
        </div>

        <div className="section-title">Rate limit</div>
        <div className="card" style={{ margin: 12 }}>
          {rate ? (
            <>
              <div className="row-between"><span className="muted small">Límite</span><span className="strong">{rate.limit}</span></div>
              <div className="row-between"><span className="muted small">Restantes</span><span className="strong">{rate.remaining}</span></div>
              <div className="row-between"><span className="muted small">Reset</span><span className="strong">{new Date(rate.reset * 1000).toLocaleTimeString()}</span></div>
            </>
          ) : <div className="muted small">Cargando…</div>}
        </div>

        <div className="section-title">Avanzado</div>
        <div className="card" style={{ margin: 12 }}>
          <div className="field">
            <label>OAuth Client ID (Device Flow)</label>
            <input value={app.settings.oauthClientId || ''} onChange={e => app.updateSettings({ oauthClientId: e.target.value || undefined })}
                   placeholder="Por defecto: GitHub CLI client" />
            <span className="hint">Pega tu propio OAuth App client_id si quieres scopes personalizados.</span>
          </div>
        </div>

        <div className="section-title">Sesión</div>
        <div className="card" style={{ margin: 12 }}>
          <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => router.push({ name: 'about' })}>ℹ️ Acerca de OctoMobile</button>
          <button className="btn btn-danger mt-2" style={{ width: '100%' }} onClick={() => {
            if (confirm('¿Cerrar sesión?')) app.logout();
          }}>🚪 Cerrar sesión</button>
        </div>
        <div style={{ height: 24 }} />
      </div>
    </>
  );
}
