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

const init = async () => {
  // Set up provider.
  const suiClient = new SuiClient({
    url: getFullnodeUrl("testnet"),
  });

  // Create state.

  const tx = new TransactionBlock();

  // const zero_coin = tx.moveCall({
  //   target: "0x2::coin::zero",
  //   typeArguments: ["0x2::sui::SUI"],
  //   arguments: [],
  // });

  // console.log(zero_coin);

  // tx.moveCall({
  //   target: "0x2::coin::create_currency",
  //   arguments: [
  //     tx.object("0x2d45b8565fe2e65072e9e541425db25b56627dd7242e97052e22e0a2b5797c68"),
  //     tx.pure.u8(6),
  //     tx.pure.string("aa"),
  //     tx.pure.string("bb"),
  //     tx.pure.string("cc"),
  //     tx.pure.string(""),
  //   ],
  //   typeArguments: [
  //     "0xdb18895c540152d8de92fa685930e922be1c79efec4275a39b4831a73d572dd2::one_time_witness_registry::UniqueTypeRecord<0xdb18895c540152d8de92fa685930e922be1c79efec4275a39b4831a73d572dd2::my_otw::MY_OTW>",
  //   ],
  // });

  tx.moveCall({
    target: "0x2::coin::mint_and_transfer",
    arguments: [
      tx.object("0xe0dec492c9aaca67c3b0e3aba81eff2e4e0e2365dc45bf953b2817ef9d16713d"),
      tx.pure(30 * Math.pow(10, 9)),
      tx.pure("0xbdd8530db59bb5268319f720b9ef2e5d653c538398c135b07c845e87f3a67570"),
    ],
    typeArguments: ["0x9883424d2a5c72c2f788aef33cdc6080d5eb24ad3a75d31e50201af91a3b46eb::witness::WITNESS"],
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
