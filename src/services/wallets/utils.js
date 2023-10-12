import { signTypedData, SignTypedDataVersion } from "@metamask/eth-sig-util";

export const requestSignTypedData = async (privateKeyStr, address, timestamp) => {
    const typedData = {
      types: {
        EIP712Domain: [
            { name: 'name', type: 'string' },
        ],
        Request: [
          { name: 'desc', type: 'string' },
          { name: 'address', type: 'string' },
          { name: 'timestamp', type: 'string' },
        ],
      },
      primaryType: 'Request',
      domain: {
        name: 'PADO Labs',
      },
      message: {
        desc: 'PADO Labs',
        address,
        timestamp,
      },
    };
    const privateKey = Buffer.from(privateKeyStr, "hex");      
    let res = signTypedData({privateKey, data: typedData, version: SignTypedDataVersion.V4});
    //console.log('requestSignTypedData res=', res);
    return res;
};