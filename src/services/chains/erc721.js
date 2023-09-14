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
  console.log('erc721 mintWithSignature params===', params);
  const contractAddress = EASInfo[networkName].erc721Contract;
  const abi = [
    'function mintWithSignature(bool, address, uint256, uint256, uint256, bytes) payable public',
    // 'function owner() public view virtual returns (address)',
    'function tokenURI(uint256) public view virtual override returns (string)',
  ];
  let provider = new ethers.providers.Web3Provider(metamaskprovider);
  await provider.send('eth_requestAccounts', []);
  let signer = provider.getSigner();
  const contract = new ethers.Contract(contractAddress, abi, signer);
  //   const ownerRes = await contract.owner();
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
  const receiptInfo = await provider.getTransactionReceipt(tx.hash);
  console.log('erc721 mintWithSignature tx=', tx, 'receipt=', receiptInfo);
  const topics = receiptInfo.logs[0].topics;
  const topicsLen = topics.length;
  const tokenId = topics[topicsLen - 1];
  console.log('erc721 mintWithSignature tokenId=', tokenId);
  const nftInfo = await contract.tokenURI(tokenId);
  console.log('erc721 nftInfo=', nftInfo);
  return [Number(tokenId), nftInfo];
}

export async function submitUniswapTxProof(params) {
  try {
    let { metamaskprovider, txHash, proof, auxiBlkVerifyInfo } = params;
    console.log('submitUniswapTxProof params===', params);
    const contractAddress = '0x0e38FDbDebB447B76568a57A71165fC0a669C9F8';
    const abi = [
      'function submitUniswapTxProof(bytes,bytes,bytes) external',
    ];
    let provider = new ethers.providers.Web3Provider(metamaskprovider);
    await provider.send('eth_requestAccounts', []);
    let signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);

    const tx = await contract.submitUniswapTxProof(
      txHash,
      proof,
      auxiBlkVerifyInfo
    );
    console.log('submitUniswapTxProof tx...');
    await tx.wait();
    const receiptInfo = await provider.getTransactionReceipt(tx.hash);
    console.log('submitUniswapTxProof tx=', tx, 'receipt=', receiptInfo);
    // const topics = receiptInfo.logs[0].topics;
    // const topicsLen = topics.length;
    // const tokenId = topics[topicsLen - 1];
    // console.log('erc721 mintWithSignature tokenId=', tokenId);
    return tx.hash;
  } catch (e) {
    console.log('submitUniswapTxProof error: ', e);
  }
}
