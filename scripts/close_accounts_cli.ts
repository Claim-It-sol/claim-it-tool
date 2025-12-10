/**
 * Example CLI to scan a provided keypair for empty SPL token accounts and close them
 * NOTE: This is a demonstration script. Use carefully and only with wallets you control.
 *
 * Usage:
 *   ts-node scripts/close_accounts_cli.ts <KEYPAIR_PATH> [--rpc http://127.0.0.1:8899] [--batch 5]
 *
 * This script uses the example IDL in /idl and expects the program id to be set in Anchor.toml
 */
import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair, Transaction } from "@solana/web3.js";
import fs from "fs";
import os from "os";
import path from "path";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";

const IDL = JSON.parse(fs.readFileSync(path.join(__dirname, "../idl/spl_account_closer.json"), "utf8"));
const PROGRAM_ID = new PublicKey("YourProgramIDHere111111111111111111111111111");

async function loadKeypair(filePath: string): Promise<Keypair> {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return Keypair.fromSecretKey(Buffer.from(raw));
}

async function main() {
  const keypairPath = process.argv[2] || path.join(os.homedir(), ".config/solana/id.json");
  const rpc = (() => {
    const i = process.argv.indexOf("--rpc");
    return i === -1 ? "http://127.0.0.1:8899" : process.argv[i+1];
  })();
  const batchArg = (() => {
    const i = process.argv.indexOf("--batch");
    return i === -1 ? 5 : parseInt(process.argv[i+1], 10);
  })();

  console.log("Using RPC:", rpc);
  const payer = await loadKeypair(keypairPath);
  const connection = new Connection(rpc, "confirmed");
  const wallet = new (class Wallet { publicKey = payer.publicKey; signTransaction = async (tx:any) => { tx.partialSign(payer); return tx; }})();
  const provider = new anchor.AnchorProvider(connection, wallet as any, { commitment: "confirmed" });
  const program = new anchor.Program(IDL as any, PROGRAM_ID, provider);

  // fetch token accounts
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(payer.publicKey, { programId: TOKEN_PROGRAM_ID });
  const empty: {pubkey: PublicKey, lamports: number}[] = [];

  for (const { pubkey, account } of tokenAccounts.value) {
    const balance = account.data.parsed.info.tokenAmount.uiAmount;
    if (balance === 0) {
      empty.push({ pubkey, lamports: account.lamports });
    }
  }

  console.log("Empty token accounts found:", empty.length);
  if (empty.length === 0) return;

  const batchSize = batchArg;
  for (let i = 0; i < empty.length; i += batchSize) {
    const batch = empty.slice(i, i + batchSize);
    const tx = new Transaction();
    for (const acc of batch) {
      const ix = await program.methods.closeEmptyAccount()
        .accounts({
          tokenAccount: acc.pubkey,
          owner: payer.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .instruction();
      tx.add(ix);
    }

    const sig = await provider.sendAndConfirm(tx);
    console.log(`Closed ${batch.length} accounts. Sig: ${sig}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
