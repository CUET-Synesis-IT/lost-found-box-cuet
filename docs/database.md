# Database Schema

The initial migration is [202609140001_initial_schema.sql](../supabase/migrations/202609140001_initial_schema.sql). Apply it through the Supabase CLI migration workflow or SQL editor; do not make untracked production schema changes.

## Relationships

```text
auth.users ── 1:1 ── profiles
     ├── 1:N ── posts
     └── 1:N ── claims (claimant_id)
posts (FOUND) ── 1:N ── claims (found_post_id)
posts (LOST)  ── 1:N ── claims (related_lost_post_id)
claims (APPROVED) ── 1:1 ── resolutions
resolutions ── 1:1 ── lost post and found post
```

All identifiers are UUIDs. Event and audit timestamps are `timestamptz` in UTC; clients render Bangladesh Standard Time.

## Tables and domain values

| Table | Purpose |
| --- | --- |
| `profiles` | One application profile per `auth.users` account. |
| `posts` | User-owned LOST or FOUND report. |
| `claims` | Claim on a FOUND post tied to the claimant's LOST post. |
| `resolutions` | Final record linking an approved claim and both resolved posts. |

- Post types: `LOST`, `FOUND`
- Post statuses: `ACTIVE`, `CLAIM_PENDING`, `RESOLVED`, `ARCHIVED`
- Claim statuses: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`
- Categories use the MVP controlled list from the implementation plan.

## Integrity and approval transaction

Foreign keys, enums, check constraints, indexes, and triggers enforce:

- A claim points to a FOUND post and a claimant-owned LOST post; self-claims are rejected.
- Posts with any claim history cannot be deleted.
- Each approved claim, lost post, and found post can have only one resolution.
- A resolution must match its approved claim and both posts must be resolved.
- Deferred constraint triggers require a resolution for every approved claim and resolved post at commit time.

The future FastAPI approval transaction must approve the claim, resolve both posts, and insert the resolution atomically. Partial state fails at commit.

## Indexes and RLS

Indexes support feed ordering, owner dashboards, similarity candidates (`post_type`, `status`, `event_time`), category filtering, and claim lookups.

RLS is enabled on every table:

- Public users read active posts only; owners also read their own non-public posts.
- Users create, edit, and delete only their posts. Browser roles cannot write lifecycle status.
- Users read/update only their own profile display fields.
- Claimants and found-post owners read claims; browser users create claims only as themselves and cannot alter claim status.
- Resolutions are visible only to owners of a participating post.

Critical status transitions remain FastAPI responsibilities using server-only database access.

## Apply and verify

```powershell
supabase db push
```

```sql
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('profiles', 'posts', 'claims', 'resolutions');
```

## Storage image policy

Migration `202609140002_lost_found_images_storage.sql` creates the public
`lost-found-images` bucket. It accepts only JPEG, PNG, and WebP objects up to
5 MB. Browser uploads use `posts/{user_id}/{post_id}/{filename}`. Storage RLS
permits authenticated inserts, updates, and deletes only when the second path
segment equals `auth.uid()`. The application saves the returned public URL in
`posts.image_url`; PostgreSQL does not store image binaries.
