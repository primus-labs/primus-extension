import { ethers } from 'ethers';
import { EASInfo } from '@/config/envConstants';
import { utils } from 'ethers';

/*
params = {
    networkName: networkName,
    metamaskprovider: provider,
    receipt: receiptaddr,
    signature: signature
}

return tx
*/
export async function mintWithSignature(params) {
  let { networkName, metamaskprovider, receipt, signature } = params;
  //   const splitsignature = utils.splitSignature(signature);
  //   const formatSignature = {
  //     v: splitsignature.v,
  //     r: splitsignature.r,
  //     s: splitsignature.s,
  //   };
//   const params = Object.assign(originParams, { signature: `0x${signature}` });
  console.log('erc721 mintWithSignature params===', params);
  const contractAddress = EASInfo[networkName].erc721Contract;
  const abi = [
    'function mintWithSignature(bool, address, uint256, uint256, uint256, bytes) payable public',
    'function owner() public view virtual returns (address)',
  ];
  let provider = new ethers.providers.Web3Provider(metamaskprovider);
  await provider.send('eth_requestAccounts', []);
  let signer = provider.getSigner();
  const contract = new ethers.Contract(contractAddress, abi, signer);
//   const ownerRes = await contract.owner();
//   debugger;
  const tx = await contract.mintWithSignature(
    true,
    receipt,
    0,
    1,
    1,
    signature
  );
  console.log('erc721 mintWithSignature tx...');
  await tx.wait();
  console.log('erc721 mintWithSignature tx=', tx);
}
