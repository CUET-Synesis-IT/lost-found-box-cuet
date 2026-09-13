# CUET Lost and Found Box

## Complete Implementation Plan

**Version:** MVP / Version 1

**Frontend:** Next.js + TypeScript + Tailwind CSS

**Backend:** FastAPI + Python

**Authentication:** Supabase Auth with Google OAuth

**Database:** Supabase PostgreSQL

**Storage:** Supabase Storage

---

# 1. Purpose

The purpose of this project is to build a web-based **Lost and Found Box for CUET** where members of the CUET community can report lost items and found items.

The application should provide a centralized platform where users can:

- Report a lost item.
- Report a found item.
- Browse active lost and found posts.
- Search and filter posts.
- View detailed information about an item.
- Upload an optional image.
- Automatically discover potentially matching lost/found posts.
- Claim a found item.
- Review and approve or reject claims.
- Mark successfully returned items as resolved.

The main unique feature of the application is an automatic **similarity matching system**.

For every lost item post, the system should identify and display the most similar found item posts.

For every found item post, the system should identify and display the most similar lost item posts.

The initial version should return the **top 5 most similar active posts**.

---

# 2. Product Vision

The product should solve a common problem inside a university campus.

Currently, when someone loses an item, information about the item may be shared through:

- Facebook groups.
- Messenger groups.
- Department groups.
- Personal contacts.
- Notice boards.
- Informal communication.

Similarly, when someone finds an item, it may be difficult to identify the actual owner.

The CUET Lost and Found Box should provide one centralized platform:

```text
User loses an item
        ↓
Creates LOST post
        ↓
System searches existing FOUND posts
        ↓
Shows top similar matches
        ↓
Owner can inspect possible matches
        ↓
Owner submits claim
        ↓
Finder reviews claim
        ↓
Finder approves claim
        ↓
Item is returned
        ↓
Both posts become RESOLVED
```

The reverse flow should also work:

```text
User finds an item
        ↓
Creates FOUND post
        ↓
System searches existing LOST posts
        ↓
Shows top similar matches
        ↓
Possible owner submits claim
        ↓
Finder verifies ownership
        ↓
Finder approves claim
        ↓
Both posts become RESOLVED
```

The first version should focus on providing a complete and working end-to-end experience.

Do not over-engineer the MVP.

---

# 3. Scope

## 3.1 Must-Have Features

These are mandatory for the MVP.

### Authentication

- Supabase authentication.
- OAuth-based login.
- Session persistence.
- Logout.
- Protected application routes.
- Backend Supabase JWT validation.
- CUET institutional email validation.

### Lost and Found Posts

- Create LOST post.
- Create FOUND post.
- View all posts.
- View single post.
- Edit own post.
- Delete own post.
- Optional image.
- Post category.
- Description.
- Location.
- Lost/found date and time.
- Post status.

### Browsing

- Lost/found filtering.
- Category filtering.
- Search.
- Pagination.
- Post detail page.

### Similarity Matching

- LOST posts compared only with FOUND posts.
- FOUND posts compared only with LOST posts.
- Top 5 similar posts.
- Category similarity.
- Description similarity.
- Location similarity.
- Time similarity.
- Similarity score.
- Similar post links.

### Claim System

- Claim a found item.
- Select a related lost post.
- Add an optional explanation.
- Finder can view received claims.
- Finder can approve a claim.
- Finder can reject a claim.
- Approved claim resolves related posts.
- Resolution relationship is stored.

### Dashboard

- My posts.
- My lost posts.
- My found posts.
- My resolved posts.
- My submitted claims.
- Claims received for found posts.

### Technical Requirements

- Responsive UI.
- Backend validation.
- Authorization.
- Error handling.
- Database migrations/schema management.
- Secure environment variables.
- Supabase Storage configuration.
- Basic backend testing.
- Manual frontend testing.
- Deployment-ready configuration.
- README documentation.

---

## 3.2 Explicitly Out of Scope for MVP

Do not implement these unless the MVP is completely working and there is significant remaining time.

- Real-time chat between finder and claimant.
- AI chatbot.
- Image recognition.
- Image similarity matching.
- Push notifications.
- Email notifications.
- SMS notifications.
- Advanced moderation system.
- Reputation points.
- Social features.
- Machine learning training pipeline.
- Microservice architecture.
- Complex analytics.
- Mobile application.
- Multi-language support.
- Advanced semantic vector database infrastructure.

These can be documented under **Future Enhancements**.

---

# 4. Architecture

Use a simple three-layer architecture.

```text
                         ┌──────────────────────┐
                         │      CUET User       │
                         │       Browser        │
                         └──────────┬───────────┘
                                    │
                                    │ HTTPS
                                    ▼
                         ┌──────────────────────┐
                         │       Next.js        │
                         │      Frontend        │
                         │                      │
                         │ Authentication UI    │
                         │ Posts UI             │
                         │ Search / Filter      │
                         │ Similarity UI        │
                         │ Claims UI            │
                         │ Dashboard            │
                         └──────────┬───────────┘
                                    │
                              REST / JSON
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │       FastAPI        │
                         │       Backend        │
                         │                      │
                         │ JWT Validation       │
                         │ Authorization        │
                         │ Post Logic           │
                         │ Claim Logic          │
                         │ Similarity Engine    │
                         │ Validation           │
                         └──────────┬───────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │           Supabase            │
                    │                               │
                    │  Supabase Auth                │
                    │  PostgreSQL Database          │
                    │  Supabase Storage             │
                    └───────────────────────────────┘
```

The frontend should not directly perform critical business operations against the database.

Important operations should go through FastAPI.

Examples:

```text
Create Post
Update Post
Delete Post
Create Claim
Approve Claim
Reject Claim
Resolve Posts
Calculate Similarity
```

Authentication is handled through Supabase Auth.

FastAPI must validate the authenticated user's Supabase access token before allowing protected operations.

---

# 5. Recommended Repository Structure

Use a monorepo.

```text
cuet-lost-found/
│
├── frontend/
│
├── backend/
│
├── docs/
│   ├── architecture.md
│   ├── database.md
│   ├── api.md
│   └── screenshots/
│
├── .gitignore
│
├── .env.example
│
└── README.md
```

---

## 5.1 Frontend Structure

```text
frontend/
│
├── src/
│   │
│   ├── app/
│   │   ├── page.tsx
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx
│   │   │
│   │   ├── auth/
│   │   │   └── callback/
│   │   │
│   │   ├── posts/
│   │   │   ├── page.tsx
│   │   │   ├── create/
│   │   │   └── [id]/
│   │   │
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   ├── posts/
│   │   │   └── claims/
│   │   │
│   │   └── layout.tsx
│   │
│   ├── components/
│   │   ├── auth/
│   │   ├── posts/
│   │   ├── claims/
│   │   ├── dashboard/
│   │   ├── layout/
│   │   └── ui/
│   │
│   ├── lib/
│   │   ├── api/
│   │   ├── supabase/
│   │   └── utils/
│   │
│   ├── hooks/
│   │
│   └── types/
│
├── public/
│
├── .env.example
│
└── package.json
```

---

## 5.2 Backend Structure

```text
backend/
│
├── app/
│   │
│   ├── main.py
│   │
│   ├── api/
│   │   ├── dependencies.py
│   │   │
│   │   └── v1/
│   │       ├── posts.py
│   │       ├── claims.py
│   │       └── health.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   └── security.py
│   │
│   ├── schemas/
│   │   ├── post.py
│   │   ├── claim.py
│   │   └── common.py
│   │
│   ├── services/
│   │   ├── post_service.py
│   │   ├── claim_service.py
│   │   └── similarity_service.py
│   │
│   ├── repositories/
│   │   ├── post_repository.py
│   │   └── claim_repository.py
│   │
│   └── database/
│       ├── session.py
│       └── models/
│
├── tests/
│
├── .env.example
│
└── requirements.txt
```

Keep the similarity system isolated.

The rest of the application should not depend on a specific TF-IDF implementation.

---

# 6. Technology Stack

## Frontend

Use:

```text
Next.js
TypeScript
App Router
Tailwind CSS
Supabase JavaScript client
```

Optional UI library:

```text
shadcn/ui
```

Do not add unnecessary frontend libraries.

---

## Backend

Use:

```text
FastAPI
Python
Pydantic
SQLAlchemy
```

Use a clear service structure.

---

## Database

Use:

```text
Supabase PostgreSQL
```

Supabase is responsible for:

```text
Authentication
PostgreSQL
Storage
```

---

# 7. Authentication Design

Use Supabase Auth.

The initial application uses **Google OAuth**.

CUET users authenticate via their institutional Google accounts
(`@student.cuet.ac.bd` or `@cuet.ac.bd`).

The architecture should support institutional authentication without tightly coupling application logic to one provider.

---

## 7.1 Allowed CUET Email Patterns

Student emails follow a pattern similar to:

```text
u2104087@student.cuet.ac.bd
```

Students should therefore use:

```text
@student.cuet.ac.bd
```

Faculty and staff emails follow a pattern similar to:

```text
name@cuet.ac.bd
```

Therefore:

```text
@cuet.ac.bd
```

should also be allowed.

---

## 7.2 Important Email Validation Rule

The frontend may validate the email domain for user experience.

However:

```text
Frontend validation alone is NOT sufficient.
```

The backend must verify the authenticated user's email before allowing protected operations.

Conceptually:

```text
User Login
      ↓
Supabase Auth
      ↓
Supabase Access Token
      ↓
Frontend stores session
      ↓
Frontend calls FastAPI
      ↓
Authorization: Bearer <access_token>
      ↓
FastAPI validates token
      ↓
FastAPI verifies CUET email
      ↓
Allow or deny request
```

---

# 8. User Model

For the MVP, use one primary authenticated user type.

All authenticated users can:

- Create lost posts.
- Create found posts.
- Browse posts.
- Claim found items.
- Manage their own posts.
- Manage claims related to their found posts.

There is no need to create separate student, teacher, and staff roles in Version 1.

The important requirement is:

```text
The user must belong to the CUET institutional community.
```

---

# 9. Database Design

The primary tables are:

```text
profiles
posts
claims
resolutions
```

---

## 9.1 profiles

```text
profiles
```

Suggested fields:

```text
id
email
full_name
avatar_url
created_at
updated_at
```

`id` should correspond to the Supabase Auth user ID.

**Profile creation:**

A `profiles` row is created automatically when a user first authenticates.
This can be handled by a Supabase database trigger on the `auth.users` table,
or by the backend during the first authenticated request.

The backend must not assume a profile row already exists; it should create
one if missing when the user performs their first protected operation.

---

## 9.2 posts

```text
posts
```

Suggested fields:

```text
id

user_id

post_type

category

description

location

event_time

image_url

status

created_at

updated_at
```

**Timezone:**

All `event_time` and `created_at` / `updated_at` values are stored in UTC.
CUET is in Bangladesh (UTC+06:00). The frontend should convert timestamps to
Bangladesh Standard Time (BST) for display purposes.

Backend calculations (e.g. time similarity) operate on UTC timestamps.

---

## 9.3 Post Type

Allowed values:

```text
LOST
FOUND
```

---

## 9.4 Post Status

Suggested values:

```text
ACTIVE
CLAIM_PENDING
RESOLVED
ARCHIVED
```

Meaning:

### ACTIVE

The item is currently lost or available for claim.

### CLAIM\_PENDING

A found post has one or more claims awaiting review.

For the MVP, a found post **may receive multiple concurrent claims**.

Claims are reviewed independently. The post status transitions to CLAIM\_PENDING
when at least one PENDING claim exists, and returns to ACTIVE when all claims
have been rejected or cancelled.

Do not automatically block all claims unless the business rule requires it.

### RESOLVED

The item has been successfully returned.

### ARCHIVED

The post is no longer active but is retained for history.

---

# 10. Categories

Use predefined categories.

Initial categories:

```text
Electronics

Wallet

Keys

ID Card

Documents

Bag

Books

Clothing

Accessories

Money

Other
```

For the MVP, categories can be stored as a validated enum or controlled list.

Do not create a full category management system unless there is a clear need.

---

# 11. Claims Table

The `claims` table represents an ownership claim against a found item.

```text
claims
```

Suggested fields:

```text
id

found_post_id

claimant_id

related_lost_post_id

message

status

created_at

updated_at
```

---

## 11.1 Claim Status

```text
PENDING

APPROVED

REJECTED

CANCELLED
```

---

# 12. Resolutions Table

When a claim is approved, store the final relationship.

```text
resolutions
```

Suggested fields:

```text
id

lost_post_id

found_post_id

claim_id

resolved_at
```

This allows the application to preserve the relationship between the lost post and the found post.

---

# 13. Database Relationships

```text
User
 │
 ├───────────────┐
 │               │
 ▼               ▼
Posts          Claims
 │
 │
 ├──── LOST
 │
 └──── FOUND
        │
        ▼
      Claims
        │
        ▼
    Approved Claim
        │
        ▼
     Resolution
        │
        ├── Lost Post
        │
        └── Found Post
```

---

# 14. Database Constraints

Important rules should be enforced at the backend and database level where appropriate.

Examples:

```text
post_type must be LOST or FOUND.

status must be a valid status.

claimant_id must exist.

found_post_id must reference a FOUND post.

related_lost_post_id must reference a LOST post.

Only one approved resolution should exist for a resolved post.
```

The application must prevent inconsistent resolution states.

---

# 15. Row-Level Security

Supabase Row-Level Security should be configured appropriately.

Basic principles:

Users may:

```text
Read public active posts.

Read their own posts.

Create their own posts.

Update their own posts.

Delete their own posts.

Create claims as themselves.

Read their own claims.
```

Users must not be able to:

```text
Modify another user's posts.

Delete another user's posts.

Approve another user's claims.

Create a claim on behalf of another user.

Change ownership of a post.
```

Critical operations should still be validated by FastAPI.

---

# 16. Post Creation Flow

```text
Authenticated User
        ↓
Create Post Form
        ↓
Select LOST or FOUND
        ↓
Enter Category
        ↓
Enter Description
        ↓
Enter Location
        ↓
Select Date/Time
        ↓
Optional Image
        ↓
Submit
        ↓
FastAPI Validation
        ↓
Create Post
        ↓
Post Status = ACTIVE
        ↓
Redirect to Post Details
```

---

# 17. Image Strategy

Use Supabase Storage.

Create a bucket:

```text
lost-found-images
```

Suggested structure:

```text
posts/{user_id}/{post_id}/{filename}
```

Example:

```text
posts/uuid/post-uuid/wallet.jpg
```

Validate:

- File type.
- File size.

Recommended formats:

```text
JPEG
PNG
WebP
```

Do not store large image binaries directly inside PostgreSQL.

Store the public image URL returned by Supabase Storage in `image_url`.

The bucket should be configured for public read so that image URLs can be
displayed without authentication. Upload and delete are restricted to the
owner's path via Row-Level Security or application-level authorization.

---

# 18. Posts API

Use the base path:

```text
/api/v1
```

---

## 18.1 Create Post

```text
POST /api/v1/posts
```

Requires authentication.

---

## 18.2 Get Posts

```text
GET /api/v1/posts
```

Support:

```text
post_type

category

status

search

page

limit
```

Example:

```text
GET /api/v1/posts?post_type=LOST&category=Wallet
```

**Public feed visibility:**

Resolved posts are **not** visible in the public feed.

The default `GET /api/v1/posts` endpoint returns only posts with status ACTIVE.
The `status` filter may be used to explicitly request other statuses,
but resolved posts are excluded from the default public listing.

Authenticated users may view their own resolved posts via the dashboard.

---

## 18.3 Get Post

```text
GET /api/v1/posts/{post_id}
```

---

## 18.4 Update Post

```text
PUT /api/v1/posts/{post_id}
```

Only the owner may update the post.

---

## 18.5 Delete Post

```text
DELETE /api/v1/posts/{post_id}
```

Only the owner may delete the post.

**Deletion policy:**

A post that has an associated claim (PENDING, APPROVED, or REJECTED) may **not** be deleted.

Only posts with no claims may be deleted.

Editing a claimed post is allowed; deleting is not.

---

# 19. Similarity Matching

This is the primary unique feature of the application.

The system should compare:

```text
LOST
   ↕
FOUND
```

The system should never compare:

```text
LOST ↔ LOST

FOUND ↔ FOUND
```

---

# 20. Similarity Matching Goal

For every lost post:

```text
Lost Post
    ↓
Find Active Found Posts
    ↓
Calculate Similarity
    ↓
Sort by Score
    ↓
Return Top 5
```

For every found post:

```text
Found Post
    ↓
Find Active Lost Posts
    ↓
Calculate Similarity
    ↓
Sort by Score
    ↓
Return Top 5
```

---

# 21. Similarity Score

For Version 1, use a weighted hybrid score.

Suggested initial formula:

```text
Final Score =

Description Similarity × 0.40

+

Category Similarity × 0.30

+

Location Similarity × 0.20

+

Time Similarity × 0.10
```

The weights should be configurable.

Do not scatter these weights throughout the application.

Keep them inside the similarity service configuration.

---

# 22. Category Similarity

Initial implementation:

```text
Same category = 1.0

Different category = 0.0
```

Example:

```text
Wallet ↔ Wallet = 1.0

Wallet ↔ Keys = 0.0
```

Future versions may support related categories.

---

# 23. Description Similarity

For Version 1, use:

```text
TF-IDF

+

Cosine Similarity
```

Example:

```text
Lost:
Black leather wallet containing CUET student ID.

Found:
Dark leather wallet found near the CUET library.
```

These descriptions should receive a relatively high similarity score.

---

## 23.1 Future Upgrade

The implementation should later support:

```text
Sentence Embeddings

+

Cosine Similarity

+

pgvector
```

Do not implement this in the MVP.

The important architectural requirement is:

```text
The similarity algorithm must be replaceable without changing the rest of the application.
```

---

# 24. Location Similarity

Version 1 can use normalized text similarity.

Examples:

```text
Central Library

CUET Central Library
```

should receive a relatively high similarity score.

Normalize:

```text
Lowercase

Trim whitespace

Remove unnecessary punctuation
```

Do not build a geographic map system for the MVP.

---

# 25. Time Similarity

Items found close to the time they were lost may receive a higher score.

Example:

```text
Lost:
September 10, 3:00 PM

Found:
September 10, 4:00 PM
```

should receive a higher score than:

```text
Lost:
September 1

Found:
October 15
```

Use a simple normalized time-distance scoring function.

**Normalization:**

All timestamps are compared in UTC.

Compute the absolute time difference in hours between `event_time` of the two
posts. Convert this difference to a score in the range [0, 1] using a
decreasing function, for example:

```text
time_score = 1 / (1 + hours_difference / time_decay_constant)
```

A configurable `time_decay_constant` (default: 24 hours) controls how quickly
the score decays with distance. A difference of 0 hours yields 1.0;
a difference of 24 hours yields 0.5.

The frontend displays times in Bangladesh Standard Time (BST, UTC+06:00).

---

# 26. Similarity Service

Create:

```text
similarity_service.py
```

Conceptual interface:

```python
calculate_similarity(post_a, post_b)
```

and:

```python
get_similar_posts(post_id, limit=5)
```

The service should return:

```text
post_id

post_type

category

description

location

event_time

image_url

similarity_score
```

---

# 27. Similar Posts API

Create:

```text
GET /api/v1/posts/{post_id}/similar
```

Example response:

```json
[
  {
    "post_id": "uuid",
    "post_type": "FOUND",
    "category": "Wallet",
    "description": "Black wallet found near the library.",
    "location": "Central Library",
    "event_time": "2026-09-10T16:00:00",
    "similarity_score": 0.87
  }
]
```

Return at most:

```text
5 posts
```

Only active opposite-type posts should normally be considered.

Resolved posts must not appear in similarity recommendations.

---

# 28. Claim System

A user can claim a found item.

The claimant should select one of their own lost posts.

The claim should optionally contain an explanation.

Example:

```text
I believe this wallet belongs to me because it contains my
CUET student ID and my identification cards.
```

---

# 29. Claim Flow

```text
User opens FOUND post
        ↓
Click "Claim This Item"
        ↓
System loads user's ACTIVE LOST posts
        ↓
User selects related LOST post
        ↓
Optional explanation
        ↓
Submit Claim
        ↓
Claim = PENDING
        ↓
Found Post = CLAIM_PENDING (if not already)
        ↓
Finder reviews claim
        │
        ├──────── Approve
        │             ↓
        │       Claim = APPROVED
        │             ↓
        │       Found Post = RESOLVED
        │             ↓
        │       Lost Post = RESOLVED
        │             ↓
        │       Create Resolution
        │
        └──────── Reject
                      ↓
                Claim = REJECTED
                      ↓
                If no PENDING claims remain:
                      ↓
                Found Post = ACTIVE
```

**Multiple concurrent claims:**

A found post may receive multiple PENDING claims simultaneously.
Each claim is reviewed independently. The found post is set to CLAIM\_PENDING
when the first PENDING claim arrives, and returns to ACTIVE only when no
PENDING claims remain (all rejected or cancelled, or none approved).

---

# 30. Claim Validation

The backend must verify:

```text
Claimant is authenticated.

Found post exists.

Found post is ACTIVE or CLAIM_PENDING.

Claimant does not own the found post.

Related lost post exists.

Related lost post belongs to claimant.

Related lost post has type LOST.

Related lost post is ACTIVE.
```

Do not rely on frontend validation.

---

# 31. Claims API

## Create Claim

```text
POST /api/v1/claims
```

---

## Get My Claims

```text
GET /api/v1/claims/my
```

---

## Get Claims for a Found Post

```text
GET /api/v1/posts/{post_id}/claims
```

Only the owner of the found post may access received claims.

---

## Approve Claim

```text
POST /api/v1/claims/{claim_id}/approve
```

---

## Reject Claim

```text
POST /api/v1/claims/{claim_id}/reject
```

---

# 32. Claim Approval Transaction

Claim approval must be handled atomically.

The process is:

```text
BEGIN TRANSACTION

        ↓

Load Claim

        ↓

Verify Claim = PENDING

        ↓

Verify authenticated user owns FOUND post

        ↓

Verify LOST post is ACTIVE

        ↓

Set Claim = APPROVED

        ↓

Set FOUND post = RESOLVED

        ↓

Set LOST post = RESOLVED

        ↓

Create Resolution Record

        ↓

COMMIT
```

If any step fails:

```text
ROLLBACK
```

The system must never end in a state such as:

```text
Claim = APPROVED

Found Post = RESOLVED

Lost Post = ACTIVE
```

or:

```text
Claim = APPROVED

Found Post = ACTIVE

Lost Post = RESOLVED
```

All related state changes must succeed or fail together.

---

# 32.1 Claim Rejection Behavior

Claim rejection is handled atomically.

The process is:

```text
BEGIN TRANSACTION

        ↓

Load Claim

        ↓

Verify Claim = PENDING

        ↓

Verify authenticated user owns FOUND post

        ↓

Set Claim = REJECTED

        ↓

If no PENDING claims remain for the found post:

        ↓

Set FOUND post = ACTIVE

        ↓

COMMIT
```

If any step fails:

```text
ROLLBACK
```

When a claim is approved, the found post transitions to RESOLVED
immediately, regardless of any remaining PENDING claims. This is because
approval means the item has been returned and is no longer available.

When a claim is rejected, the found post returns to ACTIVE only if no
other PENDING claims remain.

---

# 33. Post Detail Page

The post detail page should display:

```text
Image

Post Type

Category

Description

Location

Lost/Found Time

Status

Post Information
```

Below the main post:

For a LOST post:

```text
Similar Found Items
```

For a FOUND post:

```text
Similar Lost Items
```

Display up to five matches.

Each match should contain:

```text
Category

Short Description

Location

Time

Similarity Percentage

Link to Post
```

---

# 34. Frontend Pages

Recommended routes:

```text
/
```

Homepage.

```text
/login
```

Login.

```text
/auth/callback
```

Supabase OAuth callback.

```text
/posts
```

Posts feed.

```text
/posts/create
```

Create post.

```text
/posts/[id]
```

Post details.

```text
/dashboard
```

User dashboard.

```text
/dashboard/posts
```

User's posts.

```text
/dashboard/claims
```

User's claims and received claims.

---

# 35. Dashboard

The dashboard should include:

## My Posts

```text
My Lost Posts

My Found Posts

Resolved Posts
```

---

## My Claims

```text
Pending

Approved

Rejected
```

---

## Claims Received

For found posts owned by the user:

```text
Claimant

Related Lost Post

Claim Message

Claim Status

Approve

Reject
```

---

# 36. API Client

Create a centralized API client.

Example:

```text
frontend/src/lib/api/
```

Do not scatter raw `fetch()` calls throughout all components.

The API client should handle:

```text
Base API URL

HTTP Methods

JSON Parsing

Supabase Access Token

Authorization Header

Common Error Handling
```

Organize API functions logically:

```text
postsApi

claimsApi

profileApi
```

---

# 37. Error Handling

Use appropriate backend HTTP responses.

Examples:

```text
400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

409 Conflict

422 Validation Error

500 Internal Server Error
```

Frontend should convert common API errors into understandable messages.

Examples:

```text
You must log in to perform this action.

You do not have permission to edit this post.

This item is no longer available for claiming.

This claim has already been processed.

The selected lost post is no longer active.
```

---

# 38. Environment Variables

## Frontend

```text
NEXT_PUBLIC_SUPABASE_URL=

NEXT_PUBLIC_SUPABASE_ANON_KEY=

NEXT_PUBLIC_API_BASE_URL=
```

---

## Backend

```text
SUPABASE_URL=

SUPABASE_JWT_SECRET=

DATABASE_URL=

CORS_ORIGINS=
```

Never commit real secrets.

Provide:

```text
.env.example
```

with placeholders.

---

# 39. Database Schema Management

Since Supabase provides the PostgreSQL database, the project should have a clear schema migration strategy.

The workflow should be:

```text
Modify Database Model / Schema

        ↓

Create Migration

        ↓

Review Migration

        ↓

Apply Migration

        ↓

Test Database
```

Do not manually change production database structure without recording the change.

Document migration commands.

---

# 40. Supabase Storage Security

The storage system should ensure users cannot arbitrarily modify another user's files.

Recommended conceptual policy:

```text
User uploads to their own path.

User can modify/delete files in their own path.

Public viewing policy depends on the application design.
```

For example:

```text
posts/{user_id}/...
```

The application should not trust a user-provided path without validating ownership.

---

# 41. Security Requirements

Review:

```text
Supabase token validation.

CUET email verification.

Backend authorization.

Post ownership.

Claim ownership.

Finder authorization.

Database transaction safety.

Input validation.

Image validation.

Environment secrets.

CORS configuration.
```

Never assume:

```text
The frontend can enforce security.
```

All important authorization checks must exist in the backend.

---

# 42. Testing

## Backend Tests

Test:

```text
Unauthorized post creation.

Authorized post creation.

Unauthorized post update.

Authorized post update.

Unauthorized post deletion.

Claim creation validation.

Claiming own found post.

Invalid related lost post.

Unauthorized claim approval.

Claim rejection.

Successful claim approval.

Transaction consistency.

Similarity filtering.

LOST ↔ FOUND comparison.

Resolved post exclusion.
```

---

## Similarity Tests

Test:

```text
Same category.

Different category.

Very similar descriptions.

Unrelated descriptions.

Similar locations.

Different locations.

Close event times.

Distant event times.

Correct top-5 ordering.
```

---

# 43. Recommended Implementation Sequence

Implement incrementally.

Do not attempt to build everything in one prompt.

```text
1. Read and understand requirements

        ↓

2. Create repository structure

        ↓

3. Configure Next.js

        ↓

4. Configure FastAPI

        ↓

5. Configure Supabase project

        ↓

6. Configure environment variables

        ↓

7. Implement health endpoint

        ↓

8. Configure Supabase authentication

        ↓

9. Implement OAuth callback

        ↓

10. Implement protected routes

        ↓

11. Implement backend JWT validation

        ↓

12. Create database schema

        ↓

13. Configure RLS policies

        ↓

14. Implement Post schemas

        ↓

15. Implement Posts CRUD API

        ↓

16. Test post authorization

        ↓

17. Build login UI

        ↓

18. Build homepage

        ↓

19. Build posts feed

        ↓

20. Build create post form

        ↓

21. Build post detail page

        ↓

22. Implement image upload

        ↓

23. Implement search/filter

        ↓

24. Build centralized API client

        ↓

25. Implement similarity service

        ↓

26. Implement similarity API

        ↓

27. Test similarity logic

        ↓

28. Build similarity UI

        ↓

29. Create claims schema

        ↓

30. Implement claim creation

        ↓

31. Implement received claims

        ↓

32. Implement claim approval transaction

        ↓

33. Implement claim rejection

        ↓

34. Build dashboard

        ↓

35. Security review

        ↓

36. Backend tests

        ↓

37. Frontend manual QA

        ↓

38. Responsive UI polishing

        ↓

39. Deployment configuration

        ↓

40. Production testing

        ↓

41. Documentation

        ↓

42. Final demonstration preparation
```

---

# 44. Definition of Done

The MVP is complete only when all of the following are true.

## Authentication

- [ ] User can log in using supported OAuth.
- [ ] Supabase session persists correctly.
- [ ] User can log out.
- [ ] Protected routes work.
- [ ] Backend validates Supabase JWT.
- [ ] Non-CUET users cannot access protected application features.

## Posts

- [ ] User can create LOST post.
- [ ] User can create FOUND post.
- [ ] User can upload optional image.
- [ ] User can browse posts.
- [ ] User can search posts.
- [ ] User can filter posts.
- [ ] User can view post details.
- [ ] User can edit own post.
- [ ] User can delete own post (only if no claims exist).
- [ ] User cannot modify another user's post.
- [ ] Resolved posts are not visible in the public feed.

## Similarity

- [ ] LOST posts show similar FOUND posts.
- [ ] FOUND posts show similar LOST posts.
- [ ] Maximum 5 results are returned.
- [ ] Similarity scores are normalized.
- [ ] Results are ordered correctly.
- [ ] Resolved posts are excluded.
- [ ] Same-type posts are not compared.

## Claims

- [ ] User can claim a found item.
- [ ] User can select one of their lost posts.
- [ ] User cannot claim own found post.
- [ ] Multiple concurrent claims are allowed.
- [ ] Finder can view received claims.
- [ ] Finder can approve claim.
- [ ] Finder can reject claim.
- [ ] Approval resolves both posts.
- [ ] Rejection returns the found post to ACTIVE if no PENDING claims remain.
- [ ] Resolution relationship is stored.
- [ ] Approval uses an atomic transaction.

## Dashboard

- [ ] User can view own posts.
- [ ] User can view own claims.
- [ ] User can view received claims.
- [ ] Resolved posts are visible appropriately.

## Technical

- [ ] Supabase database works.
- [ ] Authentication works.
- [ ] Storage works.
- [ ] API documentation works.
- [ ] Environment variables are documented.
- [ ] Backend validation works.
- [ ] Authorization works.
- [ ] Error handling works.
- [ ] Tests pass.
- [ ] README is complete.
- [ ] Critical end-to-end flow works.

---

# 45. Priority System

If time becomes limited, implement according to this priority.

## P0 — Absolutely Required

```text
Supabase Authentication

CUET Email Restriction

Lost Post Creation

Found Post Creation

Post Browsing

Post Details

Similarity Matching

Top 5 Similar Posts

Claim Creation

Claim Approval/Rejection

Resolution Workflow

Backend Authorization
```

---

## P1 — Important

```text
Search

Filtering

Image Upload

Dashboard

Edit Posts

Delete Posts

Responsive UI

Testing

Documentation
```

---

## P2 — Only If Time Allows

```text
Advanced Similarity Improvements

Better Animations

Advanced Search

Post Archiving

More Detailed Analytics

Admin Moderation

Notifications

Image Similarity
```

Do not start P2 features while P0 features are unfinished.

---

# 46. Suggested Final Demonstration

The final presentation should demonstrate one complete story.

## Part 1 — Lost Item

Show:

```text
Login

    ↓

Create LOST Post

    ↓

Enter Item Information

    ↓

Publish Post

    ↓

Open Post Details

    ↓

Show Similar FOUND Posts
```

---

## Part 2 — Found Item

Then:

```text
Login as Another User

    ↓

Create FOUND Post

    ↓

Publish

    ↓

Open Post

    ↓

Show Similar LOST Posts
```

---

## Part 3 — Claim

Then:

```text
Open FOUND Post

    ↓

Click Claim This Item

    ↓

Select Related LOST Post

    ↓

Submit Claim

    ↓

Claim = PENDING
```

---

## Part 4 — Resolution

Finally:

```text
Finder Dashboard

    ↓

Open Received Claim

    ↓

Review Related LOST Post

    ↓

Approve Claim

    ↓

Claim = APPROVED

    ↓

FOUND Post = RESOLVED

    ↓

LOST Post = RESOLVED
```

This demonstrates the complete unique workflow of the application.

---

# 47. Documentation Requirements

Prepare these documents.

## README.md

Include:

- Project description.
- Features.
- Architecture.
- Technology stack.
- Prerequisites.
- Supabase setup.
- Environment variables.
- Installation.
- Running frontend.
- Running backend.
- Database setup.
- Storage setup.
- API documentation.
- Test commands.

---

## docs/architecture.md

Include:

- System architecture.
- Frontend/backend interaction.
- Supabase integration.
- Authentication flow.
- Similarity flow.
- Claim resolution flow.

---

## docs/database.md

Include:

- ER diagram.
- Tables.
- Relationships.
- Constraints.
- Resolution relationship.

---

## docs/api.md

Include:

- Endpoint list.
- Authentication requirements.
- Request examples.
- Response examples.
- Error responses.

---

# 48. Future Enhancements

Potential future improvements:

```text
Sentence Embeddings

Semantic Similarity

pgvector

Automatic Background Matching

Email Notifications

Push Notifications

In-App Messaging

Image Similarity

Admin Moderation

Report Abuse

Map-Based Location Selection

Post Expiration

Advanced Search

Mobile Application
```

These should not delay Version 1.

---

# 49. Coding-Agent Instructions

When using Codex, Cursor, Claude Code, or another coding agent, do not ask it to build the entire application in one prompt.

Use incremental implementation.

The agent should always:

1. Read the implementation plan.
2. Inspect the existing repository.
3. Implement only the requested phase.
4. Avoid unrelated refactoring.
5. Run relevant tests.
6. Report files changed.
7. Report commands executed.
8. Report remaining issues.

---

## Prompt 1 — Requirements Analysis

```text
Read IMPLEMENTATION_PLAN.md completely.

Do not implement anything yet.

Analyze the requirements for CUET Lost and Found Box.

Identify:

1. architecture decisions
2. technical risks
3. ambiguities
4. Supabase integration requirements
5. authentication requirements
6. database relationships
7. implementation dependencies

Then propose the initial implementation sequence.

Do not add features outside the specified MVP.
```

---

## Prompt 2 — Project Setup

```text
Implement Phase 1 of IMPLEMENTATION_PLAN.md.

Set up:

- monorepo structure
- Next.js frontend
- FastAPI backend
- TypeScript configuration
- Tailwind CSS
- backend environment configuration
- frontend environment configuration
- CORS for local development
- backend health endpoint

Do not implement authentication or business features yet.

Create:

frontend/
backend/
docs/

Create .env.example files.

Add a GET /health endpoint.

The frontend should have a simple homepage confirming that the application is running.

After implementation:

1. list files changed
2. list commands executed
3. report results
4. report remaining issues
```

---

## Prompt 3 — Supabase Setup

```text
Implement the Supabase integration required by IMPLEMENTATION_PLAN.md.

Configure the project architecture for:

- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage

Do not hardcode secrets.

Create the required environment variables.

Create reusable Supabase client configuration for the Next.js frontend.

Create backend configuration for validating Supabase access tokens.

Do not implement posts or claims yet.

After implementation, document:

1. Supabase project configuration required
2. environment variables required
3. local testing steps
```

---

## Prompt 4 — Authentication

```text
Implement authentication according to IMPLEMENTATION_PLAN.md.

Requirements:

- Supabase OAuth login
- login page
- authentication callback
- session persistence
- logout
- protected routes
- backend access token validation

CUET users should be allowed only if their authenticated email matches:

@student.cuet.ac.bd

or

@cuet.ac.bd

Do not rely only on frontend validation.

FastAPI must validate the Supabase access token and authenticated user information before protected operations.

Create a reusable backend dependency:

get_current_user()

Do not implement posts yet.

Test the authentication flow.
```

---

## Prompt 5 — Database Schema

```text
Implement the database schema described in IMPLEMENTATION_PLAN.md.

Create:

profiles
posts
claims
resolutions

Use appropriate:

- UUID identifiers
- foreign keys
- timestamps
- indexes
- constraints

Implement the required post types:

LOST
FOUND

Implement post statuses.

Implement claim statuses.

Ensure that the database design supports the claim approval and resolution workflow.

Configure appropriate Supabase Row Level Security policies where applicable.

Do not implement frontend functionality in this phase.

Document the schema and relationships.
```

---

## Prompt 6 — Posts API

```text
Implement the FastAPI Posts API according to IMPLEMENTATION_PLAN.md.

Implement:

POST /api/v1/posts

GET /api/v1/posts

GET /api/v1/posts/{post_id}

PUT /api/v1/posts/{post_id}

DELETE /api/v1/posts/{post_id}

Requirements:

- authentication required for create/update/delete
- users may only modify their own posts
- backend validation
- pagination
- filtering
- search

Support filters:

post_type
category
status
search

Use Pydantic schemas.

Keep route handlers separate from business logic.

Add backend tests for:

- unauthorized creation
- authorized creation
- unauthorized update
- authorized update
- unauthorized delete
- filtering
```

---

## Prompt 7 — Frontend Post Management

```text
Implement the frontend post features.

Create:

- posts feed
- create post page
- post detail page
- edit own post
- delete own post

The create form should support:

- LOST or FOUND
- category
- description
- location
- event date/time
- optional image

Requirements:

- responsive UI
- loading states
- error states
- empty states
- authenticated API requests

Do not implement similarity or claims yet.

Do not redesign unrelated parts of the project.
```

---

## Prompt 8 — Image Upload

```text
Implement optional image upload using Supabase Storage.

Use the bucket:

lost-found-images

Suggested storage path:

posts/{user_id}/{post_id}/{filename}

Requirements:

- authenticated upload
- file type validation
- file size validation
- image preview
- loading state
- error handling

Store the resulting image URL or storage reference with the post.

Do not store image binaries inside PostgreSQL.

Verify storage access rules.
```

---

## Prompt 9 — Similarity System

```text
Implement the Version 1 similarity system described in IMPLEMENTATION_PLAN.md.

Requirements:

LOST posts compare only with FOUND posts.

FOUND posts compare only with LOST posts.

Resolved posts must not be included.

Create a modular similarity service.

Implement:

calculate_similarity(post_a, post_b)

get_similar_posts(post_id, limit=5)

Use:

Description Similarity = 0.40

Category Similarity = 0.30

Location Similarity = 0.20

Time Similarity = 0.10

Use TF-IDF and cosine similarity for description similarity.

Normalize the final similarity score to 0–1.

Create:

GET /api/v1/posts/{post_id}/similar

Return the top 5 results.

Keep the implementation replaceable so that future semantic embeddings can replace the current algorithm.

Add tests for:

- same category
- different category
- similar descriptions
- unrelated descriptions
- correct post type filtering
- resolved post exclusion
- top-5 ordering
```

---

## Prompt 10 — Similarity UI

```text
Implement the similarity section on the post detail page.

For LOST posts display:

Similar Found Items

For FOUND posts display:

Similar Lost Items

Fetch:

GET /api/v1/posts/{post_id}/similar

Display up to 5 posts.

Each card should show:

- category
- short description
- location
- event time
- similarity percentage

Each card must link to the post detail page.

Handle:

- loading
- empty results
- API errors

Keep the similarity section visually secondary to the main post.
```

---

## Prompt 11 — Claims Backend

```text
Implement the claims system backend.

Create:

POST /api/v1/claims

GET /api/v1/claims/my

GET /api/v1/posts/{post_id}/claims

POST /api/v1/claims/{claim_id}/approve

POST /api/v1/claims/{claim_id}/reject

Rules:

- claimant must be authenticated
- found post must exist
- found post must be active
- claimant cannot claim their own found post
- related lost post must belong to claimant
- related lost post must have type LOST
- related lost post must be active

Approval must:

1. verify finder ownership
2. verify claim is pending
3. approve claim
4. resolve found post
5. resolve related lost post
6. create resolution record

All approval operations must occur inside one database transaction.

Add tests for:

- unauthorized claim
- claiming own found post
- invalid lost post
- unauthorized approval
- successful approval
- successful rejection
- transaction consistency
```

---

## Prompt 12 — Claims Frontend

```text
Implement the claims UI.

On FOUND post pages:

If the authenticated user is not the owner, show:

Claim This Item

The claim form should:

- load the user's active LOST posts
- allow selecting one related lost post
- allow optional explanation
- submit the claim

For FOUND post owners:

Create a received claims section.

Display:

- related lost post
- claimant information according to privacy requirements
- claim message
- claim status
- approve action
- reject action

Show confirmation before approval.

After approval:

- refresh claim data
- update post status
- show both posts as resolved
```

---

## Prompt 13 — Dashboard

```text
Implement the authenticated user dashboard.

Include:

My Lost Posts

My Found Posts

Resolved Posts

My Submitted Claims

Claims Received

Provide appropriate:

- loading states
- empty states
- error states

Use existing APIs where possible.

Do not duplicate business logic in the frontend.
```

---

## Prompt 14 — Security Review

```text
Perform a security review of the current implementation.

Review:

- Supabase authentication
- JWT validation
- CUET email restriction
- backend authorization
- post ownership
- claim ownership
- finder authorization
- database transactions
- image upload validation
- storage policies
- environment secrets
- CORS

Identify confirmed security issues.

Fix only confirmed issues.

Do not introduce unrelated features.

Report:

1. issues found
2. fixes applied
3. remaining risks
```

---

## Prompt 15 — Final MVP Review

```text
Perform a complete MVP review against IMPLEMENTATION_PLAN.md.

Review:

Authentication

Posts

Images

Search/filter

Similarity

Claims

Resolution workflow

Dashboard

Authorization

Error handling

Responsive UI

Testing

Documentation

Identify missing or incomplete requirements.

Fix confirmed issues.

Do not add features outside the MVP.

Finally provide:

1. completed requirements
2. incomplete requirements
3. known limitations
4. local setup instructions
5. manual testing checklist
6. recommended Version 2 improvements
```

---

# 50. Final Development Principle

The implementation order should always prioritize:

```text
Working

    ↓

Secure

    ↓

Correct

    ↓

Maintainable

    ↓

Polished
```

Do not introduce advanced AI or machine learning infrastructure before the basic system works.

The Version 1 similarity system should remain simple:

```text
TF-IDF

+

Cosine Similarity

+

Category Matching

+

Location Matching

+

Time Proximity
```

Later, the similarity engine can evolve toward:

```text
Semantic Embeddings

+

Vector Search

+

pgvector

+

Image Similarity
```

without requiring a major redesign of the application.

The MVP should first prove the complete end-to-end workflow:

```text
CUET User

    ↓

Login

    ↓

Create LOST / FOUND Post

    ↓

System Finds Similar Posts

    ↓

User Reviews Match

    ↓

Claim

    ↓

Finder Reviews Claim

    ↓

Approval

    ↓

Both Posts Resolved
```

That complete workflow is the primary success criterion for Version 1.
