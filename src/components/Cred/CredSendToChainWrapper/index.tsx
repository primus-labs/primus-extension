import React, {
  FC,
  useState,
  useMemo,
  useCallback,
  useEffect,
  memo,
} from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';

import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';
import TransferToChainDialog from '@/components/DataSourceDetail/TransferToChainDialog';
import ConnectWalletDialog from './ConnectWalletDialog';

import { ONCHAINLIST, PADOADDRESS, EASInfo } from '@/config/envConstants';
import { connectWallet } from '@/services/wallets/metamask';
import { attestByDelegationProxy, attestByDelegationProxyFee } from '@/services/chains/eas.js';
import { setCredentialsAsync } from '@/store/actions';
import {compareVersions} from '@/utils/utils'
import type { Dispatch } from 'react';
import type { CredTypeItemType } from '@/types/cred';
import type { UserState } from '@/types/store';
import type { WALLETITEMTYPE } from '@/types/config';
import type { ActiveRequestType } from '@/types/config';
import { eventReport } from '@/services/api/usertracker';

import './index.sass';

interface CredSendToChainWrapperType {
  visible?: boolean;
  activeCred?: CredTypeItemType;
  onSubmit: () => void;
  onClose: () => void;
}
const CredSendToChainWrapper: FC<CredSendToChainWrapperType> = memo(
  ({ visible = true, activeCred, onClose, onSubmit }) => {
    const [submitAddress, setSubmitAddress] = useState<string>();
    const [step, setStep] = useState(0);
    const [activeNetworkName, setActiveNetworkName] = useState<string>();
    // const [activeCred, setActiveCred] = useState<CredTypeItemType>();
    const [activeSendToChainRequest, setActiveSendToChainRequest] =
      useState<ActiveRequestType>();

    const credentialsFromStore = useSelector(
      (state: UserState) => state.credentials
    );

    const dispatch: Dispatch<any> = useDispatch();

    const errorDescEl = useMemo(
      () => (
        <>
          <p>Your wallet did not connect or refused to authorize.</p>
          <p>Please try again later.</p>
        </>
      ),
      []
    );

    const initCredList = useCallback(async () => {
      await dispatch(setCredentialsAsync());
    }, [dispatch]);

    const handleCloseMask = useCallback(() => {
      setStep(0);
      onClose();
    }, [onClose]);

    const onSubmitActiveSendToChainRequestDialog = useCallback(() => {
      if (
        activeSendToChainRequest?.type === 'suc' ||
        activeSendToChainRequest?.type === 'error' ||
        activeSendToChainRequest?.type === 'warn'
      ) {
        setStep(0);
        onSubmit();
        return;
      }
    }, [activeSendToChainRequest?.type, onSubmit]);

    const handleSubmitTransferToChain = useCallback((networkName?: string) => {
      if (networkName) {
        setActiveNetworkName(networkName);
        setStep(4);
      }
    }, []);
    const handleCancelTransferToChain = useCallback(() => {}, []);
    const handleBackConnectWallet = useCallback(() => {
      setStep(3);
    }, []);
    const handleSubmitConnectWallet = useCallback(
      async (wallet: WALLETITEMTYPE) => {
        setActiveSendToChainRequest({
          type: 'loading',
          title: 'Processing',
          desc: 'Please complete the transaction in your wallet.',
        });
        setStep(5);
        const targetNetwork =
          EASInfo[activeNetworkName as keyof typeof EASInfo];
        try {
          const [accounts, chainId, provider] = await connectWallet(
            targetNetwork
          );
          setSubmitAddress((accounts as string[])[0]);
          const { keyStore } = await chrome.storage.local.get(['keyStore']);
          const { address } = JSON.parse(keyStore);
          const upChainParams = {
            networkName: activeNetworkName,
            metamaskprovider: provider,
            receipt: '0x' + address,
            attesteraddr: PADOADDRESS,
            data: activeCred?.encodedData,
            signature: activeCred?.signature,
            type: activeCred?.type,
            schemaName: activeCred?.schemaName ?? 'EAS',
          };
          const compareRes = compareVersions(
            '1.0.0',
            activeCred?.version ?? ''
          );
          let upChainRes;
          if (compareRes > -1) {
            // old version
            upChainRes = await attestByDelegationProxy(upChainParams);
          } else {
            upChainRes = await attestByDelegationProxyFee(upChainParams);
          }
          if (upChainRes) {
            const cObj = { ...credentialsFromStore };
            const curRequestid = activeCred?.requestid as string;
            const curCredential = cObj[curRequestid];
            const newProvided = curCredential.provided ?? [];
            const currentChainObj: any = ONCHAINLIST.find(
              (i) => activeNetworkName === i.title
            );
            currentChainObj.attestationUID = upChainRes;
            currentChainObj.submitAddress = submitAddress;
            const existIndex = newProvided.findIndex(
              (i) => i.title === activeNetworkName
            );
            existIndex < 0 && newProvided.push(currentChainObj);

            cObj[curRequestid] = Object.assign(curCredential, {
              provided: newProvided,
            });
            await chrome.storage.local.set({
              credentials: JSON.stringify(cObj),
            });
            await initCredList();
            setActiveSendToChainRequest({
              type: 'suc',
              title: 'Congratulations',
              desc: 'Your attestation is recorded on-chain!',
            });

            const eventType = `${upChainParams.type}-${upChainParams.schemaName}`;
            const eventInfo = {
              eventType: 'UPPER_CHAIN',
              rawData: {
                network: upChainParams.networkName,
                type: eventType,
                source: curCredential.source,
              },
            };
            eventReport(eventInfo);
          } else {
            setActiveSendToChainRequest({
              type: 'error',
              title: 'Failed',
              desc: errorDescEl,
            });
          }
        } catch (e) {
          console.log('upChainRes catch e=', e);
          setActiveSendToChainRequest({
            type: 'error',
            title: 'Failed',
            desc: errorDescEl,
          });
        }
      },
      [
        activeCred,
        activeNetworkName,
        credentialsFromStore,
        initCredList,
        submitAddress,
        errorDescEl,
      ]
    );
    useEffect(() => {
      if (visible) {
        setSubmitAddress(undefined);
        setActiveNetworkName(undefined);
        setStep(3);
      }
    }, [visible]);
    return (
      <div className="credSendToChainWrapper">
        {visible && step === 3 && (
          <TransferToChainDialog
            title="Provide Attestation"
            desc="Provide your attestation for on-chain applications."
            list={ONCHAINLIST}
            tip="Please select one chain to provide attestation"
            checked={false}
            backable={false}
            headerType={
              activeCred?.did ? 'polygonIdAttestation' : 'attestation'
            }
            address={activeCred?.did as string}
            onClose={handleCloseMask}
            onSubmit={handleSubmitTransferToChain}
            onCancel={handleCancelTransferToChain}
          />
        )}
        {visible && step === 4 && (
          <ConnectWalletDialog
            onClose={handleCloseMask}
            onSubmit={handleSubmitConnectWallet}
            onBack={handleBackConnectWallet}
          />
        )}
        {visible && step === 5 && (
          <AddSourceSucDialog
            type={activeSendToChainRequest?.type}
            title={activeSendToChainRequest?.title}
            desc={activeSendToChainRequest?.desc}
            headerType="attestation"
            onClose={handleCloseMask}
            onSubmit={onSubmitActiveSendToChainRequestDialog}
          />
        )}
      </div>
    );
  }
);

export default CredSendToChainWrapper;
