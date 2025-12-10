# Scripts usage

- `close_accounts_cli.ts` - scans a provided keypair for empty SPL token accounts and attempts to close them by calling the on-chain program.
  - Make sure the program is deployed and the PROGRAM_ID in the script is correct.
  - Example:
    ```bash
    ts-node scripts/close_accounts_cli.ts ~/.config/solana/id.json --rpc http://127.0.0.1:8899 --batch 5
    ```
  - The script expects the keypair file to be a JSON array of 64 numbers (Solana CLI default).

Notes:
- These scripts are educational and for developer testing only. Don't run them against wallets you don't control.
