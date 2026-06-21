# WAVE HANDOFF — product phase

| Field | Value |
|-------|-------|
| **phase** | `product` |
| **active_role** | `BUILDER` |
| **wave** | P4 |
| **iteration** | 1 |
| **branch** | `product/p4-command-palette` |
| **trunk** | `main` |
| **repo_path** | `c:\WAVSVN\components\_cartographer` |
| **review_tool** | Graphite (`gt submit`) |
| **blockers** | none |

## BUILDER task — P4 command palette + pins

See `docs/PRODUCT-ROADMAP.md` P4 acceptance.

### Implement

1. `git checkout main; git pull; gt sync`
2. `gt create product/p4-command-palette -m "product(p4): command palette + pins"`
3. `lib/pins.ts` — load/save pinned deployment IDs (`goc-pins`)
4. `components/CommandPalette.tsx` — Ctrl/Cmd+K modal, fuzzy search ranked list, actions (select deployment, shift actions)
5. OpsConsole: pin toggle on queue rows; sort pinned first; wire palette; filter-change reselect; mobile `?` button
6. `about/page.tsx` — operator-facing copy (console/triage/handoff, not interview demo)

### Ship

```powershell
npm run build; npm test
git commit -m "product(p4): command palette, pinned watch list, UX polish"
gt submit --no-edit
```

Handoff → REVIEWER, note PR URL.

## Prior (merged)

P1 #3 · P2 #4 · P3 #5 — see `docs/reviews/product-p*-REVIEW.md`
