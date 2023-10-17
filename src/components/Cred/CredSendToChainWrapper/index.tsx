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

import AddressInfoHeader from '@/components/Cred/AddressInfoHeader';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';
import TransferToChainDialog from '@/components/DataSourceDetail/TransferToChainDialog';
import ConnectWalletDialog from './ConnectWalletDialog';

import {
  ONCHAINLIST,
  PADOADDRESS,
  EASInfo,
  LINEASCHEMANAME,
  FIRSTVERSIONSUPPORTEDNETWORKNAME,
} from '@/config/envConstants';
import { CredVersion } from '@/config/constants';
import { connectWallet, switchChain } from '@/services/wallets/metamask';
import {
  attestByDelegationProxy,
  attestByDelegationProxyFee,
} from '@/services/chains/eas.js';
import { setCredentialsAsync } from '@/store/actions';
import { compareVersions, getAuthUserIdHash } from '@/utils/utils';
import { regenerateAttestation } from '@/services/api/cred';

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
    const walletAddress = useSelector(
      (state: UserState) => state.walletAddress
    );
    const connectedWallet = useSelector(
      (state: UserState) => state.connectedWallet
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

    
    const handleCancelTransferToChain = useCallback(() => {}, []);
    const handleBackConnectWallet = useCallback(() => {
      setStep(3);
    }, []);
    const handleSubmitConnectWallet = useCallback(
      async (wallet?: WALLETITEMTYPE, networkName?:string) => {
        setActiveSendToChainRequest({
          type: 'loading',
          title: 'Processing',
          desc: 'Please complete the transaction in your wallet.',
        });
        setStep(5);
        const formatNetworkName = activeNetworkName?? networkName
        const targetNetwork =
          EASInfo[formatNetworkName as keyof typeof EASInfo];
        let formatProvider;
        try {
          if (connectedWallet?.address) {
            const awitchChainRes = await switchChain(
              connectedWallet?.provider?.chainId,
              targetNetwork,
              connectedWallet?.provider
            );
            formatProvider = connectedWallet?.provider;
            setSubmitAddress(connectedWallet?.address);
          } else {
            const [accounts, chainId, provider] = await connectWallet(
              targetNetwork
            );
            formatProvider = provider;
            setSubmitAddress((accounts as string[])[0]);
          }

          const { keyStore } = await chrome.storage.local.get(['keyStore']);
          const { address } = JSON.parse(keyStore);
          const LineaSchemaName = formatNetworkName?.startsWith('Linea')
            ? LINEASCHEMANAME
            : 'EAS';
          let upChainParams = {
            networkName: formatNetworkName,
            metamaskprovider: formatProvider,
            receipt: '0x' + address,
            attesteraddr: PADOADDRESS,
            data: activeCred?.encodedData,
            signature: activeCred?.signature,
            type:
              activeCred?.reqType === 'web'
                ? activeCred?.reqType
                : activeCred?.type,
            schemaName: activeCred?.schemaName ?? LineaSchemaName,
          };
          let versionForComparison = activeCred?.version ?? '';

          let upChainRes;
          const cObj = { ...credentialsFromStore };
          const curRequestid = activeCred?.requestid as string;
          const curCredential = cObj[curRequestid];
          if (formatNetworkName !== FIRSTVERSIONSUPPORTEDNETWORKNAME) {
            const requestParams: any = {
              rawParam: Object.assign(curCredential, { ext: null }),
              greaterThanBaseValue: true,
              signature: curCredential.signature,
              newSigFormat: LineaSchemaName,
            };
            if (activeCred?.source === 'zan') {
              const authUseridHash = await getAuthUserIdHash();
              requestParams.dataToBeSigned = {
                source: activeCred?.source,
                type: activeCred?.type,
                authUseridHash: authUseridHash,
                recipient: walletAddress,
                timestamp: +new Date() + '',
                result: true,
              };
            }

            const { rc, result } = await regenerateAttestation(requestParams);
            if (rc === 0) {
              upChainParams.signature = result.result.signature;
              upChainParams.data = result.result.encodedData;
            }
            versionForComparison = CredVersion;
          }
          const compareRes = compareVersions('1.0.0', versionForComparison);
          if (compareRes > -1) {
            // old version <= 1.0.0
            upChainRes = await attestByDelegationProxy(upChainParams);
          } else {
            upChainRes = await attestByDelegationProxyFee(upChainParams);
          }
          if (upChainRes) {
            const newProvided = curCredential.provided ?? [];
            const currentChainObj: any = ONCHAINLIST.find(
              (i) => formatNetworkName === i.title
            );
            currentChainObj.attestationUID = upChainRes;
            currentChainObj.submitAddress = submitAddress;
            const existIndex = newProvided.findIndex(
              (i) => i.title === formatNetworkName
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
        walletAddress,
        connectedWallet,
      ]
    );
    const handleSubmitTransferToChain = useCallback(
      async (networkName?: string) => {
        if (networkName) {
          await setActiveNetworkName(networkName);
        } else {
          return
        }
        if (connectedWallet?.address) {
          handleSubmitConnectWallet(undefined,networkName);
        } else {
          setStep(4);
        }
      },
      [connectedWallet?.address, handleSubmitConnectWallet]
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
            headerEl={<AddressInfoHeader />}
            onClose={handleCloseMask}
            onSubmit={onSubmitActiveSendToChainRequestDialog}
          />
        )}
      </div>
    );
  }
);

export default CredSendToChainWrapper;
