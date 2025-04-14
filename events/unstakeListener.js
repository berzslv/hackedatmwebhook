const { Connection } = require("@solana/web3.js");
const { STAKING_PROGRAM_ID, NETWORK } = require("../config");
const db = require("../db/memory");

const connection = new Connection(NETWORK, "confirmed");

async function listenForUnstakes() {
  connection.onLogs(STAKING_PROGRAM_ID, (logInfo) => {
    const tx = logInfo.signature;
    const logStr = logInfo.logs.join(" ");

    if (logStr.includes("Unstake")) {
      db.unstakeEvents.push({ signature: tx, timestamp: Date.now() });
      console.log("🔁 Unstake Event Detected:", tx);
    }
  });
}

module.exports = listenForUnstakes;
