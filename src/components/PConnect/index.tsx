import React, { useEffect, useState, useMemo, memo, useCallback } from 'react';
import { useSelector,useDispatch } from 'react-redux'

import {setConnectWalletDialogVisibleAction} from '@/store/actions'
import { formatAddress } from '@/utils/utils';
import { connectWallet, requestSign } from '@/services/wallets/metamask';
import {
  ONCHAINLIST,
  PADOADDRESS,
  EASInfo,
  LINEASCHEMANAME,
  FIRSTVERSIONSUPPORTEDNETWORKNAME,
} from '@/config/envConstants';
import {bindConnectedWallet} from '@/services/api/user'

import iconMy from '@/assets/img/iconMy.svg'
import PButton from '@/components/PButton'
import ConnectWalletDialog from '@/components/Cred/CredSendToChainWrapper/ConnectWalletDialog';
import './index.scss';
import type { UserState } from '@/types/store'
import type { WALLETITEMTYPE } from '@/config/constants';
import type { ActiveRequestType } from '@/types/config';

const PConnect = memo(() => {
  
  const [activeRequest, setActiveRequest] =
    useState<ActiveRequestType>();
  const [step, setStep] = useState<number>(1)
  const [avatar, setAvatar] = useState<any>();
  const [address, setAddress] = useState<string>();
  const [copied, setCopied] = useState<boolean>(false);
  const connectWalletDialogVisible = useSelector(
    (state: UserState) => state.connectWalletDialogVisible
  );
  console.log('222222connectWalletDialogVisible', connectWalletDialogVisible, step);
  const dispatch = useDispatch()
  const errorDescEl = useMemo(
    () => (
      <>
        <p>Your wallet did not connect or refused to authorize.</p>
        <p>Please try again later.</p>
      </>
    ),
    []
  );
  const handleCopy = () => {
    navigator.clipboard.writeText('0x' + address);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  const formatAddr = useMemo(() => {
    return address ? formatAddress('0x' + address) : '';
  }, [address]);
  const getUserInfo = () => {
    chrome.storage.local.get(
      ['userInfo', 'keyStore'],
      ({ userInfo, keyStore }) => {
        if (userInfo) {
          const parseUserInfo = JSON.parse(userInfo);
          const { picture } = parseUserInfo;
          setAvatar(picture);
        }
        if (keyStore) {
          const parseKeystore = JSON.parse(keyStore);
          const { address } = parseKeystore;
          setAddress(address);
        }
      }
    );
  };
  const handleConnect = useCallback(() => {

  }, [])
  const handleCloseMask = useCallback(() => {
    dispatch(setConnectWalletDialogVisibleAction(false));
  },[dispatch])
  const handleSubmitConnectWallet = useCallback(
    async (wallet: WALLETITEMTYPE) => {
      setActiveRequest({
        type: 'loading',
        title: 'Sign the message',
        desc: "PADO uses this signature to verify that you're the owner of this address.",
      });
      setStep(2);
      const targetNetwork = EASInfo['Sepolia' as keyof typeof EASInfo];//TODO!!!
      try {
        const [accounts, chainId, provider] = await connectWallet(
          targetNetwork
        );
        const address = (accounts as string[])[0]
        const type = wallet.name.toLowerCase()
        const timestamp: string = +new Date() + '';
        const signature = await requestSign(address, timestamp);
        if (!signature) {
          setActiveRequest({
            type: 'error',
            title: 'Failed',
            desc: errorDescEl,
          });
          return;
        }
        const res = await bindConnectedWallet({
          signature,
          timestamp,
          address,
          type,
        });
        const { rc } = res
        if (rc === 0) {
          await chrome.storage.local.set({
            connectedWallet: address,
          });
          setActiveRequest({
            type: 'success',
            title: 'Success',
            desc:'Success' // TODO!!!
          })
        }
      } catch (e) {
        // console.log('upChainRes catch e=', e);
        setActiveRequest({
          type: 'error',
          title: 'Failed',
          desc: errorDescEl,
        });
      }
    },
    [
     
    ]
  );
  // useEffect(() => {
  //   getUserInfo();
  // }, []);
  return (
    <div className="PConnect">
      <PButton text="Connect Wallet" onClick={handleConnect} />
      {connectWalletDialogVisible &&
        step === 1 && (
          <ConnectWalletDialog
            onClose={handleCloseMask}
            onSubmit={handleSubmitConnectWallet}
          />
        )}
      {/* {visible && step === 2 && (
        <AddSourceSucDialog
          type={activeSendToChainRequest?.type}
          title={activeSendToChainRequest?.title}
          desc={activeSendToChainRequest?.desc}
          headerEl={<AddressInfoHeader />}
          onClose={handleCloseMask}
          onSubmit={onSubmitActiveSendToChainRequestDialog}
        />
      )} */}
    </div>
  );
});

export default PConnect;
