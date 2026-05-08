# Extra Issue Contexts

Reference materials per issue — screenshots, documentation snippets, API references, error logs, design specs. One sub-folder per issue.

## Folder Structure
```
extra-issue-contexts/
├── README.md               ← this file
├── ISSUE-001-short-name/
│   ├── context.md          ← summary of the issue + links
│   ├── screenshot-1.png
│   └── relevant-docs.md
├── ISSUE-002-short-name/
│   └── ...
```

## Naming Convention
```
ISSUE-[number]-[2-4-word-slug]/
```
Examples:
- `ISSUE-001-map-not-loading`
- `ISSUE-002-jeep-count-wrong`
- `ISSUE-003-auth-redirect-loop`

## context.md Template

Each issue folder should have a `context.md`:

```markdown
# ISSUE-XXX — [Short Title]

## Problem
What's broken or unclear.

## Screenshots / Attachments
List files in this folder and what they show.

## Relevant Docs / Links
- Link or reference to documentation
- Related code locations

## Reproduction Steps
1. Step one
2. Step two

## Notes
Anything else useful for tackling this.
```
