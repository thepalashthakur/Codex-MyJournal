# Codex Feature Implementation — Journal Sections, Emotion Tracking & Impact Areas

## Context

You are working on an **existing personal journaling web application**.

Before making changes, inspect the existing repository and understand its architecture, database schema, journal-entry model, editor implementation, authentication integration, Supabase setup, design system, tests, and existing conventions.

Do **not** rebuild or replace existing functionality.

Extend the application with a flexible system for:

1. Journal entry sections
2. Emotion tracking
3. Emotion intensity
4. Hierarchical/custom emotions
5. Impact areas
6. Impact-area entities
7. Fast inline creation from the journal editor
8. Future analytics/integration support

The feature must remain privacy-focused, user-specific, extensible, and suitable for long-term journal data.

---

# 1. Core Concept

A journal entry can contain multiple logical **sections**.

Example:

```text
Journal Entry

Morning
"I woke up feeling energetic..."

Emotion:
Happy → Optimistic
Intensity: 7/10

Impact Areas:
Health → Sleep
People → Sarah


Work
"The meeting didn't go particularly well..."

Emotion:
Sad → Disappointed
Intensity: 6/10

Impact Areas:
Work → Project Alpha
People → John
```

A journal entry therefore does **not** have one global emotion.

Emotion tracking belongs to individual sections of an entry.

---

# 2. Entry Sections

Introduce a first-class `EntrySection` domain object.

Conceptually:

```ts
EntrySection {
  id
  userId
  entryId

  title?
  content
  contentFormat
  contentVersion

  position

  createdAt
  updatedAt
  deletedAt?
}
```

A journal entry can have `0..N` sections.

Users should be able to:

- add a section
- optionally name a section
- edit section content
- reorder sections
- delete sections
- duplicate sections where useful
- associate emotional context with sections
- associate impact areas/entities with sections

Do not require users to create sections before they can journal.

The normal writing experience must remain fast.

If the existing editor architecture makes explicit sections disruptive, introduce sections progressively while preserving compatibility with existing entries.

Existing entries must continue to work.

Do **not** destructively migrate existing journal content without a clear migration strategy.

---

# 3. Section ↔ Emotion Relationship

Each section can have **at most one selected emotion**.

Relationship:

```text
EntrySection 1 → 0..1 Emotion
```

A section may have no emotion.

Emotion tracking is optional.

The selected emotion should also support an **intensity**.

Example:

```text
Emotion: Anxious
Intensity: 8 / 10
```

Suggested association:

```ts
SectionEmotion {
  id
  userId
  entrySectionId
  emotionId
  intensity?
  createdAt
  updatedAt
}
```

Enforce the one-emotion-per-section rule at the database level where practical.

For example, `entrySectionId` should be unique in the association table.

---

# 4. Emotion Intensity

Emotion intensity represents how strongly the user experienced the selected emotion.

Use a consistent scale.

Initial implementation:

```text
1–10
```

Where:

```text
1 = very mild
10 = extremely strong
```

Do not confuse emotion intensity with positive/negative sentiment.

For example:

```text
Calm: 9/10
Angry: 3/10
Excited: 8/10
Sad: 2/10
```

are all valid.

The UI should make intensity quick to set and optional.

---

# 5. Emotion Hierarchy

Emotions support nesting up to **three levels**.

Example:

```text
Anger
 ├── Frustrated
 │    ├── Annoyed
 │    └── Irritated
 ├── Resentful
 └── Furious
```

Another example:

```text
Happiness
 ├── Joyful
 │    ├── Playful
 │    └── Delighted
 ├── Proud
 └── Optimistic
```

Maximum depth:

```text
Level 1
  → Level 2
      → Level 3
```

Do **not** allow level 4+.

Prevent:

- circular references
- self-parenting
- invalid parent relationships
- cross-user parent relationships

Validate hierarchy rules server-side, not only in the UI.

---

# 6. Emotion Model

Use a normalized model.

Suggested conceptual structure:

```ts
Emotion {
  id
  userId?

  name
  normalizedName

  parentEmotionId?
  depth

  color?
  icon?

  isSystem
  isArchived
  isHidden

  position

  createdAt
  updatedAt
  deletedAt?
}
```

Adapt this model to the existing database conventions rather than blindly copying it.

---

# 7. Default Emotion Wheel

New users should have access to a useful default emotion taxonomy based on a standard emotion-wheel style organization.

Seed a sensible three-level emotion hierarchy.

For example, high-level categories may include concepts such as:

```text
Happy
Sad
Angry
Fearful
Surprised
Disgusted
```

with more specific emotions underneath them.

The exact taxonomy should be stored as seed/configuration data rather than hardcoded throughout React components.

Default emotions must behave as a template/catalog.

User customization must **not** modify global defaults for other users.

---

# 8. User-Specific Emotion Library

Every user effectively has their own emotion configuration.

Users can:

- create emotion
- create child emotion
- rename emotion
- change color
- reorder emotion
- move emotion within the hierarchy where valid
- archive emotion
- restore emotion
- hide emotion
- unhide emotion
- delete custom emotion
- reset emotions to defaults

Emotion configuration is private and user-specific.

Never allow one user's customization to affect another user.

---

# 9. Reset to Default

Provide:

```text
Settings
 → Emotions
     → Reset to Default
```

Resetting should restore the default emotion taxonomy.

This action needs explicit confirmation.

Do **not** accidentally destroy historical journal meaning.

If historical sections reference customized emotions, those references must remain interpretable.

Prefer preserving historical emotion records or snapshots rather than making old journal entries meaningless after reset/delete operations.

---

# 10. Historical Integrity

Journal history is more important than configuration cleanliness.

If a user used:

```text
Emotion: Excited
```

on an entry in 2026 and later renames/deletes/archives that emotion, the historical entry should not silently lose its emotional context.

Choose an appropriate strategy such as:

- soft deletion
- immutable historical references
- snapshot name/color on `SectionEmotion`
- another clearly documented strategy

Do **not** use cascading deletion that removes emotional history from journal entries.

---

# 11. Archive vs Hide vs Delete

Treat these concepts differently.

## Hide

Emotion remains available historically but is not normally displayed in quick emotion selection.

## Archive

Emotion is retired from normal future use but remains fully available historically.

## Delete

Deletion should primarily apply to custom emotions that are unused.

If an emotion is referenced historically, either:

- prevent permanent deletion, or
- convert deletion into archival/soft deletion.

Never silently remove emotional data from old entries.

---

# 12. Emotion Colors

Users can assign colors to emotions.

Example:

```text
Joy       yellow
Calm      blue
Anger     red
Anxiety   purple
```

Do not rely on color alone to communicate emotion.

Emotion name must always remain visible/accessibly available.

Ensure adequate contrast in light and dark themes.

---

# 13. Impact Areas

Sections can also have zero or more **Impact Areas**.

Impact Areas represent what the section/emotion relates to.

Examples:

```text
People
Health
Fitness
Work
Family
Relationship
Finance
Study
Sleep
Habits
Travel
Personal Growth
```

Unlike emotions, Impact Areas are **not hierarchical**.

Do not allow Impact Areas to contain other Impact Areas.

---

# 14. Impact Area Model

Suggested structure:

```ts
ImpactArea {
  id
  userId

  name
  normalizedName

  color?
  icon?

  isArchived
  position

  createdAt
  updatedAt
}
```

Prevent duplicate normalized names per user.

---

# 15. Impact Area Entities

An Impact Area can contain many **entities**.

Examples:

```text
People
 ├── Mom
 ├── Dad
 ├── Sarah
 └── John

Work
 ├── Project Alpha
 ├── Client XYZ
 └── Team

Health
 ├── Sleep
 ├── Diet
 └── Medication

Fitness
 ├── Gym
 ├── Running
 └── Yoga

Habits
 ├── Reading
 ├── Meditation
 └── No Sugar
```

Entities belong directly to an Impact Area.

There is no additional nesting.

Relationship:

```text
Impact Area
    ↓
0..N Entities
```

Suggested model:

```ts
ImpactEntity {
  id
  userId
  impactAreaId

  name
  normalizedName

  isArchived

  createdAt
  updatedAt
}
```

Prevent duplicate normalized entity names within the same Impact Area for the same user.

---

# 16. Section Impact Associations

Each section can have **many Impact Areas**.

Each selected Impact Area can optionally have **many selected entities**.

Example:

```text
Section

Emotion:
Frustrated
Intensity: 7

Impact:

People
  John
  Sarah

Work
  Project Alpha
  Team

Health
  Sleep
```

Model this relationally rather than storing comma-separated values.

A possible model is:

```ts
SectionImpactArea {
  id
  userId
  entrySectionId
  impactAreaId
}
```

and:

```ts
SectionImpactEntity {
  id
  userId
  sectionImpactAreaId
  impactEntityId
}
```

Use uniqueness constraints to prevent duplicate associations.

---

# 17. Quick Add Is Critical

Users must **not** have to leave the journal editor merely because an emotion, Impact Area, or entity does not already exist.

Support inline quick creation.

Example:

```text
Emotion
[ Search emotions... ]

No emotion found for "Hopeful"

+ Create "Hopeful"
```

If hierarchy context exists:

```text
Create "Hopeful"
under:
Happy → Optimistic
```

Likewise:

```text
Impact Area
[ Search... ]

+ Create "Spirituality"
```

And:

```text
People

[ Search people... ]

+ Add "Rahul"
```

The new item should immediately become selectable/selected without requiring a page refresh.

---

# 18. Fast Entry UX

Do not turn journal writing into filling out a form.

The primary workflow remains:

```text
Write first
Add context when useful
```

Emotion/impact controls should be visually secondary to writing.

A possible section UI:

```text
────────────────────────────────────

Morning

I woke up feeling surprisingly energetic today...

[ + Emotion ]   [ + Impact ]

────────────────────────────────────
```

After selection:

```text
😊 Optimistic · 8/10

People: Sarah
Health: Sleep
```

Keep this compact.

---

# 19. Emotion Picker

Create a fast emotion picker.

It should support:

- recent emotions
- frequently used emotions
- search
- hierarchy browsing
- emotion-wheel browsing
- color indicators
- keyboard navigation
- custom emotion creation

Possible interaction:

```text
Choose emotion

Recent
😊 Happy
😌 Calm
😟 Anxious

Browse

Happy >
Sad >
Angry >
Fearful >
Surprised >
Disgusted >

Search emotions...
```

Selecting a parent should allow either:

1. selecting that emotion directly, or
2. drilling into children.

Do not force users to always choose the deepest level.

For example, all of these should be valid:

```text
Happy

Happy → Optimistic

Happy → Optimistic → Hopeful
```

---

# 20. Intensity UX

Immediately after selecting an emotion, make intensity easy to specify.

Example:

```text
Optimistic

Intensity
1 ─────●────── 10
       7
```

On mobile, ensure the interaction is touch friendly.

Do not make intensity mandatory unless there is a strong existing product reason.

---

# 21. Impact Picker

Impact selection should support multiple Impact Areas.

Example:

```text
What influenced this?

☑ People
   Sarah
   John
   + Add person

☑ Work
   Project Alpha
   + Add work item

☐ Health
☐ Fitness
☐ Habits

+ New Impact Area
```

Search must work across both:

```text
Impact Areas
Entities
```

Searching:

```text
Sarah
```

should make it easy to select:

```text
People → Sarah
```

---

# 22. Dedicated Emotion Settings

Add an Emotion Management screen under Settings.

For example:

```text
/settings/emotions
```

Support:

- browse hierarchy
- create
- rename
- change color
- reorder
- change parent
- archive
- restore
- hide
- unhide
- delete where safe
- reset defaults

Show hierarchy clearly.

Example:

```text
Happy
 ├─ Playful
 │   ├─ Aroused
 │   └─ Cheeky
 ├─ Content
 └─ Interested
```

Drag-and-drop can be used if it is accessible, but provide an accessible alternative.

---

# 23. Impact Area Settings

Provide a management screen such as:

```text
/settings/impact-areas
```

Example:

```text
People
  Mom
  Dad
  Sarah
  John

Work
  Project Alpha
  Client XYZ

Fitness
  Running
  Gym
```

Users can:

- create Impact Area
- rename Impact Area
- archive Impact Area
- reorder Impact Areas
- create entity
- rename entity
- move entity to another Impact Area where sensible
- archive entity
- delete unused entity

Maintain historical integrity using the same principles as emotions.

---

# 24. People Are Not Special-Cased

Do **not** create a hardcoded People subsystem merely because People is a common Impact Area.

The generic architecture should support:

```text
People → Sarah

Work → Project Alpha

Fitness → Running

Habits → Meditation
```

All should use the same `ImpactArea` / `ImpactEntity` architecture.

This allows users to create arbitrary domains later.

---

# 25. Future Habit Integration

Impact entities may eventually reference objects from other integrations.

For example:

```text
Habits
  Meditation
  Reading
  Gym
```

may later correspond to an actual Habit integration.

Therefore design entities so they can eventually support:

```ts
sourceType?
externalId?
metadata?
```

Do **not** implement the Habit integration unless one already exists or is explicitly required.

Do not tightly couple `ImpactEntity` to any external service.

---

# 26. Search

Extend journal search/filtering to support emotional context.

Users should eventually be able to filter:

```text
Emotion = Anxious
Emotion under = Fearful
Intensity >= 7

Impact Area = Work
Impact Entity = Project Alpha

Emotion = Happy
AND
Impact Area = People
```

Initial implementation should at minimum support:

- exact emotion filtering
- Impact Area filtering
- Impact Entity filtering

Structure services so hierarchy-aware filtering can be added cleanly.

---

# 27. Analytics Readiness

Do **not** turn the journal into an analytics dashboard.

However, structure the data so future reflection features can answer questions such as:

```text
Which emotions occur most frequently?

Which areas are most associated with stress?

Which people frequently appear alongside happiness?

How has anxiety intensity changed over time?

Which emotions are associated with work?

What emotional patterns occur around specific habits?
```

Do not precompute unnecessary analytics during normal journal writing.

Use normalized, queryable data.

---

# 28. Privacy

Emotion data is highly personal journal information.

Treat it with the same privacy requirements as journal content.

Every operation must:

1. resolve authenticated user server-side
2. validate input
3. load target resource
4. verify ownership
5. perform operation

Never trust browser-provided `userId`.

Never expose another user's:

- emotions
- Impact Areas
- entities
- section associations
- journal data

Do not send emotional/journal data to third-party analytics.

---

# 29. Database Integrity

Use appropriate:

- foreign keys
- indexes
- uniqueness constraints
- check constraints
- RLS where compatible
- soft deletion
- timestamps

Likely indexes include concepts such as:

```text
Emotion(userId, normalizedName)
Emotion(userId, parentEmotionId)
Emotion(userId, isArchived)

EntrySection(entryId, position)

SectionEmotion(entrySectionId)
SectionEmotion(emotionId)
SectionEmotion(emotionId, intensity)

ImpactArea(userId, normalizedName)

ImpactEntity(userId, impactAreaId)
ImpactEntity(impactAreaId, normalizedName)

SectionImpactArea(entrySectionId)
SectionImpactArea(impactAreaId)

SectionImpactEntity(sectionImpactAreaId)
SectionImpactEntity(impactEntityId)
```

Adapt naming to the actual schema.

---

# 30. Migration Safety

Before creating migrations, inspect the existing:

- Entry schema
- editor content model
- autosave implementation
- Supabase migrations
- RLS policies
- repository/data layer

Do not break existing entries.

If introducing `EntrySection` requires changing existing entry storage, provide a backward-compatible migration strategy.

Prefer incremental migration over destructive rewriting.

---

# 31. Autosave

Emotion and Impact selections should participate safely in the existing autosave architecture.

Changing:

```text
emotion
intensity
Impact Area
Impact Entity
section order
section content
```

must persist reliably.

Avoid excessive requests while the intensity slider is moving.

Debounce where appropriate.

Do not allow an older autosave response to overwrite newer state.

---

# 32. Application Services

Do not put business logic directly in React components.

Introduce/reuse application services such as:

```ts
createEntrySection()
updateEntrySection()
deleteEntrySection()
reorderEntrySections()

setSectionEmotion()
removeSectionEmotion()
setEmotionIntensity()

createEmotion()
updateEmotion()
archiveEmotion()
hideEmotion()
deleteEmotion()
resetEmotionLibrary()

createImpactArea()
updateImpactArea()
archiveImpactArea()

createImpactEntity()
updateImpactEntity()
archiveImpactEntity()

addImpactAreaToSection()
removeImpactAreaFromSection()

addImpactEntityToSection()
removeImpactEntityFromSection()
```

These services should eventually be reusable by:

- web
- mobile
- API
- integrations
- imports
- automation

---

# 33. Validation

Use Zod or the repository's existing validation approach.

Validate:

## Emotion

```text
name length
normalized uniqueness
maximum hierarchy depth = 3
valid parent
no self-parent
no hierarchy cycles
ownership
valid color
```

## Intensity

```text
integer
1 <= intensity <= 10
```

## Impact Area

```text
name
normalized uniqueness
ownership
```

## Impact Entity

```text
name
Impact Area ownership
normalized uniqueness within area
```

## Associations

Verify all referenced resources belong to the same authenticated user.

---

# 34. Import / Export

Update journal export so emotional context is not lost.

Machine-readable exports should include:

```text
sections
section order
section content

emotion
emotion hierarchy/context where needed
emotion intensity

Impact Areas
Impact Entities
```

Historical entries should remain understandable even if the current emotion library changes.

Do not create a proprietary-only representation.

---

# 35. Accessibility

All new UI must support:

- keyboard navigation
- accessible labels
- screen readers
- visible focus states
- touch
- sufficient contrast
- light mode
- dark mode
- reduced motion

Do not represent emotion exclusively through:

```text
color
emoji
icon
```

Always include textual emotion names.

---

# 36. Mobile UX

This feature must work extremely well on mobile.

Use:

- bottom sheets where appropriate
- large touch targets
- searchable selectors
- compact selected chips
- minimal editor obstruction

The emotion picker should not cover the user's writing unnecessarily.

Impact selection should remain usable with one hand where practical.

---

# 37. Performance

Assume users may eventually have:

```text
100,000+ entries
thousands of section-emotion records
thousands of impact associations
hundreds of custom entities
```

Do **not** load all historical emotional associations into the browser.

Use indexed server-side queries.

Emotion/Impact configuration itself is small enough to cache sensibly per user.

Avoid N+1 queries when loading journal sections and their emotional context.

---

# 38. Tests

Add automated tests covering at minimum:

## Sections

- create section
- update section
- reorder sections
- delete section
- section ownership

## Emotions

- create custom emotion
- three-level hierarchy
- reject fourth level
- prevent cycles
- rename
- archive
- hide
- restore
- color
- user isolation
- reset defaults

## Section Emotion

- assign emotion
- replace emotion
- remove emotion
- one emotion per section
- intensity validation
- historical integrity

## Impact Areas

- create
- rename
- archive
- duplicate prevention
- user isolation

## Impact Entities

- create
- rename
- associate with area
- duplicate prevention
- ownership

## Section Impact

- multiple Impact Areas per section
- multiple entities per area
- remove association
- duplicate prevention

## Quick Add

- create emotion from editor
- create Impact Area from editor
- create entity from editor
- immediately select newly created value

## Security

Ensure user A cannot:

- access user B's emotions
- modify user B's emotions
- access user B's Impact Areas
- attach user B's entities
- modify emotional metadata on user B's entries

---

# 39. Suggested Implementation Sequence

Do **not** implement everything in one uncontrolled change.

First inspect the repository and produce a short implementation plan.

Then implement approximately:

```text
1. Entry section domain + migration
2. Emotion domain + default taxonomy
3. Emotion hierarchy management
4. Section emotion + intensity
5. Emotion picker
6. Emotion settings
7. Impact Area domain
8. Impact Entity domain
9. Section Impact associations
10. Impact picker + quick add
11. Impact settings
12. Search/filter integration
13. Export integration
14. Tests and documentation
```

Adapt this order if the existing architecture suggests a safer approach.

---

# 40. Git Requirements

Follow the repository's existing Git discipline.

Before implementation:

```bash
git status
git log --oneline
```

Do **not** initialize Git if the application is already inside a Git repository.

Create focused commits.

Possible commits:

```text
feat: add journal entry sections
feat: add emotion taxonomy and hierarchy
feat: add section emotion tracking
feat: add emotion intensity tracking
feat: add emotion picker
feat: add emotion management settings
feat: add journal impact areas
feat: add impact area entities
feat: associate impact context with entry sections
feat: add inline emotion and impact creation
feat: add emotion and impact search filters
feat: include emotional context in journal exports
test: add emotion and impact domain coverage
docs: document emotional context architecture
```

Do not create commits merely to match this example.

Each commit must represent a coherent, working feature.

Before every commit inspect:

```bash
git status
git diff
git diff --staged
```

Do not commit unrelated changes.

---

# 41. Documentation

Update README/architecture documentation with:

```text
Entry Section architecture
Emotion hierarchy
Default emotion taxonomy
Custom emotion behavior
Reset behavior
Archive / Hide / Delete semantics
Emotion intensity
Impact Areas
Impact Entities
Section associations
Database schema
Indexes
RLS/security
Quick-add workflow
Search integration
Export representation
Historical integrity strategy
```

---

# 42. Definition of Done

This feature is complete when an authenticated user can:

1. Write a journal entry containing sections.
2. Add/remove/reorder sections.
3. Assign zero or one emotion to each section.
4. Give that emotion an optional 1–10 intensity.
5. Browse a three-level emotion hierarchy.
6. Use the default emotion library.
7. Create custom emotions.
8. Rename/recolor/archive/hide custom emotions.
9. Reset their emotion configuration to defaults safely.
10. Preserve historical emotional data after configuration changes.
11. Assign multiple Impact Areas to a section.
12. Assign multiple entities within those Impact Areas.
13. Create Impact Areas directly from the journal editor.
14. Create entities directly from the journal editor.
15. Create custom emotions directly from the journal editor.
16. Search/select emotions and impacts quickly.
17. Manage emotions from Settings.
18. Manage Impact Areas/entities from Settings.
19. Access the feature comfortably on desktop and mobile.
20. Export entries without losing emotional context.
21. Access only their own emotional/journal data.
22. Pass automated tests.
23. Pass lint.
24. Pass production build.

---

# 43. Final Engineering Constraint

Do not treat this as merely adding a `mood` column to `Entry`.

The domain is intentionally:

```text
Journal Entry
      │
      ├── Section
      │     │
      │     ├── Emotion (0..1)
      │     │      └── Intensity
      │     │
      │     └── Impact Areas (0..N)
      │              │
      │              └── Entities (0..N)
      │
      └── Section
            │
            ├── Emotion (0..1)
            │      └── Intensity
            │
            └── Impact Areas (0..N)
                    └── Entities (0..N)
```

Emotion hierarchy:

```text
Emotion
   └── Emotion
          └── Emotion

Maximum depth = 3
```

Impact hierarchy:

```text
Impact Area
   └── Entity

No further nesting.
```

Preserve these domain rules throughout the database, service layer, API boundaries, UI, search, import/export, and tests.

Before coding, inspect the existing implementation and explicitly identify how these changes will integrate with the existing Entry model, editor, autosave system, Supabase schema, authentication/ownership model, search, and export architecture.

Do not replace working architecture merely because a greenfield implementation would be easier.
