const { Connection, PublicKey } = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID, TOKEN_MINT, NETWORK } = require("../config");
const db = require("../db/memory");

const connection = new Connection(NETWORK, "confirmed");

async function getTransactionWithRetry(signature, retries = 3) {
  while (retries > 0) {
    try {
      // Attempt to fetch the transaction
      const tx = await connection.getParsedTransaction(signature, "confirmed");
      return tx;
    } catch (err) {
      if (err.message.includes("Transaction version (0)")) {
        console.error("Transaction version not supported, retrying...");
        await sleep(1000); // Wait before retrying
      } else if (err.message.includes("429 Too Many Requests")) {
        console.error("Rate limit exceeded, retrying...");
        await sleep(1000); // Wait before retrying
      } else {
        console.error("Error fetching transaction:", err.message);
        break;
      }
      retries--;
    }
  }
  return null; // Return null if all retries fail
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function listenForTransfers() {
  connection.onLogs(TOKEN_PROGRAM_ID, async (logInfo) => {
    const txSignature = logInfo.signature;

    try {
      const tx = await getTransactionWithRetry(txSignature);

      if (!tx || !tx.meta || !tx.transaction) return;

      const instructions = tx.transaction.message.instructions;

      for (const ix of instructions) {
        if (
          ix.programId.toBase58() === TOKEN_PROGRAM_ID.toBase58() &&
          ix.parsed?.type === "transfer" &&
          ix.parsed?.info?.mint === TOKEN_MINT.toBase58()
        ) {
          db.tokenTransfers.push({
            signature: txSignature,
            from: ix.parsed.info.source,
            to: ix.parsed.info.destination,
            amount: ix.parsed.info.amount,
            timestamp: Date.now(),
          });

          console.log("✅ Filtered Token Transfer:", txSignature);
        }
      }
    } catch (err) {
      console.error("Transfer log error:", err.message);
    }
  });

  console.log("📡 Listening for filtered token transfers...");
}

module.exports = listenForTransfers;
