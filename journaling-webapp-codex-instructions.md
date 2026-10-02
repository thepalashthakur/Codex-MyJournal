# Codex Build Instructions — Personal Journaling Web App

## Objective

Build a production-ready, privacy-focused personal journaling web application using **Next.js App Router + TypeScript**, designed for deployment on **Vercel**.

The product should provide the major journaling capabilities users expect from mature products such as Day One while remaining an independent application with its own branding, UI, architecture, data model, and integration layer.

Reference product:
https://dayoneapp.com/features/

Use public Day One functionality only as product inspiration. Do not copy proprietary branding, text, UI, assets, or implementation.

The architecture must support future integrations without requiring major changes to the core journal domain.

Potential future integrations include:

- mobile applications
- browser extensions
- email-to-journal
- calendar providers
- health/activity providers
- location providers
- weather providers
- automation platforms
- webhooks
- public/private APIs
- importers
- exporters
- AI features
- third-party storage providers
- external publishing/sharing services

---

# 1. Existing Infrastructure

Two existing local repositories/services must be inspected and reused.

## Existing User Authentication

Repository:

```text
/Users/p/Github/UseAuth/
```

Known path supplied by the user:

```text
/Users/p/Github/UseAuth/eslint.config.mjs
```

The ESLint file is only a known file inside the repository. Do not interpret it as the authentication API.

Before implementing authentication:

1. Inspect `/Users/p/Github/UseAuth/`.
2. Read its README/documentation.
3. Inspect `package.json`.
4. Identify exported APIs.
5. Understand session handling.
6. Identify server/client helpers.
7. Identify required environment variables.
8. Understand how other applications are expected to integrate with it.
9. Reuse the existing authentication implementation.

Do NOT create another authentication system.

Create or reuse a clean application boundary such as:

```ts
getCurrentUser()
getCurrentUserId()
requireUser()
```

Every user-owned resource must be scoped to the authenticated user.

Never trust a browser-provided `userId`.

If the repository cannot be accessed or its integration contract cannot be determined, document the missing integration instead of silently replacing it.

---

# 2. Existing S3 File Sync

Repository:

```text
/Users/p/Github/S3Sync/
```

Known path supplied by the user:

```text
/Users/p/Github/S3Sync/eslint.config.mjs
```

Again, the ESLint file is only a known repository path.

Before implementing attachment/media storage:

1. Inspect `/Users/p/Github/S3Sync/`.
2. Read its documentation.
3. Inspect its package configuration.
4. Identify its public API.
5. Understand upload behavior.
6. Understand download behavior.
7. Understand synchronization behavior.
8. Understand deletion behavior.
9. Understand metadata handling.
10. Understand signed/private URL behavior.
11. Understand authorization requirements.
12. Reuse the existing service.

Do NOT create another S3/object-storage implementation.

Binary files should use S3Sync:

- photos
- videos
- audio recordings
- PDFs
- documents
- drawings
- future attachment types

Supabase/Postgres should contain attachment metadata and storage references, not large binary files.

---

# 3. Database

Use **Supabase PostgreSQL** for structured application data.

Store:

- journals
- collections
- entries
- entry content
- tags
- attachment metadata
- locations
- weather metadata
- favorites
- templates
- prompts
- reminders
- integration configuration
- import/export jobs
- integration events
- sharing metadata
- audit metadata where needed

Use migrations.

Keep privileged Supabase credentials server-only.

Use Row Level Security where compatible with the existing authentication architecture as defense in depth.

Application-level authorization remains mandatory.

---

# 4. Technology

Use:

- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- shadcn/ui where useful
- Supabase PostgreSQL
- existing UserAuth service
- existing S3Sync service
- Zod
- Server Components by default
- Server Actions for internal authenticated mutations where appropriate
- Route Handlers for API/integration boundaries
- Vercel-compatible architecture

Follow existing repository conventions where reasonable.

Default to the Node.js runtime.

---

# 5. Git and Source-Control Requirements

Source-control discipline is mandatory.

Before implementation:

```bash
git status
```

Determine whether the target application is already inside a Git repository.

If Git is NOT initialized:

```bash
git init
```

Create an appropriate `.gitignore` before the first commit.

Never initialize a nested Git repository inside an existing repository.

Never delete or rewrite existing Git history.

Do not force-push.

Do not modify unrelated existing commits.

## Secrets

Never commit:

```text
.env
.env.local
.env.production
.env.development.local
private keys
API secrets
Supabase service-role keys
S3 credentials
authentication secrets
generated credentials
```

Provide `.env.example` containing variable names and safe placeholders only.

Before every commit inspect:

```bash
git status
git diff
git diff --staged
```

Do not commit unrelated files.

## One Feature = One Commit

Create one focused Git commit for every completed feature or meaningful implementation unit.

Do NOT implement the entire application and create one large final commit.

Examples:

```text
chore: initialize journaling application
feat: add Supabase journal schema
feat: integrate existing authentication
feat: add journal management
feat: add journal entry editor
feat: add entry autosave
feat: add timeline view
feat: add tags
feat: add media attachments
feat: add calendar view
feat: add search
feat: add on-this-day memories
feat: add templates and prompts
feat: add location metadata
feat: add map view
feat: add reminders
feat: add import and export
feat: add integration framework
feat: add sharing
feat: add journal analytics
test: add journal domain tests
docs: add deployment documentation
```

A feature commit should:

1. contain one coherent change
2. compile where practical
3. include relevant tests
4. avoid unrelated formatting/refactors
5. use a descriptive conventional commit message

Do not commit half-implemented features merely to create more commits.

At completion provide:

```bash
git log --oneline
```

and summarize the feature commits.

---

# 6. Product Principles

The application is a **private personal journal first**.

Prioritize:

1. Privacy
2. Data ownership
3. Writing experience
4. Reliability
5. Searchability
6. Long-term preservation
7. Integration extensibility
8. Performance
9. Accessibility
10. Visual polish

Entries should remain usable and exportable many years later.

Avoid coupling the data model to temporary UI decisions.

---

# 7. Primary Navigation

Provide:

```text
Today
Timeline
Calendar
Journals
Media
Map
Search
On This Day
Templates
Settings
```

Adapt navigation responsively for mobile.

---

# 8. Multiple Journals

Users can maintain multiple journals.

Examples:

```text
Personal
Travel
Work
Ideas
Gratitude
Dreams
```

Suggested model:

```ts
Journal {
  id
  userId
  name
  description?
  color?
  icon?
  position
  isArchived
  archivedAt?
  createdAt
  updatedAt
}
```

Support:

- create
- edit
- reorder
- archive
- restore
- delete
- move entries between journals
- filter by journal

Do not hardcode a journal limit.

---

# 9. Journal Collections

Allow optional collections to organize journals.

Example:

```text
Personal
  Daily Journal
  Gratitude

Travel
  Europe 2026
  India Trips
```

Suggested model:

```ts
JournalCollection {
  id
  userId
  name
  position
  createdAt
  updatedAt
}
```

Collections are organizational and should not complicate entry ownership.

---

# 10. Journal Entries

The Entry is the central domain object.

Suggested model:

```ts
Entry {
  id
  userId
  journalId

  title?

  content
  contentFormat
  contentVersion

  entryDate
  timezone

  isFavorite
  isPinned?

  locationId?

  weatherData?
  metadata?

  sourceType
  sourceId?

  createdAt
  updatedAt
  deletedAt?
}
```

`entryDate` means when the journaled event/moment belongs.

It may differ from `createdAt`.

Users must be able to backdate entries.

Changing `entryDate` must not rewrite `createdAt`.

---

# 11. Rich Writing Experience

The editor is one of the most important product surfaces.

Support:

- paragraphs
- headings
- bold
- italic
- strikethrough
- hyperlinks
- block quotes
- bulleted lists
- numbered lists
- checklists
- separators
- code formatting where useful
- Markdown shortcuts
- undo/redo

Provide a distraction-minimized writing mode.

Use a robust structured editor architecture.

Do not store generated HTML as the only canonical representation.

Use a versioned content format that can be migrated.

Support Markdown import/export.

---

# 12. Autosave

Entries must autosave.

Display subtle state:

```text
Saving…
Saved
Offline changes
Save failed
```

Debounce writes.

Prevent race conditions where an older request overwrites newer content.

Consider optimistic concurrency/version numbers.

Users should not need to press Save during normal writing.

---

# 13. Offline-Friendly Architecture

Design entry editing so offline support can be added or progressively enabled.

At minimum:

- avoid losing unsaved text on transient network failures
- maintain local draft state
- retry failed autosaves safely
- surface synchronization status
- design IDs and mutations so future offline sync is possible

Do not implement a complex distributed sync engine unless required, but avoid architectural decisions that make future offline support impossible.

---

# 14. Entry Date and Time

Users can edit:

- date
- time
- timezone

Store timestamps in UTC where appropriate while retaining the timezone/context necessary to reproduce the intended local entry date.

Never rely on the Vercel server timezone.

---

# 15. Timeline

Route:

```text
/timeline
```

Provide a chronological feed of entries.

Support:

- infinite loading or pagination
- date grouping
- journal filtering
- tag filtering
- favorites
- media previews
- search result highlighting where relevant

Timeline cards should show useful previews without rendering an entire large entry.

---

# 16. Today

Route:

```text
/today
```

Show:

- today's entries
- quick entry composer
- prompts
- relevant memories
- writing streak/consistency where useful
- optional reminder state

The page should make starting an entry extremely fast.

---

# 17. Tags

Support flexible entry tags.

Suggested models:

```ts
Tag {
  id
  userId
  name
  normalizedName
  createdAt
}
```

and:

```ts
EntryTag {
  entryId
  tagId
}
```

Support:

- create
- rename
- merge
- delete
- autocomplete
- filter
- multi-tag search

Prevent duplicate normalized tags for the same user.

---

# 18. Favorites

Users can favorite important entries.

Favorites should be searchable/filterable.

Favoriting must not duplicate the entry.

---

# 19. Attachments and Media

Entries may contain multiple attachments.

Support architecture for:

```text
IMAGE
VIDEO
AUDIO
DOCUMENT
PDF
DRAWING
OTHER
```

Suggested metadata:

```ts
Attachment {
  id
  userId
  entryId

  type

  storageKey
  fileName
  mimeType
  size

  width?
  height?
  duration?

  checksum?

  createdAt
}
```

Actual file storage must use the existing S3Sync service.

Do not expose private raw S3 URLs if the existing service supports protected/signed access.

Validate:

- file type
- size
- ownership

Attachment deletion must clean up storage safely.

Design cleanup to tolerate retries.

---

# 20. Photos

Support multiple photos per entry.

Provide:

- upload
- previews
- captions where useful
- responsive galleries
- full-screen viewing
- metadata extraction where safe

Do not require photos for entries.

Use optimized image delivery compatible with Next.js.

---

# 21. Video

Support video attachments through S3Sync.

Display:

- poster/preview where available
- duration
- playback controls

Do not load large videos unnecessarily in timeline lists.

---

# 22. Audio Entries

Support audio attachments/voice journaling.

The architecture should support:

- uploaded audio
- future browser recording
- duration
- playback
- optional transcription later

Transcription must be a separate provider/integration.

Do not couple the core entry model to one transcription vendor.

---

# 23. Documents

Support documents such as:

```text
PDF
TXT
Markdown
other safe document formats
```

Files belong to entries and use S3Sync.

Do not automatically execute or render unsafe file content.

---

# 24. Calendar View

Route:

```text
/calendar
```

Provide month navigation.

Indicate dates containing entries.

Selecting a date shows entries from that date.

Support timezone-correct grouping.

Optionally show small media previews where performance permits.

---

# 25. Media View

Route:

```text
/media
```

Provide a gallery of entry attachments.

Filter by:

```text
Photos
Videos
Audio
Documents
```

Selecting media must navigate back to its journal entry.

Use pagination/infinite loading.

---

# 26. Location Metadata

Entries may optionally contain location metadata.

Suggested structure:

```ts
Location {
  id
  userId

  latitude?
  longitude?

  placeName?
  locality?
  region?
  country?

  source

  createdAt
}
```

Location is optional.

Never require it to write an entry.

Never silently capture precise location.

Architecture should allow different future location providers.

---

# 27. Map View

Route:

```text
/map
```

Display entries with location metadata.

Requirements:

- map provider must be abstracted
- do not couple the Entry model to a specific map vendor
- cluster markers where appropriate
- selecting a marker reveals entries
- location privacy must be respected

The initial implementation can use a selected map provider, but place it behind an adapter.

---

# 28. Weather Metadata

Entries may optionally record weather context.

Examples:

```text
temperature
condition
humidity
weatherCode
provider
observedAt
```

Weather must be stored as entry metadata after retrieval so old entries do not change when viewed later.

Create a provider interface:

```ts
interface WeatherProvider {
  getWeather(input): Promise<WeatherSnapshot>
}
```

Do not couple domain logic to one weather API.

If no provider is configured, journaling must still work normally.

---

# 29. Search

Search is a core feature.

Route:

```text
/search
```

Search across:

- title
- entry body
- tags
- journal
- location names
- dates where appropriate

Support filters:

```text
Journal
Date range
Tags
Favorites
Has photo
Has video
Has audio
Location
```

Start with PostgreSQL/Supabase search capabilities.

Keep search behind a service boundary so a dedicated search engine can be added later.

Do not load every entry into the browser to search it.

---

# 30. On This Day

Route:

```text
/on-this-day
```

Show entries from the same month/day in previous years.

Example:

```text
October 3, 2025
October 3, 2024
October 3, 2023
```

Handle leap-day behavior explicitly.

Allow filtering by journal.

Do not show deleted/private-inaccessible entries.

---

# 31. Prompts

Support journaling prompts.

Examples:

```text
What made today meaningful?
What are you grateful for?
What challenged you today?
What did you learn?
What do you want to remember about today?
```

Suggested model:

```ts
Prompt {
  id
  userId?
  text
  category?
  isSystem
  createdAt
}
```

Support:

- built-in prompts
- user-created prompts
- random prompt
- prompt categories
- creating an entry from a prompt

Prompt usage should remain optional.

---

# 32. Templates

Support reusable entry templates.

Examples:

```text
Daily Reflection
Gratitude
Weekly Review
Travel Log
Dream Journal
Book Notes
```

Suggested model:

```ts
EntryTemplate {
  id
  userId
  name
  content
  contentFormat
  journalId?
  createdAt
  updatedAt
}
```

Allow:

- create
- edit
- duplicate
- delete
- start entry from template

Architecture should later support variables such as:

```text
{{date}}
{{time}}
{{weather}}
{{location}}
```

Do not build an unsafe arbitrary template execution engine.

---

# 33. Reminders

Allow journaling reminders.

Suggested model:

```ts
JournalReminder {
  id
  userId
  journalId?

  schedule
  timezone
  enabled

  createdAt
  updatedAt
}
```

Examples:

```text
Every day at 9 PM
Every Sunday at 6 PM
Weekdays at 8 PM
```

Because deployment is on Vercel, do not create a permanently running Node process.

Design delivery for:

- Vercel Cron
- email
- web push
- mobile push later
- external notification provider

Do not claim reminders are delivered unless a delivery mechanism is actually configured.

---

# 34. Writing Streaks and Consistency

Provide optional journaling consistency metrics.

Examples:

```text
Current writing streak
Longest writing streak
Days journaled this month
Entries this month
```

Do not gamify aggressively.

A streak should be informational, not the core purpose of journaling.

Timezone-aware calendar dates must be used.

---

# 35. Entry Metadata

Support extensible metadata.

Examples:

```text
weather
location
device/source
import source
activity
music
calendar context
custom integration metadata
```

Do not add a database column for every possible future integration.

Use a combination of normalized core fields and versioned structured metadata.

Define which fields are canonical versus integration-specific.

---

# 36. Source Tracking

Every entry should support source metadata.

Examples:

```ts
sourceType:
  WEB
  IMPORT
  EMAIL
  API
  MOBILE
  AUTOMATION
  INTEGRATION
```

Optional:

```ts
sourceId
externalId
```

This enables idempotent future imports/integrations.

Use uniqueness constraints where appropriate to prevent duplicate imported entries.

---

# 37. Import Framework

Design imports as a framework rather than a one-off script.

Create an abstraction such as:

```ts
interface JournalImporter {
  validate(input): Promise<ImportValidation>
  parse(input): AsyncIterable<ImportedEntry>
}
```

Potential future imports:

- Day One exports
- Markdown
- JSON
- CSV
- plain text
- other journaling platforms

Imports should support:

- validation
- preview
- progress
- error reporting
- idempotency
- attachment import
- timezone preservation
- source tracking

Large imports should not depend on a single long browser request.

Design them as jobs where appropriate.

---

# 38. Export and Data Ownership

Export is mandatory.

Users must be able to retrieve their journal data.

Design export support for:

```text
JSON
Markdown
PDF
ZIP archive
```

At minimum implement a machine-readable complete export and a human-readable format.

Exports should preserve:

- entries
- dates
- journals
- tags
- metadata
- attachment references/files where applicable

Do not create a proprietary-only data trap.

Large exports should use job-based processing where appropriate.

---

# 39. Sharing

Entries are private by default.

Design optional sharing separately from ownership.

Potential model:

```ts
EntryShare {
  id
  entryId
  userId
  token
  expiresAt?
  revokedAt?
  createdAt
}
```

If implemented:

- sharing must be explicit
- links must be revocable
- private entries must never become public accidentally
- search engines should not index private/shared content by default
- attachments must follow the same access rules

Do not make public publishing the default.

---

# 40. Integration Architecture

Future integrations are a major requirement.

Create an explicit integration layer.

Conceptually:

```text
lib/integrations/
  types.ts
  registry.ts

  weather/
  location/
  email/
  calendar/
  automation/
  ai/
  importers/
  exporters/
```

Core journal services must not directly depend on vendor SDKs.

Use adapters/interfaces.

Example:

```ts
interface IntegrationProvider {
  id: string
  name: string
  capabilities: string[]
}
```

Integration-specific configuration should be isolated.

---

# 41. External API

Design the application so a stable authenticated API can be exposed later.

Keep business logic separate from Server Actions.

For example:

```text
UI
  ↓
Server Action / Route Handler
  ↓
Application Service
  ↓
Domain Logic
  ↓
Repository/Data Layer
```

Do not implement critical journal logic directly inside route handlers.

This allows the same services to later support:

- web
- mobile
- API
- email
- browser extension
- automations

---

# 42. Webhooks

Design for future outbound webhooks.

Potential events:

```text
entry.created
entry.updated
entry.deleted
attachment.created
journal.created
```

If implementing webhooks:

- sign payloads
- support retries
- use event IDs
- make delivery idempotent
- record delivery attempts
- never expose private data beyond configured scopes

The initial release does not need a full webhook UI unless required, but architecture should accommodate it.

---

# 43. Email-to-Journal

Design an adapter for future email journaling.

Conceptually:

```text
Incoming Email
      ↓
Email Provider Adapter
      ↓
Validation/Auth
      ↓
Entry Creation Service
      ↓
Journal
```

Do not tie entry creation to one email vendor.

Attachments from incoming email should pass through S3Sync.

---

# 44. Automation Integrations

Prepare for services such as:

```text
Zapier
IFTTT
Make
custom webhook automation
```

Do this by exposing stable application services/events rather than adding vendor-specific code throughout the application.

---

# 45. AI Features

AI is optional and must remain isolated.

Potential future features:

- entry summarization
- writing prompts
- semantic search
- title suggestions
- reflection questions
- transcription
- memory discovery

Do NOT make journal creation dependent on AI.

Create provider boundaries if AI features are introduced.

Private journal content must not automatically be sent to external AI providers without an explicit product decision and appropriate user control.

---

# 46. Delete and Trash

Prefer soft deletion first.

Entries should support a Trash/recovery period if practical.

Example:

```ts
deletedAt
```

Users should be able to:

- move to trash
- restore
- permanently delete

Permanent deletion must also handle associated S3 attachments safely.

Use background/retry-safe cleanup where necessary.

---

# 47. Privacy and Security

Every server-side operation must:

1. resolve authenticated user
2. validate input with Zod
3. load target resource
4. verify ownership/permission
5. perform the operation

Never rely solely on hidden UI controls.

Never accept client-provided ownership as authoritative.

Use secure defaults.

Do not log private entry contents unnecessarily.

Avoid putting journal text into analytics/error telemetry.

Sanitize rendered user content where needed.

---

# 48. Supabase Data Integrity

Use:

- foreign keys
- unique constraints
- indexes
- appropriate cascade/restrict behavior
- RLS where compatible

Likely indexes include:

```text
Entry(userId, entryDate)
Entry(userId, journalId, entryDate)
Entry(userId, isFavorite)
Attachment(entryId)
Tag(userId, normalizedName)
EntryTag(entryId, tagId)
Journal(userId, isArchived)
```

Optimize search separately.

---

# 49. UI Design

Create a calm, premium writing-focused interface.

Prioritize:

- typography
- whitespace
- readable line length
- fast editor startup
- minimal distractions
- media presentation
- clear chronology

Support:

```text
Light
Dark
System
```

Avoid excessive:

- gradients
- glassmorphism
- animations
- oversized cards
- dashboard-like clutter

This is a journal, not a business analytics application.

---

# 50. Responsive Design

The application must work well on:

- desktop
- tablet
- mobile web

The writing/editor experience is especially important on mobile.

Avoid interactions that require hover.

---

# 51. Accessibility

Support:

- keyboard navigation
- semantic HTML
- accessible labels
- visible focus states
- sufficient contrast
- screen-reader friendly editor controls
- reduced motion preferences

Media controls must be accessible.

---

# 52. Empty States

Create intentional empty states.

Examples:

```text
Your journal starts here.

Write your first entry.

[New Entry]
```

For On This Day:

```text
No memories from this day yet.
```

For Media:

```text
Photos, videos and recordings attached to entries will appear here.
```

---

# 53. Loading and Error States

Use Next.js conventions:

```text
loading.tsx
error.tsx
not-found.tsx
```

Use skeletons where useful.

Do not expose database or storage internals in error messages.

Editor save failures must be particularly clear because data loss is unacceptable.

---

# 54. Performance

Design for users with:

```text
10,000+
50,000+
100,000+ entries
```

Do not load all entries at once.

Use:

- cursor pagination
- indexed queries
- bounded date queries
- lazy media loading
- optimized thumbnails
- server-side filtering
- database search
- appropriate caching

Avoid N+1 queries.

Do not fetch full-resolution media in timeline thumbnails.

---

# 55. Suggested Project Structure

Adapt to the actual repository:

```text
app/
  (app)/
    layout.tsx

    today/
      page.tsx

    timeline/
      page.tsx

    entries/
      new/
        page.tsx

      [entryId]/
        page.tsx
        edit/
          page.tsx

    calendar/
      page.tsx

    journals/
      page.tsx
      [journalId]/
        page.tsx

    media/
      page.tsx

    map/
      page.tsx

    search/
      page.tsx

    on-this-day/
      page.tsx

    templates/
      page.tsx

    settings/
      page.tsx

  api/
    integrations/
    imports/
    exports/
    webhooks/

components/
  editor/
  entries/
  journals/
  timeline/
  calendar/
  media/
  map/
  search/
  templates/
  ui/

lib/
  auth/
  db/
  supabase/
  storage/
  journals/
  entries/
  search/
  dates/
  integrations/
  import/
  export/
  validation/

actions/
  entries.ts
  journals.ts
  tags.ts
  templates.ts
  attachments.ts

supabase/
  migrations/

tests/
```

---

# 56. Domain/Application Services

Business logic must not live in React components.

Create services such as:

```ts
createEntry()
updateEntry()
deleteEntry()
restoreEntry()

createJournal()
moveEntryToJournal()

addTagToEntry()
removeTagFromEntry()

attachMedia()
deleteAttachment()

searchEntries()

getTimeline()
getEntriesForDate()
getOnThisDayEntries()

createTemplate()

startImport()
generateExport()
```

These services should be usable by future interfaces beyond the web UI.

---

# 57. Testing

Add automated tests for critical domain behavior.

Test:

- authentication/ownership
- journal isolation
- entry creation
- autosave/version conflict behavior
- backdated entries
- timezone grouping
- tags
- favorites
- attachment ownership
- S3 cleanup behavior
- calendar grouping
- On This Day
- search filtering
- soft deletion/restoration
- import idempotency
- source/external IDs
- export completeness
- integration boundaries

Add end-to-end tests for the most important user flows if the repository test stack supports them.

---

# 58. Development Seed Data

Provide optional development seed data.

Example journals:

```text
Personal
Travel
Ideas
Gratitude
```

Example entries should exercise:

- tags
- favorites
- different dates
- media metadata
- location metadata
- multiple journals

Never automatically seed production.

---

# 59. Vercel Deployment

Ensure clean deployment to Vercel.

Document all environment variables.

Potential categories:

```text
Supabase
UserAuth
S3Sync
optional map provider
optional weather provider
optional email provider
optional AI provider
```

Do not hardcode environment-specific URLs or secrets.

Run the repository's equivalents of:

```bash
npm run lint
npm run test
npm run build
```

The production build must pass before the work is considered complete.

---

# 60. Implementation Process for Codex

Do not immediately begin broad implementation.

## Phase 1 — Repository Inspection

Inspect:

- target application repository
- `/Users/p/Github/UseAuth/`
- `/Users/p/Github/S3Sync/`
- package configuration
- existing Next.js structure
- Supabase setup
- migrations
- design system
- auth integration
- storage integration
- environment variables
- test framework
- Vercel configuration

Also inspect Git status/history.

If the target is not a Git repository, initialize Git.

Produce a short implementation plan based on what actually exists.

---

## Phase 2 — Foundation

Implement:

- project/app shell
- Supabase integration
- existing auth integration
- S3Sync adapter
- migrations
- authorization helpers
- core domain types

Commit each coherent feature separately.

---

## Phase 3 — Core Journaling

Implement in approximately this order:

1. Journal management
2. Entry model
3. Entry editor
4. Autosave
5. Timeline
6. Tags
7. Favorites
8. Attachments/media
9. Calendar
10. Search
11. On This Day
12. Templates
13. Prompts
14. Location/weather metadata
15. Media view
16. Map
17. Reminders
18. Import
19. Export
20. Sharing
21. Integration framework

Create one focused Git commit per completed feature.

---

## Phase 4 — Polish

Add:

- mobile responsiveness
- dark mode
- loading states
- empty states
- error recovery
- accessibility
- keyboard shortcuts
- editor polish
- performance improvements

Do not combine unrelated polish into one huge commit.

---

## Phase 5 — Verification

Verify:

- auth
- user isolation
- RLS
- S3 access
- attachment privacy
- autosave reliability
- timezone correctness
- search
- large timeline pagination
- imports
- exports
- mobile layout
- tests
- lint
- production build

Review Git history and ensure commits remain feature-focused.

---

# 61. Important Engineering Rules

Do NOT:

- create a new auth system
- create a new object-storage implementation
- copy Day One's UI/branding
- expose Supabase service credentials
- expose S3 credentials
- trust client-supplied user IDs
- store large media blobs in Postgres
- store only HTML as canonical journal content
- couple core journal services directly to vendor SDKs
- assume server timezone equals user timezone
- send journal contents to third parties without explicit feature requirements
- load all journal entries into the browser
- make AI mandatory
- commit secrets
- create one giant final Git commit
- initialize a nested Git repository
- rewrite existing Git history
- modify unrelated code merely to satisfy this specification

When ambiguous, prioritize:

1. user data safety
2. privacy
3. correctness
4. writing experience
5. extensibility
6. maintainability
7. performance
8. visual polish

---

# 62. Definition of Done

The initial product is complete when an authenticated user can:

1. Create and manage multiple journals.
2. Write rich journal entries.
3. Autosave entries reliably.
4. Backdate entries.
5. Browse a chronological timeline.
6. Tag entries.
7. Favorite entries.
8. Attach photos and other supported media using S3Sync.
9. Browse entries by calendar date.
10. Search journal content.
11. View On This Day memories.
12. Create/use templates.
13. Use journaling prompts.
14. View media across entries.
15. Store optional location/weather context where configured.
16. Archive/delete/restore content safely.
17. Export their journal data.
18. Access only their own data.
19. Use the app comfortably on desktop and mobile.
20. Refresh/reopen without losing persisted data.
21. Deploy successfully to Vercel.

The architecture must additionally demonstrate clear extension points for:

- mobile clients
- external APIs
- webhooks
- email journaling
- automation platforms
- importers/exporters
- calendar integrations
- location/weather providers
- AI features

Git requirements must also be satisfied:

- repository initialized if one did not already exist
- appropriate `.gitignore`
- no secrets committed
- one focused commit per completed feature
- clean working tree at completion unless explicitly documented
- final `git log --oneline` included in implementation summary

---

# 63. Final Documentation

Before finishing, update/create README documentation covering:

- architecture
- database schema
- migrations
- authentication integration
- S3Sync integration
- Supabase configuration
- environment variables
- local development
- tests
- build
- Vercel deployment
- editor/content format
- import/export
- privacy/security assumptions
- integration architecture
- known limitations
- future integration extension points

Also provide a final implementation report containing:

```text
Implemented features
Tests added
Migrations added
Environment variables required
Known limitations
Deferred features
Deployment instructions
Git commit summary
```

Include:

```bash
git status
git log --oneline
```

Do not claim a feature is implemented unless it has actually been built and verified.
