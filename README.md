# SPL Account Closer (Anchor / Solana)

**What this repo contains**
- An Anchor program (Rust) that safely closes empty SPL Token accounts and returns rent to the owner.
- A TypeScript client/utility (`scripts/`) that demonstrates how to call the program (CLI-style).
- Project configuration files to build and test locally with `anchor` (Anchor.toml, Cargo.toml workspace).
- A sample IDL and a minimal test script scaffold you can run locally.
- Security notes and a small audit checklist so reviewers can verify correctness.

> **Note:** The repo is intentionally backend/program-focused. No frontend included.
> Replace the placeholder program ID (`YourProgramIDHere111111111111111111111111111`) with your deployed program id before deploying or publishing a release.

## Quick structure
```
.
├─ Anchor.toml
├─ Cargo.toml                 # workspace
├─ LICENSE
├─ .gitignore
├─ programs/
│  └─ spl_account_closer/
│     ├─ Cargo.toml
│     └─ src/
│        └─ lib.rs            # the Anchor program (Rust)
├─ idl/
│  └─ spl_account_closer.json # example IDL (generated from the TS IDL provided)
└─ scripts/
   ├─ close_accounts_cli.ts   # CLI example using Anchor provider & Keypair
   └─ README_SCRIPTS.md       # how to run scripts locally
```

## Build & test (local development)
Prerequisites:
- Rust (stable), `cargo`
- `anchor` CLI (matching program version used)
- Solana tool suite (`solana` CLI) and a local validator (or cluster)
- Node.js & npm/yarn (for scripts/tests)

Steps:
1. Configure your Solana CLI to localnet (if you want local testing):
   ```bash
   solana config set --url http://127.0.0.1:8899
   ```
2. Start a local validator:
   ```bash
   solana-test-validator --reset
   ```
3. Build the program:
   ```bash
   anchor build
   ```
4. Deploy:
   - Update `Anchor.toml` with your `programs.spl_account_closer.id` (the program id shown by `anchor build` or use a pre-deployed id).
   - Deploy using `anchor deploy` (localnet or cluster as configured).
5. Use the scripts in `/scripts` to interact with the program.

## Security notes / reviewer checklist
- The program only calls `token::close_account` CPI from `anchor_spl::token`. Validators:
  - Ensure accounts passed to the program are validated: owner, amount == 0.
  - Check owner signer requirement: program requires the owner to sign when closing.
  - Ensure the token program ID passed is the canonical SPL Token program (not an attacker program).
- Recommended additional checks before production:
  - Add explicit `require_keys_eq` checks comparing `token_program.key()` to the canonical `spl_token::id()` if you want to hardcode the token program id.
  - Add more descriptive event logging (optional) for on-chain observability.
  - Run a static analysis and audit (preferably external).
- Gas / resource usage: `close_multiple_accounts` uses `remaining_accounts` and CPI in a loop; watch transaction size limits.

## Files added by this repo skeleton
- `.gitignore` (Rust, Node, Anchor artifacts)
- `LICENSE` (MIT)
- `Anchor.toml`, root `Cargo.toml` (workspace to build program)
- `programs/spl_account_closer/Cargo.toml` and `src/lib.rs` (the program)
- `idl/spl_account_closer.json` (example IDL, usable by frontends)
- `scripts/close_accounts_cli.ts` (CLI example to scan & close token accounts using a Keypair wallet)
- `scripts/README_SCRIPTS.md` (how to run the scripts)

## Support / questions
If you'd like, I can:
- Add a simple GitHub Actions workflow that runs `anchor build` on PRs.
- Generate a minimal unit/integration test using TypeScript + Anchor mocha (needs local validator on CI).
- Add instructions to verify the program on mainnet-beta/testnet (audit steps).
