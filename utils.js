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
  return "a11ceb0b060000000a01000c020c1e032a2d04570a05615e07bf01cf01088e036006ee03340aa204050ca704410014010c02060211021202130005020001010701000002000c01000102020c01000104030200050407000009000100010b01040100011006040100020708090102030d0601010c030e0e01010c040f0b0c00050a050300010302030307040a050d02080007080400040b0101080508000b020108000b03010800010805010b01010900010a02010900010800070900020a020a020a020b01010805070804020b030109000b02010900010b02010800010608040105010b03010800020900050c436f696e4d65746164617461064f7074696f6e0b5472656173757279436170095478436f6e746578740355726c075749544e45535304636f696e0f6372656174655f63757272656e63790b64756d6d795f6669656c6404696e6974156e65775f756e736166655f66726f6d5f6279746573046e6f6e65066f7074696f6e147075626c69635f667265657a655f6f626a6563740f7075626c69635f7472616e736665720673656e64657204736f6d65087472616e736665720a74785f636f6e746578740375726c077769746e6573730000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000020201090a02070653796d626f6c0a0205044e616d650a020c0b4465736372697074696f6e0a02090849636f6e5f55726c0a020100000201080100000000021f0b000c030704070521040938000c02050d0704110738010c020b0307000701070207030b020a0138020c040c050b0438030b050b012e110638040200";
}

module.exports = {
  getBytecode,
  CompiledModule,
};
