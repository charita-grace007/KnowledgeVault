# Security Specification: Re:mind

## 1. Data Invariants
- **Multi-Tenant User Isolation**: Every item document is stored under `/users/{uid}/items/{itemId}` and strictly isolated to the authenticated user whose `request.auth.uid == uid`. No user can read, list, create, update, or delete items belonging to another user.
- **Strict Key Whitelisting**: An item must strictly contain exactly four keys upon creation: `text`, `summary`, `tags`, and `createdAt`. No ghost or shadow fields are permitted.
- **Data Boundaries**:
  - `text`: String with length between 1 and 10,000 characters.
  - `summary`: String with length up to 1,000 characters.
  - `tags`: List of strings, maximum 20 items, individual tag up to 50 characters.
  - `createdAt`: Immutable server timestamp matching `request.time` on creation.
- **Id Poisoning Prevention**: Path parameters `uid` and `itemId` must match regex `^[a-zA-Z0-9_-]+$` and have size <= 128.

## 2. The "Dirty Dozen" Payloads
1. **Cross-Tenant Read (IDOR)**: User A attempts `get` or `list` on `/users/userB/items/{itemId}`. Expected: PERMISSION_DENIED.
2. **Cross-Tenant Write**: User A attempts `create` on `/users/userB/items/{itemId}`. Expected: PERMISSION_DENIED.
3. **Ghost Field Injection (Shadow Update)**: User A creates an item with extra field `role: "admin"`. Expected: PERMISSION_DENIED.
4. **Client Timestamp Spoofing**: User A sends `createdAt: "2020-01-01T00:00:00Z"`. Expected: PERMISSION_DENIED.
5. **CreatedAt Tampering on Update**: User A updates an item and attempts to overwrite `createdAt`. Expected: PERMISSION_DENIED.
6. **Empty Text Field**: User A creates an item with `text: ""`. Expected: PERMISSION_DENIED.
7. **Oversized Text Field (Denial of Wallet)**: User A creates an item with text exceeding 10,000 characters. Expected: PERMISSION_DENIED.
8. **Invalid Tag Type**: User A sends `tags: [123, true]` instead of strings. Expected: PERMISSION_DENIED.
9. **Unbounded Tags Array**: User A sends 100 tags in the tags list. Expected: PERMISSION_DENIED.
10. **Path Injection / Poisoning**: User A attempts to write to an itemId with invalid special characters or path traversal (e.g. `../../etc`). Expected: PERMISSION_DENIED.
11. **Unauthenticated Access**: Anonymous or unauthenticated request to `/users/{uid}/items/{itemId}`. Expected: PERMISSION_DENIED.
12. **Arbitrary Collection Write**: User attempts write to root collection `/items/{itemId}`. Expected: PERMISSION_DENIED (hit global safety net).
