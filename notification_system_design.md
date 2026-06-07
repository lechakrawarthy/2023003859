# Notification System Design

## Stage 1

REST API design for a campus notification platform. Students get notified about Placements, Events, and Results. All endpoints require a Bearer token — authentication is pre-authorised, no login flow needed.

---

### Endpoints

#### 1. Get All Notifications

```
GET /api/notifications
```

**Headers:**
```json
{ "Authorization": "Bearer <token>" }
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 20) |
| notification_type | string | No | "Event", "Result", or "Placement" |

**Response (200):**
```json
{
  "notifications": [
    {
      "id": "d146095a-0d86-4a34-9e69-3900a14576bc",
      "type": "Placement",
      "message": "CSX Corporation hiring",
      "isRead": false,
      "createdAt": "2026-04-22T17:51:18Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

---

#### 2. Get Single Notification

```
GET /api/notifications/:id
```

**Headers:**
```json
{ "Authorization": "Bearer <token>" }
```

**Response (200):**
```json
{
  "id": "d146095a-0d86-4a34-9e69-3900a14576bc",
  "type": "Placement",
  "message": "CSX Corporation hiring",
  "isRead": false,
  "createdAt": "2026-04-22T17:51:18Z"
}
```

**Response (404):**
```json
{ "error": "Notification not found" }
```

---

#### 3. Mark Notification as Read

```
PATCH /api/notifications/:id/read
```

**Headers:**
```json
{ "Authorization": "Bearer <token>" }
```

**Response (200):**
```json
{
  "id": "d146095a-0d86-4a34-9e69-3900a14576bc",
  "isRead": true
}
```

---

#### 4. Mark All as Read

```
PATCH /api/notifications/read-all
```

**Headers:**
```json
{ "Authorization": "Bearer <token>" }
```

**Response (200):**
```json
{ "message": "All notifications marked as read" }
```

---

#### 5. Get Unread Count

```
GET /api/notifications/unread-count
```

**Headers:**
```json
{ "Authorization": "Bearer <token>" }
```

**Response (200):**
```json
{ "unreadCount": 12 }
```

---

### Notification Schema

```json
{
  "id": "uuid",
  "type": "Event | Result | Placement",
  "message": "string",
  "isRead": "boolean",
  "createdAt": "ISO 8601 datetime"
}
```

---

### Real-Time Notifications

Using **Server-Sent Events (SSE)** — notifications only flow from server to client, so SSE is simpler than WebSockets and works over plain HTTP with auto-reconnect built in.

```
GET /api/notifications/stream
Headers: { "Authorization": "Bearer <token>", "Accept": "text/event-stream" }
```

Server pushes events in this format whenever a new notification arrives:
```
event: notification
data: {"id":"abc-123","type":"Placement","message":"Google hiring","isRead":false,"createdAt":"2026-04-22T18:00:00Z"}
```

---

## Stage 2

### Why PostgreSQL?

Notifications have a fixed schema and per-student read state needs to be tracked reliably. A relational DB handles this well — foreign keys, JOINs, ENUM types, ACID guarantees. MongoDB would work too but the structured nature of this data doesn't benefit from a schema-less approach.

---

### Schema

```sql
CREATE TYPE notification_type AS ENUM ('Event', 'Result', 'Placement');

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        notification_type NOT NULL,
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE students (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name  TEXT NOT NULL
);

CREATE TABLE student_notifications (
  student_id      UUID REFERENCES students(id) ON DELETE CASCADE,
  notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
  is_read         BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (student_id, notification_id)
);
```

The `student_notifications` junction table stores read state per student without duplicating notification content. One notification row, N read-state rows.

---

### Scaling concerns

At 50,000 students and 5,000,000 notifications, two things hurt:
- Full table scans kill read performance (fixed with indexes in Stage 3)
- Broadcasting to all 50,000 students means 50,000 DB inserts per notification (fixed with a queue in Stage 5)

---

### Queries

#### Fetch unread notifications for a student
```sql
SELECT n.id, n.type, n.message, n.created_at, sn.is_read
FROM notifications n
JOIN student_notifications sn ON sn.notification_id = n.id
WHERE sn.student_id = $1
  AND sn.is_read = false
ORDER BY n.created_at DESC
LIMIT $2 OFFSET $3;
```

#### Mark one notification as read
```sql
UPDATE student_notifications
SET is_read = true
WHERE student_id = $1 AND notification_id = $2;
```

#### Mark all as read
```sql
UPDATE student_notifications
SET is_read = true
WHERE student_id = $1 AND is_read = false;
```

#### Unread count
```sql
SELECT COUNT(*) AS unread_count
FROM student_notifications
WHERE student_id = $1 AND is_read = false;
```

---

## Stage 3

### Is the original query correct?

```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt ASC;
```

No. `studentID` and `isRead` don't exist on the `notifications` table — read state is stored in `student_notifications`. The query would fail at runtime.

### Why is it slow?

No indexes on `studentID` or `isRead`, so the DB does a full table scan across 5,000,000 rows. Then it sorts everything matching the filter. At this scale that's seconds per query, and it gets worse as data grows.

### Should you index every column?

No. Indexing every column is a bad idea:
- Every write (INSERT/UPDATE) has to update every index — so more indexes = slower writes.
- Low-cardinality columns like `isRead` (just true/false) barely help. The DB still reads half the table on average.
- You waste memory and disk for no real gain.

Index selectively based on what your actual queries filter and sort on.

### Indexes to add

```sql
-- for all queries filtering by student
CREATE INDEX idx_sn_student_id ON student_notifications(student_id);

-- for unread queries — avoids reading read notifications at all
CREATE INDEX idx_sn_student_unread ON student_notifications(student_id, is_read);

-- for ORDER BY created_at
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- for filtering by type
CREATE INDEX idx_notifications_type ON notifications(type);
```

The composite `(student_id, is_read)` index is the most impactful one — the DB jumps directly to unread rows for that student.

### Find students who got a Placement notification in the last 7 days

```sql
SELECT DISTINCT s.id, s.email, s.name
FROM students s
JOIN student_notifications sn ON sn.student_id = s.id
JOIN notifications n ON n.id = sn.notification_id
WHERE n.type = 'Placement'
  AND n.created_at >= NOW() - INTERVAL '7 days';
```

`idx_notifications_type` narrows down to Placement rows first, then the join pulls only the relevant students.

---

## Stage 4

### The problem

Every page load hits the DB. With 50,000 students refreshing frequently, the DB gets hammered — especially for the same queries returning the same data. This causes slow loads and timeouts.

### Solutions

#### Redis Cache

Cache each student's notification list keyed by student + page + type:

```
Key:   notifications:{student_id}:{page}:{type}
Value: JSON array
TTL:   60 seconds
```

Read flow: check Redis first → if hit, return it → if miss, query DB, cache it, return it.

When a notification is created or read, delete that student's cache keys so the next request gets fresh data.

60 seconds of stale data is fine for notifications. Wouldn't be acceptable for something like a bank balance.

#### Cache the unread count separately

The unread badge count is fetched constantly. Cache it with no TTL and invalidate it explicitly whenever a notification is marked read:

```
Key:   unread_count:{student_id}
Value: integer
```

#### Paginate — never fetch everything

Always use `LIMIT + OFFSET` or cursor-based pagination. Never load all notifications at once.

Cursor pagination is better than OFFSET at large page numbers:
```sql
SELECT * FROM notifications
WHERE created_at < $cursor
ORDER BY created_at DESC
LIMIT 20;
```
With OFFSET the DB scans and skips N rows every time. With a cursor it jumps straight to the right position via the index.

#### Read replica

Route all SELECT queries to a read replica. Writes go to primary only. This lets you scale read throughput horizontally without touching application logic.

### Tradeoffs

| Strategy | Benefit | Tradeoff |
|----------|---------|----------|
| Redis cache | Near-zero DB reads on cache hit | Slightly stale data; extra infra |
| Unread count cache | Eliminates the most frequent query | Must invalidate on every read action |
| Cursor pagination | O(1) page fetch via index | Client needs to track cursor |
| Read replica | Scales reads without code changes | Replication lag (usually under 1s) |

---

## Stage 5

### What's wrong with the original implementation?

```python
function notify_all(student_ids: array, message: string):
    for student_id in student_ids:
        send_email(student_id, message)
        save_to_db(student_id, message)
        push_to_app(student_id, message)
```

Several things:

1. **No isolation between students** — when `send_email` failed at student 200, the entire loop stopped. The other 49,800 students got nothing even though there was nothing wrong with their delivery.
2. **Sequential** — 50,000 students processed one at a time. One slow email API call blocks the whole queue.
3. **No retries** — if the email API was down briefly, those 200 students are just lost. There's no way to retry only them.
4. **DB and email are coupled** — if the DB insert fails after the email was already sent, the notification doesn't show in-app. The student got an email about something that doesn't exist in the system.
5. **No crash recovery** — if the server restarts at student 25,000, there's no way to know where it stopped or resume from there.

### Should DB save and email send happen together?

No. The DB write is your source of truth and should always happen first. Email and push are delivery mechanisms that can fail and be retried independently. If you couple them, a transient email failure corrupts your data state.

### Fix: use a job queue

```
HR clicks "Notify All"
        │
        ▼
1. Save one notification row to DB
2. Enqueue one delivery job per student (BullMQ / Redis Queue)
3. Return 202 Accepted to HR immediately
        │
        ▼
Worker pool processes jobs concurrently
        ├── send_email(student_id, message)   → retry on failure
        └── push_to_app(student_id, message)  → retry on failure
```

### Revised pseudocode

```typescript
async function notify_all(student_ids: string[], message: string): Promise<void> {
  const notification_id = await db.insert_notification(message);

  const BATCH_SIZE = 1000;
  for (let i = 0; i < student_ids.length; i += BATCH_SIZE) {
    const batch = student_ids.slice(i, i + BATCH_SIZE);
    await db.bulk_insert_student_notifications(batch, notification_id);
  }

  for (const student_id of student_ids) {
    await queue.enqueue("deliver_notification", { student_id, notification_id, message });
  }
}

async function deliver_notification(job: Job): Promise<void> {
  const { student_id, message } = job.data;
  await send_email(student_id, message);
  await push_to_app(student_id, message);
}
```

### When send_email fails for 200 students

Only those 200 jobs fail. The other 49,800 are unaffected. The failed jobs retry with exponential backoff. If they keep failing, they go to a dead-letter queue where someone can inspect and replay them manually. The DB already has the notification — nothing is lost.

---

## Stage 6

### Approach

Priority is scored using a combination of type weight and recency:

```
score = (type_weight × 1_000_000_000_000) + timestamp_ms
```

Type weights: Placement = 3, Result = 2, Event = 1. Multiplying by 1 trillion ensures type always dominates over recency — a Placement is always ranked above a Result regardless of when it arrived, and within the same type, newer notifications rank higher.

### How the top N is maintained

`PriorityInbox` is a class that keeps a sorted list of the top 10 notifications. On every `add()` call:
1. Push the new notification into the list.
2. Sort by score ascending (lowest score at index 0).
3. If length exceeds 10, shift off the lowest-scored item.

`getTopNotifications()` returns a copy sorted descending — highest priority first.

This keeps memory bounded to N items at all times. As new notifications arrive they're evaluated against the current bottom of the list and evict it if they score higher.

### Code

Code is in `notification_app_be/src/priorityInbox.ts`. 

Output:
```
TOP 10 PRIORITY NOTIFICATIONS

1. [Placement] CSX Corporation hiring | 2026-04-22T17:51:18
2. [Placement] Advanced Micro Devices Inc. hiring | 2026-04-22T17:49:42
...
```
