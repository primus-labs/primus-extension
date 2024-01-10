"use client";

import {BAS, SchemaEncoder} from "@bnb-attestation-service/bas-sdk";
import {hashMessage} from "viem";
import {address} from "hardhat/internal/core/config/config-validation";
import axios, {AxiosResponse} from "axios";
import {Offchain} from "@ethereum-attestation-service/eas-sdk";
import {GreenFieldClient} from "@bnb-attestation-service/bas-sdk/dist/greenFieldClient";


const base64ToHex = (base64: string) => {
    const raw = atob(base64);
    let result = "0x";
    for (let i = 0; i < raw.length; i++) {
        const hex = raw.charCodeAt(i).toString(16);
        result += hex.length === 2 ? hex : "0" + hex;
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

const formatValue = ({value, type}: any) => {
    if (type === "boolean" || type === "string") {
        return [value];
    }
    if (type === "uint256") {
        return [value.toString()];
    }
    return [value?.toString?.() || ""];
};

export function encodeAddrToBucketName(addr: string) {
    return `bas-${hashMessage(addr).substring(2, 42)}`;
};



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


// Initialize the sdk with the address of the EAS Schema contract address
let bas: BAS;

export const useBAS = () => {

    let greenFieldClient: GreenFieldClient;
    let endpointUrlParam: string
    const initClient = async (address: any, contractAddress: any, chainId: any, rpcUrl: any, endpointUrl: any) => {
        bas = new BAS(contractAddress, rpcUrl, chainId);
        greenFieldClient = bas.greenFieldClient
        greenFieldClient.init(address, chainId)
        endpointUrlParam = endpointUrl
    }
    const attestOffChainWithGreenFieldWithFixValue = async (address: any, provider: any, eip712MessageRawDataWithSignature: any,schemaUid: any, getDataTime: any) => {
        if (!address) return;
        if (!bas) {
            console.log("please init client first")
            return;
        }

        const listBucketRes = await greenFieldClient.client.bucket.listBuckets({
            address: address,
            endpoint: endpointUrlParam
        })
        let bucketExists = false;
        // @ts-ignore
        for (let bodyKey in listBucketRes.body) {
            // @ts-ignore
            console.log(listBucketRes.body[bodyKey].BucketInfo.BucketName)
            // @ts-ignore
            if (listBucketRes.body[bodyKey].BucketInfo.BucketName === encodeAddrToBucketName(address)) {
                bucketExists = true;
            }
        }
        console.log("update res", listBucketRes);
        console.log(`bucketExists : ${bucketExists}`)
        if (!bucketExists) {
            console.log("need to create bucket")
            //need to create bucket
            const res = await createBASBuckect(provider, encodeAddrToBucketName(address));
            console.log("create bucket successfully!")
        }
        //@ts-ignore
        BigInt.prototype.toJSON = function () {
            return this.toString();
        };

        const str = JSON.stringify(eip712MessageRawDataWithSignature);
        const bytes = new TextEncoder().encode(str);
        const blob = new Blob([bytes], {
            type: "application/json;charset=utf-8",
        });
        let objectInfo
        const isPrivate = false
        const attestationUid = await getAttestationUid(eip712MessageRawDataWithSignature,getDataTime)
        try {
            objectInfo = await greenFieldClient.createObject(
                provider,
                new File([blob], `${schemaUid}.${attestationUid}`),
                isPrivate
            );
        } catch (err: any) {
            if (err.statusCode === 404) {
                return "notfound";
            }
            console.log(err);
            alert(err.message);
        }

        return {...eip712MessageRawDataWithSignature, objectInfo: objectInfo,attestationUid:attestationUid};
    };

    const decodeHexData = (dataRaw: string, schemaStr: string) => {
        const schemaEncoder = new SchemaEncoder(schemaStr);
        let res = schemaEncoder.decodeData(dataRaw);
        console.log({res});
        res = res.map((e: any) => ({
            ...e,
            value: formatValue(e.value),
            // typeof e.value.type === "boolean" || typeof e.value.type === "string"
            //   ? [e.value.value]
            //   : [e.value.value?.toString?.() || ""],
        }));
        console.log({res});

        return res;
    };


    const listBASBuckect = async (provider: any, address: any) => {
        if (!address) {
            console.log('address is null')
            return
        }
        ;
        debugger
        // const res = await greenFieldClient.client.bucket.getBucketMeta({
        //     bucketName: encodeAddrToBucketName(address)
        // })
        const res = await greenFieldClient.client.bucket.listBuckets({
            address: address,
            endpoint: "https://gnfd-testnet-sp1.bnbchain.org"
        })

        debugger
        let bucketExists = false;
        // @ts-ignore
        for (let bodyKey in res.body) {
            // @ts-ignore
            console.log(res.body[bodyKey].BucketInfo.BucketName)
            // @ts-ignore
            if (res.body[bodyKey].BucketInfo.BucketName === encodeAddrToBucketName(address)) {
                bucketExists = true;
            }
        }
        // const res = await greenFieldClient.createBucket(provider);
        console.log("update res", res);
        console.log(`bucketExists : ${bucketExists}`)
        return bucketExists;
    };

    const createBASBuckect = async (provider: any, bucketName: string) => {
        debugger
        if (!address) return;
        // await shouldSwitchNetwork(chains[0].id);
        const res = await greenFieldClient.createBucket(provider, bucketName);
        console.log("create bucket res", res);
        return res;
    };

    const createBASBuckectDefault = async (provider: any, address: any) => {
        debugger
        if (!address) return;
        const res = await greenFieldClient.createBucket(provider, encodeAddrToBucketName(address));
        console.log(res)
    }

    const getAttestationUid = async (eip712MessageRawDataWithSignature: any, getDataTime: any)=>{
        let param = eip712MessageRawDataWithSignature.message
        param["time"] = getDataTime
        // param["data"] = response.data.result.typeData
        param["data"] = "0x" + param["data"]
        return Offchain.getOffchainUID(param);
    }


    return {
        attestOffChainWithGreenFieldWithFixValue,
        createBASBuckect,
        listBASBuckect,
        decodeHexData,
        createBASBuckectDefault,
        initClient
    };
};