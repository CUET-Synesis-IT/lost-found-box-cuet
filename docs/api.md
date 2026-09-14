# API: Posts

All endpoints are under `/api/v1`. Post create, update, and delete operations
require a valid Supabase access token for a CUET email:

```http
Authorization: Bearer <access_token>
```

## Endpoints

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/posts` | Required | Create a LOST or FOUND post. |
| `GET` | `/posts` | No | Browse posts with filters and pagination. |
| `GET` | `/posts/{post_id}` | No | Get one post. |
| `PUT` | `/posts/{post_id}` | Required | Update the authenticated user's post. |
| `DELETE` | `/posts/{post_id}` | Required | Delete the authenticated user's post with no claims. |

## Create request

```json
{
  "post_type": "LOST",
  "category": "Wallet",
  "description": "Black wallet with CUET ID.",
  "location": "Central Library",
  "event_time": "2026-09-14T09:00:00Z",
  "image_url": "https://example.supabase.co/storage/v1/object/public/lost-found-images/example.jpg"
}
```

`image_url` is optional; upload handling is intentionally implemented in its
own phase. The API assigns `user_id` from the validated token and sets status
to `ACTIVE`; clients cannot supply either field.

## List filters

`GET /api/v1/posts` supports:

- `post_type=LOST|FOUND`
- `category=<MVP category>`
- `status=ACTIVE|CLAIM_PENDING|RESOLVED|ARCHIVED`
- `search=<description or location text>`
- `page` (default `1`)
- `limit` (default `20`, maximum `100`)

Without `status`, the feed returns only `ACTIVE` posts. Results are ordered by
newest creation time and use `{ items, page, limit, total }` pagination.

## Errors

- `401`: missing, invalid, or expired bearer token.
- `403`: authenticated user does not own the post or is not a CUET user.
- `404`: post does not exist.
- `409`: database constraint prevents a requested change (for example, deleting
  a post with claim history).
- `422`: invalid body, enum/filter, UUID, or pagination input.
