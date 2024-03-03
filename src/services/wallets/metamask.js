import createMetaMaskProvider from 'metamask-extension-provider';
import { ethers } from 'ethers';
import store from '@/store';
import {
  setConnectWalletActionAsync,
  connectWalletAsync,
} from '@/store/actions';
var provider;

export const connectWallet = async (targetNetwork) => {
  console.log('connect metamask', targetNetwork);
  try {
    if (provider && provider.on) {
      provider.removeListener('chainChanged', handleChainChanged);
      provider.removeListener('accountsChanged', handleAccountsChanged);
      provider.removeListener('connect', handleConnect);
      provider.removeListener('disconnect', handleDisconnect);
    }
    provider = createMetaMaskProvider();
    const [accounts, chainId] = await Promise.all([
      provider.request({
        method: 'eth_requestAccounts',
      }),
      provider.request({ method: 'eth_chainId' }),
    ]);

    // if (targetNetwork) {
    await switchChain(chainId, targetNetwork);
    // }
    subscribeToEvents();
    return [accounts, chainId, provider];
  } catch (e) {
    console.log('connect wallet error: ', e);
    if (e.code === 4001) {
      // User rejected the request.
      return [undefined, undefined, undefined, e];
    } else if (e.message === '4001') {
      throw new Error(e);
    } else {
      return [];
    }
  }
};
export const switchChain = async (connectedChainId, targetNetwork, p) => {
  provider = p ?? provider;
  let chainId, chainName, rpcUrls, blockExplorerUrls, nativeCurrency;
  const tNetwork = store.getState().activeConnectWallet.network;
  if (!tNetwork) {
    return;
  }
  ({ chainId, chainName, rpcUrls, blockExplorerUrls, nativeCurrency } =
    tNetwork);

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
    } else if (err.code === 4001) {
      throw new Error(err.code);
    } else {
    }
    return true;
  }
};
export const getProvider = () => {
  return provider;
};

export const requestSign = async (
  address,
  timestamp,
  { walletName, walletProvider } = {}
) => {
  let res = '';
  try {
    if (walletName === 'walletconnect') {
      const provider = new ethers.providers.Web3Provider(walletProvider);
      const signer = provider.getSigner();
      const typedData = {
        types: {
          // EIP712Domain: [{ name: 'name', type: 'string' }],
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
      res = await signer._signTypedData(
        typedData.domain,
        typedData.types,
        typedData.message
      );
      console.log('walletConnect eth_signTypedData_v4', res);
    } else {
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
      res = await provider.request({
        method: 'eth_signTypedData_v4',
        params: [address, typedData],
      });
    }
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
  const addr = provider.selectedAddress;
  const curConnectedWallet = store.getState().connectedWallet;
  const name = curConnectedWallet?.name;
  const id = curConnectedWallet?.id;
  store.dispatch(
    setConnectWalletActionAsync({
      id,
      name,
      address: addr,
      provider,
    })
  );
};
const handleAccountsChanged = async (accounts) => {
  console.log('metamask account changes: ', accounts, provider);
  if (accounts.length > 0) {
    // const newAddr = accounts[accounts.length-1];
    const addr = provider.selectedAddress;
    // const addr = newAddr;
    // provider.selectedAddress = addr;
    // await store.dispatch(setConnectWalletActionAsync(undefined));
    store.dispatch(
      connectWalletAsync({
        id: 'metamask',
        address: addr,
        provider,
        name: 'metamask',
      })
    );
  } else {
    store.dispatch(setConnectWalletActionAsync(undefined));
  }
};
const handleConnect = () => {
  console.log('metamask connected]');
};
const handleDisconnect = () => {
  // provider = null;
  console.log('metamask disconnected');
};
export const switchAccount = async (provider) => {
  try {
    const permissions = await provider.request({
      method: 'wallet_requestPermissions',
      params: [{ eth_accounts: {} }],
    });
    const accountsPermission = permissions.find(
      (permission) => permission.parentCapability === 'eth_accounts'
    );
    if (accountsPermission) {
      console.log('eth_accounts permission successfully requested!');
    }
  } catch (error) {
    if (error.code === 4001) {
      // EIP-1193 userRejectedRequest error
      console.log('Permissions needed to continue.');
    } else {
      console.error(error);
    }
  }
};
