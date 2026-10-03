# Stillroom

A private, writing-first journal built with Next.js App Router, TypeScript, Supabase PostgreSQL, the existing [UseAuth](../UseAuth) authentication service, and the existing [S3Sync](../S3Sync) file service. Stillroom has its own visual design and data model.

## What works

- Multiple journals: create, rename, reorder, archive, restore, and delete empty journals. Entries can be moved between active journals in the editor.
- Structured rich text entries with headings, lists, checklists, quotes, links, code, undo/redo, backdating, favorites, tags, and focus mode.
- Debounced autosave with a PostgreSQL revision check, a browser draft copy, retry after transient failures, and a visible conflict state.
- Today, paginated timeline, calendar, search, On This Day, media, map, templates, prompts, settings, and Trash views.
- Photos, video, audio, PDFs, and safe text documents uploaded through S3Sync. Files remain private and are checked against entry ownership before display.
- Manual place and weather context. Precise location is never collected automatically.
- JSON and Markdown exports.

## Architecture

The browser calls same-origin Next.js route handlers. These resolve the user through UseAuth's `/api/v1/auth/me`, then use that user's Supabase access token for database queries. Supabase RLS checks `auth.uid()` on every journal table. No service-role credential is used by Stillroom. Domain operations live in `src/lib/journal-service.ts`; route handlers validate requests and call those operations. Storage calls go through `src/lib/storage.ts` to S3Sync's `/api/s3/sign` API. The browser sends file bytes directly to the signed S3 URL, then finalizes and links the file to an entry.

Entry content is versioned TipTap JSON (`content_format = tiptap-json`, `content_version = 1`). `content_text` is a derived plain-text copy for search, previews, and Markdown export. `entry_date` is the UTC instant; `local_date` and `timezone` preserve the intended calendar day. `created_at` is never changed by backdating.

`src/lib/integrations/types.ts` defines provider boundaries for weather, maps, importers, exporters, and future services. The current map uses a local coordinate projection and makes no third-party map request. The core entry service is independent of vendor SDKs.

## Setup

1. Configure **the same Supabase project** in UseAuth, S3Sync, and Stillroom. UseAuth currently responds with `setup_required` at `https://use-auth-rosy.vercel.app/api/health`; sign-in will not work until its `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` are set. Follow the UseAuth README for email confirmation URLs and `APP_URL`.
2. Configure S3Sync using its README and private S3 bucket. Its deployment is `https://s3-sync.vercel.app`. Set its `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `S3_BUCKET` in **S3Sync only**. Allow the Stillroom origin in bucket CORS for direct `PUT` uploads.
3. Apply S3Sync's `supabase/migrations/20260613000000_create_files.sql` first. Then apply all Stillroom migrations in order from `supabase/migrations/`, including `20261003000500_authenticated_privileges.sql`. The first migration references `public.files`. If the first four migrations are already applied, run only the privileges migration to fix `42501 permission denied` errors.
4. Copy `.env.example` to `.env.local` and set Stillroom's `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `USEAUTH_URL`, and `S3SYNC_URL`. The example already contains the two service URLs supplied for this project. Never add service-role or AWS keys to Stillroom.
5. Run `npm ci` and `npm run dev`. Open the local URL printed by Next.js. The UseAuth deployment must be configured before using the sign-in form.

## Vercel

Import this repository as a Next.js project. Add the four Stillroom environment variables from `.env.example` for each environment. Use an HTTPS production domain. Add that domain to UseAuth's exact origin allowlist if the auth API is called directly from a browser in a later client; Stillroom currently makes server-to-server auth requests. Add the domain to the S3 bucket CORS policy for signed direct uploads. Apply migrations before opening the app to users. Run `npm run lint`, `npm test`, and `npm run build` before deployment.

## Privacy and security

UseAuth owns passwords and identity. Stillroom stores its access and refresh tokens in `HttpOnly`, `SameSite=Lax` cookies. A server request verifies the access token with UseAuth, and database operations also run under Supabase RLS. Every route that changes data checks the browser origin and resolves the user; user IDs from the browser are never accepted. Attachment streams require an owned entry and an owned S3Sync file. File content is served with `nosniff`; documents download rather than render inline. The app does not send entry contents to analytics, AI services, map services, or external fonts.

## Tests

`npm test` covers timezone-aware day grouping, backdated time conversion, leap-day behavior, and structured-content text extraction. `npm run lint`, `npm run typecheck`, and `npm run build` provide static checks. Live auth, RLS, uploads, and end-to-end persistence still require configured Supabase and S3 services; they could not be exercised against the current UseAuth deployment because its health endpoint reports missing Supabase configuration.

## Current limits

- JSON export includes every structured table and attachment reference, but not attachment binaries in a ZIP. Download files from their entries. Very large exports may exceed a Vercel function's execution limit; a background export job is the next step.
- Import UI, shared links, outbound webhooks, email-to-journal, AI, automatic weather, calendar/provider integrations, and reminder delivery are extension points, not active features. Reminder delivery is not claimed.
- Search is limited to 50 results per query. Timeline and media have bounded pagination. The map plots up to 500 manually located entries without a geographic basemap. Media does not generate thumbnails, so full-size image gallery use may be costly.
- Journal collections, tag rename/merge, template editing/duplication, and automatic S3 orphan cleanup are not exposed in the UI. Attachment deletion keeps a retry queue; its cleanup endpoint can be called by an authenticated user.
- The app is privacy-focused through access control and private S3 objects, but it does not provide end-to-end encryption. Database operators with privileged access can read journal text.
- No production deployment or live authenticated flow has been verified yet. Configure the existing services and Supabase, then run an end-to-end test before treating the app as production ready.
