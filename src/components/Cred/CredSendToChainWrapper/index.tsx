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
import { useSearchParams,useNavigate } from 'react-router-dom';
import PButton from '@/components/PButton'
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
import {
  setCredentialsAsync,
  connectWalletAsync,
  setRewardsDialogVisibleAction,
} from '@/store/actions';
import { compareVersions, getAuthUserIdHash } from '@/utils/utils';
import { regenerateAttestation } from '@/services/api/cred';

import type { Dispatch } from 'react';
import type { CredTypeItemType } from '@/types/cred';
import type { UserState } from '@/types/store';
import type { WALLETITEMTYPE } from '@/types/config';
import type { ActiveRequestType } from '@/types/config';
import { eventReport } from '@/services/api/usertracker';

import './index.scss';

interface CredSendToChainWrapperType {
  visible?: boolean;
  activeCred?: CredTypeItemType;
  onSubmit: (sucFlag?: any) => void;
  onClose: () => void;
}
const CredSendToChainWrapper: FC<CredSendToChainWrapperType> = memo(
  ({ visible = true, activeCred, onClose, onSubmit }) => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams();
    const fromEvents = searchParams.get('fromEvents');
    const [step, setStep] = useState(0);
    const [activeNetworkName, setActiveNetworkName] = useState<string>();
    // const [activeCred, setActiveCred] = useState<CredTypeItemType>();
    const [activeSendToChainRequest, setActiveSendToChainRequest] =
      useState<ActiveRequestType>();

    const credentialsFromStore = useSelector(
      (state: UserState) => state.credentials
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
    const formatChainList = useMemo(() => {
      const newList = ONCHAINLIST.map((i) => {
        if (i.title === 'Linea Goerli') {
          i.disabled = false;
          return {...i}
        }
        return { ...i, disabled: true };
      });
      return newList;
    }, []);

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
        if (activeSendToChainRequest?.type === 'suc') {
          onSubmit(true);
        } else {
          onSubmit();
        }
        return;
      }
    }, [activeSendToChainRequest?.type, onSubmit]);

    const handleCancelTransferToChain = useCallback(() => {}, []);
    const handleBackConnectWallet = useCallback(() => {
      setStep(3);
    }, []);
    const handleSubmitConnectWallet = useCallback(
      async (wallet?: WALLETITEMTYPE, networkName?: string) => {
        const startFn = () => {
          setActiveSendToChainRequest({
            type: 'loading',
            title: 'Processing',
            desc: 'Please complete the transaction in your wallet.',
          });
          setStep(5);
        };
        const errorFn = () => {
          setActiveSendToChainRequest({
            type: 'error',
            title: 'Unable to proceed',
            desc: errorDescEl,
          });
        };
        const sucFn = async (walletObj: any) => {
          const LineaSchemaName = formatNetworkName?.startsWith('Linea')
            ? LINEASCHEMANAME
            : 'EAS';
          let upChainParams = {
            networkName: formatNetworkName,
            metamaskprovider: walletObj.provider,
            receipt: activeCred?.address,
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
                recipient: activeCred?.address,
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
            currentChainObj.submitAddress = walletObj.address;
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
            if (curCredential.reqType === 'web') {
              if (newProvided.length && newProvided.length > 0) {
                const flag = newProvided.some(
                  (i) => i.chainName.indexOf('Linea') > -1
                );
                if (flag) {
                  await chrome.storage.local.set({
                    mysteryBoxRewards: '1',
                  });
                }
              }
            }
            setActiveSendToChainRequest({
              type: 'suc',
              title: 'Congratulations',
              desc: 'Your attestation is recorded on-chain!',
            });

            let upChainType = upChainParams.type;
            if (upChainParams.type === 'web') {
              upChainType = activeCred?.schemaType;
            }
            const eventType = `${upChainType}-${upChainParams.schemaName}`;
            let upchainNetwork = upChainParams.networkName;
            if (
              process.env.NODE_ENV === 'production' &&
              upChainParams.networkName === 'Linea Goerli'
            ) {
              upchainNetwork = 'Linea Mainnet';
            }
            const eventInfo = {
              eventType: 'UPPER_CHAIN',
              rawData: {
                network: upchainNetwork,
                type: eventType,
                source: curCredential.source,
              },
            };
            eventReport(eventInfo);
          } else {
            setActiveSendToChainRequest({
              type: 'error',
              title: 'Unable to proceed',
              desc: 'Your balance may be insufficient',
            });
          }
        };
        const formatNetworkName = activeNetworkName ?? networkName;
        const targetNetwork =
          EASInfo[formatNetworkName as keyof typeof EASInfo];
        dispatch(
          connectWalletAsync(undefined, startFn, errorFn, sucFn, targetNetwork)
        );
      },
      [
        activeCred,
        activeNetworkName,
        credentialsFromStore,
        initCredList,
        errorDescEl,
        dispatch,
      ]
    );
    const handleSubmitTransferToChain = useCallback(
      async (networkName?: string) => {
        if (networkName) {
          await setActiveNetworkName(networkName);
        } else {
          return;
        }
        if (connectedWallet?.address) {
          handleSubmitConnectWallet(undefined, networkName);
        } else {
          setStep(4);
        }
      },
      [connectedWallet?.address, handleSubmitConnectWallet, dispatch]
    );

    useEffect(() => {
      if (visible) {
        setActiveNetworkName(undefined);
        setStep(3);
      }
    }, [visible]);
    const onClickClaimNFT = useCallback(() => {
      onSubmitActiveSendToChainRequestDialog()
      navigate('/events');
    }, [navigate, onSubmitActiveSendToChainRequestDialog]);
    const onClickRewards = useCallback(() => {
      onSubmitActiveSendToChainRequestDialog();
      dispatch(
        setRewardsDialogVisibleAction({
          visible: true,
          tab: 'Badges',
        })
      );
      navigate('/cred');
    }, [dispatch, onSubmitActiveSendToChainRequestDialog, navigate]);
    const footerButton = useMemo(() => {
      if (activeSendToChainRequest?.type === 'suc') {
        if (fromEvents === 'Badges') {
          return (
            <div className="claimEventsBtns">
              <PButton text="Get Early Bird NFT" onClick={onClickClaimNFT} />
              <PButton text="Check Rewards" onClick={onClickRewards} />
            </div>
          );
        } else {
          return null;
        }
      } else {
        return null
      }
    }, [
      fromEvents,
      activeSendToChainRequest?.type,
      onClickClaimNFT,
      onClickRewards,
    ]);
     
    
    return (
      <div className="credSendToChainWrapper">
        {visible && step === 3 && (
          <TransferToChainDialog
            title="Submit Attestation"
            desc="Submit your attestation to one of the following blockchains."
            list={fromEvents ? formatChainList : ONCHAINLIST}
            tip="Please select one chain to submit attestation"
            checked={false}
            backable={false}
            headerType={
              activeCred?.did ? 'polygonIdAttestation' : 'attestation'
            }
            address={(activeCred?.did ?? activeCred?.address) as string}
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
            headerEl={
              <AddressInfoHeader address={activeCred?.address as string} />
            }
            footerButton={footerButton}
            onClose={handleCloseMask}
            onSubmit={onSubmitActiveSendToChainRequestDialog}
          />
        )}
      </div>
    );
  }
);

export default CredSendToChainWrapper;
