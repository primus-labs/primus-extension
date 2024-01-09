"use client";

import {BAS, SchemaEncoder, SchemaRegistry} from "@bnb-attestation-service/bas-sdk";
import {hashMessage} from "viem";
import {address} from "hardhat/internal/core/config/config-validation";
import axios, {AxiosResponse} from "axios";
import {Offchain} from "@ethereum-attestation-service/eas-sdk";
import { GreenFieldClient } from "@bnb-attestation-service/bas-sdk/dist/greenFieldClient";

export const GRPC_URL =
    "https://gnfd-testnet-fullnode-tendermint-ap.bnbchain.org";
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


export const EASContractAddress = "0x620e84546d71A775A82491e1e527292e94a7165A"; //  BNB BAS

// Initialize the sdk with the address of the EAS Schema contract address
let bas: BAS;

export const useBAS = () => {

    let greenFieldClient: GreenFieldClient;
    const initClient = async (address: any, chainId: any, rpcUrl: any) => {
        bas = new BAS(EASContractAddress, rpcUrl, chainId);
        greenFieldClient = bas.greenFieldClient
        greenFieldClient.init(address,chainId)
    }
    const attestOffChainWithGreenFieldWithFixValue = async (address: any, provider: any, eip712MessageRawDataWithSignature: any, schemaUid: any) => {
        debugger
        if (!address) return;
        if (!bas) {
            console.log("please init client first")
            return;
        }

        const listBucketRes = await greenFieldClient.client.bucket.listBuckets({
            address: address,
            endpoint: "https://gnfd-testnet-sp1.bnbchain.org"
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
        try {
            debugger
            objectInfo = await greenFieldClient.createObject(
                provider,
                new File([blob], `${schemaUid}.${eip712MessageRawDataWithSignature["uid"]}`),
                isPrivate
            );
        } catch (err: any) {
            if (err.statusCode === 404) {
                return "notfound";
            }
            console.log(err);
            alert(err.message);
        }

        return {...eip712MessageRawDataWithSignature, objectInfo: objectInfo};
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

    const getNewSignature = async () => {
        const header = {
            "Authorization": "Bearer eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJwYWRvbGFicy5vcmciLCJzdWIiOiIweGMxYTdGNmYzOTdkNUM3OTNhNzg2MTNDZjM2NGEwNjkxNDZkZDcxZjciLCJleHAiOjQ4NTM2MTgxNjcsInVzZXItaWQiOjE3MjQ2MjczMTIwOTczNjE5MjAsInNjb3BlIjoiYXV0aCJ9.MHRWNwh1v4PFrLrvkZrRJDmXdkVcIuKxf9Onu7UKLgHZcdSlWq6m8IV3Eq-wJjVwbBpv5zHh9jCh8uQG7GAFacVvwuUNAcquWS8xmK669ANQvSMerq6G0L2kv7iUWz6KEimq0M1btdphZuwIPDa3epHeTHRZJlDCo35gGRSV2qcoPgdoyidUKOMhSCdvPqs-df3r7Is32Xtrn3AvFPWAiQWwcW2rSnbv-5KCEMIGS7jcIXlwDIpm3-HfXsynwnbOfsLQ0WOExiXseObZHaAdTGu925Cv0c6L4TzXj9NmWPB201wgwg_KxqXFHcChCMBUbHW0ChN9xc1VqlkgfBjROg"
        }
        // const url = "https://api-dev.padolabs.org/credential/re-generate?newSigFormat=Verax-Scroll-Sepolia";
        const url = "https://api-dev.padolabs.org/credential/re-generate?newSigFormat=BAS-BSC-Testnet";
        const body = JSON.parse("{\"rawParam\":{\"requestid\":\"eda20d37-3adb-4932-95a2-a2205a907e9d\",\"version\":null,\"credVersion\":\"0.2.11\",\"source\":\"GOOGLE\",\"baseName\":null,\"holdingToken\":null,\"baseUrl\":null,\"padoUrl\":null,\"proxyUrl\":null,\"cipher\":null,\"getDataTime\":\"1704419840652\",\"exchange\":null,\"sigFormat\":\"EAS-Ethereum\",\"schemaType\":\"GOOGLE_ACCOUNT_OWNER\",\"schema\":null,\"user\":{\"userid\":\"1724627312097361920\",\"address\":\"0x024e45d7f868c41f3723b13fd7ae03aa5a181362\",\"token\":null},\"baseValue\":null,\"greaterThanBaseValue\":null,\"sourceUseridHash\":\"25deb5f92761aa19e8f8b872f11a9e08b6b8d9bf58aef0365a0ccde9bb92eab9\",\"ext\":null,\"issuer\":null,\"did\":null},\"greaterThanBaseValue\":true,\"signature\":\"0x422d31e0517c5de6e73710537f0834c0b1336e6e1868527624ade50675da7b912a1208e2a0cf57c49198aacd368286a781a768170ed4d82567bebf6ee9f55eac1b\",\"newSigFormat\":\"BAS-BSC-Testnet\",\"sourceUseridHash\":\"25deb5f92761aa19e8f8b872f11a9e08b6b8d9bf58aef0365a0ccde9bb92eab9\"}")
        const response: AxiosResponse = await axios.post(url, body, {
            headers: header
        });
        console.log(response.data.result.result.getDataTime)
        let param = response.data.result.eip712MessageRawDataWithSignature.message
        param["time"] = response.data.result.result.getDataTime
        // param["data"] = response.data.result.typeData
        param["data"] = "0x" + param["data"]
        const uid = Offchain.getOffchainUID(param)
        console.log(uid)
        let eip712MessageRawDataWithSignature = response.data.result.eip712MessageRawDataWithSignature
        eip712MessageRawDataWithSignature["uid"] = uid
        return {
            eip712MessageRawDataWithSignature: eip712MessageRawDataWithSignature,
            schemaUid: response.data.result.schemaUid
        }
    }


    return {
        getNewSignature,
        attestOffChainWithGreenFieldWithFixValue,
        createBASBuckect,
        listBASBuckect,
        decodeHexData,
        createBASBuckectDefault,
        initClient
    };
};