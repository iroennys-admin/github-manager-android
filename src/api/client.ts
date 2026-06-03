// ============================================================
// OctoMobile · GitHub REST API client
// ------------------------------------------------------------
// Handles:
//   • Authentication via Personal Access Token (classic or
//     fine-grained) AND OAuth Device Flow (no backend needed)
//   • All HTTP verbs with sane defaults
//   • Automatic JSON parse, error wrapping, rate-limit info
//   • Cursor and link-header pagination helpers
//   • Streaming download/blob helpers
// ============================================================

export const GITHUB_API = 'https://api.github.com';
export const GITHUB_WEB = 'https://github.com';
export const ACCEPT_DEFAULT = 'application/vnd.github+json';
export const API_VERSION = '2022-11-28';

export interface RateLimit {
  limit: number;
  remaining: number;
  reset: number; // epoch
  used: number;
}

export interface GhError extends Error {
  status: number;
  body?: any;
  isAuth?: boolean;
  isRateLimit?: boolean;
}

export class GitHubClient {
  token: string | null;
  baseUrl: string;
  /** Most recent rate-limit snapshot from response headers */
  lastRate: RateLimit | null = null;

  constructor(token: string | null = null, baseUrl: string = GITHUB_API) {
    this.token = token;
    this.baseUrl = baseUrl;
  }

  setToken(t: string | null) { this.token = t; }
  hasToken() { return !!this.token; }

  // ─────────────────────────────────────────────────────────
  // Core request
  // ─────────────────────────────────────────────────────────
  async request<T = any>(
    path: string,
    init: RequestInit & { query?: Record<string, any>; accept?: string; raw?: boolean } = {},
  ): Promise<T> {
    const { query, accept = ACCEPT_DEFAULT, raw, headers, ...rest } = init;

    let url = path.startsWith('http') ? path : `${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    if (query) {
      const usp = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) {
        if (v === undefined || v === null) continue;
        if (Array.isArray(v)) v.forEach((x) => usp.append(k, String(x)));
        else usp.set(k, String(v));
      }
      const q = usp.toString();
      if (q) url += (url.includes('?') ? '&' : '?') + q;
    }

    const reqHeaders: Record<string, string> = {
      Accept: accept,
      'X-GitHub-Api-Version': API_VERSION,
      ...(headers as any),
    };
    if (this.token) reqHeaders.Authorization = `Bearer ${this.token}`;
    if (init.body && typeof init.body === 'object' && !(init.body instanceof FormData)
        && !(init.body instanceof Blob) && !(init.body instanceof ArrayBuffer)
        && typeof init.body !== 'string') {
      reqHeaders['Content-Type'] = 'application/json';
      (rest as any).body = JSON.stringify(init.body);
    }

    const resp = await fetch(url, { ...rest, headers: reqHeaders });

    // Capture rate-limit headers
    const limit = resp.headers.get('x-ratelimit-limit');
    if (limit) {
      this.lastRate = {
        limit: Number(limit),
        remaining: Number(resp.headers.get('x-ratelimit-remaining') || 0),
        reset: Number(resp.headers.get('x-ratelimit-reset') || 0),
        used: Number(resp.headers.get('x-ratelimit-used') || 0),
      };
    }

    if (resp.status === 204) return undefined as any;
    if (raw) return resp as any;

    const ct = resp.headers.get('content-type') || '';
    const isJson = ct.includes('application/json');
    const data = isJson ? await resp.json().catch(() => undefined) : await resp.text();

    if (!resp.ok) {
      const err: GhError = Object.assign(new Error(
        (data && data.message) ? data.message : `HTTP ${resp.status}`
      ), {
        status: resp.status, body: data,
        isAuth: resp.status === 401,
        isRateLimit: resp.status === 403 && this.lastRate?.remaining === 0,
      });
      throw err;
    }

    return data as T;
  }

  get<T = any>(p: string, q?: Record<string, any>) { return this.request<T>(p, { method: 'GET', query: q }); }
  post<T = any>(p: string, body?: any, q?: Record<string, any>) { return this.request<T>(p, { method: 'POST', body, query: q }); }
  put<T = any>(p: string, body?: any) { return this.request<T>(p, { method: 'PUT', body }); }
  patch<T = any>(p: string, body?: any) { return this.request<T>(p, { method: 'PATCH', body }); }
  delete<T = any>(p: string, body?: any) { return this.request<T>(p, { method: 'DELETE', body }); }

  // ─────────────────────────────────────────────────────────
  // Pagination helpers
  // ─────────────────────────────────────────────────────────

  /** Fetch one page; returns the items and the next-url (or null). */
  async page<T = any>(path: string, query: Record<string, any> = {}, perPage = 30):
      Promise<{ items: T[]; next: string | null; resp: any }> {
    const url = path.startsWith('http')
      ? path
      : `${this.baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;

    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) usp.set(k, String(v));
    }
    if (!usp.has('per_page')) usp.set('per_page', String(perPage));
    const full = url + (url.includes('?') ? '&' : '?') + usp.toString();

    const headers: Record<string, string> = {
      Accept: ACCEPT_DEFAULT,
      'X-GitHub-Api-Version': API_VERSION,
    };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;

    const resp = await fetch(full, { headers });
    if (!resp.ok) {
      const body = await resp.text();
      let parsed: any; try { parsed = JSON.parse(body); } catch {}
      const err: GhError = Object.assign(new Error(parsed?.message || `HTTP ${resp.status}`), {
        status: resp.status, body: parsed,
        isAuth: resp.status === 401,
        isRateLimit: resp.status === 403,
      });
      throw err;
    }
    const items: T[] = await resp.json();
    const next = parseNextLink(resp.headers.get('link'));
    return { items, next, resp };
  }

  /** Iterate up to maxPages of results, concatenated. */
  async paginate<T = any>(path: string, query: Record<string, any> = {}, perPage = 100, maxPages = 10): Promise<T[]> {
    const all: T[] = [];
    let next: string | null = path;
    let i = 0;
    let q = query;
    while (next && i < maxPages) {
      const { items, next: nx } = await this.page<T>(next, i === 0 ? q : {}, perPage);
      all.push(...items);
      next = nx;
      q = {};
      i++;
    }
    return all;
  }
}

function parseNextLink(link: string | null): string | null {
  if (!link) return null;
  const parts = link.split(',');
  for (const p of parts) {
    const m = p.match(/<([^>]+)>;\s*rel="next"/);
    if (m) return m[1];
  }
  return null;
}

// ─────────────────────────────────────────────────────────
// Singleton (set up by AuthProvider)
// ─────────────────────────────────────────────────────────
export const gh = new GitHubClient();
