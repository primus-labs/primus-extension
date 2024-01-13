import {GreenFieldClient} from "@bnb-attestation-service/bas-sdk/dist/greenFieldClient";
import {encodeAddrToBucketName, getOffchainAuthKeys} from "@bnb-attestation-service/bas-sdk/dist/helper";

export class CustomGreenFieldClient extends GreenFieldClient {
    constructor(url, chainId) {
        super(url, chainId)
    }

    async createObjects(provider, files, isPrivate = true) {
        console.log("started");
        console.log(this.address, this.chainId);
        if (!this.address || !files || !this.chainId) {
            alert("Please select a file or address");
            return;
        }
        const offChainData = await getOffchainAuthKeys(this.address, provider, this.client, this.chainId);
        if (!offChainData) {
            console.log("No offchain, please create offchain pairs first");
            alert("No offchain, please create offchain pairs first");
            return;
        }
        let txss = []
        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            const fileBytes = await file.arrayBuffer();
            const hashResult = await window.FileHandle.getCheckSums(new Uint8Array(fileBytes));
            const {contentLength, expectCheckSums} = hashResult;
            console.log(hashResult);
            console.log("offChainData", offChainData);
            console.log("hashResult", hashResult);
            try {
                const tx = await this.client.object.createObject({

                    bucketName: encodeAddrToBucketName(this.address),
                    objectName: file.name,
                    creator: this.address,
                    visibility: isPrivate
                        ? "VISIBILITY_TYPE_PRIVATE"
                        : "VISIBILITY_TYPE_PUBLIC_READ",
                    fileType: "json",
                    redundancyType: "REDUNDANCY_EC_TYPE",
                    contentLength: contentLength,
                    expectCheckSums: JSON.parse(expectCheckSums),
                }, {
                    type: "EDDSA",
                    domain: window.location.origin,
                    seed: offChainData.seedString,
                    address: this.address,
                });
                txss[i] = tx
            } catch (e) {
                console.log(e)
                if (e.message === "repeated object") {
                    console.log(`repeated object:${files[i].name}`)
                }
            }
        }
        

        const txs = await this.client.txClient.multiTx(txss);
        const simulateInfo = await txs.simulate({
            denom: 'BNB',
        });

        console.log('simulateInfo', simulateInfo);
        console.log(simulateInfo);

        const {transactionHash} = await txs.broadcast({
            denom: "BNB",
            gasLimit: Number(simulateInfo.gasLimit),
            gasPrice: simulateInfo.gasPrice,
            payer: this.address,
            granter: "",
            signTypedDataCallback: async (addr, message) => {
                return await provider?.request({
                    method: "eth_signTypedData_v4",
                    params: [addr, message],
                });
            },
        });

        let allUploadRes = [];

        for (let i = 0; i < files.length; i++) {
            try {
                const uploadRes = await this.client.object.uploadObject({
                    bucketName: encodeAddrToBucketName(this.address),
                    objectName: files[i].name,
                    body: files[i],
                    txnHash: transactionHash,
                }, {
                    type: "EDDSA",
                    domain: window.location.origin,
                    seed: offChainData.seedString,
                    address: this.address,
                });
                console.log(uploadRes)
                allUploadRes[i] = uploadRes
            } catch (e) {
                if (e.message === "repeated object") {
                    console.log(`repeated object:${files[i].name}`)
                }
            }

        }

        return allUploadRes;
    }
}
