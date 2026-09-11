# Chronicle Compass Roadmap

## Current State
- **Upload UI**: PDF/image drag-and-drop on home page with simulated extraction progress
- **Search UI**: Query interface with language selection modal and timeline display
- **Settings UI**: Preferences for translation and ingestion (non-functional)
- **State**: In-memory React context with mock data
- **Stack**: React 19, TanStack Start, Tailwind CSS v4, shadcn/ui

---

## Phase 1: Real Search Engine & Timeline Building
**Objective**: Wire search to stored newspapers and extract entities and dates to build real timelines.

### 1.1 Extract Text from PDFs
- [ ] Integrate PDF parsing library (pdfjs or pdf-parse for server-side)
- [ ] Build server-side function in `src/lib/documents.functions.ts`:
  - `extractPdfText(buffer: Buffer): Promise<{ pages: Page[], language: string }>`
  - Detect language using existing AI capability (`ai.server.ts`)
- [ ] Handle multi-page documents
- [ ] Store extracted text in `IndexedDB` locally or Supabase (ready for persistence)

### 1.2 Entity & Date Extraction
- [ ] Add AI extraction to `ai.server.ts`:
  - `extractEntitiesAndDates(text: string, language: string): Promise<{ entities: Entity[], dates: DateMention[] }>`
  - Use Claude or similar to identify: people, places, organizations, events
  - Extract date references (absolute and relative)
- [ ] Schema in `src/lib/news-context.tsx`:
  ```typescript
  type Entity = { name: string; type: 'person' | 'place' | 'organization' | 'event' };
  type DateMention = { date: string; confidence: number; context: string };
  ```

### 1.3 Real Search Logic
- [ ] Update `search.functions.ts`:
  - `searchEntity(query: string): TimelineItem[]`
  - Search extracted entities and their context across all documents
  - Match query term against entity names and aliases
- [ ] Merge entities from multiple mentions (same person in different newspapers)
- [ ] Return timeline sorted by date

### 1.4 Update news-context.tsx
- [ ] Add `allEntities: Entity[]` to context
- [ ] Track extracted document content: `documents: { id, name, extractedText, entities, dates }`
- [ ] Update `runSearch()` to call real search functions instead of mock

---

## Phase 2: User Sign-In & Persistence
**Objective**: Build sign-in screen so each user's uploaded newspapers persist between sessions.

### 2.1 Authentication
- [ ] Supabase Auth integration (already in `package.json`)
- [ ] Create sign-in route: `src/routes/auth/login.tsx`
  - Email/password form
  - Social login option (Google/GitHub)
- [ ] Create sign-up route: `src/routes/auth/signup.tsx`
- [ ] Protect routes: `/search`, `/settings`, and upload features require auth
- [ ] Add sign-out button to sidebar

### 2.2 Database Schema
- [ ] Supabase tables:
  - `users` (from Supabase Auth)
  - `documents` (id, user_id, name, language, published_at, content, extracted_at)
  - `entities` (id, document_id, name, type, context)
  - `dates` (id, document_id, date, confidence, context)
  - `user_preferences` (user_id, default_language, auto_extract, keep_original)

### 2.3 Update Context for Persistence
- [ ] Add `userId` to NewsContext
- [ ] Load `uploadedFiles` and preferences from Supabase on app init
- [ ] Sync `addFiles()` to database
- [ ] Update settings to save preferences to database

### 2.4 Upload to Supabase Storage
- [ ] On file upload:
  - Store PDF in Supabase Storage (not in DB blob)
  - Extract text → entities → dates server-side
  - Store metadata in `documents` and `entities` tables
  - Return extracted structure to UI

---

## Phase 3: End-to-End Real Workflow
**Objective**: Walk the real end-to-end: upload a real PDF, search an entity, pick a language, confirm nodes sort and expand.

### 3.1 Real PDF Upload Flow
- [ ] Update `/routes/index.tsx` (upload page):
  - Accept PDF upload
  - Call server function to extract text + entities
  - Show extraction progress (real, not simulated)
  - Display extracted language, entity count, date range
- [ ] Server function `processUploadedPdf()`:
  - Read PDF buffer
  - Extract text with page numbers
  - Run entity/date extraction
  - Insert into Supabase
  - Return doc ID

### 3.2 Search Against Real Data
- [ ] `/routes/search.tsx` - Query Engine:
  - User enters entity name (e.g., "Winston Churchill")
  - Search returns all mentions across documents
  - Show source newspaper, date, extracted context
- [ ] Verify entities are correctly extracted and deduplicated

### 3.3 Language Selection → Timeline Translation
- [ ] LanguageModal confirmation triggers:
  - `translateTimelineItems(results, targetLanguage)`
  - Call AI to translate summaries to target language
  - Keep original text in collapsible "View Original"
- [ ] Test with 2-3 real newspapers in different languages

### 3.4 Timeline Display & Sorting
- [ ] Vertical timeline (already styled) displays sorted results
  - Sort button (oldest/newest) works in real data
  - Expandable cards show original + translated text
  - No missing mentions

---

## Phase 4: Entity Tagging UI for Documents
**Objective**: Build tagging screen for each newspaper so users can label entities manually, then rebuild timeline from tags.

### 4.1 Entity Tagger Component
- [ ] New route: `/routes/documents/$documentId/tag.tsx`
- [ ] UI layout:
  - Left: Full extracted text with highlighted entities
  - Right: Sidebar with entity list (people, places, events)
  - Buttons: "Add Tag", "Remove", "Merge Duplicates"
- [ ] Allow user to:
  - Highlight text and assign entity type + name
  - Edit auto-extracted entities (correct AI mistakes)
  - Merge detected duplicates (e.g., "Churchill" + "Winston Churchill")
  - Confirm/save tags

### 4.2 Update Database
- [ ] Add `user_tagged` boolean to `entities` table
- [ ] Store manual corrections separately
- [ ] Endpoint: `PATCH /api/documents/{id}/entities` - save user tags
- [ ] Re-index search after tags change

### 4.3 Tag-Based Timeline Building
- [ ] Update search to prioritize user-tagged entities (higher confidence)
- [ ] Option to "Use Only Tagged Entities" in search settings
- [ ] Show tag confidence/source badge (AI vs. user-tagged)

### 4.4 Link Tagger to Upload
- [ ] After PDF extraction, show "Tag Entities" button on document card
- [ ] Optional workflow: Upload → Extract → Tag → Search
- [ ] Or: Upload → Skip tagging → Search immediately

---

## Phase 5: Real Timeline UI
**Objective**: Build the real timeline UI on top of stored articles with vertical nodes, dates, expandable source text, and sort controls.

### 5.1 Timeline Component Rebuild
- [ ] Component: `src/components/timeline-view.tsx`
  - Vertical line with circular date markers
  - Each node is a card with:
    - Date (bold)
    - Source newspaper + badge
    - Language badge
    - Translated summary (main text)
    - Expandable: original text, entity tags, date confidence
  - No missing mentions; all results visible
- [ ] Smooth animations when sorting

### 5.2 Sort & Filter Controls
- [ ] Sort: Oldest First / Newest First
- [ ] Filter by source newspaper (checkboxes)
- [ ] Filter by language (dropdown)
- [ ] Filter by entity type (people / places / events)
- [ ] Keyword highlight in timeline text

### 5.3 Timeline Persistence
- [ ] Save search queries as "timeline reports"
  - User can name and export as PDF/JSON
  - Timestamped, searchable

---

## Implementation Notes

### Tech Decisions
- **PDF extraction**: `pdfjs-dist` (client) + `pdf-parse` (server) or `PyPDF2` via API
- **Entity extraction**: Claude API (via `ai.server.ts`) or fine-tuned model
- **Language detection**: Google Cloud Natural Language or similar
- **Storage**: Supabase Storage (PDFs) + PostgreSQL (metadata/entities)
- **Persistence**: Supabase Auth + DB + localStorage for offline cache

### File Structure (after completion)
```
src/
  routes/
    auth/
      login.tsx
      signup.tsx
    documents/
      $documentId/
        tag.tsx
    index.tsx         (updated: real upload)
    search.tsx        (updated: real search)
    settings.tsx      (updated: persist preferences)
  components/
    timeline-view.tsx (new: real timeline UI)
    entity-tagger.tsx (new: tagging interface)
  lib/
    ai.server.ts      (updated: entity extraction)
    documents.functions.ts (updated: PDF extraction)
    search.functions.ts (updated: real search logic)
    auth.server.ts    (new: Supabase auth)
    db.ts             (new: Supabase client)
    news-context.tsx  (updated: real state + persistence)
```

### Testing Checklist
- [ ] Upload 2+ real PDFs in different languages
- [ ] Extract entities correctly (AI accuracy)
- [ ] Search entity across all documents
- [ ] Translate results to 3 different languages
- [ ] Sort timeline ascending/descending
- [ ] Expand/collapse source text on timeline nodes
- [ ] Filter by newspaper and sort controls
- [ ] Manual entity tagging + re-index
- [ ] Sign out and sign back in; data persists
- [ ] Export timeline as PDF

---

## Dependencies to Add
```bash
npm install pdfjs-dist pdf-parse date-fns
npm install @supabase/supabase-js@latest  # already present
```

### Environment Variables (`.env.local`)
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_CLAUDE_API_KEY=... (if using Claude server-side)
```

---

## Success Criteria
1. ✅ Upload real newspaper PDF → extract text + entities
2. ✅ Search entity name → see all mentions in timeline
3. ✅ Pick output language → see translated text
4. ✅ Sort + expand timeline → all nodes visible and interactive
5. ✅ Sign in → uploaded documents persist across sessions
6. ✅ Tag entities manually → search respects user corrections
7. ✅ Export timeline as formatted report (PDF/JSON)
