// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

// ref = https://github.com/MystenLabs/asset-tokenization/blob/main/setup/src/utils/bytecode-template.ts
const { BCS, getRustConfig, BcsReader, BcsWriter } = require("@mysten/bcs");
const bcs = new BCS(getRustConfig());

/**
 * Helper class which wraps the underlying JSON structure.
 * Provides a way to change the identifiers and update the identifier indexes.
 */
class CompiledModule {
  inner;

  constructor(inner) {
    this.inner = inner;
  }

  /**
   * Quite dangerous method which updates a constant in the constant pool. To make sure
   * that the index is set correctly, the `expectedValue` and `expectedType` must be provided
   * - this way we at least try to minimize the risk of updating a wrong constant.
   */
  updateConstant(idx, value, expectedValue, expectedType) {
    if (idx >= this.inner.constant_pool.length) {
      throw new Error("Invalid constant index; no constant exists at this index");
    }

    let { type_, data } = this.inner.constant_pool[idx];
    type_ = JSON.stringify(type_) == JSON.stringify({ Vector: "U8" }) ? "string" : type_;

    if (expectedType.toLowerCase() !== type_.toLowerCase()) {
      throw new Error(`Invalid constant type; expected ${expectedType}, got ${type_}`);
    }

    let oldValue = bcs.de(type_.toLowerCase(), new Uint8Array(data)).toString();

    if (oldValue !== expectedValue) {
      throw new Error(`Invalid constant value; expected ${expectedValue}, got ${oldValue}`);
    }

    this.inner.constant_pool[idx].data = [...bcs.ser(type_.toLowerCase(), value).toBytes()];

    return this;
  }

  /**
   * Update `identifiers`: provide the changeset where keys are the old
   * identifiers and values are the new identifiers.
   */
  changeIdentifiers(identMap) {
    // first apply patches - they don't affect indexes; but we need to keep
    // them to compare agains the new sorting order later.
    let identifiers = Object.freeze([...this.inner.identifiers].map((ident) => (ident in identMap ? identMap[ident] : ident)));

    // sort the identifiers - indexes are changed.
    this.inner.identifiers = [...identifiers].sort((a, b) => a.charCodeAt(0) - b.charCodeAt(0));

    // console.log(this.inner.identifiers, identifiers);

    let indexUpdates = new Map();
    for (let ident of identifiers) {
      let oldIdx = identifiers.indexOf(ident);
      let newIdx = this.inner.identifiers.indexOf(ident);
      indexUpdates.set(oldIdx, newIdx);
    }

    const keys = ["module_handles", "struct_handles", "function_handles", "field_handles"];

    // update each of the storages with the new index.
    for (let innerKey of keys) {
      // @ts-ignore
      this.inner[innerKey] = this.inner[innerKey].map((handle) => {
        return indexUpdates.has(handle.name) ? { ...handle, name: indexUpdates.get(handle.name) } : handle;
      });
    }

    // separately patch struct defs
    this.inner.struct_defs = this.inner.struct_defs.map((struct) => {
      let decl = struct.field_information.Declared.map((decl) => ({
        ...decl,
        name: indexUpdates.get(decl.name),
      }));

      return {
        ...struct,
        field_information: { Declared: decl },
      };
    });

    return this;
  }

  toJSON() {
    return this.inner;
  }
}

/**
 * Return the tempate bytecode.
 *
 * Can be acquired by compiling the `template` package and then fetching
 * via the command:
 * ```
 * xxd -c 0 -p build/template/bytecode_modules/template.mv | head -n 1
 * ```
 *
 * Should not be modified manually.
 * Depends on the `Collectible` package and must be rebuilt if the
 * `Collectible` has been republished on the network.
 */
function getBytecode() {
  return "a11ceb0b060000000a01000c020c1e032a22044c0805545407a801b40108dc026006bc03240ae003050ce503280012010b0206020f021002110005020001010701000002000c01000102020c01000104030200050407000009000100010a01040100020706070102030c0901010c030d0d01010c040e0a0b00010302050308040c02080007080400020b020108000b03010800010805010b01010900010800070900020a020a020a020b01010805070804020b030109000b02010900010b02010800010900010608040105010b03010800020900050c436f696e4d65746164617461064f7074696f6e0b5472656173757279436170095478436f6e746578740355726c075749544e45535304636f696e0f6372656174655f63757272656e63790b64756d6d795f6669656c6404696e6974046e6f6e65066f7074696f6e147075626c69635f667265657a655f6f626a6563740f7075626c69635f7472616e736665720673656e646572087472616e736665720a74785f636f6e746578740375726c077769746e6573730000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020201090a02070653796d626f6c0a0205044e616d650a020c0b4465736372697074696f6e00020108010000000002120b00070007010702070338000a0138010c020c030b0238020b030b012e110538030200";
}

module.exports = {
  getBytecode,
  CompiledModule,
};
