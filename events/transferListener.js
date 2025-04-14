const { Connection } = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID, TOKEN_MINT, NETWORK } = require("../config");
const db = require("../db/memory");

const connection = new Connection(NETWORK, {
commitment: "confirmed",
maxSupportedTransactionVersion: 0,
});

async function listenForTransfers() {
connection.onLogs(TOKEN_PROGRAM_ID, async (logInfo) => {
const txSignature = logInfo.signature;

try {
const tx = await connection.getParsedTransaction(txSignature, {
maxSupportedTransactionVersion: 0,
});

if (!tx || !tx.meta || !tx.transaction) return;

const instructions = tx.transaction.message.instructions;

for (const ix of instructions) {
if (
ix.programId.toString() === TOKEN_PROGRAM_ID.toString() &&
ix.parsed?.type === "transfer" &&
ix.parsed?.info?.mint === TOKEN_MINT.toString()
) {
db.tokenTransfers.push({
signature: txSignature,
timestamp: Date.now(),
from: ix.parsed.info.source,
to: ix.parsed.info.destination,
amount: ix.parsed.info.amount,
});

console.log("💸 Token Transfer Detected:", txSignature);
}
}
} catch (err) {
console.warn("Transfer log error:", err.message);
}
});
}

module.exports = listenForTransfers;
