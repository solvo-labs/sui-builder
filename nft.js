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

const package_id = "0x1bd1f10339d3da1f4d57bfc9c30e7ee9cb20489df74bc3b314525b98f5e4c211";

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
  //   target: "0x44d12155bb085df7d5432f0ad2419eb46195c449c327c716f43b733cfd17884d::devnet_nft::mint_to_sender",
  //   arguments: [tx.pure.u64(100), tx.pure.string("SYM"), tx.pure.string("name"), tx.pure.string("desc"), bcs.option(bcs.string()).serialize("some value"), tx.pure.bool(true)],
  //   typeArguments: [
  //     normalizeSuiObjectId("0x1"),
  //     normalizeSuiObjectId("0x2"),
  //     normalizeSuiObjectId(package_id),
  //     // "0x02::package::UpgradeCap",
  //     // tx.object("0xa540b41b0409c2b9855793f1768c701b475ba7c1093d7c1da9515b895c50e5bf").value,
  //     // "0x2::SYM::SYM",
  //     // "0xbf8c85ca9a2118356e47f9ae122a118ac9e5558ec0c617065e6789725769537e::one_time_witness_registry::UniqueTypeRecord<0xbf8c85ca9a2118356e47f9ae122a118ac9e5558ec0c617065e6789725769537e::my_otw::MY_OTW>",
  //   ],
  // });

  // mint
  // tx.moveCall({
  //   target: "0x44d12155bb085df7d5432f0ad2419eb46195c449c327c716f43b733cfd17884d::devnet_nft::mint_to_sender",
  //   arguments: [tx.pure.string("yakya"), tx.pure.string("yaa"), tx.pure.string("https://ipfs.io/ipfs/bafkreidhxli7jw5swgbjvjdbn5gxehpfrduq22laamlrkakpvxxqivlpi4")],
  //   typeArguments: [],
  // });

  // transfer
  // tx.moveCall({
  //   target: "0x44d12155bb085df7d5432f0ad2419eb46195c449c327c716f43b733cfd17884d::devnet_nft::transfer",
  //   arguments: [tx.object("0x049349dc7dbf86ddfdf541431fb2c1948e902c854f1b3e39eb4104c2f6f8c5ef"), tx.pure("0xc0080d8cbbe6e1b9b44652b4649762548d50a6f327a882f21bd47ef4c88d2c5d")],
  // });

  // 0x48e3b9654f77bf376698de702f7bf89d68d0b035dc4e3bf7d7d234d35882b72b;

  tx.moveCall({
    target: "0x44d12155bb085df7d5432f0ad2419eb46195c449c327c716f43b733cfd17884d::devnet_nft::burn",
    arguments: [tx.object("0x650ea7aa0cfc27dbe196e614f2e3105396e2e73e39480dd74ef9cde8be86b599")],
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
