import {EAS, Delegated, ATTEST_TYPE, SchemaEncoder, SchemaRegistry} from "@ethereum-attestation-service/eas-sdk";
import {ethers, utils} from 'ethers';
import {_TypedDataEncoder} from "@ethersproject/hash";

const EASContractAddress = "0xC2679fBD37d54388Ce493F1DB75320D236e1815e"; // Sepolia v0.26
const eas = new EAS(EASContractAddress);
const attesteraddr = "0x024e45D7F868C41F3723B13fD7Ae03AA5A181362";
const schemauid = "0x72785c9098718a320672387465aba432ea1f2a40e7c2acc67f61ee5d8e7f5b09";

/*test demo is :

const  test=async () => {
  console.log('start to connect metamask!')
  const metamaskprovider = createMetaMaskProvider();
  console.log('connect metamask success!')
  let params = {
    'metamaskprovider': metamaskprovider,
    'schemadata': {
      'source': 'TWITTER',
      'useridhash': keccak256(toUtf8Bytes('12345')),
      'address': '0x024e45D7F868C41F3723B13fD7Ae03AA5A181362',
      'getdatatime': 123445,
      'baseValue': 100,
      'balanceGreaterBaseValue': true
    },
    attesteraddr: '0x024e45D7F868C41F3723B13fD7Ae03AA5A181362'
  }
  let provider = new ethers.providers.Web3Provider(metamaskprovider);
  await provider.send("eth_requestAccounts", []);
  let signer = provider.getSigner();

  let result = await getHash(params)
  console.log('signature',result.signature)
  let param_tem = {
    'metamaskprovider': metamaskprovider,
    'receipt': "0x024e45D7F868C41F3723B13fD7Ae03AA5A181362",
    'attesteraddr': '0x024e45D7F868C41F3723B13fD7Ae03AA5A181362',
    'data': result.encodedData,
    'signature':   splitSignature(result.signature)

  }
  attestByDelegation(param_tem)

}


 */


/**
 * attesteraddr  receipt
 */

/*
params = {
    metamaskprovider: provider,
    schemadata: {
        string source,
        string(bytes32) useridhash,
        string(address) address,
        string(uint64) getdatatime,
        string(uint64) baseValue,
        string(bool) balanceGreaterBaseValue
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
    const {metamaskprovider, schemadata} = params;
    console.log('params', params)
    let provider = new ethers.providers.Web3Provider(metamaskprovider);
    await provider.send("eth_requestAccounts", []);
    let signer = provider.getSigner();
    const network = await provider.getNetwork();
    const EAS_CONFIG = {
        address: EASContractAddress,
        version: "0.26",
        chainId: network.chainId,
    };
    let delegated = new Delegated(EAS_CONFIG);
    const schemaEncoder = new SchemaEncoder("string source, bytes32 useridhash, address address, uint64 getdatatime, uint64 baseValue, bool balanceGreaterBaseValue");
    let encodedData = schemaEncoder.encodeData([
        {name: "source", type: "string", value: schemadata.source},
        {name: "useridhash", type: "bytes32", value: schemadata.useridhash},
        {name: "address", type: "address", value: schemadata.address},
        {name: "getdatatime", type: "uint64", value: schemadata.getdatatime},
        {name: "baseValue", type: "uint64", value: schemadata.baseValue},
        {name: "balanceGreaterBaseValue", type: "bool", value: schemadata.balanceGreaterBaseValue}
    ]);
    eas.connect(signer);
    const nonce = await eas.getNonce(attesteraddr);
    const domain = delegated.getDomainTypedData();
    const types = {
        Attest: ATTEST_TYPE
    };
    const value = {
        schema: schemauid,
        recipient: await signer.getAddress(),
        expirationTime: 0,
        revocable: true,
        data: encodedData,
        refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
        nonce: nonce.toNumber(),
    };
    console.log('domain', domain)
    console.log('types', types)
    console.log('value', value)
    const typedatahash = _TypedDataEncoder.hash(domain, types, value);
    // let signature = await signer._signTypedData(domain, types, value)
    console.log("typedatahash", typedatahash)
    console.log('encodedData', encodedData)
    let result = {}
    result.typedatahash = typedatahash
    result.encodedData = encodedData
    // result.signature = signature
    return result;
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
    let {data, attesteraddr, receipt, signature, metamaskprovider} = params;
    console.log('data', data)
    console.log('attesteraddr', attesteraddr)
    console.log('receipt', receipt)
    console.log('metamaskprovider', metamaskprovider)
    //for test
    let tx;
    let provider = new ethers.providers.Web3Provider(metamaskprovider);
    await provider.send("eth_requestAccounts", []);
    let signer = provider.getSigner();
    eas.connect(signer);
    try {
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

