// ============================================================
// Tiny stack-based router (no react-router) suited for mobile.
// Pages push onto a stack; back pops. Supports hardware back.
// ============================================================

import { createContext, useContext } from 'react';

export type Route =
  | { name: 'home' }
  | { name: 'login' }
  | { name: 'repos' }
  | { name: 'repo'; owner: string; repo: string }
  | { name: 'issues'; owner?: string; repo?: string }
  | { name: 'issue'; owner: string; repo: string; number: number }
  | { name: 'pulls'; owner?: string; repo?: string }
  | { name: 'pr'; owner: string; repo: string; number: number }
  | { name: 'branches'; owner: string; repo: string }
  | { name: 'commits'; owner: string; repo: string; ref?: string }
  | { name: 'commit'; owner: string; repo: string; sha: string }
  | { name: 'files'; owner: string; repo: string; path?: string; ref?: string }
  | { name: 'file'; owner: string; repo: string; path: string; ref?: string }
  | { name: 'edit-file'; owner: string; repo: string; path: string; sha?: string; content?: string; ref?: string }
  | { name: 'actions'; owner: string; repo: string }
  | { name: 'run'; owner: string; repo: string; runId: number }
  | { name: 'releases'; owner: string; repo: string }
  | { name: 'release'; owner: string; repo: string; id: number }
  | { name: 'gists' }
  | { name: 'gist'; id: string }
  | { name: 'edit-gist'; id?: string }
  | { name: 'notifications' }
  | { name: 'profile'; login?: string }
  | { name: 'followers'; login: string }
  | { name: 'following'; login: string }
  | { name: 'starred' }
  | { name: 'orgs' }
  | { name: 'org'; login: string }
  | { name: 'search' }
  | { name: 'settings' }
  | { name: 'about' }
  | { name: 'create-repo' }
  | { name: 'create-issue'; owner: string; repo: string }
  | { name: 'create-pr'; owner: string; repo: string }
  | { name: 'web-view'; url: string; title?: string };

export interface Router {
  current: Route;
  stack: Route[];
  push: (r: Route) => void;
  replace: (r: Route) => void;
  back: () => boolean; // returns true if popped
  reset: (r: Route) => void;
}

export const RouterCtx = createContext<Router | null>(null);
export const useRouter = (): Router => {
  const v = useContext(RouterCtx);
  if (!v) throw new Error('useRouter() outside provider');
  return v;
};
