const { SuiClient, getFullnodeUrl } = require("@mysten/sui.js/client");
const { Ed25519Keypair } = require("@mysten/sui.js/keypairs/ed25519");
const { TransactionBlock } = require("@mysten/sui.js/transactions");
const { SUI_TYPE_ARG } = require("@mysten/sui.js/utils");
const { fromHEX } = require("@mysten/sui.js/utils");
const yargs = require("yargs");
const { bcs } = require("@mysten/sui.js/bcs");
const { normalizeSuiObjectId } = require("@mysten/sui.js/utils");
const dotenv = require("dotenv");
dotenv.config();

const keypair = Ed25519Keypair.fromSecretKey(fromHEX(process.env.SECRET_KEY));

// console.log(keypair.getPublicKey().toSuiAddress());

const init = async () => {
  // Set up provider.
  const suiClient = new SuiClient({
    url: getFullnodeUrl("testnet"),
  });

  // Create state.

  const tx = new TransactionBlock();

  // tx.moveCall({
  //   target: "0x2::coin::mint_and_transfer",
  //   arguments: [
  //     tx.object("0x75bc9e624e69682be2a12472ef285dec374faeaf7469f52b3ec282cde252157e"),
  //     tx.pure(1500 * Math.pow(10, 6)),
  //     tx.pure("0xa6633459c2d47b9fbebc6b93ac0bbc62926b9d1e764a64ce3ff3d47172861b6d"),
  //   ],
  //   typeArguments: ["0x584f860e0bfc8c136d4518d7f3d62d453d44f09d6efbb9a07d947489ef977882::witness::WITNESS"],
  // });

  tx.moveCall({
    target: "0x2::coin::mint",
    arguments: [tx.object("0x75bc9e624e69682be2a12472ef285dec374faeaf7469f52b3ec282cde252157e"), tx.pure(1 * Math.pow(10, 6))],
    typeArguments: ["0x584f860e0bfc8c136d4518d7f3d62d453d44f09d6efbb9a07d947489ef977882::witness::WITNESS"],
  });

  try {
    const result = await suiClient.signAndExecuteTransactionBlock({
      transactionBlock: tx,
      signer: keypair,
    });

    console.log(result);
  } catch (error) {
    console.log("error", error);
  }
};

init();
