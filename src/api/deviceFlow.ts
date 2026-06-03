// ============================================================
// OctoMobile · GitHub OAuth Device Flow
// ------------------------------------------------------------
// Requires only a public client_id — NO backend, NO secret.
// We use the official "GitHub CLI" client_id (widely used by
// CLI tools) but the user can override it in Settings.
// Reference: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#device-flow
// ============================================================

// Default: GitHub CLI's public client id (it's public, hard-coded everywhere).
// Allows requesting any scope the user wants.
export const DEFAULT_CLIENT_ID = '178c6fc778ccc68e1d6a';

export interface DeviceCodeStart {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export interface DeviceCodePoll {
  access_token?: string;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
  interval?: number;
}

const DEFAULT_SCOPES = [
  'repo', 'workflow', 'write:packages', 'delete:packages',
  'admin:org', 'admin:public_key', 'admin:repo_hook', 'admin:org_hook',
  'gist', 'notifications', 'user', 'delete_repo', 'write:discussion',
  'admin:enterprise', 'read:project', 'project', 'admin:gpg_key',
];

export async function startDeviceFlow(clientId = DEFAULT_CLIENT_ID, scopes = DEFAULT_SCOPES): Promise<DeviceCodeStart> {
  const r = await fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, scope: scopes.join(' ') }),
  });
  if (!r.ok) throw new Error(`Device flow start failed: HTTP ${r.status}`);
  return r.json();
}

export async function pollDeviceFlow(clientId: string, deviceCode: string): Promise<DeviceCodePoll> {
  const r = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      device_code: deviceCode,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    }),
  });
  return r.json();
}

/**
 * Polls until the user completes authorization, then resolves with the token.
 * `onProgress` gets called when the user code is first shown.
 */
export async function awaitDeviceAuth(
  clientId: string,
  deviceCode: string,
  intervalSec: number,
  signal?: AbortSignal,
): Promise<string> {
  let interval = Math.max(5, intervalSec || 5);
  for (;;) {
    if (signal?.aborted) throw new Error('aborted');
    await new Promise((res) => setTimeout(res, interval * 1000));
    const poll = await pollDeviceFlow(clientId, deviceCode);
    if (poll.access_token) return poll.access_token;
    if (poll.error === 'authorization_pending') continue;
    if (poll.error === 'slow_down') { interval += 5; continue; }
    if (poll.error === 'expired_token') throw new Error('Device code expired. Please restart login.');
    if (poll.error === 'access_denied') throw new Error('Authorization denied by user.');
    if (poll.error) throw new Error(`${poll.error}: ${poll.error_description || ''}`);
  }
}
