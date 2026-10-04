# Codex Prompt — Journal Entry Editor UI/UX Redesign

## Objective

Redesign the existing Journal Entry editor page to make it **minimal, clean, writing-focused, functional, intuitive, responsive, accessible, and visually calm**.

This is a **UI/UX redesign of the existing page**, not a rewrite of the journal architecture.

Before making changes, inspect the existing implementation and reuse the existing editor, autosave, journal selection, sections, emotion tracking, emotion intensity, impact areas/entities, tags, attachments, location, weather, favorite/star, entry date/time, timezone, trash/delete behavior, authentication, persistence, and design system.

Do not remove working functionality merely to simplify the interface.

> **Writing is the primary interface. Everything else should use progressive disclosure.**

If a control is not necessary for writing the next sentence, it should not visually compete with the editor.

---

## 1. Current UX Problem

The current editor exposes too many controls simultaneously. Date/time, timezone, journal selector, favorite, formatting, tags, trash, sections, attachments, location, coordinates, temperature, weather and context-saving controls all compete with writing.

Preserve these capabilities while dramatically reducing their visual prominence.

## 2. Target Information Hierarchy

```text
Entry navigation / save state
Date / Journal
Title
Writing
Sections
Tags
Context
  Attachment
  Location
  Weather
Entry details
```

Visual priority: **Writing → Title → Sections → Emotional/impact context → Tags/context → Entry metadata → Administrative/destructive actions**.

## 3. Remove the Large Outer Editor Card

Remove the giant bordered container around the editor. The entry should feel like a document/canvas.

Use a centered content column around `760–840px` on desktop, adjusted to the existing typography. Use whitespace, typography, alignment and subtle separators rather than nested cards and borders.

## 4. Proposed Desktop Structure

```text
← Journal                                      Saved    •••

Sunday, October 4 · 10:36 PM
My Journal ▾                                      ☆

Give this day a title…

B   I   H2   •   1.   ☑   ❞   🔗   •••

Start writing your thoughts...

Today was...

+ Add section

────────────────────────────────────────────

#personal    #reflection                      + Add tag

Add context

📎 Attachment      📍 Location      ☁ Weather

────────────────────────────────────────────

Entry details                                      ›
```

Use this as information hierarchy, not a literal visual specification.

## 5. Header and Autosave

Use a compact header such as:

```text
← Journal                                Saved   •••
```

Expose autosave subtly: `Saved`, `Saving…`, `Couldn't save`, and `Couldn't save — Retry`.

Reuse the existing autosave system. Do not implement a second save mechanism or show success toasts for normal autosaves.

## 6. Date, Timezone and Journal

Replace large date/time fields with lightweight clickable metadata such as `Sunday, October 4 · 10:36 PM`. Clicking opens the appropriate date/time editor.

Remove the permanent timezone input from the primary editor. Keep timezone in Entry Details or date/time editing UI.

Replace the large Journal select with `My Journal ▾` and reuse existing journal-selection behavior.

## 7. Favorite

Keep the favorite/star feature as a subtle `☆ / ★` control with accessible labels such as `Add to favorites` and `Remove from favorites`.

## 8. Entry Title

Keep the title important without allowing it to dominate. Approximate sizes: Desktop 32–36px, Mobile 28–32px. Use placeholder `Give this day a title…`. Avoid a visible form-field border.

## 9. Main Writing Editor

The body editor is the primary component. It should have no large surrounding border, feel like a document, use comfortable line height/readable width, grow naturally with content, and avoid an unnecessarily huge empty box.

Use an initial minimum height around `250–350px`, then let content determine page height. The page should normally scroll rather than using a fixed-height internal editor scroll region.

## 10. Formatting Toolbar

Preserve rich-text functionality while reducing prominence. Prioritize Bold, Italic, Heading, Bulleted list, Numbered list, Checklist, Quote and Link. Move less-common actions under `•••` where appropriate. Keep Undo/Redo accessible.

Where reliable, make the toolbar more visible when the editor is focused. Do not introduce fragile floating UI merely for visual novelty.

On mobile, use a horizontally scrollable/grouped/overflow toolbar rather than squeezing all controls into one row.

## 11. Sections Become Part of the Document

Remove permanent explanatory copy from the Sections area. Use onboarding/help only when needed.

Normal state:

```text
+ Add section
```

A section should feel like another document block:

```text
Morning                                      •••

Write about this moment…

Emotion                                  + Add
Impact                                   + Add
```

Populated:

```text
Morning                                      •••

Had a difficult conversation at work today...

😟 Frustrated · 7/10

Work · Project Alpha
People · Rahul
```

Reuse the existing section architecture. Section overflow actions may include Rename, Duplicate, Move up/down and Delete. If drag/drop is used, provide an accessible alternative.

## 12. Emotion and Impact Context

Emotion belongs visually with its section. Use `+ Emotion` when empty and a compact representation such as `😟 Frustrated · 7/10` when selected. Do not permanently show a large intensity form.

Impact follows the same rule: `+ Impact` when empty, or compact values such as `Work · Project Alpha` and `People · Rahul` when selected. Do not permanently display large multi-select forms.

## 13. Tags Redesign

Replace the comma-separated text input and remove the `Separate with commas` instruction.

Use searchable chips:

```text
#personal    #reflection    #work    + Add
```

The picker should search existing tags and support creating a missing tag. Preserve existing tag data/storage.

## 14. Attachments and Context

Do not reserve a large Attachments section when there are no attachments.

Use:

```text
Add context

📎 Attachment      📍 Location      ☁ Weather
```

When attachments exist, show thumbnails/files directly with a compact `+ Add`. Preserve the existing storage/upload architecture; do not introduce a second upload system.

## 15. Location Redesign

Do not expose latitude/longitude in the normal editor.

Normal empty state: `📍 Add location`.

Selected state: `📍 Indore, Madhya Pradesh`.

Clicking opens editing/removal. A picker may provide search, `Use current location`, recent places, Cancel and Save. Do not fake place search if it does not exist.

Coordinates remain valid data but move to Entry Details or an Advanced disclosure. Do not remove stored coordinate data.

## 16. Weather Redesign

Do not permanently show Temperature and Condition fields.

Empty: `☁ Add weather`.

Selected: `☀ 24°C · Clear`.

If automatic weather retrieval does not exist, do not pretend it does. Provide `Add weather manually` where needed and design the component so automatic lookup can be added later.

When both location and weather exist, present them compactly.

## 17. Context Persistence

Where technically and privacy-wise safe, integrate context changes with the existing autosave architecture. Avoid requiring a separate `Save context` button merely because the current implementation uses one.

If explicit confirmation exists for privacy reasons, preserve that semantic and redesign the wording/interaction rather than silently changing privacy behavior.

## 18. Destructive Actions

Remove `Move to Trash` from the writing surface. Put it in the overflow menu with Entry details, Duplicate and Export, separated visually from the destructive action. Use appropriate destructive styling and confirmation.

## 19. Entry Details

Create a progressive-disclosure Entry Details interface for secondary metadata such as Created, Modified, Journal, Timezone, Location and Coordinates. Only show data that exists.

## 20. Focus Mode

Add optional Focus Mode if it can be implemented cleanly without duplicating or destabilizing the editor.

Approximate experience:

```text
                                      Saved

Give this day a title…

Today I...
```

Collapse navigation, metadata, context and secondary controls. Provide an obvious accessible exit control. `Esc` may be a shortcut but cannot be the only exit mechanism.

## 21. Mobile Experience

Mobile is first-class. Do not simply shrink desktop form controls.

Use bottom sheets, compact menus, touch-friendly chips, a mobile editor toolbar and safe-area spacing where appropriate. Avoid making multiple UI regions sticky simultaneously.

## 22. Visual Design Rules

Reduce visible borders. Use borders primarily for active input states, meaningful grouping, separators and dialogs/popovers.

Preserve dark theme and support light/system themes. Use background levels, typography, whitespace and muted secondary text for hierarchy.

Avoid glassmorphism, unnecessary gradients, excessive shadows, oversized decorative cards, excessive badges and unnecessary animations. Use motion sparingly and respect `prefers-reduced-motion`.

## 23. Accessibility

Support keyboard navigation, screen readers, semantic controls, visible focus, adequate contrast, reduced motion and touch. Icon-only controls require accessible labels.

Do not communicate favorite, emotion, save state, weather or destructive state only through color/iconography.

Preserve common editor shortcuts where supported.

## 24. Autosave Safety

Verify autosave for title, body, sections, section order, emotion, intensity, Impact Areas, Impact Entities, tags, favorite, journal, date/time, location and weather.

Reuse the existing debounce/concurrency protection. Older save responses must never overwrite newer state.

## 25. Existing Data Compatibility

Existing entries must continue rendering correctly with title, content, tags, journal, favorite, date/time, timezone, attachments, sections, location, coordinates and weather.

Treat this primarily as a presentation/interaction migration. Do not change the database schema unless genuinely required.

## 26. Component Architecture

Do not create one giant client component. Prefer/reuse focused components such as:

```text
EntryHeader
AutosaveStatus
EntryMetadataSummary
EntryDatePicker
JournalSelector
FavoriteButton
JournalTitle
JournalEditor
EditorToolbar
EntrySection
SectionActions
SectionEmotion
SectionImpact
AddSectionButton
TagPicker
TagChip
EntryContext
AttachmentPicker
AttachmentGallery
LocationPicker
WeatherPicker
EntryDetails
EntryActionsMenu
FocusMode
```

Adapt names to the existing architecture and reuse existing components where possible.

## 27. Progressive Disclosure Rule

Before permanently displaying any control, ask:

> Does the user need this control visible while writing the next sentence?

If not, prefer compact text, chip, icon, popover, sheet, dialog, overflow menu or Entry Details.

Examples:

```text
Timezone        → Entry Details
Coordinates     → Entry Details / Advanced
Trash           → Overflow
Weather inputs  → Weather picker
Tag text field  → Tag picker
Journal field   → Compact selector
Date input      → Clickable metadata
```

Do not over-minimize essential information or create mystery-meat navigation.

## 28. Loading, Errors and Performance

Avoid replacing the entire editor with a large skeleton during minor operations. Use localized loading for journal selection, attachments, location, weather and section context.

Use calm inline errors such as `Couldn't save this change. Retry`, `Upload failed. Retry`, or `Couldn't get your location. Enter it manually.` Never expose raw database/provider errors.

Typing must remain fast. Avoid expensive page rerenders caused by editor state/autosave. Isolate expensive sections, pickers, autocomplete, attachment previews and context components where justified.

## 29. Testing

Update/add tests for:

- Existing entry rendering, title/body editing, autosave state, journal selection, favorite and date editing.
- Section add/edit/reorder/delete, emotion, intensity and Impact Areas/entities.
- Existing tags, search, add/remove and create.
- Add/remove attachment, add/edit/remove location, weather and preservation of coordinates.
- Entry Details, Move to Trash, destructive confirmation and Focus Mode if implemented.
- Mobile/desktop responsiveness, keyboard access, labels, focus, dialogs/sheets and icon buttons.

## 30. Implementation Sequence

1. Audit the current page, data dependencies, autosave, editor, sections and context persistence.
2. Implement document-style layout, content width, header and compact metadata.
3. Improve title, editor and responsive toolbar.
4. Integrate Sections visually into the document.
5. Replace comma-based Tags UI with chips/picker.
6. Redesign Attachments, Location and Weather context.
7. Add Entry Details and overflow actions; move timezone/coordinates/trash out of primary UI.
8. Implement Focus Mode only after the standard editor is stable.
9. Complete mobile audit.
10. Complete accessibility, light/dark and interaction polish.
11. Run lint, tests and production build.

## 31. Git Requirements

Before coding:

```bash
git status
git log --oneline
```

Do not initialize Git if already present.

Use focused commits, for example:

```text
refactor: simplify journal entry layout
feat: add compact journal entry header
refactor: simplify editor formatting toolbar
refactor: integrate sections into journal document
feat: replace tag input with tag picker
refactor: simplify entry attachments
refactor: redesign location and weather context
feat: add journal entry details panel
refactor: move destructive entry actions to overflow menu
feat: add journal focus mode
fix: improve journal editor mobile experience
fix: improve journal editor accessibility
test: update journal entry editor coverage
```

Before every commit run `git status`, `git diff` and `git diff --staged`. Do not commit unrelated changes.

## 32. Definition of Done

The redesign is complete when:

1. The page feels primarily like a writing surface.
2. The giant outer editor card is removed.
3. Date/time is lightweight metadata.
4. Timezone is removed from the primary interface.
5. Journal selection is compact.
6. Favorite remains accessible.
7. Title typography is balanced.
8. Writing dominates the page.
9. The toolbar is simpler without losing functionality.
10. Sections visually belong to the document.
11. Emotion/intensity is compact within sections.
12. Impact Areas/entities are compact within sections.
13. Tags use a searchable chip-based interface.
14. Empty attachments do not consume a large section.
15. Location does not expose coordinates by default.
16. Weather does not permanently expose raw inputs.
17. Context uses progressive disclosure.
18. Trash is removed from the writing surface.
19. Autosave state is clearly visible.
20. Entry Details exposes secondary metadata.
21. Existing data remains compatible.
22. Existing autosave remains reliable.
23. Mobile experience is excellent.
24. Desktop writing width is comfortable.
25. Light/dark themes work correctly.
26. Keyboard/screen-reader accessibility works.
27. Tests pass.
28. Lint passes.
29. Production build passes.

## Final Design Principle

The finished editor should feel like opening a private page and immediately beginning to write.

It should **not** feel like completing a database form.

Preserve functionality, but reveal complexity only when the user asks for it.

The hierarchy should always be:

**Write → add structure → add context → manage metadata.**

Do not sacrifice data correctness, autosave reliability, section/emotion architecture, attachment persistence, privacy semantics or accessibility merely to achieve a visually minimal interface.
