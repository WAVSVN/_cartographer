# WAVE HANDOFF — product phase

| Field | Value |
|-------|-------|
| **phase** | `product` |
| **active_role** | `BUILDER` |
| **wave** | P1 |
| **iteration** | 1 |
| **branch** | `product/p1-operator-console` |
| **trunk** | `main` |
| **repo_path** | `c:\WAVSVN\components\_cartographer` |
| **review_tool** | Graphite (`gt submit`) |
| **blockers** | none |

## BUILDER task — P1 operator console

See `docs/PRODUCT-ROADMAP.md` P1 acceptance.

### Implement

1. `gt create product/p1-operator-console` from synced `main`
2. **API** `apps/web/app/api/deployment/[id]/route.ts` — `{ deployment, contract, runbook, risk }`
3. **OpsConsole refactor:**
   - Select queue item → load detail panel (facts, SLA, MW, equipment, runbook steps)
   - Remove auto-brief on select; add "Generate brief" button
   - Replace `PLAYBOOK` / "Interview playbook" → `SHIFT_ACTIONS` / "Shift actions"
   - Queue filters: All | Exception | Watch | Overdue
   - Keyboard: j/k, /, ?, Escape
4. **layout.tsx** — replace `demo` badge with live shift clock (local time, monospace)
5. Optional: `components/DeploymentDetail.tsx`, `components/ShortcutsHelp.tsx`

### Verify + ship

```powershell
npm run build; npm test
git commit -m "product(p1): operator-first console — detail panel, runbook, keyboard nav"
git push -u origin product/p1-operator-console
gt submit --no-edit
```

### Handoff after BUILDER

- `active_role` → `REVIEWER`
- Note PR URL from `gt submit`

## REVIEWER task

1. Review PR (Graphite/GitHub)
2. Write `docs/reviews/product-p1-REVIEW.md` — CONVERGED or BLOCKED
3. If BLOCKED: `active_role` → `BUILDER`, fix review comments, `gt submit` again
4. If CONVERGED: merge via `gh pr merge` or Graphite; handoff P2 BUILDER
