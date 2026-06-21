# WAVE HANDOFF — product phase

| Field | Value |
|-------|-------|
| **phase** | `product` |
| **active_role** | `BUILDER` |
| **wave** | P2 |
| **iteration** | 1 |
| **branch** | `product/p2-triage-state` (create from synced `main` after P1 merge) |
| **trunk** | `main` |
| **repo_path** | `c:\WAVSVN\components\_cartographer` |
| **review_tool** | Graphite (`gt submit`) |
| **blockers** | none |
| **last_review** | `docs/reviews/product-p1-REVIEW.md` — CONVERGED |

## BUILDER task — P2 triage state

See `docs/PRODUCT-ROADMAP.md` P2 deliverable.

### Implement

1. `gt sync` on `main`; `gt create product/p2-triage-state -m "product(p2): triage state per deployment"`
2. **Triage state** per deployment: `ack` / `investigating` / `escalated` — persist in `localStorage`, keyed by deployment id
3. **UI** on queue rows and/or `DeploymentDetail`: triage controls (operator labels, not interview copy)
4. State survives refresh; default unset for new deployments
5. Optional: filter queue by triage state

### Verify + ship

```powershell
npm run build; npm test
git commit -m "product(p2): triage state — ack, investigating, escalated"
git push -u origin product/p2-triage-state
gt submit --no-edit
```

### Handoff after BUILDER

- `active_role` → `REVIEWER`
- Note PR URL from `gt submit`

## REVIEWER task (P1 — done)

- Review: `docs/reviews/product-p1-REVIEW.md` — **CONVERGED**
- PR #3 merged to `main`
