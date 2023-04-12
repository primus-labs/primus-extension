import { EAS, Delegated, ATTEST_TYPE, SchemaEncoder, SchemaRegistry } from "@ethereum-attestation-service/eas-sdk";
import { TypedDataEncoder } from "@ethersproject/hash";

/*
params = {
    metamaskprovider: provider,
    schemadata: {
        string source,
        string(byte32) useridhash,
        string(address) address,
        string(uint64) getdatatime,
        string(uint64) baseValue,
        string(bool) balanceGreaterBaseValue
    }
    attesteraddr: addr
}

return {
    truedata: {
        hash,
        encodedData,
    },
    falsedata: {
        hash,
        encodedData,
    }
}
*/
export async function getHash(params) {
}

/*
params = {
    metamaskprovider: provider,
    receipt: receiptaddr,
    attesteraddr: addr,
    data: encodedData,
    signature: signature
}

return eas attestaion id
*/
export async function attestByDelegation(params) {
}