const { Connection } = require("@solana/web3.js");
const { STAKING_PROGRAM_ID, NETWORK } = require("../config");
const db = require("../db/memory");

const connection = new Connection(NETWORK, "confirmed");

async function listenForRewards() {
  connection.onLogs(STAKING_PROGRAM_ID, (logInfo) => {
    const tx = logInfo.signature;
    const logStr = logInfo.logs.join(" ");

    if (logStr.includes("Reward") || logStr.includes("Claim")) {
      db.rewardClaims.push({ signature: tx, timestamp: Date.now() });
      console.log("🎁 Reward Claim Detected:", tx);
    }
  });
}

module.exports = listenForRewards;
