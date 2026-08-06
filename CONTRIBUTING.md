# Team contribution and branch workflow

## Branch model

- `main` is the only integration branch. It must remain buildable and demonstrable; do not develop or commit directly on it.
- `dev/<github-id>` is each member's personal development branch, for example `dev/zzha0659`.
- `feature/<short-name>` is an optional short-lived branch created from the relevant personal branch or the latest `main`.

## Development workflow

1. Update local `main` before starting work:

   ```bash
   git switch main
   git pull --ff-only origin main
   ```

2. Move to the personal branch and merge the latest `main`:

   ```bash
   git switch dev/<github-id>
   git merge main
   ```

3. Work from `code/` and run the quality checks:

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

5. Open a pull request into `main`. Obtain at least one review from another member, pass the automated checks, and resolve review comments before merging.

## Commit prefixes

- `feat:` new capability
- `fix:` defect correction
- `docs:` documentation changes
- `test:` test additions or corrections
- `refactor:` structural change without intended behaviour changes
- `chore:` dependencies, tooling, or repository maintenance

Keep each commit focused on one subject. Never commit `.env` files, tokens, AWS credentials, `node_modules`, `dist`, or temporary output.

## Pull request requirements

- Explain what changed and why.
- Reference the relevant user story or Definition of Done.
- Include test results; attach screenshots or recordings for visible page changes.
- List incomplete work and required follow-up actions.
- Do not approve your own pull request; another member must complete the review.
