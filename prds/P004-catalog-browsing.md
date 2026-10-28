# P004 — Catalog Browsing

| Field | Value |
| --- | --- |
| ID | P004 |
| Status | Accepted |
| Area | Catalog |
| Created | 2026-10-20 |
| Related | P002, P005 |

## Context

Members need to find books before they can borrow them.

## Decision

A logged-in member can see every book in the catalog, including books with no available
copies, and open any book to see its details.

## Rules

- Each book shows: title, author(s), description, cover image (optional), ISBN (optional).
- Each book in the list shows whether it is currently available (P005).
- Members can search by title or author. No category filters in v1 (P004-Q1).

## Acceptance criteria

- [ ] A member sees all books, available or not.
- [ ] Opening a book shows its details and availability.
- [ ] Searching by part of a title or author name returns matching books.

## Open questions

### P004-Q1 — What search does the catalog need in v1?

- **A.** Search by title or author **(Recommended)**
- **B.** No search, just the full list
- **C.** A + filter by category/genre

**Recommendation:** A. Cheap to build and enough for a small library. Categories need
extra data entry for every book, so they can wait.

**Answer:** A — decided by product owner on 2026-10-20.
