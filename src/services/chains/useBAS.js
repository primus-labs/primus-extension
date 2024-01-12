
import {BAS, SchemaEncoder} from "@bnb-attestation-service/bas-sdk";
import {hashMessage} from "viem";
import {address} from "hardhat/internal/core/config/config-validation";
import axios, {AxiosResponse} from "axios";
import {Offchain} from "@ethereum-attestation-service/eas-sdk";
// import {GreenFieldClient} from "@bnb-attestation-service/bas-sdk/dist/greenFieldClient";
import {CustomGreenFieldClient} from "./CustomGreenFieldClient";


const formatValue = ({value, type}) => {
    if (type === "boolean" || type === "string") {
        return [value];
    }
    if (type === "uint256") {
        return [value.toString()];
    }
    return [value?.toString?.() || ""];
};

export function encodeAddrToBucketName(addr) {
    return `bas-${hashMessage(addr).substring(2, 42)}`;
};


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

export const EASContractAddress = "0x620e84546d71A775A82491e1e527292e94a7165A"; //  BNB BAS

// Initialize the sdk with the address of the EAS Schema contract address
let bas;

export const useBAS = () => {

    let greenFieldClient;
    let endpointUrlParam;
    const initClient = async (address, contractAddress, chainId, rpcUrl, endpointUrl) => {
        bas = new BAS(contractAddress, rpcUrl, chainId);
        greenFieldClient = new CustomGreenFieldClient(rpcUrl,chainId)
        bas.greenFieldClient = greenFieldClient
        greenFieldClient.init(address, chainId)
        endpointUrlParam = endpointUrl

    }
    const attestOffChainWithGreenFieldWithFixValue = async (address, provider, attestationInfo) => {
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
        
        let files =[]
        let resp = []
        for (let i = 0; i < attestationInfo.length; i++) {
            const str = JSON.stringify(attestationInfo[i].eip712MessageRawDataWithSignature);
            const bytes = new TextEncoder().encode(str);
            const blob = new Blob([bytes], {
                type: "application/json;charset=utf-8",
            });
            const attestationUid = await getAttestationUid(attestationInfo[i].eip712MessageRawDataWithSignature,attestationInfo[i].getDataTime)
            // @ts-ignore
            files[i] = new File([blob], `${attestationInfo[i].schemaUid}.${attestationUid}`)
            // @ts-ignore
            resp[i] = {
                eip712MessageRawDataWithSignature:attestationInfo[i].eip712MessageRawDataWithSignature,
                attestationUid:attestationUid
            }
        }
        const isPrivate = false
        try {
            await greenFieldClient.createObjects(
                provider,
                files,
                isPrivate
            );
        } catch (err) {
            if (err.statusCode === 404) {
                return "notfound";
            }
            if(err.message ==="repeated object"){
                return "repeated object"
            }
            console.log(err);
            alert(err.message);
        }

        return resp;
    };

    const decodeHexData = (dataRaw, schemaStr) => {
        const schemaEncoder = new SchemaEncoder(schemaStr);
        let res = schemaEncoder.decodeData(dataRaw);
        console.log({res});
        res = res.map((e) => ({
            ...e,
            value: formatValue(e.value),
            // typeof e.value.type === "boolean" || typeof e.value.type === "string"
            //   ? [e.value.value]
            //   : [e.value.value?.toString?.() || ""],
        }));
        console.log({res});

        return res;
    };


    const listBASBuckect = async (provider, address) => {
        if (!address) {
            console.log('address is null')
            return
        }
        ;
        // const res = await greenFieldClient.client.bucket.getBucketMeta({
        //     bucketName: encodeAddrToBucketName(address)
        // })
        const res = await greenFieldClient.client.bucket.listBuckets({
            address: address,
            endpoint: endpointUrlParam
        })

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

    const createBASBuckect = async (provider, bucketName) => {
        if (!address) return;
        // await shouldSwitchNetwork(chains[0].id);
        const res = await greenFieldClient.createBucket(provider, bucketName);
        console.log("create bucket res", res);
        return res;
    };

    const createBASBuckectDefault = async (provider, address) => {
        if (!address) return;
        const res = await greenFieldClient.createBucket(provider, encodeAddrToBucketName(address));
        console.log(res)
    }

    const getAttestationUid = async (eip712MessageRawDataWithSignature, getDataTime)=>{
        let param = eip712MessageRawDataWithSignature.message
        param["time"] = getDataTime
        // param["data"] = response.data.result.typeData
        param["data"] = "0x" + param["data"]
        return Offchain.getOffchainUID(param);
    }

    const getNewSignature = async (requestBody ) => {
        const header = {
            "Authorization": "Bearer eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJwYWRvbGFicy5vcmciLCJzdWIiOiIweGMxYTdGNmYzOTdkNUM3OTNhNzg2MTNDZjM2NGEwNjkxNDZkZDcxZjciLCJleHAiOjQ4NTM2MTgxNjcsInVzZXItaWQiOjE3MjQ2MjczMTIwOTczNjE5MjAsInNjb3BlIjoiYXV0aCJ9.MHRWNwh1v4PFrLrvkZrRJDmXdkVcIuKxf9Onu7UKLgHZcdSlWq6m8IV3Eq-wJjVwbBpv5zHh9jCh8uQG7GAFacVvwuUNAcquWS8xmK669ANQvSMerq6G0L2kv7iUWz6KEimq0M1btdphZuwIPDa3epHeTHRZJlDCo35gGRSV2qcoPgdoyidUKOMhSCdvPqs-df3r7Is32Xtrn3AvFPWAiQWwcW2rSnbv-5KCEMIGS7jcIXlwDIpm3-HfXsynwnbOfsLQ0WOExiXseObZHaAdTGu925Cv0c6L4TzXj9NmWPB201wgwg_KxqXFHcChCMBUbHW0ChN9xc1VqlkgfBjROg"
        }
        // const url = "https://api-dev.padolabs.org/credential/re-generate?newSigFormat=Verax-Scroll-Sepolia";
        const url = "https://api-dev.padolabs.org/credential/re-generate?newSigFormat=BAS-BSC-Testnet";
        const body = JSON.parse(requestBody)
        const response = await axios.post(url, body, {
            headers: header
        });
        let eip712MessageRawDataWithSignature = response.data.result.eip712MessageRawDataWithSignature
        return {
            eip712MessageRawDataWithSignature: eip712MessageRawDataWithSignature,
            getDataTime: response.data.result.result.getDataTime,
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