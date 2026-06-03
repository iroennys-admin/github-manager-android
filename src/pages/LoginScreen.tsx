import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../state/store';
import { auth } from '../api/github';
import { gh } from '../api/client';
import { startDeviceFlow, awaitDeviceAuth, DEFAULT_CLIENT_ID } from '../api/deviceFlow';
import { toast } from '../ui/Toast';

type Mode = 'choose' | 'token' | 'device';

export default function LoginScreen() {
  const app = useApp();
  const [mode, setMode] = useState<Mode>('choose');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);

  // Device flow state
  const [deviceCode, setDeviceCode] = useState<string | null>(null);
  const [userCode, setUserCode] = useState<string | null>(null);
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string>(app.settings.oauthClientId || DEFAULT_CLIENT_ID);
  const abortRef = useRef<AbortController | null>(null);

  const loginWithToken = async () => {
    if (!token.trim()) return;
    setBusy(true);
    try {
      gh.setToken(token.trim());
      const me = await auth.me();
      app.setMe(me);
      app.setToken(token.trim());
      toast.success(`¡Hola ${me.login}!`);
    } catch (e: any) {
      gh.setToken(null);
      toast.error(e?.message || 'Token inválido');
    } finally {
      setBusy(false);
    }
  };

  const startDevice = async () => {
    setBusy(true);
    try {
      const start = await startDeviceFlow(clientId);
      setDeviceCode(start.device_code);
      setUserCode(start.user_code);
      setVerifyUrl(start.verification_uri);
      setMode('device');
      // Begin polling
      abortRef.current = new AbortController();
      try {
        const tk = await awaitDeviceAuth(clientId, start.device_code, start.interval, abortRef.current.signal);
        gh.setToken(tk);
        const me = await auth.me();
        app.setMe(me);
        app.setToken(tk);
        toast.success(`¡Hola ${me.login}!`);
      } catch (e: any) {
        if (e?.message !== 'aborted') toast.error(e?.message || 'Error en device flow');
        setMode('choose'); setDeviceCode(null);
      }
    } catch (e: any) {
      toast.error(e?.message || 'No se pudo iniciar device flow');
    } finally { setBusy(false); }
  };

  const cancelDevice = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMode('choose'); setDeviceCode(null);
  };

  const copy = (s: string) => {
    navigator.clipboard?.writeText(s).then(() => toast.success('Copiado'));
  };
  const openBrowser = (url: string) => { try { window.open(url, '_blank', 'noopener'); } catch {} };

  return (
    <div className="login-wrap">
      <div className="login-logo">🐙</div>
      <div className="login-title">OctoMobile</div>
      <div className="login-sub mt-2">
        Gestiona toda tu cuenta de GitHub desde Android — repos, issues, PRs, Actions, Gists y más.
      </div>

      <div style={{ width: '100%', maxWidth: 360, marginTop: 24 }}>
        {mode === 'choose' && (
          <>
            <button className="btn btn-accent" style={{ width: '100%', padding: '14px' }} onClick={startDevice} disabled={busy}>
              {busy ? <span className="spinner" /> : '🔐 Iniciar sesión con GitHub'}
            </button>
            <div className="muted small center mt-3">
              o si prefieres usar un Personal Access Token:
            </div>
            <button className="btn btn-ghost mt-2" style={{ width: '100%' }} onClick={() => setMode('token')}>
              🔑 Usar Personal Access Token
            </button>
            <div className="dim tiny center mt-4">
              Tus credenciales nunca salen de tu dispositivo.
            </div>
          </>
        )}

        {mode === 'token' && (
          <>
            <div className="field">
              <label>Personal Access Token</label>
              <input
                type="password" placeholder="ghp_…  ó  github_pat_…"
                value={token} onChange={e => setToken(e.target.value)}
                autoCorrect="off" autoCapitalize="off" spellCheck={false}
              />
              <span className="hint">Genera uno en <span className="strong">github.com → Settings → Developer settings → Personal access tokens</span></span>
            </div>
            <button className="btn btn-primary mt-2" style={{ width: '100%' }} onClick={loginWithToken} disabled={busy || !token.trim()}>
              {busy ? <span className="spinner" /> : 'Conectar'}
            </button>
            <button className="btn btn-ghost mt-2" style={{ width: '100%' }} onClick={() => openBrowser('https://github.com/settings/tokens/new?scopes=repo,workflow,gist,notifications,user,admin:org,delete_repo,write:packages&description=OctoMobile')}>
              🔗 Crear token con los scopes correctos
            </button>
            <button className="btn mt-3" style={{ width: '100%' }} onClick={() => setMode('choose')}>
              ← Volver
            </button>
          </>
        )}

        {mode === 'device' && deviceCode && (
          <>
            <div className="muted small center mt-2">
              1. Toca el botón para abrir GitHub<br/>
              2. Introduce el código que ves abajo<br/>
              3. Autoriza la app<br/>
              4. Vuelve aquí — la sesión se abrirá sola
            </div>

            <div className="code-display mt-3">{userCode}</div>

            <button className="btn btn-sm mt-2" style={{ width: '100%' }} onClick={() => copy(userCode || '')}>
              📋 Copiar código
            </button>

            <button className="btn btn-accent mt-3" style={{ width: '100%', padding: '14px' }} onClick={() => openBrowser(verifyUrl || 'https://github.com/login/device')}>
              🔗 Abrir github.com/login/device
            </button>

            <div className="loading mt-3"><span className="spinner" /> Esperando autorización…</div>

            <button className="btn btn-ghost mt-3" style={{ width: '100%' }} onClick={cancelDevice}>Cancelar</button>
          </>
        )}
      </div>
    </div>
  );
}
