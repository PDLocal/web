# Email Broadcast — v1 Implementation Plan

_Last updated: 2026-07-26_

The first PD Local feature. Goal: get Dara out of a manually-managed
spreadsheet + BCC workflow (tedious **and** a privacy risk) and into a real,
group-scoped broadcast system. Background and the decisions behind this plan:
`docs/content-editor-evaluation.md` (TipTap), and the memory notes on the
product vision, permission model, and email feature.

## Scope

**In (v1):**

- One local `Group` (Dara's), with a location and its roster imported from the
  spreadsheet (<100).
- Group admins email their own group; site admins can email all members.
- Compose on a dedicated route with the TipTap editor; send via Resend;
  per-recipient unsubscribe.
- Explicit email opt-in captured on new self-registrations.

**Out (deferred):** multiple groups per user, geo-radius/"find groups near me"
discovery, segments, scheduling, open/click analytics, drip sequences, A/B.
(Schema is shaped so these don't require a migration — notably membership is a
join table, not a FK on `User`.)

## Why group-scoped (recap)

PD Local email is **location-scoped** — "BBQ at South Park pavilion" is
meaningless to a member in Santa Fe. So the audience is _a local group's
roster_, not a flat list. Group (vs. geo-radius) is the right primitive: bounded
known audience, matches how PD communities organize, and gives a clean
permission boundary. The two email scopes carry different content by nature:
**group email = local**; **site-admin all-member email = global/platform**
(announcements, policy, fundraising).

## Data model (Prisma additions)

Follows existing conventions (`cuid()` ids, `createdAt`/`updatedAt`, explicit
indexes on FKs).

```prisma
model Group {
  id          String  @id @default(cuid())
  name        String
  slug        String  @unique          // for /groups/:slug URLs
  description String  @default("")

  // Location — the group is the geo unit for email in v1.
  city        String
  state       String                    // US for now; generic enough for later
  postalCode  String?
  latitude    Float?                    // nullable — for future "near me" matching, not used in v1
  longitude   Float?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  memberships GroupMembership[]
  broadcasts  Broadcast[]
}

// The roster AND the email audience. A row may exist before the person registers
// (imported contact, userId null) and gets linked to a User on registration.
model GroupMembership {
  id               String  @id @default(cuid())
  role             String  @default("member")  // 'member' | 'admin'  (admin = group admin, e.g. Dara)
  email            String                       // delivery address (canonical pre-registration)
  name             String?
  emailSubscribed  Boolean @default(true)
  unsubscribeToken String  @unique @default(cuid())

  group   Group  @relation(fields: [groupId], references: [id], onDelete: Cascade, onUpdate: Cascade)
  groupId String

  // Linked once the person registers (matched by email). Null = imported-but-not-registered contact.
  user   User?   @relation(fields: [userId], references: [id], onDelete: SetNull, onUpdate: Cascade)
  userId String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([groupId, email])
  @@index([groupId])
  @@index([userId])
  @@index([groupId, emailSubscribed])   // the send query
}

// A sent (or draft) broadcast — audit trail + "sent history" + resend.
model Broadcast {
  id        String    @id @default(cuid())
  subject   String
  bodyJson  String                       // TipTap document JSON (see editor eval doc)
  status    String    @default("draft")  // 'draft' | 'sending' | 'sent'
  sentAt    DateTime?

  // Null groupId = site-wide (all members), site-admin only. Set = a specific group.
  group   Group?  @relation(fields: [groupId], references: [id], onDelete: SetNull, onUpdate: Cascade)
  groupId String?

  sender   User   @relation(fields: [senderId], references: [id], onDelete: Cascade, onUpdate: Cascade)
  senderId String

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([groupId])
  @@index([senderId])
}
```

Add the inverse relations to `User` (`memberships GroupMembership[]`,
`broadcasts Broadcast[]`).

Per-recipient delivery tracking (`BroadcastRecipient`) is **deferred** — for
<100 recipients a send-time log + Resend dashboard is enough.

Migration: `npx prisma migrate dev --name add-groups-and-broadcasts`.

## Permissions

Site admin is a **global** Epic Stack `Role` ('admin'). Group admin is
**relational** (admin _of a specific group_), so it lives on
`GroupMembership.role` — it is **not** a global Permission row, and the generic
`requireUserWithPermission` (which only checks global roles) can't express it.
Add a bespoke helper in `app/utils/permissions.server.ts`:

```ts
// Passes if the user is a site admin OR a group admin of THIS group. Returns userId.
export async function requireGroupAdmin(request: Request, groupId: string) {
	const userId = await requireUserId(request)
	const user = await prisma.user.findFirst({
		select: { id: true },
		where: {
			id: userId,
			OR: [
				{ roles: { some: { name: 'admin' } } }, // site admin
				{ memberships: { some: { groupId, role: 'admin' } } }, // group admin of this group
			],
		},
	})
	if (!user)
		throw data(
			{ error: 'Unauthorized', message: 'Requires group admin' },
			{ status: 403 },
		)
	return userId
}
```

- **Group send** (`/groups/:slug/broadcasts/*`) →
  `requireGroupAdmin(request, group.id)`.
- **Site-wide send** (all members) → existing
  `requireUserWithRole(request, 'admin')`.
- Ladder: anonymous < group member < group admin < site admin. Every registered
  user belongs to ≥1 group (enforced at registration — no limbo state).

## Routes & flow

Reuses the Epic Stack dedicated-edit-route pattern (cf.
`users/$username/notes/$noteId_.edit.tsx`).

- `app/routes/groups/$slug/index.tsx` — group home; for group admins, shows
  roster + "Email this group" + broadcast history.
- `app/routes/groups/$slug/members.tsx` — roster admin: list, add/remove, import
  (paste CSV / upload), toggle `emailSubscribed`. `requireGroupAdmin`.
- `app/routes/groups/$slug/broadcasts/new.tsx` — **compose** (dedicated page,
  not a modal): subject input + TipTap editor. Saves a `Broadcast` draft.
  `requireGroupAdmin`.
- `app/routes/groups/$slug/broadcasts/$id.tsx` — review/preview + **Send**
  action. `requireGroupAdmin`.
- `app/routes/resources/unsubscribe.tsx` — **public** (no auth): `?token=…` →
  flips `emailSubscribed = false` for that membership. Idempotent, one-click,
  its own confirmation page.
- Onboarding/signup: add an **email opt-in checkbox**; on register, create/link
  the user's `GroupMembership` (match imported contact by email) with
  `emailSubscribed` from the checkbox.

**Send action outline:**

1. `requireGroupAdmin`; load `emailSubscribed` memberships for the group.
2. Set broadcast `status: 'sending'`.
3. Render the email once per recipient (unsubscribe link is per-recipient) and
   send via Resend. For <100, one **Resend batch call** (`/emails/batch`,
   max 100) or a small-concurrency loop over the existing `sendEmail` in
   `app/utils/email.server.ts`.
4. Set `status: 'sent'`, `sentAt`; toast + redirect back to the group.

## Email composition & rendering

- Store the TipTap document as JSON in `Broadcast.bodyJson`.
- At send time: TipTap JSON → **email-safe HTML**, wrapped in a **react-email**
  template (`app/components/emails/GroupBroadcast.tsx`) that provides the shell,
  `<Tailwind>`, header, and the legally-required **footer**: unsubscribe link +
  physical postal address (CAN-SPAM). Render via the existing `renderReactEmail`
  path.
- **Risk to validate in the spike:** email clients need inlined styles / simple
  markup. Converting arbitrary TipTap HTML into email-safe HTML is the trickiest
  bit — constrain the editor to paragraphs, headings, bold/italic, links,
  bullet/numbered lists, and images, and confirm they render across Gmail/Apple
  Mail/Outlook.
- Add a `List-Unsubscribe` / `List-Unsubscribe-Post` header (RFC 8058) for
  one-click unsubscribe in Gmail/Apple Mail — nice-to-have, improves
  deliverability.

## Prerequisites (one-time ops — user tasks)

1. Register/choose the sending domain and set **`RESEND_API_KEY`** (see
   `env.server.ts`; today `sendEmail` mocks without it).
2. Change the hardcoded `from` (`hello@epicstack.dev` in `email.server.ts`) to a
   PD Local address.
3. **Domain auth**: add SPF, DKIM, DMARC DNS records (Resend provides them).
   Without this, broadcasts land in spam / get the domain blocklisted. This is
   the single most important deliverability step.
4. Decide the postal address for the footer (org-level in config is fine for v1;
   per-group later).

## Build order

1. **Spike (de-risk first):** minimal TipTap editor in this repo → store JSON →
   convert to email HTML → wrap in a react-email template → send one broadcast
   to 2–3 test addresses via Resend, with a working unsubscribe link. Proves the
   whole pipe **and** the TipTap→email-HTML conversion.
2. Prisma models + migration (`Group`, `GroupMembership`, `Broadcast`) + seed
   Dara's group.
3. `requireGroupAdmin` helper.
4. Roster route + spreadsheet import (CSV paste/upload → `GroupMembership`
   rows).
5. Compose route (TipTap) + draft save.
6. Send action (batched) + react-email template + CAN-SPAM footer.
7. Public unsubscribe route.
8. Signup opt-in checkbox + link-contact-to-user on registration.

## Open decisions (not blocking the spike)

- **Resend transactional batch (list in our DB)** vs **Resend Broadcasts (list
  in theirs)** — plan assumes the former for data ownership. Revisit if we want
  their hosted audience/unsubscribe.
- Import UX: CSV upload vs. paste. (Paste is simpler for one <100 list.)
- Footer postal address: org-level vs. per-group.
