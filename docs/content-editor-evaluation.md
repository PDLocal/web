# Content Editor Evaluation — TipTap vs. Lexical vs. BlockNote

_Last updated: 2026-07-26_

## Context

PD Local stores authored rich content (member-written events and articles,
staff-written Patient Profiles/guidance) as **structured JSON in Prisma**,
edited via an **embedded rich-text editor** — not a headless CMS. See
`docs/steelcitybg-comparison.md` for why. This doc evaluates the three leading
React editor libraries against PD Local's needs.

**The gating constraint is accessibility:** authors are people with Parkinson's
/ motor challenges, so the editor UI must be keyboard-first and forgiving — no
reliance on drag-and-drop, hover-only toolbars, or slash menus.

## Decision

**Recommended: TipTap v3.** Alternative: **Lexical.** Rejected for this
audience: **BlockNote.**

## Why

### Accessibility (decisive)

- **TipTap & Lexical are headless** — they ship _no_ UI, so we build a plain,
  always-visible, button-based toolbar with no drag/hover/slash interactions and
  full control over ARIA and focus.
- **BlockNote ships a Notion-style UI** whose defaults (hover side-menu, mouse
  drag-to-reorder, slash menu) are exactly the antipatterns that hurt
  motor-impaired users. It can be disabled and rebuilt on its Ariakit variant,
  but that means fighting the library, custom keyboard block-reordering, and it
  has a history of keyboard-path regressions.
- **None of the three certifies WCAG conformance.** All market a11y; none
  guarantee it. The required work (custom keyboard-first toolbar, mandatory
  image alt-text, no drag/hover/slash, screen-reader testing) is natural with
  the headless editors and a retrofit with BlockNote.

### Comparison summary

| Dimension                 | TipTap v3 ✅                                                                                                                                                                  | Lexical (alt)                                                                                                                 | BlockNote ❌                                                                                                                          |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **License / cost**        | MIT core; $0 self-hosted. 10 formerly-Pro extensions (incl. FileHandler/image) open-sourced June 2025. Paid = TipTap Cloud SaaS only (collab/AI/export), which we don't need. | **100% MIT, purest** — no paid tier, no SaaS, ever.                                                                           | MPL-2.0 core free; "XL" extras (AI, multi-column, DOCX/PDF export) are GPL-3.0-or-commercial ($2,340/yr; nonprofit terms on request). |
| **A11y**                  | Headless; semantic HTML output, `role="textbox"`. No WCAG cert; toolbar ARIA is ours.                                                                                         | Headless; `EditorState`-reconciliation gives best cross-AT contenteditable reliability. WCAG claims are marketing, unaudited. | Default UX depends on drag/hover/slash. No a11y guarantee.                                                                            |
| **Output / storage**      | ProseMirror JSON (store this) + HTML/Markdown.                                                                                                                                | `EditorState` JSON (store this) + HTML/Markdown.                                                                              | Block JSON (store this) + HTML; Markdown lossy.                                                                                       |
| **SSR (React Router 7)**  | **Best** — `@tiptap/static-renderer` turns stored JSON → HTML/React/Markdown with **no DOM/browser**. Editor itself client-only (`immediatelyRender: false`).                 | Good — `@lexical/headless`; Markdown path DOM-free, HTML needs a JSDOM shim. Editor client-first.                             | `ServerBlockNoteEditor` renders static HTML, but docs carry an unresolved React 19 StrictMode note (verify on 0.52.x).                |
| **Image upload → Tigris** | FileHandler (free/MIT) on drop/paste → POST to existing `storage.server.ts` pipeline.                                                                                         | Most custom — images are a custom `DecoratorNode` (good playground reference to adapt).                                       | Most turnkey (`uploadFile`/`resolveFileUrl`, pre-signed S3 example) — least relevant given a11y.                                      |
| **Maturity**              | **v3 stable (July 2025), past 1.0**; ~38k stars; ueberdosis.                                                                                                                  | Meta-backed (powers FB/IG/WhatsApp); pre-1.0 (v0.48); ~24k stars — pin versions.                                              | TypeCell + NLnet grants; pre-1.0 (v0.52); ~10k stars; built on ProseMirror/TipTap.                                                    |
| **DX / TS**               | TS-native; lowest boilerplate; StarterKit + `editor.chain()...` and `editor.isActive()` for `aria-pressed`.                                                                   | TS-native; steepest curve — assemble `LexicalComposer` + plugins + own toolbar.                                               | TS-native; fastest to a working editor, but minimal a11y UI means opting out of defaults.                                             |

### Why TipTap leads for PD Local

1. **Best DOM-free SSR** — content (articles, event descriptions) renders
   constantly in React Router loaders; the static renderer turns stored JSON
   into HTML/React with no browser.
2. **Free image handling** wires straight into the existing Tigris
   `storage.server.ts` pipeline.
3. **Lowest boilerplate** to a hand-built, keyboard-first accessible toolbar.
4. **Only one past 1.0** — API stability for a long-lived, largely
   solo-maintained project.

### When to pick Lexical instead

- Licensing absolutism (100% MIT, zero commercial surface) matters for a
  donation-funded app.
- We hit contenteditable/assistive-tech reliability bugs — Lexical's
  `EditorState` reconciliation is the most robust defense.
- Costs: more boilerplate, pre-1.0 churn, build the image node ourselves, JSDOM
  shim for HTML SSR.

## Authoring UX (production)

Authoring happens **inside the app**, behind the same login and RBAC — there is
no separate Studio at another URL (the key departure from the Sanity/SteelCityBg
model). On a content page (e.g. `/faq`):

- **Normal users** get a read-only, styled, SSR-rendered view (Prisma query →
  TipTap static renderer).
- **Users with the relevant permission** (e.g. `update:faq`) see the same page
  plus editing affordances: "+ Add", per-item "Edit"/"Delete", and "Move ↑/↓"
  (explicit buttons, never drag).

**Edit on a dedicated route, not an overlay.** Anything containing the rich-text
editor opens as a full **page** (`/admin/faq/:id/edit`, mirroring the Epic Stack
Notes `$noteId_.edit` pattern) — not a drawer or modal. Rationale for our older
/ motor-impaired audience:

- Overlays (drawer/modal) require focus-trapping, `aria-modal`, Escape handling,
  and focus restoration done perfectly, or they strand keyboard/screen-reader
  users. A full page needs none of that.
- The editor opens its own sub-dialogs (insert link, insert image + alt-text);
  nesting those inside a modal/drawer is a focus-trap-within-a-focus-trap. On a
  page they're the only overlay.
- A page gives room for large text and big targets; modals/drawers get cramped.
- No accidental click-outside dismissal wiping unsaved writing; native URL +
  back button for free.

Cost is minor loss of list context — handled with a "← Back" link and returning
to the list (scrolled to the item, with a toast) after Save.

**Overlays only for trivial, editor-free actions** — a "Delete this question?"
confirmation or a quick reorder — where the focus-trap surface is tiny and
there's no content to lose.

The same machinery generalizes: a member authoring an event/article uses the
same editor on its own route, gated by a different permission (e.g.
`create:event:own`); permissions decide who sees controls.

## Implementation notes (apply to whichever we pick)

- Build a **minimal, always-visible, button-based toolbar**; no
  drag/hover/slash. `aria-pressed` on toggle buttons, managed focus,
  `Alt+F10`-style toolbar access.
- **Mandatory alt-text** on image insert; keyboard-accessible image controls.
- If block reordering is needed, use explicit **"move up / move down" buttons**,
  not drag handles.
- Gate the interactive editor to **client-only**; render stored content
  **server-side** (static renderer / headless).
- **Budget dedicated screen-reader + keyboard testing** — none of these is
  accessible out of the box.

## Open items to verify before/at implementation

- TipTap has no React-Router-specific SSR guide (pattern is framework-agnostic —
  confirm with a spike).
- Lexical's pre-1.0 status → pin versions, read release notes.
- BlockNote's exact XL license terms and whether the React 19 StrictMode note
  still applies to 0.52.x (only relevant if BlockNote is reconsidered).
