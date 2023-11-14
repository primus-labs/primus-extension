import {
  EAS,
  Delegated,
  ATTEST_TYPE,
  SchemaEncoder,
  SchemaRegistry,
  ZERO_BYTES32,
} from '@ethereum-attestation-service/eas-sdk';
import { EIP712Proxy } from '@ethereum-attestation-service/eas-sdk/dist/eip712-proxy';
import { ethers, utils, BigNumber as BN } from 'ethers';
import { proxyabi } from './proxyabi';
import { lineaportalabi } from './lineaportalabi';

//const { keccak256, toUtf8Bytes, splitSignature } = utils;
import { _TypedDataEncoder } from '@ethersproject/hash';
import { EASInfo } from '@/config/envConstants';
//var ethereumjsUtil = require('ethereumjs-util');

export async function testeas() {
  //const testkeyhash = keccak256(toUtf8Bytes(""));
  //console.log("testkeyhash=", testkeyhash);

  //const testhash2 = ethereumjsUtil.keccak256(Buffer.from("", 'utf-8'));
  //console.log("testhash2=", ethereumjsUtil.bufferToHex(testhash2));

  let schemadata = {
    source: 'okx',
    sourceUseridHash: '',
    authUseridHash:
      '0x1234567890123456789012345678901234567890123456789012345678901234',
    receipt: '0x7ab44DE0156925fe0c24482a2cDe48C465e47573',
    getDataTime: 1234567890,
    baseValue: 1000,
    balanceGreaterThanBaseValue: true,
  };
  let params = {
    networkName: 'Sepolia',
    schemadata: schemadata,
    attesteraddr: '0x024e45D7F868C41F3723B13fD7Ae03AA5A181362',
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
  const { networkName, schemadata, attesteraddr } = params;
  console.log('eas getHash params', params);
  const easContractAddress = EASInfo[networkName].easContact;
  const eas = new EAS(easContractAddress);
  const schemauid = EASInfo[networkName].schemaUid;

  let provider = new ethers.providers.JsonRpcProvider(
    EASInfo[networkName].rpcUrl
  );
  const network = await provider.getNetwork();
  const EAS_CONFIG = {
    address: easContractAddress,
    version: '0.26',
    chainId: network.chainId,
  };
  let delegated = new Delegated(EAS_CONFIG);
  const schemaEncoder = new SchemaEncoder(
    'string source,bytes32 sourceUseridHash,bytes32 authUseridHash,address receipt,uint64 getDataTime,uint64 baseValue,bool balanceGreaterThanBaseValue'
  );
  let encodedData = schemaEncoder.encodeData([
    { name: 'source', type: 'string', value: schemadata.source },
    {
      name: 'sourceUseridHash',
      type: 'bytes32',
      value: schemadata.sourceUseridHash,
    },
    {
      name: 'authUseridHash',
      type: 'bytes32',
      value: schemadata.authUseridHash,
    },
    { name: 'receipt', type: 'address', value: schemadata.receipt },
    { name: 'getDataTime', type: 'uint64', value: schemadata.getDataTime },
    { name: 'baseValue', type: 'uint64', value: schemadata.baseValue },
    {
      name: 'balanceGreaterThanBaseValue',
      type: 'bool',
      value: schemadata.balanceGreaterThanBaseValue,
    },
  ]);

  const domain = delegated.getDomainTypedData();
  const types = {
    Attest: ATTEST_TYPE,
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
    refUID:
      '0x0000000000000000000000000000000000000000000000000000000000000000',
    nonce: nonce.toNumber(),
  };
  console.log('domain', domain);
  console.log('types', types);
  console.log('value', value);
  const typedatahash = _TypedDataEncoder.hash(domain, types, value);
  console.log('typedatahash', typedatahash);
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
  let {
    networkName,
    data,
    attesteraddr,
    receipt,
    signature,
    metamaskprovider,
  } = params;
  const splitsignature = utils.splitSignature(signature);
  const formatSignature = {
    v: splitsignature.v,
    r: splitsignature.r,
    s: splitsignature.s,
  };
  console.log('eas attestByDelegation params', params);
  const easContractAddress = EASInfo[networkName].easContact;
  const eas = new EAS(easContractAddress);

  let tx;
  let provider = new ethers.providers.Web3Provider(metamaskprovider);
  await provider.send('eth_requestAccounts', []);
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
      signature: formatSignature,
    });
  } catch (er) {
    console.log('attest failed', er);
    return;
  }
  const newAttestationUID = await tx.wait();
  console.log('newAttestationUID', newAttestationUID);
  return newAttestationUID;
}

async function getFee(networkName, metamaskprovider) {
  const contractAddress = EASInfo[networkName].easProxyFeeContract;
  const abi = ['function fee() public view returns(uint256)'];
  let provider = new ethers.providers.Web3Provider(metamaskprovider);
  const contract = new ethers.Contract(contractAddress, abi, provider);
  const fee = await contract.fee();
  console.log('get fee=', fee);
  return fee;
}

export async function attestByDelegationProxy(params) {
  let {
    networkName,
    data,
    attesteraddr,
    receipt,
    signature,
    metamaskprovider,
    type,
    schemaName,
  } = params;
  const splitsignature = utils.splitSignature(signature);
  const formatSignature = {
    v: splitsignature.v,
    r: splitsignature.r,
    s: splitsignature.s,
  };
  console.log('eas attestByDelegationProxy params', params);
  const easProxyContractAddress = EASInfo[networkName].easProxyContrac;
  const easProxy = new EIP712Proxy(easProxyContractAddress);
  let tx;
  let provider = new ethers.providers.Web3Provider(metamaskprovider);

  await provider.send('eth_requestAccounts', []);

  let signer = provider.getSigner();
  easProxy.connect(signer);
  try {
    let schemauid;
    const activeSchemaInfo = EASInfo[networkName].schemas[schemaName];
    if (type === 'ASSETS_PROOF') {
      schemauid = activeSchemaInfo.schemaUid;
    } else if (type === 'TOKEN_HOLDINGS') {
      schemauid = activeSchemaInfo.schemaUidTokenHoldings;
    } else if (type === 'IDENTIFICATION_PROOF') {
      schemauid = activeSchemaInfo.schemaUidIdentification;
    }
    console.log('attestByDelegationProxy schemauid=', schemauid);
    tx = await easProxy.attestByDelegationProxy(
      {
        schema: schemauid,
        data: {
          recipient: receipt,
          data: data,
          expirationTime: 0,
          revocable: true,
        },
        attester: attesteraddr,
        signature: formatSignature,
        deadline: 0,
      }
      // { gasPrice: BN.from('20000000000'), gasLimit: BN.from('1000000') }
    );
  } catch (er) {
    console.log('eas attestByDelegationProxy attest failed', er);
    return;
  }
  const newAttestationUID = await tx.wait();
  console.log(
    'eas attestByDelegationProxy newAttestationUID',
    newAttestationUID
  );
  return newAttestationUID;
}

export async function attestByDelegationProxyFee(params) {
  let {
    networkName,
    data,
    attesteraddr,
    receipt,
    signature,
    metamaskprovider,
    type,
    schemaName,
  } = params;
  const splitsignature = utils.splitSignature(signature);
  const formatSignature = {
    v: splitsignature.v,
    r: splitsignature.r,
    s: splitsignature.s,
  };
  console.log('eas attestByDelegationProxyFee params', params);
  const easProxyFeeContractAddress = EASInfo[networkName].easProxyFeeContract;
  let provider = new ethers.providers.Web3Provider(metamaskprovider);
  await provider.send('eth_requestAccounts', []);
  let signer = provider.getSigner();
  let contract;
  if (networkName.startsWith('Linea') || networkName.indexOf('Scroll') > -1) {
    contract = new ethers.Contract(
      easProxyFeeContractAddress,
      lineaportalabi,
      signer
    );
  } else {
    contract = new ethers.Contract(
      easProxyFeeContractAddress,
      proxyabi,
      signer
    );
  }
  let tx;
  let schemauid;
  const activeSchemaInfo = EASInfo[networkName].schemas[schemaName];
  if (type === 'ASSETS_PROOF') {
    schemauid = activeSchemaInfo.schemaUid;
  } else if (type === 'TOKEN_HOLDINGS') {
    schemauid = activeSchemaInfo.schemaUidTokenHoldings;
  } else if (type === 'IDENTIFICATION_PROOF') {
    schemauid = activeSchemaInfo.schemaUidIdentification;
  } else if (type === 'web') {
    // TODO
    schemauid = activeSchemaInfo.schemaUidWeb;
  }
  console.log(
    'attestByDelegationProxyFee schemauid=',
    schemauid,
    easProxyFeeContractAddress
  );
  const fee = await getFee(networkName, metamaskprovider);
  const paramsobj = {
    schema: schemauid,
    data: {
      recipient: receipt,
      expirationTime: 0,
      revocable: true,
      refUID: ZERO_BYTES32,
      data: data,
      value: 0n,
    },
    signature: formatSignature,
    attester: attesteraddr,
    deadline: 0,
  };
  try {
    if (networkName.startsWith('Linea') || networkName.indexOf('Scroll') > -1) {
      tx = await contract.attest(paramsobj, { value: fee });
    } else {
      tx = await contract.attestByDelegation(
        paramsobj,
        { value: fee }
        // { gasPrice: BN.from('20000000000'), gasLimit: BN.from('1000000') }
      );
    }
  } catch (er) {
    console.log('222222eas attestByDelegationProxyFee attest failed', er);
    try {
      if (
        networkName.startsWith('Linea') ||
        networkName.indexOf('Scroll') > -1
      ) {
        tx = await contract.callStatic.attest(paramsobj, { value: fee });
      } else {
        tx = await contract.callStatic.attestByDelegation(paramsobj, {
          value: fee,
        });
      }
    } catch (error) {
      console.log('eas attestByDelegationProxyFee caught error:\n', error);
    }
    if (
      (er.data && er.data.message.indexOf('insufficient funds') > -1) ||
      er.message.indexOf('insufficient funds') > -1
    ) {
      
      return {
        error: 1,
        message: 'insufficient funds',
      };
    } else if (er.ACTION_REJECTED === 'ACTION_REJECTED') {
      return {
        error: 2,
        message: 'user rejected transaction',
      };
    }
    // throw new Error(er);

    return;
  }
  console.log('eas attestByDelegationProxyFee tx=', tx);
  const txreceipt = await tx.wait();
  console.log('eas attestByDelegationProxyFee txreceipt=', txreceipt);
  if (networkName.startsWith('Linea') || networkName.indexOf('Scroll') > -1) {
    return txreceipt.transactionHash;
  } else {
    const newAttestationUID = txreceipt.logs[txreceipt.logs.length - 1].data;
    return newAttestationUID;
  }
}

export async function bulkAttest(params) {
  let {
    networkName,
    metamaskprovider,
    items /*: [{
      data,
      attesteraddr,
      receipt,
      signature,
      type,
      schemaName,
    }]*/,
  } = params;
  console.log('eas bulkAttest params', params);
  const easProxyFeeContractAddress = EASInfo[networkName].easProxyFeeContract;
  let provider = new ethers.providers.Web3Provider(metamaskprovider);
  await provider.send('eth_requestAccounts', []);
  let signer = provider.getSigner();
  let contract;
  if (networkName.startsWith('Linea') || networkName.indexOf('Scroll') > -1) {
    contract = new ethers.Contract(
      easProxyFeeContractAddress,
      lineaportalabi,
      signer
    );
  } else {
    contract = new ethers.Contract(
      easProxyFeeContractAddress,
      proxyabi,
      signer
    );
  }

  let bulkParams = [];
  for (const item of items) {
    const splitsignature = utils.splitSignature(item.signature);
    const formatSignature = {
      v: splitsignature.v,
      r: splitsignature.r,
      s: splitsignature.s,
    };
    let schemauid;
    const activeSchemaInfo = EASInfo[networkName].schemas[item.schemaName];
    if (item.type === 'ASSETS_PROOF') {
      schemauid = activeSchemaInfo.schemaUid;
    } else if (item.type === 'TOKEN_HOLDINGS') {
      schemauid = activeSchemaInfo.schemaUidTokenHoldings;
    } else if (item.type === 'IDENTIFICATION_PROOF') {
      schemauid = activeSchemaInfo.schemaUidIdentification;
    } else if (item.type === 'web') {
      // TODO
      schemauid = activeSchemaInfo.schemaUidWeb;
    }
    console.log('bulkAttest schemauid=', schemauid);

    const paramsobj = {
      schema: schemauid,
      data: {
        recipient: item.receipt,
        expirationTime: 0,
        revocable: true,
        refUID: ZERO_BYTES32,
        data: item.data,
        value: 0,
      },
      signature: formatSignature,
      attester: item.attesteraddr,
      deadline: 0,
    };
    bulkParams.push(paramsobj);
  }

  const fee = await getFee(networkName, metamaskprovider);
  const bulkFee = fee * bulkParams.length;
  let tx;
  try {
    tx = await contract.bulkAttest(bulkParams, { value: bulkFee });
  } catch (er) {
    try {
      tx = await contract.callStatic.bulkAttest(bulkParams, { value: bulkFee });
    } catch (error) {
      console.log('eas bulkAttest caught error:\n', error);
    }
    if (er.data && er.data.message.indexOf('insufficient funds') > -1) {
      return {
        error: 1,
        message: 'insufficient funds',
      };
    } else if (er.ACTION_REJECTED === 'ACTION_REJECTED') {
      return {
        error: 2,
        message: 'user rejected transaction',
      };
    }
    // throw new Error(er);
    return;
  }

  console.log('eas bulkAttest tx=', tx);
  const txreceipt = await tx.wait();
  console.log('eas bulkAttest txreceipt=', txreceipt);
  if (networkName.startsWith('Linea') || networkName.indexOf('Scroll') > -1) {
    return txreceipt.transactionHash;
  } else {
    let newAttestationUIDs = [];
    for (let i = 0; i < bulkParams.length; i++) {
      const attestationUID =
        txreceipt.logs[txreceipt.logs.length - bulkParams.length + i].data;
      newAttestationUIDs.push(attestationUID);
    }
    return newAttestationUIDs;
  }
}

export function getAttestInfoByEncodeDdata(schemaStr, encodeD) {
  const schemaEncoder = new SchemaEncoder(schemaStr);
  let encodedData = schemaEncoder.decodeData(encodeD);
  return encodedData;
}
