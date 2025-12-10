# Minimal Audit Checklist (quick reviewer guide)

1. **Authority & Signer checks**
   - Confirm that the owner that will receive rent is a signer (owner: Signer).
2. **Token program match**
   - Verify that the `token_program` provided in the accounts is the canonical SPL Token program.
3. **Zero balance verification**
   - The program requires token_account.amount == 0. Verify tokens with decimals and proper parsing in client.
4. **CPI safety**
   - Ensure CPI `CloseAccount` uses `account`, `destination` and `authority` correctly.
5. **Transaction size**
   - The `close_multiple_accounts` relies on `remaining_accounts`. On-chain transaction size limits may require batching.
6. **Off-chain scripts**
   - Confirm client scripts properly compute rent (lamports) if showing reclaimable SOL. On-chain rent may vary.
