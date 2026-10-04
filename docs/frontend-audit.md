# Frontend audit and redesign

- Stack: Next.js 16 App Router, React 19, TypeScript, MUI 9 with Emotion and the v16 App Router cache provider. Existing rich text uses TipTap; icons use Lucide.
- Routes: `/`, `/sign-in`, `/today`, `/timeline`, `/calendar`, `/journals`, `/journals/[journalId]`, `/entries/new`, `/entries/[entryId]`, `/entries/[entryId]/edit`, `/media`, `/map`, `/search`, `/on-this-day`, `/templates`, `/settings`. Root loading, error, and not-found states are included.
- Shell: shared desktop sidebar and temporary MUI mobile Drawer. `AppShell` keeps the viewer timezone cookie behavior.
- Forms and dialogs: authentication, entry creation/editor/context, search, journal/template management, settings, attachments. TipTap content remains a specialized editor; upload and rich-content checkboxes retain native inputs where required.
- Data and behavior preserved: Supabase-backed server services, session refresh, entry autosave and offline drafts, journal and template CRUD, search filters, export, upload/download, map/context, tags, and trash recovery.
- Design: centralized light/dark MUI theme plus CSS tokens for editor-specific and route layout styles. Stored appearance is applied before hydration; system preference is observed.
- Responsive: content widths and spacing adapt across mobile, tablet and desktop; calendar cells and editor controls reflow on narrow screens.
