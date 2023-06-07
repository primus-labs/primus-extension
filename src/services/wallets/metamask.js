import createMetaMaskProvider from 'metamask-extension-provider';

var provider;

export const connectWallet = async (targetNetwork) => {
  console.log('connect metamask');
  try {
    provider = createMetaMaskProvider();
    const [accounts, chainId] = await Promise.all([
      provider.request({
        method: 'eth_requestAccounts',
      }),
      provider.request({ method: 'eth_chainId' }),
    ]);
    await switchChain(chainId, targetNetwork);
    subscribeToEvents();
    return [accounts, chainId, provider];
  } catch (e) {
    console.log('connect wallet error: ', e)
    if (e.code === 4001) {
      // User rejected the request.
      return [undefined, undefined, undefined, e];
    } else {
      return []
    }
    throw new Error(e);
  }
};
const switchChain = async (connectedChainId, targetNetwork) => {
  const { chainId, chainName, rpcUrls, blockExploreUrls } = targetNetwork;
  const obj = {
    chainId,
    chainName,
    rpcUrls,
    blockExploreUrls,
  };
  if (connectedChainId === obj.chainId) {
    console.log(`当前链已经是:${obj.chainName}`);
    return;
  } else {
    console.log(`正在切换链为:${obj.chainName}`);
  }
  try {
    // switch network
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: obj.chainId }],
    });
    return true;
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = e;
    console.log(err);
    if (err.code === 4902) {
      try {
        // add network
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [obj],
        });
      } catch (addError) {
        console.error(addError);
      }
    } else {
    }
    return true;
  }
};
export const getProvider = () => {
  return provider;
};

const subscribeToEvents = () => {
  if (provider && provider.on) {
    provider.on('chainChanged', handleChainChanged);
    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('connect', handleConnect);
    provider.on('disconnect', handleDisconnect);
  }
};

const handleChainChanged = (chainId) => {
  console.log('metamask chainId changes: ', chainId);
};
const handleAccountsChanged = (accounts) => {
  console.log('metamask account changes: ', accounts);
};
const handleConnect = () => {
  console.log('metamask connected]');
};
const handleDisconnect = () => {
  provider = null;
  console.log('metamask disconnected');
};
