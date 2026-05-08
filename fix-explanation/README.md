# Fix Explanations

Every fix Claude completes gets logged here. Read these at your own pace — no need to digest everything in the chat.

## File Naming
```
YYYY-MM-DD-[short-slug].md
```
Examples:
- `2026-05-08-map-marker-crash.md`
- `2026-05-09-jeep-count-off-by-one.md`

## What Each File Contains
- **What was broken** — plain description, no jargon
- **Root cause** — why it was happening
- **What was changed** — files touched, with line references
- **How to test it** — exact steps to verify the fix works
- **Side effects to watch** — anything nearby that could be affected

---

## Log Index
| Date | Fix | File |
|------|-----|------|
| 2026-05-08 | Google Maps Loader class removed — migrated to new functional API | [2026-05-08-google-maps-loader-api.md](2026-05-08-google-maps-loader-api.md) |

---

## Fix File Template

```markdown
# Fix — [Short Title]
**Date:** YYYY-MM-DD

## What Was Broken
Describe the symptom in plain terms — what the user saw or what failed.

## Root Cause
Why it was happening. Keep it short.

## What Changed
| File | Change |
|------|--------|
| `src/path/file.vue` | Description of change |

## How to Test
1. Open the app and go to [page/feature].
2. Do [specific action].
3. Expected result: [what should happen].
4. Also check: [edge case or regression].

## Watch Out For
Anything nearby that might have been affected or should be monitored.
```
