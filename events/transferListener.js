const { Connection } = require("@solana/web3.js");
const { TOKEN_PROGRAM_ID, NETWORK } = require("../config");
const db = require("../db/memory");

const connection = new Connection(NETWORK, "confirmed");

async function listenForTransfers() {
  connection.onLogs(TOKEN_PROGRAM_ID, (logInfo) => {
    const tx = logInfo.signature;
    const logStr = logInfo.logs.join(" ");

    if (logStr.includes("Transfer")) {
      db.tokenTransfers.push({ signature: tx, timestamp: Date.now() });
      console.log("💸 Token Transfer Detected:", tx);
    }
  });
}

module.exports = listenForTransfers;
