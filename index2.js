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

// a11ceb0b060000000a01000c020c1e032a22044c0805545407a801b40108dc026006bc03240ae003050ce503280012010b0206020f021002110005020001010701000002000c01000102020c01000104030200050407000009000100010a01040100020706070102030c0901010c030d0d01010c040e0a0b00010302050308040c02080007080400020b020108000b03010800010805010b01010900010800070900020a020a020a020b01010805070804020b030109000b02010900010b02010800010900010608040105010b03010800020900050c436f696e4d65746164617461064f7074696f6e0b5472656173757279436170095478436f6e746578740355726c075749544e45535304636f696e0f6372656174655f63757272656e63790b64756d6d795f6669656c6404696e6974046e6f6e65066f7074696f6e147075626c69635f667265657a655f6f626a6563740f7075626c69635f7472616e736665720673656e646572087472616e736665720a74785f636f6e746578740375726c077769746e6573730000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020201090a02070653796d626f6c0a0205044e616d650a020c0b4465736372697074696f6e00020108010000000002120b00070007010702070338000a0138010c020c030b0238020b030b012e110538030200

// ref = https://github.com/MystenLabs/asset-tokenization/blob/main/setup/src/publishAsset.ts
const publishNewAsset = async (decimal, symbol, token_name, description) => {
  const witness = getBytecode();

  const compiledModule = new CompiledModule(JSON.parse(wasm.deserialize(witness)))
    .updateConstant(0, decimal, "9", "u8")
    .updateConstant(1, symbol, "Symbol", "string")
    .updateConstant(2, token_name, "Name", "string")
    .updateConstant(3, description, "Description", "string");
  // .changeIdentifiers({
  //   witness: symbol,
  //   WITNESS: symbol.toUpperCase(),
  // });

  const bytesToPublish = wasm.serialize(JSON.stringify(compiledModule));

  const tx = new TransactionBlock();
  tx.setGasBudget(100000000);

  const [upgradeCap] = tx.publish({
    modules: [[...fromHEX(bytesToPublish)]],
    dependencies: [normalizeSuiObjectId("0x1"), normalizeSuiObjectId("0x2")],
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

  if (txRes?.effects?.status.status === "success") {
    // console.log("New asset published!", JSON.stringify(txRes, null, 2));
    console.log("New asset published! Digest:", txRes.digest);
    const packageId = txRes.effects.created?.find((item) => item.owner === "Immutable")?.reference.objectId;
    console.log("Package ID:", packageId);
  } else {
    console.log(txRes);
    console.log("Error: ", txRes?.effects?.status);
    throw new Error("Publishing failed");
  }
};

publishNewAsset("5", "MA", "Magical Asset", "A magical Asset that can be used for magical things!");
