import { signTypedData, SignTypedDataVersion } from '@metamask/eth-sig-util';

export const requestSignTypedData = async (
  privateKeyStr,
  address,
  timestamp
) => {
  const typedData = {
    types: {
      EIP712Domain: [{ name: 'name', type: 'string' }],
      Request: [
        { name: 'desc', type: 'string' },
        { name: 'address', type: 'string' },
        { name: 'timestamp', type: 'string' },
      ],
    },
    primaryType: 'Request',
    domain: {
      name: 'Primus Labs',
    },
    message: {
      desc: 'Primus Labs',
      address,
      timestamp,
    },
  };
  try {
    const privateKey = Buffer.from(privateKeyStr, 'hex');
    let res = signTypedData({
      privateKey,
      data: typedData,
      version: SignTypedDataVersion.V4,
    });
    //console.log('requestSignTypedData res=', res);
    return res;
  } catch (e) {
    console.log('requestSignTypedData error', e);
  }
};
