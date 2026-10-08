# Syncflow Sharer

A SvelteKit app for sharing browser media (screen, camera, microphone) into sessions of a single SyncFlow project. One admin creates and ends sessions; anyone with the URL can share into an active session without logging in.

**Terms**

- **SyncFlow**: a platform for collecting multimodal learning-analytics data in real time, built on LiveKit (WebRTC). This app talks to it through `syncflow-node-client`.
- **Session**: a SyncFlow session in the configured project, backed by one LiveKit room. The room name is the session name.

## Stack and commands

SvelteKit 3 + Svelte 5 (runes), `@sveltejs/adapter-node`, Tailwind 4 + `flowbite-svelte` 1.x + `flowbite-svelte-icons`, `livekit-client` in the browser, `minio` for S3, `bcrypt` for the admin password.

Package manager is **pnpm** (version pinned in `package.json` `packageManager`; run `corepack enable`). Do not use npm or yarn or commit another lockfile.

```sh
pnpm install     # native builds are allow-listed in pnpm-workspace.yaml `allowBuilds` (bcrypt, esbuild)
pnpm dev         # vite dev server
pnpm build       # outputs ./build; `pnpm start` runs `node build` (port 3000)
pnpm check       # svelte-check type checking
pnpm exec prettier --check .   # formatting check
pnpm format      # prettier --write
pnpm check:design   # design-system checker (docs/design-rules.md)
```

If you add a dependency with an install script, add it to `allowBuilds` in `pnpm-workspace.yaml` or pnpm will skip its build. pnpm does not hoist undeclared packages, so import only what `package.json` lists.

There are no tests. After changes, run `pnpm exec prettier --check .`, `pnpm check`, `pnpm check:design` and `pnpm build`. `pnpm check` currently fails on existing issues (about 29 type errors, for example `App.Locals` has no `user` type). `pnpm check:design`, Prettier and the build pass. Do not add new errors; fix existing ones only when asked.

## Layout

- `src/hooks.server.ts`: auth guard and `locals.user`.
- `src/lib/server/syncflow-client.ts`: lazily built `ProjectClient` singleton, session filtering (`getSyncflowSharerSessions`), and the `SYNCFLOW_SHARER_SESSION_COMMENTS` marker.
- `src/lib/server/settings.ts`: in-memory admin settings singleton.
- `src/lib/server/s3-client.ts`: lazily built MinIO client.
- `src/routes/`
  - `+page` (public): pick an active session, devices, codec and presets; the `generateSessionToken` action issues a LiveKit token, then the browser navigates to `/session`.
  - `session/` (public): joins LiveKit with the token and options passed as query params, publishes tracks, then POSTs a publication record.
  - `login/`: `login` / `logout` form actions.
  - `admin/` (guarded): settings, create / end / delete sessions, pick device groups.
  - `preview/` (guarded): hidden, subscribe-only viewer for a running session; can end it.
  - `recordings/` (guarded): lists a session's egresses and gets signed media URLs.
  - `api/token` (GET, public when enabled): see below.
  - `api/publication_record` (POST, public): writes the request body to S3.

## How it actually works

**Admin auth.** `ROOT_USER` plus a bcrypt hash in `ROOT_PASSWORD`. A successful login sets an httpOnly `sessionId` cookie to a random UUID for 24h. The hook only checks that the cookie exists; the value is never stored or validated. Only the `/admin`, `/preview` and `/recordings` routes are guarded (including their form actions). Treat this as a known weakness and do not rely on it for anything stronger.

**Admin settings** live in a module-level object (`syncFlowSettings`). They are shared by every visitor, are lost on restart, and do not work across multiple instances. Fields: `enabled`, `enableAudio`, `enableCamera`, `enableScreenShare`, `recordSession`, `sessionName`, `selectedDevices`. The home page reads the audio, camera and screen-share flags; `enabled` is stored but not read anywhere outside admin.

**Sessions.** `createSession` uses the configured name, `autoRecording` from settings, `deviceGroups` from the selected devices, and sets `comments` to `"Created from SyncFlow Sharer"`. Unless `SHOW_ALL_SESSIONS === 'true'`, every session list is filtered to that comment, so changing the string hides existing sessions. "Active" means `status === 'Started'`; the public page filters to active sessions on the client. Delete goes through `projectClient.client.authorizedFetch` because the node client has no delete method; recordings and media URLs use the same escape hatch.

**Tokens.** Sharer tokens are issued with broad grants (`roomAdmin`, `roomCreate`, `roomRecord`, `ingressAdmin`, `recorder`). The preview token is hidden and subscribe-only, using `ROOT_USER` as identity.

**`GET /api/token?identity=...`** returns 401 unless `ENABLE_TOKEN_ENDPOINT === 'true'`. It takes the first started session carrying the sharer comment, and if there is none it creates one from the current settings. CORS is limited to `TOKEN_ENDPOINT_ORIGIN` when set.

**Publication records.** After `/session` publishes its tracks, it POSTs a description of them. The server writes it to `<projectName>-<projectId>/<sessionName>/publication-records/<identity>/<ISO time>/record.json` in the bucket named in the SyncFlow project details. S3 errors are logged and swallowed; the endpoint always echoes the body.

**SyncFlow client calls** return Result types (`.unwrap()`, `.map()`, `.mapAsync()`, `.unwrapOr()`, `.unwrapOrElse()`). Follow that pattern rather than try/catch around raw promises.

## Configuration

All variables are read from `process.env` at runtime (not `$env`). Booleans must be the exact string `true`.

| Variable                                                                                | Used for                                            |
| --------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `SYNCFLOW_SERVER_URL`, `SYNCFLOW_API_KEY`, `SYNCFLOW_API_SECRET`, `SYNCFLOW_PROJECT_ID` | Project client                                      |
| `ROOT_USER`                                                                             | Admin username, also the preview identity           |
| `ROOT_PASSWORD`                                                                         | bcrypt **hash** of the admin password               |
| `S3_ENDPOINT`, `S3_PORT`, `S3_USE_SSL`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`                | MinIO client for publication records                |
| `ENABLE_TOKEN_ENDPOINT`                                                                 | Turns on `/api/token`                               |
| `TOKEN_ENDPOINT_ORIGIN`                                                                 | `Access-Control-Allow-Origin` for the `/api` routes |
| `SHOW_ALL_SESSIONS`                                                                     | Show sessions not created by the sharer             |

There is no bucket variable; the bucket comes from the SyncFlow project details.

## Deployment

One project per deployment. `docker compose build && docker compose up` builds a two-stage `node:20` image (pnpm through Corepack, `pnpm install --frozen-lockfile`, then `pnpm prune --prod`) and serves on port 3000, with environment from `.env`.

CI (`.github/workflows/deploy.yaml`): every push to `main` SSHes to a Jetstream2 VM, re-clones the repo, copies `~/.env.mimesharer` to `.env`, and rebuilds and restarts the `web` service under project `mime-sharer-deployment`. A nightly job runs `docker system prune -f` there. **Pushing to `main` deploys to production.**
