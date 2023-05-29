import createMetaMaskProvider from 'metamask-extension-provider';

var provider;

export const connectWallet = async () => {
    console.log("connec metamask");
    provider = createMetaMaskProvider();
    const [accounts, chainId] = await Promise.all([
        provider.request({
            method: 'eth_requestAccounts',
        }),
        provider.request({ method: 'eth_chainId' }),
    ]);
    subscribeToEvents();
    return [accounts, chainId, provider];
}

export const getProvider = () => {
    return provider;
}


const subscribeToEvents = () => {
    if (provider && provider.on) {
        provider.on("chainChanged", handleChainChanged);
        provider.on("accountsChanged", handleAccountsChanged);
        provider.on("connect", handleConnect);
        provider.on("disconnect", handleDisconnect);
    }
}

const handleChainChanged = (chainId) => {
    console.log("metamask chainId changes: ", chainId);
}
const handleAccountsChanged = (accounts) => {
    console.log("metamask account changes: ", accounts);
}
const handleConnect = () => {
    console.log("metamask connected]");
}
const handleDisconnect = () => {
    provider = null;
    console.log("metamask disconnected");
}
