'use client';
import createMetaMaskProvider from 'metamask-extension-provider';
import { BAS, SchemaEncoder } from '@bnb-attestation-service/bas-sdk';
import { hashMessage } from 'viem';
// import { address } from 'hardhat/internal/core/config/config-validation';
import axios, { AxiosResponse } from 'axios';
import { Offchain } from '@ethereum-attestation-service/eas-sdk';
import { GreenFieldClient } from '@bnb-attestation-service/bas-sdk/dist/greenFieldClient';
import { CustomGreenFieldClient } from './CustomGreenFieldClient';

const base64ToHex = (base64: string) => {
  const raw = atob(base64);
  let result = '0x';
  for (let i = 0; i < raw.length; i++) {
    const hex = raw.charCodeAt(i).toString(16);
    result += hex.length === 2 ? hex : '0' + hex;
  }
  return result;
};

enum VisibilityType {
  VISIBILITY_TYPE_UNSPECIFIED = 0,
  VISIBILITY_TYPE_PUBLIC_READ = 1,
  VISIBILITY_TYPE_PRIVATE = 2,
  /** VISIBILITY_TYPE_INHERIT - If the bucket Visibility is inherit, it's finally set to private. If the object Visibility is inherit, it's the same as bucket. */
  VISIBILITY_TYPE_INHERIT = 3,
  UNRECOGNIZED = -1,
}

const formatValue = ({ value, type }: any) => {
  if (type === 'boolean' || type === 'string') {
    return [value];
  }
  if (type === 'uint256') {
    return [value.toString()];
  }
  return [value?.toString?.() || ''];
};

export function encodeAddrToBucketName(addr: string) {
  return `bas-${hashMessage(addr).substring(2, 42)}`;
}

//Demo url : https://github.com/xudean/bas-greenfield-demo

// BNB Greenfield Testnet:
// networkName: BNB Greenfield Testnet
// rpcUrl: https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org
// chainId: 5600
// symbol: tBNB
// chainScan: https://testnet.greenfieldscan.com
// endpointUrl: https://gnfd-testnet-sp1.bnbchain.org
//
// BNB Greenfield Mainnet:
// networkName: BNB Greenfield Mainnet
// rpcUrl: https://greenfield-chain.bnbchain.org
// chainId: 1017
// symbol: BNB
// chainScan: https://greenfieldscan.com
// endpointUrl: https://greenfield-sp.bnbchain.org

export const EASContractAddress = '0x620e84546d71A775A82491e1e527292e94a7165A'; //  BNB BAS

// Initialize the sdk with the address of the EAS Schema contract address
let bas: BAS;

export const useBAS = () => {
  let greenFieldClient: CustomGreenFieldClient;
  let endpointUrlParam: string;
  const initClient = async (
    address: any,
    contractAddress: any,
    chainId: any,
    rpcUrl: any,
    endpointUrl: any
  ) => {
    bas = new BAS(contractAddress, rpcUrl, chainId);
    greenFieldClient = new CustomGreenFieldClient(rpcUrl, chainId);
    bas.greenFieldClient = greenFieldClient;
    greenFieldClient.init(address, chainId);
    endpointUrlParam = endpointUrl;
  };
  const attestOffChainWithGreenFieldWithFixValue = async (
    address: any,
    // provider: any,
    attestationInfo: any
  ) => {
    console.log('111attestOffChainWithGreenFieldWithFixValue');

    const provider = createMetaMaskProvider();
    console.log('111provider:', provider)
    if (!address) return;
    if (!bas) {
      console.log('please init client first');
      return;
    }

    const listBucketRes = await greenFieldClient.client.bucket.listBuckets({
      address: address,
      endpoint: endpointUrlParam,
    });
    let bucketExists = false;
    // @ts-ignore
    for (let bodyKey in listBucketRes.body) {
      // @ts-ignore
      console.log(listBucketRes.body[bodyKey].BucketInfo.BucketName);
      // @ts-ignore
      if (
        listBucketRes.body[bodyKey].BucketInfo.BucketName ===
        encodeAddrToBucketName(address)
      ) {
        bucketExists = true;
      }
    }
    console.log('update res', listBucketRes);
    console.log(`bucketExists : ${bucketExists}`);
    if (!bucketExists) {
      console.log('need to create bucket');
      //need to create bucket
      const res = await createBASBuckect(
        provider,
        encodeAddrToBucketName(address)
      );
      console.log('create bucket successfully!');
    }
    //@ts-ignore
    BigInt.prototype.toJSON = function () {
      return this.toString();
    };
    let files = [];
    let resp = [];
    for (let i = 0; i < attestationInfo.length; i++) {
      const str = JSON.stringify(
        attestationInfo[i].eip712MessageRawDataWithSignature
      );
      const bytes = new TextEncoder().encode(str);
      const blob = new Blob([bytes], {
        type: 'application/json;charset=utf-8',
      });
      const attestationUid = await getAttestationUid(
        attestationInfo[i].eip712MessageRawDataWithSignature,
        attestationInfo[i].getDataTime
      );
      // @ts-ignore
      files[i] = new File(
        [blob],
        `${attestationInfo[i].schemaUid}.${attestationUid}`
      );
      // @ts-ignore
      resp[i] = {
        eip712MessageRawDataWithSignature:
          attestationInfo[i].eip712MessageRawDataWithSignature,
        attestationUid: attestationUid,
      };
    }
    const isPrivate = false;
    try {
      await greenFieldClient.createObjects(provider, files, isPrivate);
    } catch (err: any) {
      if (err.statusCode === 404) {
        return 'notfound';
      }
      if (err.message === 'repeated object') {
        return 'repeated object';
      }
      console.log(err);
      alert(err.message);
    }

    return resp;
  };

  const decodeHexData = (dataRaw: string, schemaStr: string) => {
    const schemaEncoder = new SchemaEncoder(schemaStr);
    let res = schemaEncoder.decodeData(dataRaw);
    console.log({ res });
    res = res.map((e: any) => ({
      ...e,
      value: formatValue(e.value),
      // typeof e.value.type === "boolean" || typeof e.value.type === "string"
      //   ? [e.value.value]
      //   : [e.value.value?.toString?.() || ""],
    }));
    console.log({ res });

    return res;
  };

  const listBASBuckect = async (provider: any, address: any) => {
    if (!address) {
      console.log('address is null');
      return;
    }
    // const res = await greenFieldClient.client.bucket.getBucketMeta({
    //     bucketName: encodeAddrToBucketName(address)
    // })
    const res = await greenFieldClient.client.bucket.listBuckets({
      address: address,
      endpoint: endpointUrlParam,
    });

    let bucketExists = false;
    // @ts-ignore
    for (let bodyKey in res.body) {
      // @ts-ignore
      console.log(res.body[bodyKey].BucketInfo.BucketName);
      // @ts-ignore
      if (
        res.body[bodyKey].BucketInfo.BucketName ===
        encodeAddrToBucketName(address)
      ) {
        bucketExists = true;
      }
    }
    // const res = await greenFieldClient.createBucket(provider);
    console.log('update res', res);
    console.log(`bucketExists : ${bucketExists}`);
    return bucketExists;
  };

  const createBASBuckect = async (provider: any, bucketName: string) => {
    if (!address) return;
    // await shouldSwitchNetwork(chains[0].id);
    const res = await greenFieldClient.createBucket(provider, bucketName);
    console.log('create bucket res', res);
    return res;
  };

  const createBASBuckectDefault = async (provider: any, address: any) => {
    if (!address) return;
    const res = await greenFieldClient.createBucket(
      provider,
      encodeAddrToBucketName(address)
    );
    console.log(res);
  };

  const getAttestationUid = async (
    eip712MessageRawDataWithSignature: any,
    getDataTime: any
  ) => {
    let param = eip712MessageRawDataWithSignature.message;
    param['time'] = getDataTime;
    // param["data"] = response.data.result.typeData
    param['data'] = '0x' + param['data'];
    return Offchain.getOffchainUID(param);
  };

  const getNewSignature = async (requestBody: any) => {
    const header = {
      Authorization:
        'Bearer eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJwYWRvbGFicy5vcmciLCJzdWIiOiIweGMxYTdGNmYzOTdkNUM3OTNhNzg2MTNDZjM2NGEwNjkxNDZkZDcxZjciLCJleHAiOjQ4NTM2MTgxNjcsInVzZXItaWQiOjE3MjQ2MjczMTIwOTczNjE5MjAsInNjb3BlIjoiYXV0aCJ9.MHRWNwh1v4PFrLrvkZrRJDmXdkVcIuKxf9Onu7UKLgHZcdSlWq6m8IV3Eq-wJjVwbBpv5zHh9jCh8uQG7GAFacVvwuUNAcquWS8xmK669ANQvSMerq6G0L2kv7iUWz6KEimq0M1btdphZuwIPDa3epHeTHRZJlDCo35gGRSV2qcoPgdoyidUKOMhSCdvPqs-df3r7Is32Xtrn3AvFPWAiQWwcW2rSnbv-5KCEMIGS7jcIXlwDIpm3-HfXsynwnbOfsLQ0WOExiXseObZHaAdTGu925Cv0c6L4TzXj9NmWPB201wgwg_KxqXFHcChCMBUbHW0ChN9xc1VqlkgfBjROg',
    };
    // const url = "https://api-dev.padolabs.org/credential/re-generate?newSigFormat=Verax-Scroll-Sepolia";
    const url =
      'https://api-dev.padolabs.org/credential/re-generate?newSigFormat=BAS-BSC-Testnet';
    const body = JSON.parse(requestBody);
    const response: AxiosResponse = await axios.post(url, body, {
      headers: header,
    });
    let eip712MessageRawDataWithSignature =
      response.data.result.eip712MessageRawDataWithSignature;
    return {
      eip712MessageRawDataWithSignature: eip712MessageRawDataWithSignature,
      getDataTime: response.data.result.result.getDataTime,
      schemaUid: response.data.result.schemaUid,
    };
  };

  return {
    getNewSignature,
    attestOffChainWithGreenFieldWithFixValue,
    createBASBuckect,
    listBASBuckect,
    decodeHexData,
    createBASBuckectDefault,
    initClient,
  };
};
console.log(111);
console.log(222, base64ToHex);
console.log(333, useBAS);
console.log(444, window);

window.addEventListener('message', async (event) => {
  console.log('111sandbox receive:', event);
  const result = 'invalid request';
  const { name, params } = event.data;
  const { initClient, attestOffChainWithGreenFieldWithFixValue } = useBAS();
  if (name === 'initClient') {
    const { address, easContact, chainId, rpcUrl, endpointUrl } = params;
    await initClient(address, easContact, chainId, rpcUrl, endpointUrl);
    event.source.postMessage(
      { name: 'initClient', result: { success: true } },
      event.origin
    );
  } else if (name === 'attestOffChainWithGreenFieldWithFixValue') {
    const { address, attestationInfo } = params;

    console.log('111windowParent', window.parent);
    const res = await attestOffChainWithGreenFieldWithFixValue(
      address,
      attestationInfo
    );
    event.source.postMessage(
      {
        name: 'attestOffChainWithGreenFieldWithFixValue',
        result: { success: true , res},
      },
      event.origin
    );
  }
});
