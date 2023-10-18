import createMetaMaskProvider from 'metamask-extension-provider';
import store from '@/store';
import { setConnectWalletAction } from '@/store/actions';
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

    if (targetNetwork) {
      await switchChain(chainId, targetNetwork);
    }
    subscribeToEvents();
    return [accounts, chainId, provider];
  } catch (e) {
    console.log('connect wallet error: ', e);
    if (e.code === 4001) {
      // User rejected the request.
      return [undefined, undefined, undefined, e];
    } else {
      return [];
    }
    throw new Error(e);
  }
};
export const switchChain = async (connectedChainId, targetNetwork, p) => {
  provider = p ?? provider;
  const { chainId, chainName, rpcUrls, blockExplorerUrls, nativeCurrency } =
    targetNetwork;
  const obj = {
    chainId,
    chainName,
    rpcUrls,
    blockExplorerUrls,
    nativeCurrency,
  };

  if (connectedChainId === obj.chainId) {
    console.log(`The current chain is already:${obj.chainName}`);
    return;
  } else {
    console.log(`Switching chain to:${obj.chainName}`);
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

export const requestSign = async (address, timestamp) => {
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
      name: 'PADO Labs',
    },
    message: {
      desc: 'PADO Labs',
      address,
      timestamp,
    },
  };
  let res = '';
  try {
    res = await provider.request({
      method: 'eth_signTypedData_v4',
      params: [address, typedData],
    });
  } catch (e) {
    console.log('requestSign error: ', e);
  }
  return res;
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
  console.log('metamask chainId changes: ', chainId, provider);
  const addr = store.getState().connectedWallet.address;
  store.dispatch(
    setConnectWalletAction({
      address: addr,
      provider,
    })
  );
};
const handleAccountsChanged = (accounts) => {
  console.log('metamask account changes: ', accounts, provider);
  if (accounts.length > 0) {
    chrome.storage.local.set({
      connectedWalletAddress: JSON.stringify({
        name: 'metamask',
        address: accounts[0],
      }),
    });
    store.dispatch(
      setConnectWalletAction({
        address: accounts[0],
        provider,
      })
    );
  } else {
    chrome.storage.local.remove(['connectedWalletAddress'], () => {
      store.dispatch(setConnectWalletAction(undefined));
    });
  }
};
const handleConnect = () => {
  console.log('metamask connected]');
};
const handleDisconnect = () => {
  // provider = null;
  console.log('metamask disconnected');
};
