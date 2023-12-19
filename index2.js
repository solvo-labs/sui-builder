const { SuiClient, getFullnodeUrl } = require("@mysten/sui.js/client");
const { Ed25519Keypair } = require("@mysten/sui.js/keypairs/ed25519");
const { TransactionBlock } = require("@mysten/sui.js/transactions");
const { SUI_TYPE_ARG } = require("@mysten/sui.js/utils");
const { fromHEX } = require("@mysten/sui.js/utils");
const yargs = require("yargs");
const { bcs } = require("@mysten/sui.js/bcs");
const wasm = require("./move-binary-format-wasm");
const { normalizeSuiObjectId } = require("@mysten/sui.js/utils");

const { getBytecode, CompiledModule } = require("./utils");
const dotenv = require("dotenv");
dotenv.config();

const keypair = Ed25519Keypair.fromSecretKey(fromHEX(process.env.SECRET_KEY));
const client = new SuiClient({
  url: getFullnodeUrl("testnet"),
});

const genesis_byte_code =
  "a11ceb0b0600000009010006020608030e0b041902051b10072b4d0878400ab801050cbd010d000401060107000002000201020000050001000102030101020102020800070801000108000209000708010747454e45534953095478436f6e746578740e636c61696d5f616e645f6b6565700b64756d6d795f6669656c640767656e6573697304696e6974077061636b6167650a74785f636f6e746578740000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200020103010000000001040b000b0138000200";

const package_id = "0x1bd1f10339d3da1f4d57bfc9c30e7ee9cb20489df74bc3b314525b98f5e4c211";

const publishNewAsset = async (moduleName, totalSupply, symbol, asset_name, description, iconUrl, burnable) => {
  const template = getBytecode();

  const compiledModule = new CompiledModule(JSON.parse(wasm.deserialize(template)))
    .updateConstant(0, totalSupply, "100", "u64")
    .updateConstant(1, symbol, "Symbol", "string")
    .updateConstant(2, asset_name, "Name", "string")
    .updateConstant(3, description, "Description", "string")
    .updateConstant(4, iconUrl, "icon_url", "string")
    .updateConstant(5, burnable, "true", "bool")
    .changeIdentifiers({
      template: moduleName,
      TEMPLATE: moduleName.toUpperCase(),
    });

  const bytesToPublish = wasm.serialize(JSON.stringify(compiledModule));

  const tx = new TransactionBlock();
  tx.setGasBudget(100000000);
  const [upgradeCap] = tx.publish({
    modules: [[...fromHEX(bytesToPublish)], [...fromHEX(genesis_byte_code)]],
    dependencies: [normalizeSuiObjectId("0x1"), normalizeSuiObjectId("0x2"), normalizeSuiObjectId(package_id)],
  });

  tx.transferObjects([upgradeCap], tx.pure(keypair.getPublicKey().toSuiAddress(), "address"));

  const txRes = await client.signAndExecuteTransactionBlock({
    transactionBlock: tx,
    signer: keypair,
    requestType: "WaitForLocalExecution",
    options: {
      showEvents: true,
      showEffects: true,
      showObjectChanges: true,
      showBalanceChanges: true,
      showInput: true,
    },
  });

  console.log(txRes);

  // if (txRes?.effects?.status.status === "success") {
  //   // console.log("New asset published!", JSON.stringify(txRes, null, 2));
  //   console.log("New asset published! Digest:", txRes.digest);
  //   const packageId = txRes.effects.created?.find((item) => item.owner === "Immutable")?.reference.objectId;
  //   console.log("Package ID:", packageId);
  // } else {
  //   console.log(txRes);
  //   console.log("Error: ", txRes?.effects?.status);
  //   throw new Error("Publishing failed");
  // }
};

publishNewAsset("magical_asset", "200", "MA", "Magical Asset", "A magical Asset that can be used for magical things!", "new-icon_url", "true");
