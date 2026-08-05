# Team contribution and branch workflow

## Branch model

- `main` is the only integration branch. It must remain buildable and demonstrable; do not develop or commit directly on it.
- `dev/<github-id>` is each member's persistent development branch, for example `dev/xiangzhonglong`.
- `feature/<short-name>` is an optional short-lived branch for isolated work. Create it from the latest `main` or from the relevant personal development branch.

## Development workflow

1. Update local `main` before starting work:

   ```bash
   git switch main
   git pull --ff-only origin main
   ```

2. Move to the personal branch and integrate the latest `main`:

   ```bash
   git switch dev/<github-id>
   git merge main
   ```

3. Work from `code/` and run the complete quality gate:

   ```bash
   cd code
   pnpm install
   pnpm check
   ```

4. Commit and push the personal branch:

   ```bash
   git add --all
   git commit -m "feat: concise description"
   git push -u origin dev/<github-id>
   ```

5. Open a pull request into `main`. Obtain at least one review from another member, pass automated checks, and resolve review comments before merging.

## Commit prefixes

- `feat:` new capability
- `fix:` defect correction
- `docs:` documentation only
- `test:` test additions or corrections
- `refactor:` structural change without intended behaviour change
- `chore:` dependencies, tooling or repository maintenance

Keep each commit focused on one subject. Never commit `.env` files, tokens, AWS credentials, `node_modules`, `dist` or temporary output.

## Code ownership and integration rules

- The architecture/integration owner reviews changes to shared contracts, ports, `RouteService` and the application composition root.
- Integration owners define interfaces; provider owners implement those interfaces under `backend/src/adapters`.
- Frontend code consumes only shared contracts and public API responses. It must not call server-token APIs directly.
- Live integrations must preserve snapshot or mock fallback behaviour.
- Mock or snapshot data must never be labelled as live.
- A contract change must update affected frontend, backend and tests in the same pull request or in a coordinated sequence agreed by the integration owner.

## Pull request requirements

- Explain what changed and why.
- Reference the relevant user story or Definition of Done.
- Include `pnpm check` results.
- Include screenshots or recordings for visible UI changes.
- List known limitations, fallback behaviour and follow-up work.
- Do not approve your own pull request; another member should complete the review.
