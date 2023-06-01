import {EAS, Delegated, ATTEST_TYPE, SchemaEncoder, SchemaRegistry} from "@ethereum-attestation-service/eas-sdk";
import {ethers, utils} from 'ethers';
import {_TypedDataEncoder} from "@ethersproject/hash";
import { EASInfo } from "@/utils/constants";


export async function testeas() {
    let schemadata = {
        source: "okx",
        sourceUseridHash: "0x1234567890123456789012345678901234567890123456789012345678901234",
        authUseridHash: "",
        receipt: "0x7ab44DE0156925fe0c24482a2cDe48C465e47573",
        getDataTime: 1234567890,
        baseValue: 1234567890,
        balanceGreaterThanBaseValue: true
    };
    let params = {
        networkName: 'Sepolia',
        schemadata: schemadata,
        attesteraddr: '0x024e45D7F868C41F3723B13fD7Ae03AA5A181362'
    };
    const res = await getHash(params);
    console.log('res', res);
}
/*
params = {
    networkName: networkName,
    schemadata: {
        string source,
        bytes32 sourceUseridHash,
        bytes32 authUseridHash,
        address receipt,
        uint64 getDataTime,
        uint64 baseValue,
        bool balanceGreaterThanBaseValue
    }
    attesteraddr: addr
}

return {
    result: {
        typedatahash,
        encodedData,
    }
}
*/
export async function getHash(params) {
    const {networkName, schemadata, attesteraddr} = params;
    console.log('eas getHash params', params);
    const easContractAddress = EASInfo[networkName].easContact;
    const eas = new EAS(easContractAddress);
    const schemauid = EASInfo[networkName].schemaUid;

    let provider = new ethers.providers.JsonRpcProvider(EASInfo[networkName].rpcUrl);
    const network = await provider.getNetwork();
    const EAS_CONFIG = {
        address: easContractAddress,
        version: "0.26",
        chainId: network.chainId,
    };
    let delegated = new Delegated(EAS_CONFIG);
    const schemaEncoder = new SchemaEncoder("string source,bytes32 sourceUseridHash,bytes32 authUseridHash,address receipt,uint64 getDataTime,uint64 baseValue,bool balanceGreaterThanBaseValue");
    let encodedData = schemaEncoder.encodeData([
        {name: "source", type: "string", value: schemadata.source},
        {name: "sourceUseridHash", type: "bytes32", value: schemadata.sourceUseridHash},
        {name: "authUseridHash", type: "bytes32", value: schemadata.authUseridHash},
        {name: "receipt", type: "address", value: schemadata.receipt},
        {name: "getDataTime", type: "uint64", value: schemadata.getDataTime},
        {name: "baseValue", type: "uint64", value: schemadata.baseValue},
        {name: "balanceGreaterThanBaseValue", type: "bool", value: schemadata.balanceGreaterThanBaseValue}
    ]);

    const domain = delegated.getDomainTypedData();
    const types = {
        Attest: ATTEST_TYPE
    };
    eas.connect(provider);
    const nonce = await eas.getNonce(attesteraddr);
    console.log('nonce', nonce);
    const value = {
        schema: schemauid,
        recipient: schemadata.receipt,
        expirationTime: 0,
        revocable: true,
        data: encodedData,
        refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
        nonce: nonce.toNumber(),
    };
    console.log('domain', domain);
    console.log('types', types);
    console.log('value', value);
    const typedatahash = _TypedDataEncoder.hash(domain, types, value);
    console.log("typedatahash", typedatahash);
    console.log('encodedData', encodedData);
    let result = {};
    result.typedatahash = typedatahash;
    result.encodedData = encodedData;
    return result;
}

/*
params = {
    networkName: networkName,
    metamaskprovider: provider,
    receipt: receiptaddr,
    attesteraddr: addr,
    data: encodedData,
    signature: signature
}

return eas attestaion id
*/
export async function attestByDelegation(params) {
    let {networkName, data, attesteraddr, receipt, signature, metamaskprovider} = params;
    console.log('eas attestByDelegation params', params);
    const easContractAddress = EASInfo[networkName].easContact;
    const eas = new EAS(easContractAddress);

    let tx;
    let provider = new ethers.providers.Web3Provider(metamaskprovider);
    await provider.send("eth_requestAccounts", []);
    let signer = provider.getSigner();
    eas.connect(signer);
    try {
        const schemauid = EASInfo[networkName].schemaUid;
        tx = await eas.attestByDelegation({
            schema: schemauid,
            data: {
                recipient: receipt,
                data: data,
                expirationTime: 0,
                revocable: true,
            },
            attester: attesteraddr,
            signature: signature
        });
    } catch (er) {
        console.log("attest failed", er);
        return;
    }
    const newAttestationUID = await tx.wait();
    console.log('newAttestationUID', newAttestationUID)
    return newAttestationUID;
}

