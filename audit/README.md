# Audit Log

Weekly code base health checks. One file per session, named by date.

## Purpose
Catch issues I might have missed — bugs, unused code, inconsistent patterns, missing error handling, accessibility gaps, performance concerns.

## File Naming
```
YYYY-MM-DD-audit.md
```

## Audit File Template

Copy this when starting a new weekly audit:

```markdown
# Audit — YYYY-MM-DD

## Scope
Which parts of the codebase were reviewed this session.

## Issues Found

### [Issue Title]
- **File:** `src/path/to/file.vue` (line X)
- **Severity:** Low / Medium / High
- **Description:** What the problem is.
- **Suggested Fix:** How to address it.
- **Status:** Open / In Progress / Resolved

## Notes
Anything worth flagging that doesn't fit above.

## Next Audit Focus
What to prioritize next week.
```

## History
| Date | Scope | Issues Found | Resolved |
|------|-------|-------------|----------|
| — | — | — | — |
