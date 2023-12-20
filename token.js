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

  tx.moveCall({
    target: "0x2::coin::mint_and_transfer",
    arguments: [
      tx.object("0xa131f493c40b8758e1afc7748fa0827b651b9ba7c3759afabac89d3912ca7b00"),
      tx.pure(1500 * Math.pow(10, 6)),
      tx.pure("0xa6633459c2d47b9fbebc6b93ac0bbc62926b9d1e764a64ce3ff3d47172861b6d"),
    ],
    typeArguments: ["0x0ae67ca5825abbaa6af52294cf87309eeb2fb11c8ad0f3057fc949e9303d513b::witness::WITNESS"],
  });

  // tx.moveCall({
  //   target: "0x2::coin::mint",
  //   arguments: [tx.object("0xea5d99e51ee3c2c64bad5a155923fce13b0e9b39dcdde40cccb4a65c3d68ada9"), tx.pure(1 * Math.pow(10, 6))],
  //   typeArguments: ["0x23f27baa6862ff1ca2928f4600777a110970f0b14331065b1a48cb2ec398e15d::witness::WITNESS"],
  // });

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
