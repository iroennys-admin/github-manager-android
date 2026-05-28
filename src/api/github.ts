// ============================================================
// OctoMobile · Typed wrappers for the GitHub REST API
// Reference: https://docs.github.com/en/rest
// Every wrapper accepts the singleton `gh` client.
// ============================================================

import { gh } from './client';

// ── Basic types (light, just what UI consumes) ──────────────
export interface User {
  login: string; id: number; avatar_url: string; html_url: string;
  name?: string | null; company?: string | null; blog?: string | null;
  location?: string | null; email?: string | null; bio?: string | null;
  twitter_username?: string | null; public_repos: number; public_gists: number;
  followers: number; following: number; created_at: string; updated_at: string;
  type: 'User' | 'Organization' | 'Bot';
  plan?: { name: string; space: number; collaborators: number; private_repos: number };
  two_factor_authentication?: boolean;
  total_private_repos?: number; owned_private_repos?: number;
}

export interface Repo {
  id: number; name: string; full_name: string; description?: string | null;
  owner: User; private: boolean; html_url: string; fork: boolean;
  language?: string | null; stargazers_count: number; forks_count: number;
  open_issues_count: number; watchers_count: number; default_branch: string;
  pushed_at: string; updated_at: string; created_at: string; size: number;
  archived: boolean; disabled: boolean; license?: { name: string } | null;
  topics?: string[]; visibility: 'public' | 'private' | 'internal';
  has_issues: boolean; has_projects: boolean; has_wiki: boolean;
  has_discussions?: boolean; has_pages: boolean;
  permissions?: { admin: boolean; push: boolean; pull: boolean };
}

export interface Issue {
  id: number; number: number; title: string; state: 'open' | 'closed';
  body?: string | null; user: User; labels: Label[];
  assignees: User[]; milestone?: any; comments: number;
  created_at: string; updated_at: string; closed_at?: string | null;
  html_url: string; pull_request?: any; locked: boolean;
  state_reason?: string | null; reactions?: Reactions;
  draft?: boolean;
}

export interface Label { id: number; name: string; color: string; description?: string | null; }
export interface Reactions { total_count: number; '+1': number; '-1': number; laugh: number; hooray: number; confused: number; heart: number; rocket: number; eyes: number; }

export interface PullRequest extends Issue {
  merged: boolean; mergeable?: boolean | null; merged_at?: string | null;
  merge_commit_sha?: string; rebaseable?: boolean | null;
  mergeable_state?: string; head: { ref: string; sha: string; repo: Repo | null };
  base: { ref: string; sha: string; repo: Repo };
  draft?: boolean; review_comments?: number;
  additions?: number; deletions?: number; changed_files?: number;
  requested_reviewers?: User[];
  commits?: number;
}

export interface Branch { name: string; commit: { sha: string; url: string }; protected: boolean; }

export interface Commit {
  sha: string; node_id: string; html_url: string;
  commit: { message: string; author: { name: string; email: string; date: string };
            committer: { name: string; email: string; date: string };
            comment_count: number; tree: { sha: string } };
  author?: User | null; committer?: User | null; parents: { sha: string }[];
  stats?: { additions: number; deletions: number; total: number };
  files?: FileChange[];
}

export interface FileChange {
  filename: string; status: string; additions: number; deletions: number;
  changes: number; patch?: string; sha?: string; blob_url?: string; raw_url?: string;
  previous_filename?: string;
}

export interface ContentEntry {
  name: string; path: string; sha: string; size: number;
  type: 'file' | 'dir' | 'symlink' | 'submodule';
  url: string; html_url: string; download_url: string | null;
  content?: string; encoding?: string;
}

export interface Notification {
  id: string; unread: boolean; reason: string; updated_at: string; last_read_at?: string | null;
  subject: { title: string; url: string; latest_comment_url: string | null; type: string };
  repository: Repo;
}

export interface Gist {
  id: string; description?: string | null; public: boolean;
  html_url: string; created_at: string; updated_at: string;
  files: Record<string, { filename: string; type: string; language?: string; raw_url: string; size: number; content?: string }>;
  owner: User; comments: number;
}

export interface WorkflowRun {
  id: number; name: string; head_branch: string; head_sha: string;
  run_number: number; event: string; status: string; conclusion: string | null;
  workflow_id: number; url: string; html_url: string;
  created_at: string; updated_at: string; run_started_at: string;
  actor: User; head_commit: { id: string; message: string; author: { name: string } };
}

export interface Workflow {
  id: number; name: string; path: string; state: string; created_at: string; updated_at: string; html_url: string;
}

export interface Release {
  id: number; tag_name: string; name: string | null; body: string | null;
  draft: boolean; prerelease: boolean; created_at: string; published_at: string | null;
  html_url: string; tarball_url: string; zipball_url: string;
  assets: { id: number; name: string; size: number; download_count: number; browser_download_url: string; content_type: string }[];
  author: User;
}

export interface Tag { name: string; commit: { sha: string }; zipball_url: string; tarball_url: string; }

export interface Organization extends User { description?: string | null; }

// ════════════════════════════════════════════════════════════
// USERS / AUTH
// ════════════════════════════════════════════════════════════
export const auth = {
  me: () => gh.get<User>('/user'),
  myEmails: () => gh.get<{ email: string; primary: boolean; verified: boolean; visibility?: string }[]>('/user/emails'),
  user: (login: string) => gh.get<User>(`/users/${login}`),
  searchUsers: (q: string, perPage = 30) => gh.get<{ items: User[]; total_count: number }>(`/search/users`, { q, per_page: perPage }),
};

// ════════════════════════════════════════════════════════════
// REPOS
// ════════════════════════════════════════════════════════════
export const repos = {
  /** Repos for the authenticated user (works on private too). */
  myRepos: (opts: { sort?: 'created'|'updated'|'pushed'|'full_name'; direction?: 'asc'|'desc'; visibility?: 'all'|'public'|'private'; affiliation?: string; type?: string; per_page?: number; page?: number } = {}) =>
    gh.get<Repo[]>('/user/repos', { sort: 'updated', direction: 'desc', per_page: 30, ...opts }),

  paginated: (opts: { sort?: string; visibility?: string; affiliation?: string; per_page?: number; page?: number } = {}) =>
    gh.page<Repo>('/user/repos', { sort: 'updated', direction: 'desc', ...opts }, opts.per_page ?? 30),

  userRepos: (login: string, perPage = 30) => gh.get<Repo[]>(`/users/${login}/repos`, { per_page: perPage, sort: 'updated' }),

  get: (owner: string, repo: string) => gh.get<Repo>(`/repos/${owner}/${repo}`),

  create: (body: { name: string; description?: string; private?: boolean; auto_init?: boolean; gitignore_template?: string; license_template?: string; has_issues?: boolean; has_wiki?: boolean }) =>
    gh.post<Repo>('/user/repos', body),

  createInOrg: (org: string, body: any) => gh.post<Repo>(`/orgs/${org}/repos`, body),

  update: (owner: string, repo: string, body: any) => gh.patch<Repo>(`/repos/${owner}/${repo}`, body),

  delete: (owner: string, repo: string) => gh.delete(`/repos/${owner}/${repo}`),

  fork: (owner: string, repo: string, body?: { organization?: string; name?: string }) =>
    gh.post<Repo>(`/repos/${owner}/${repo}/forks`, body || {}),

  star: (owner: string, repo: string) => gh.put(`/user/starred/${owner}/${repo}`, ''),
  unstar: (owner: string, repo: string) => gh.delete(`/user/starred/${owner}/${repo}`),
  isStarred: async (owner: string, repo: string) => {
    try { await gh.request(`/user/starred/${owner}/${repo}`, { method: 'GET', raw: true }); return true; }
    catch (e: any) { if (e.status === 404) return false; throw e; }
  },

  watch: (owner: string, repo: string) => gh.put(`/repos/${owner}/${repo}/subscription`, { subscribed: true, ignored: false }),
  unwatch: (owner: string, repo: string) => gh.delete(`/repos/${owner}/${repo}/subscription`),

  starredByMe: (perPage = 30) => gh.get<Repo[]>('/user/starred', { per_page: perPage, sort: 'updated' }),
  watchedByMe: (perPage = 30) => gh.get<Repo[]>('/user/subscriptions', { per_page: perPage }),

  topics: (owner: string, repo: string) => gh.get<{ names: string[] }>(`/repos/${owner}/${repo}/topics`),
  setTopics: (owner: string, repo: string, names: string[]) => gh.put<{ names: string[] }>(`/repos/${owner}/${repo}/topics`, { names }),

  languages: (owner: string, repo: string) => gh.get<Record<string, number>>(`/repos/${owner}/${repo}/languages`),
  collaborators: (owner: string, repo: string) => gh.get<User[]>(`/repos/${owner}/${repo}/collaborators`),
  contributors: (owner: string, repo: string, perPage = 30) => gh.get<User[]>(`/repos/${owner}/${repo}/contributors`, { per_page: perPage }),

  readme: (owner: string, repo: string) => gh.get<ContentEntry>(`/repos/${owner}/${repo}/readme`),

  search: (q: string, opts: { sort?: 'stars'|'forks'|'help-wanted-issues'|'updated'; order?: 'asc'|'desc'; per_page?: number; page?: number } = {}) =>
    gh.get<{ total_count: number; items: Repo[] }>('/search/repositories', { q, per_page: 30, ...opts }),
};

// ════════════════════════════════════════════════════════════
// BRANCHES / COMMITS / FILES
// ════════════════════════════════════════════════════════════
export const git = {
  branches: (owner: string, repo: string, perPage = 100) => gh.get<Branch[]>(`/repos/${owner}/${repo}/branches`, { per_page: perPage }),
  branch: (owner: string, repo: string, branch: string) => gh.get(`/repos/${owner}/${repo}/branches/${encodeURIComponent(branch)}`),

  /** Create a branch from an existing commit SHA. */
  createBranch: (owner: string, repo: string, name: string, sha: string) =>
    gh.post(`/repos/${owner}/${repo}/git/refs`, { ref: `refs/heads/${name}`, sha }),

  deleteBranch: (owner: string, repo: string, name: string) =>
    gh.delete(`/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(name)}`),

  commits: (owner: string, repo: string, opts: { sha?: string; path?: string; author?: string; since?: string; until?: string; per_page?: number; page?: number } = {}) =>
    gh.get<Commit[]>(`/repos/${owner}/${repo}/commits`, { per_page: 30, ...opts }),

  commit: (owner: string, repo: string, sha: string) =>
    gh.get<Commit>(`/repos/${owner}/${repo}/commits/${sha}`),

  compare: (owner: string, repo: string, base: string, head: string) =>
    gh.get<{ status: string; ahead_by: number; behind_by: number; total_commits: number; commits: Commit[]; files: FileChange[] }>(`/repos/${owner}/${repo}/compare/${base}...${head}`),

  tags: (owner: string, repo: string, perPage = 30) => gh.get<Tag[]>(`/repos/${owner}/${repo}/tags`, { per_page: perPage }),

  // ─ Contents ─
  contents: (owner: string, repo: string, path = '', ref?: string) =>
    gh.get<ContentEntry | ContentEntry[]>(
      `/repos/${owner}/${repo}/contents/${encodeURI(path).replace(/#/g, '%23')}`,
      ref ? { ref } : {}
    ),

  /** Create or update a file (auto base64 if `content` is plain text). */
  putFile: (owner: string, repo: string, path: string, body: {
    message: string; content: string; sha?: string; branch?: string;
    committer?: { name: string; email: string }; author?: { name: string; email: string };
    /** if true (default), `content` is treated as UTF-8 and base64-encoded for you */
    encode?: boolean;
  }) => {
    const encoded = body.encode === false ? body.content : btoa(unescape(encodeURIComponent(body.content)));
    return gh.put(
      `/repos/${owner}/${repo}/contents/${encodeURI(path).replace(/#/g, '%23')}`,
      { ...body, content: encoded, encode: undefined },
    );
  },

  deleteFile: (owner: string, repo: string, path: string, body: { message: string; sha: string; branch?: string; committer?: any; author?: any }) =>
    gh.delete(`/repos/${owner}/${repo}/contents/${encodeURI(path).replace(/#/g, '%23')}`, body),

  /** Decode the base64 content of a file blob to UTF-8 string. */
  decodeContent: (entry: ContentEntry): string => {
    if (!entry.content) return '';
    const raw = entry.content.replace(/\n/g, '');
    try { return decodeURIComponent(escape(atob(raw))); } catch { return atob(raw); }
  },
};

// ════════════════════════════════════════════════════════════
// ISSUES
// ════════════════════════════════════════════════════════════
export const issues = {
  list: (owner: string, repo: string, opts: { state?: 'open'|'closed'|'all'; labels?: string; sort?: string; direction?: string; per_page?: number; page?: number; assignee?: string; creator?: string; milestone?: string|number; since?: string } = {}) =>
    gh.get<Issue[]>(`/repos/${owner}/${repo}/issues`, { state: 'open', per_page: 30, sort: 'updated', direction: 'desc', ...opts }),

  myIssues: (opts: { filter?: 'assigned'|'created'|'mentioned'|'subscribed'|'repos'|'all'; state?: 'open'|'closed'|'all'; per_page?: number } = {}) =>
    gh.get<Issue[]>('/issues', { filter: 'assigned', state: 'open', per_page: 30, ...opts }),

  get: (owner: string, repo: string, number: number) => gh.get<Issue>(`/repos/${owner}/${repo}/issues/${number}`),

  create: (owner: string, repo: string, body: { title: string; body?: string; assignees?: string[]; labels?: string[]; milestone?: number }) =>
    gh.post<Issue>(`/repos/${owner}/${repo}/issues`, body),

  update: (owner: string, repo: string, n: number, body: Partial<{ title: string; body: string; state: 'open'|'closed'; assignees: string[]; labels: string[]; milestone: number | null; state_reason: 'completed'|'not_planned'|'reopened' }>) =>
    gh.patch<Issue>(`/repos/${owner}/${repo}/issues/${n}`, body),

  close: (owner: string, repo: string, n: number, reason: 'completed'|'not_planned' = 'completed') =>
    issues.update(owner, repo, n, { state: 'closed', state_reason: reason }),

  reopen: (owner: string, repo: string, n: number) =>
    issues.update(owner, repo, n, { state: 'open', state_reason: 'reopened' }),

  lock: (owner: string, repo: string, n: number, reason?: 'off-topic'|'too heated'|'resolved'|'spam') =>
    gh.put(`/repos/${owner}/${repo}/issues/${n}/lock`, reason ? { lock_reason: reason } : {}),
  unlock: (owner: string, repo: string, n: number) => gh.delete(`/repos/${owner}/${repo}/issues/${n}/lock`),

  // Comments
  comments: (owner: string, repo: string, n: number, perPage = 100) =>
    gh.get<{ id: number; body: string; user: User; created_at: string; updated_at: string; html_url: string; reactions?: Reactions }[]>(
      `/repos/${owner}/${repo}/issues/${n}/comments`, { per_page: perPage }),

  comment: (owner: string, repo: string, n: number, body: string) =>
    gh.post(`/repos/${owner}/${repo}/issues/${n}/comments`, { body }),

  updateComment: (owner: string, repo: string, commentId: number, body: string) =>
    gh.patch(`/repos/${owner}/${repo}/issues/comments/${commentId}`, { body }),

  deleteComment: (owner: string, repo: string, commentId: number) =>
    gh.delete(`/repos/${owner}/${repo}/issues/comments/${commentId}`),

  // Labels
  labels: (owner: string, repo: string) => gh.get<Label[]>(`/repos/${owner}/${repo}/labels`, { per_page: 100 }),
  createLabel: (owner: string, repo: string, body: { name: string; color: string; description?: string }) =>
    gh.post<Label>(`/repos/${owner}/${repo}/labels`, body),
  deleteLabel: (owner: string, repo: string, name: string) =>
    gh.delete(`/repos/${owner}/${repo}/labels/${encodeURIComponent(name)}`),

  addLabels: (owner: string, repo: string, n: number, labels: string[]) =>
    gh.post<Label[]>(`/repos/${owner}/${repo}/issues/${n}/labels`, { labels }),
  removeLabel: (owner: string, repo: string, n: number, name: string) =>
    gh.delete(`/repos/${owner}/${repo}/issues/${n}/labels/${encodeURIComponent(name)}`),
  setLabels: (owner: string, repo: string, n: number, labels: string[]) =>
    gh.put<Label[]>(`/repos/${owner}/${repo}/issues/${n}/labels`, { labels }),

  assign: (owner: string, repo: string, n: number, assignees: string[]) =>
    gh.post(`/repos/${owner}/${repo}/issues/${n}/assignees`, { assignees }),
  unassign: (owner: string, repo: string, n: number, assignees: string[]) =>
    gh.delete(`/repos/${owner}/${repo}/issues/${n}/assignees`, { assignees }),

  search: (q: string, opts: { sort?: 'comments'|'reactions'|'updated'|'created'; order?: 'asc'|'desc'; per_page?: number } = {}) =>
    gh.get<{ items: Issue[]; total_count: number }>('/search/issues', { q, per_page: 30, ...opts }),
};

// ════════════════════════════════════════════════════════════
// PULL REQUESTS
// ════════════════════════════════════════════════════════════
export const pulls = {
  list: (owner: string, repo: string, opts: { state?: 'open'|'closed'|'all'; head?: string; base?: string; sort?: string; direction?: string; per_page?: number } = {}) =>
    gh.get<PullRequest[]>(`/repos/${owner}/${repo}/pulls`, { state: 'open', per_page: 30, sort: 'updated', direction: 'desc', ...opts }),

  get: (owner: string, repo: string, n: number) => gh.get<PullRequest>(`/repos/${owner}/${repo}/pulls/${n}`),

  create: (owner: string, repo: string, body: { title: string; head: string; base: string; body?: string; draft?: boolean; maintainer_can_modify?: boolean }) =>
    gh.post<PullRequest>(`/repos/${owner}/${repo}/pulls`, body),

  update: (owner: string, repo: string, n: number, body: Partial<{ title: string; body: string; state: 'open'|'closed'; base: string; maintainer_can_modify: boolean }>) =>
    gh.patch<PullRequest>(`/repos/${owner}/${repo}/pulls/${n}`, body),

  merge: (owner: string, repo: string, n: number, body?: { commit_title?: string; commit_message?: string; sha?: string; merge_method?: 'merge'|'squash'|'rebase' }) =>
    gh.put<{ sha: string; merged: boolean; message: string }>(`/repos/${owner}/${repo}/pulls/${n}/merge`, body || {}),

  files: (owner: string, repo: string, n: number, perPage = 100) =>
    gh.get<FileChange[]>(`/repos/${owner}/${repo}/pulls/${n}/files`, { per_page: perPage }),

  commits: (owner: string, repo: string, n: number) =>
    gh.get<Commit[]>(`/repos/${owner}/${repo}/pulls/${n}/commits`),

  reviews: (owner: string, repo: string, n: number) =>
    gh.get<any[]>(`/repos/${owner}/${repo}/pulls/${n}/reviews`),

  requestReviewers: (owner: string, repo: string, n: number, body: { reviewers?: string[]; team_reviewers?: string[] }) =>
    gh.post(`/repos/${owner}/${repo}/pulls/${n}/requested_reviewers`, body),

  removeReviewers: (owner: string, repo: string, n: number, body: { reviewers?: string[]; team_reviewers?: string[] }) =>
    gh.delete(`/repos/${owner}/${repo}/pulls/${n}/requested_reviewers`, body),

  createReview: (owner: string, repo: string, n: number, body: { body?: string; event: 'APPROVE'|'REQUEST_CHANGES'|'COMMENT'; comments?: any[] }) =>
    gh.post(`/repos/${owner}/${repo}/pulls/${n}/reviews`, body),

  search: (q: string, opts: any = {}) => issues.search(`${q} type:pr`, opts),
};

// ════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ════════════════════════════════════════════════════════════
export const notifications = {
  list: (opts: { all?: boolean; participating?: boolean; since?: string; before?: string; per_page?: number; page?: number } = {}) =>
    gh.get<Notification[]>('/notifications', { per_page: 50, ...opts }),

  markAllRead: (last_read_at?: string) => gh.put('/notifications', { last_read_at: last_read_at || new Date().toISOString(), read: true }),

  markRead: (id: string) => gh.patch(`/notifications/threads/${id}`),

  unsubscribe: (id: string) => gh.delete(`/notifications/threads/${id}/subscription`),

  thread: (id: string) => gh.get(`/notifications/threads/${id}`),
};

// ════════════════════════════════════════════════════════════
// GISTS
// ════════════════════════════════════════════════════════════
export const gists = {
  mine: (perPage = 30) => gh.get<Gist[]>('/gists', { per_page: perPage }),
  starred: (perPage = 30) => gh.get<Gist[]>('/gists/starred', { per_page: perPage }),
  user: (login: string) => gh.get<Gist[]>(`/users/${login}/gists`),
  get: (id: string) => gh.get<Gist>(`/gists/${id}`),
  create: (body: { description?: string; public: boolean; files: Record<string, { content: string }> }) =>
    gh.post<Gist>('/gists', body),
  update: (id: string, body: { description?: string; files?: Record<string, { content?: string; filename?: string } | null> }) =>
    gh.patch<Gist>(`/gists/${id}`, body),
  delete: (id: string) => gh.delete(`/gists/${id}`),
  star: (id: string) => gh.put(`/gists/${id}/star`, ''),
  unstar: (id: string) => gh.delete(`/gists/${id}/star`),
  fork: (id: string) => gh.post<Gist>(`/gists/${id}/forks`),
  comments: (id: string) => gh.get<{ id: number; body: string; user: User; created_at: string }[]>(`/gists/${id}/comments`),
  comment: (id: string, body: string) => gh.post(`/gists/${id}/comments`, { body }),
};

// ════════════════════════════════════════════════════════════
// ACTIONS / WORKFLOWS
// ════════════════════════════════════════════════════════════
export const actions = {
  workflows: (owner: string, repo: string) =>
    gh.get<{ total_count: number; workflows: Workflow[] }>(`/repos/${owner}/${repo}/actions/workflows`),

  runs: (owner: string, repo: string, opts: { workflow_id?: number|string; branch?: string; event?: string; status?: string; per_page?: number; page?: number } = {}) => {
    const path = opts.workflow_id != null
      ? `/repos/${owner}/${repo}/actions/workflows/${opts.workflow_id}/runs`
      : `/repos/${owner}/${repo}/actions/runs`;
    const { workflow_id, ...q } = opts;
    return gh.get<{ total_count: number; workflow_runs: WorkflowRun[] }>(path, { per_page: 30, ...q });
  },

  run: (owner: string, repo: string, runId: number) => gh.get<WorkflowRun>(`/repos/${owner}/${repo}/actions/runs/${runId}`),

  jobs: (owner: string, repo: string, runId: number) =>
    gh.get<{ total_count: number; jobs: any[] }>(`/repos/${owner}/${repo}/actions/runs/${runId}/jobs`),

  rerun: (owner: string, repo: string, runId: number) => gh.post(`/repos/${owner}/${repo}/actions/runs/${runId}/rerun`),
  rerunFailed: (owner: string, repo: string, runId: number) => gh.post(`/repos/${owner}/${repo}/actions/runs/${runId}/rerun-failed-jobs`),
  cancel: (owner: string, repo: string, runId: number) => gh.post(`/repos/${owner}/${repo}/actions/runs/${runId}/cancel`),
  deleteRun: (owner: string, repo: string, runId: number) => gh.delete(`/repos/${owner}/${repo}/actions/runs/${runId}`),

  dispatch: (owner: string, repo: string, workflow_id: number|string, body: { ref: string; inputs?: Record<string, any> }) =>
    gh.post(`/repos/${owner}/${repo}/actions/workflows/${workflow_id}/dispatches`, body),

  /** Returns the raw log file URL (a redirect that yields a zip). */
  logs: (owner: string, repo: string, runId: number) =>
    gh.request<Response>(`/repos/${owner}/${repo}/actions/runs/${runId}/logs`, { method: 'GET', raw: true }),

  artifacts: (owner: string, repo: string, runId: number) =>
    gh.get<{ total_count: number; artifacts: any[] }>(`/repos/${owner}/${repo}/actions/runs/${runId}/artifacts`),

  // Secrets and Variables (repo)
  secrets: (owner: string, repo: string) => gh.get<{ secrets: { name: string; created_at: string; updated_at: string }[] }>(`/repos/${owner}/${repo}/actions/secrets`),
  deleteSecret: (owner: string, repo: string, name: string) => gh.delete(`/repos/${owner}/${repo}/actions/secrets/${name}`),
  variables: (owner: string, repo: string) => gh.get<{ variables: { name: string; value: string }[] }>(`/repos/${owner}/${repo}/actions/variables`),
  setVariable: (owner: string, repo: string, name: string, value: string) =>
    gh.post(`/repos/${owner}/${repo}/actions/variables`, { name, value }),
  deleteVariable: (owner: string, repo: string, name: string) => gh.delete(`/repos/${owner}/${repo}/actions/variables/${name}`),
};

// ════════════════════════════════════════════════════════════
// RELEASES
// ════════════════════════════════════════════════════════════
export const releases = {
  list: (owner: string, repo: string, perPage = 30) =>
    gh.get<Release[]>(`/repos/${owner}/${repo}/releases`, { per_page: perPage }),
  latest: (owner: string, repo: string) => gh.get<Release>(`/repos/${owner}/${repo}/releases/latest`),
  get: (owner: string, repo: string, id: number) => gh.get<Release>(`/repos/${owner}/${repo}/releases/${id}`),
  create: (owner: string, repo: string, body: { tag_name: string; target_commitish?: string; name?: string; body?: string; draft?: boolean; prerelease?: boolean; generate_release_notes?: boolean }) =>
    gh.post<Release>(`/repos/${owner}/${repo}/releases`, body),
  update: (owner: string, repo: string, id: number, body: any) => gh.patch<Release>(`/repos/${owner}/${repo}/releases/${id}`, body),
  delete: (owner: string, repo: string, id: number) => gh.delete(`/repos/${owner}/${repo}/releases/${id}`),
};

// ════════════════════════════════════════════════════════════
// ORGANIZATIONS / TEAMS
// ════════════════════════════════════════════════════════════
export const orgs = {
  mine: (perPage = 30) => gh.get<Organization[]>('/user/orgs', { per_page: perPage }),
  get: (login: string) => gh.get<Organization>(`/orgs/${login}`),
  members: (login: string, perPage = 30) => gh.get<User[]>(`/orgs/${login}/members`, { per_page: perPage }),
  repos: (login: string, perPage = 30) => gh.get<Repo[]>(`/orgs/${login}/repos`, { per_page: perPage, sort: 'updated' }),
  teams: (login: string) => gh.get<{ id: number; name: string; slug: string; description?: string }[]>(`/orgs/${login}/teams`),
};

// ════════════════════════════════════════════════════════════
// FOLLOWING / FOLLOWERS
// ════════════════════════════════════════════════════════════
export const social = {
  followers: (perPage = 30) => gh.get<User[]>('/user/followers', { per_page: perPage }),
  following: (perPage = 30) => gh.get<User[]>('/user/following', { per_page: perPage }),
  userFollowers: (login: string, perPage = 30) => gh.get<User[]>(`/users/${login}/followers`, { per_page: perPage }),
  userFollowing: (login: string, perPage = 30) => gh.get<User[]>(`/users/${login}/following`, { per_page: perPage }),
  isFollowing: async (login: string) => {
    try { await gh.request(`/user/following/${login}`, { method: 'GET', raw: true }); return true; }
    catch (e: any) { if (e.status === 404) return false; throw e; }
  },
  follow: (login: string) => gh.put(`/user/following/${login}`, ''),
  unfollow: (login: string) => gh.delete(`/user/following/${login}`),
  myStarred: (perPage = 30) => gh.get<Repo[]>('/user/starred', { per_page: perPage }),
};

// ════════════════════════════════════════════════════════════
// SEARCH
// ════════════════════════════════════════════════════════════
export const search = {
  repos: (q: string, opts: any = {}) => repos.search(q, opts),
  issues: (q: string, opts: any = {}) => issues.search(q, opts),
  users: (q: string, perPage = 30) => auth.searchUsers(q, perPage),
  code: (q: string, opts: any = {}) => gh.get('/search/code', { q, per_page: 30, ...opts }),
  commits: (q: string, opts: any = {}) => gh.get('/search/commits', { q, per_page: 30, ...opts }),
  topics: (q: string) => gh.get('/search/topics', { q }),
};

// ════════════════════════════════════════════════════════════
// EVENTS / ACTIVITY (feed)
// ════════════════════════════════════════════════════════════
export const events = {
  received: (login: string, perPage = 30) => gh.get<any[]>(`/users/${login}/received_events`, { per_page: perPage }),
  performed: (login: string, perPage = 30) => gh.get<any[]>(`/users/${login}/events`, { per_page: perPage }),
  public: (perPage = 30) => gh.get<any[]>('/events', { per_page: perPage }),
  repo: (owner: string, repo: string, perPage = 30) => gh.get<any[]>(`/repos/${owner}/${repo}/events`, { per_page: perPage }),
};

// ════════════════════════════════════════════════════════════
// MISC
// ════════════════════════════════════════════════════════════
export const misc = {
  rateLimit: () => gh.get<{ rate: any; resources: any }>('/rate_limit'),
  gitignoreTemplates: () => gh.get<string[]>('/gitignore/templates'),
  gitignoreTemplate: (name: string) => gh.get<{ name: string; source: string }>(`/gitignore/templates/${name}`),
  licenses: () => gh.get<{ key: string; name: string; spdx_id: string }[]>('/licenses'),
  license: (key: string) => gh.get<{ key: string; name: string; body: string }>(`/licenses/${key}`),
  emojis: () => gh.get<Record<string, string>>('/emojis'),
  markdown: (text: string, mode: 'markdown'|'gfm' = 'gfm', context?: string) =>
    gh.request<string>('/markdown', { method: 'POST', body: { text, mode, context } as any, accept: 'text/html' }),
  meta: () => gh.get('/meta'),
};
