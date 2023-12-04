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
import { useSearchParams, useNavigate } from 'react-router-dom';
import { strToHexSha256 } from '@/utils/utils';
import PButton from '@/components/PButton';
import AddressInfoHeader from '@/components/Cred/AddressInfoHeader';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';
import TransferToChainDialog from '@/components/DataSourceDetail/TransferToChainDialog';
import ConnectWalletDialog from './ConnectWalletDialog';

import {
  ONCHAINLIST,
  PADOADDRESS,
  EASInfo,
  LINEASCHEMANAME,
  SCROLLSCHEMANAME,
  FIRSTVERSIONSUPPORTEDNETWORKNAME,
} from '@/config/envConstants';
import { CredVersion, SCROLLEVENTNAME } from '@/config/constants';
import { connectWallet, switchChain } from '@/services/wallets/metamask';
import {
  attestByDelegationProxy,
  attestByDelegationProxyFee,
  bulkAttest,
} from '@/services/chains/eas.js';
import {
  setCredentialsAsync,
  connectWalletAsync,
  setRewardsDialogVisibleAction,
} from '@/store/actions';
import { compareVersions, getAuthUserIdHash } from '@/utils/utils';
import { regenerateAttestation } from '@/services/api/cred';
import { queryEventDetail } from '@/services/api/event';
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
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const fromEvents = searchParams.get('fromEvents');
    const [step, setStep] = useState(0);
    const [eventDetail, setEventDetail] = useState<any>({});
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
      if (fromEvents) {
        const newList = ONCHAINLIST.map((i) => {
          if (fromEvents === 'Scroll') {
            if (i.title.indexOf('Scroll') > -1) {
              // TODO!!!
              i.disabled = false;
              return { ...i };
            }
          } else {
            if (i.title === 'Linea Goerli') {
              i.disabled = false;
              return { ...i };
            }
          }
          return { ...i, disabled: true };
        });
        return newList;
      } else {
        return ONCHAINLIST;
      }
    }, [fromEvents]);

    const initCredList = useCallback(async () => {
      await dispatch(setCredentialsAsync());
    }, [dispatch]);

    const handleCloseMask = useCallback(() => {
      setStep(0);
      onClose();
      if (fromEvents === 'LINEA_DEFI_VOYAGE') {
        navigate('/cred');
      }
    }, [onClose, fromEvents, navigate]);
    const handleCloseTransferToChain = useCallback(() => {
      setStep(0);
      onClose();
      if (fromEvents === '') {
        navigate('/cred');
      }
    }, [onClose, fromEvents, navigate]);

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
            type: 'warn',
            title: 'Unable to proceed',
            desc: errorDescEl,
          });
        };
        const scrollEventFn = async (
          walletObj: any,
          LineaSchemaName: string
        ) => {
          let credArr = Object.values(credentialsFromStore);
          const XProof = credArr.find(
            (i) => i.event === SCROLLEVENTNAME && i.source === 'x'
          ) as CredTypeItemType;
          const BinanceProof = credArr.find(
            (i) => i?.event === SCROLLEVENTNAME && i.source === 'binance'
          ) as CredTypeItemType;
          const upChainPX: any = {
            data: XProof?.encodedData,
            signature: XProof?.signature,
            attesteraddr: PADOADDRESS,
            receipt: XProof?.address,
            type: XProof?.reqType === 'web' ? XProof?.reqType : XProof?.type,
            schemaName: XProof?.schemaName ?? LineaSchemaName,
          };
          const upChainPBiance: any = {
            attesteraddr: PADOADDRESS,
            receipt: BinanceProof?.address,
            data: BinanceProof?.encodedData,
            signature: BinanceProof?.signature,
            type:
              BinanceProof?.reqType === 'web'
                ? BinanceProof?.reqType
                : BinanceProof?.type,
            schemaName: BinanceProof?.schemaName ?? LineaSchemaName,
          };
          if (formatNetworkName !== FIRSTVERSIONSUPPORTEDNETWORKNAME) {
            const requestParamsX: any = {
              rawParam: Object.assign(XProof, {
                ext: { event: SCROLLEVENTNAME },
              }),
              greaterThanBaseValue: true,
              signature: XProof?.signature,
              newSigFormat: LineaSchemaName,
              sourceUseridHash: XProof?.sourceUseridHash,
            };
            const requestParamsBinance: any = {
              rawParam: Object.assign(BinanceProof, {
                ext: { event: SCROLLEVENTNAME },
              }),
              greaterThanBaseValue: true,
              signature: BinanceProof?.signature,
              newSigFormat: LineaSchemaName,
              sourceUseridHash: BinanceProof?.sourceUseridHash,
            };
            const signResArr = await Promise.all([
              regenerateAttestation(requestParamsX),
              regenerateAttestation(requestParamsBinance),
            ]);
            signResArr.forEach((i, k) => {
              const { rc, result } = i;
              const arr = [upChainPX, upChainPBiance];
              if (rc === 0) {
                arr[k].signature = result.result.signature;
                arr[k].data = result.result.encodedData;
              }
            });
          }
          const upChainParams = {
            networkName: formatNetworkName,
            metamaskprovider: walletObj.provider,
            items: [upChainPX, upChainPBiance],
          };
          let upChainRes = await bulkAttest(upChainParams);
          // burying point
          let upChainType = upChainParams.items[0].type;
          if (upChainType === 'web') {
            upChainType = XProof?.schemaType;
          }
          const eventType = `${upChainType}-${upChainParams.items[0].schemaName}`;
          let upchainNetwork = upChainParams.networkName;
          if (
            process.env.NODE_ENV === 'production' &&
            upChainParams.networkName === 'Linea Goerli'
          ) {
            upchainNetwork = 'Linea Mainnet';
          }
          const uniqueIdX = strToHexSha256(XProof?.signature);
          const uniqueIdBinance = strToHexSha256(BinanceProof?.signature);
          var eventInfoX: any = {
            eventType: 'UPPER_CHAIN',
            rawData: {
              network: upchainNetwork,
              type: eventType,
              source: XProof.source,
              attestationId: uniqueIdX,
            },
          };
          const eventInfoBinance: any = {
            eventType: 'UPPER_CHAIN',
            rawData: {
              network: upchainNetwork,
              type: eventType,
              source: BinanceProof.source,
              attestationId: uniqueIdBinance,
            },
          };

          if (upChainRes) {
            if (upChainRes.error) {
              if (upChainRes.error === 1) {
                setActiveSendToChainRequest({
                  type: 'warn',
                  title: 'Unable to proceed',
                  desc: 'Your balance is insufficient',
                });
              } else if (upChainRes.error === 2) {
                setActiveSendToChainRequest({
                  type: 'warn',
                  title: 'Unable to proceed',
                  desc: 'Please try again later.',
                });
              }
              eventInfoX.rawData = Object.assign(eventInfoX.rawData, {
                status: 'FAILED',
                reason: upChainRes.message,
              });
              eventInfoBinance.rawData = Object.assign(
                eventInfoBinance.rawData,
                {
                  status: 'FAILED',
                  reason: upChainRes.message,
                }
              );
              eventReport(eventInfoX);
              eventReport(eventInfoBinance);
              return;
            }
            const currentChainObj: any = ONCHAINLIST.find(
              (i) => formatNetworkName === i.title
            );
            currentChainObj.attestationUID = upChainRes;
            // TODO???
            currentChainObj.submitAddress = walletObj.address;
            [XProof, BinanceProof].forEach((i) => {
              const newProvided = i.provided ?? [];
              // TODO!!!
              // const existIndex = newProvided.findIndex(
              //   (i) => i.title === formatNetworkName
              // );
              // existIndex < 0 &&
              newProvided.push(currentChainObj);
              credentialsFromStore[i.requestid] = Object.assign(i, {
                provided: newProvided,
              });
            });
            await chrome.storage.local.set({
              credentials: JSON.stringify(credentialsFromStore),
            });

            await initCredList();

            const { scrollEvent } = await chrome.storage.local.get([
              'scrollEvent',
            ]);
            const scrollEventObj = scrollEvent ? JSON.parse(scrollEvent) : {};
            Object.assign(scrollEventObj, {
              finishFlag: '1',
            });
            chrome.storage.local.set({
              scrollEvent: JSON.stringify(scrollEventObj),
            });

            setActiveSendToChainRequest({
              type: 'suc',
              title: 'Congratulations',
              desc: 'Your attestation is recorded on-chain!',
            });
            eventInfoX.rawData = Object.assign(eventInfoX.rawData, {
              status: 'SUCCESS',
              reason: '',
            });
            eventInfoBinance.rawData = Object.assign(eventInfoBinance.rawData, {
              status: 'SUCCESS',
              reason: '',
            });
            eventReport(eventInfoX);
            eventReport(eventInfoBinance);
          } else {
            setActiveSendToChainRequest({
              type: 'warn',
              title: 'Unable to proceed',
              desc: 'Please try again later.',
            });
            eventInfoX.rawData = Object.assign(eventInfoX.rawData, {
              status: 'FAILED',
              reason: 'attestByDelegationProxyFee error',
            });
            eventInfoBinance.rawData = Object.assign(eventInfoBinance.rawData, {
              status: 'FAILED',
              reason: 'attestByDelegationProxyFee error',
            });
            eventReport(eventInfoX);
            eventReport(eventInfoBinance);
          }
        };
        const sucFn = async (walletObj: any) => {
          try {
            let LineaSchemaName;
            if (formatNetworkName?.startsWith('Linea')) {
              LineaSchemaName = LINEASCHEMANAME;
            } else if (
              formatNetworkName &&
              formatNetworkName.indexOf('Scroll') > -1
            ) {
              LineaSchemaName = SCROLLSCHEMANAME;
            } else {
              LineaSchemaName = 'EAS';
            }
            if (fromEvents === 'Scroll') {
              scrollEventFn(walletObj, LineaSchemaName);
            } else {
              let upChainParams = {
                networkName: formatNetworkName,
                metamaskprovider: walletObj.provider,
                receipt: activeCred?.address,// TODO DEL!!!
                // receipt: '0x2A46883d79e4Caf14BCC2Fbf18D9f12A8bB18D07',
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
                  rawParam:
                    curCredential.type === 'UNISWAP_PROOF'
                      ? curCredential.rawParam
                      : Object.assign(curCredential, {
                          ext: null,
                        }),
                  greaterThanBaseValue: true,
                  signature: curCredential.signature,
                  newSigFormat: LineaSchemaName,
                  sourceUseridHash: curCredential.type === 'UNISWAP_PROOF'
                      ? undefined: curCredential.sourceUseridHash,
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
                if (activeCred?.type === 'UNISWAP_PROOF') {
                  requestParams.dataToBeSigned =  activeCred?.dataToBeSigned
                }
                const { rc, result } = await regenerateAttestation(
                  requestParams
                );
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

              // burying point
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
              const uniqueId = strToHexSha256(
                upChainParams.signature as string
              );
              var eventInfo: any = {
                eventType: 'UPPER_CHAIN',
                rawData: {
                  network: upchainNetwork,
                  type: eventType,
                  source: curCredential.source,
                  attestationId: uniqueId,
                },
              };
              if (upChainRes) {
                if (upChainRes.error) {
                  if (upChainRes.error === 1) {
                    setActiveSendToChainRequest({
                      type: 'warn',
                      title: 'Unable to proceed',
                      desc: 'Your balance is insufficient',
                    });
                  } else if (upChainRes.error === 2) {
                    setActiveSendToChainRequest({
                      type: 'warn',
                      title: 'Unable to proceed',
                      desc: 'Please try again later.',
                    });
                  }
                  eventInfo.rawData = Object.assign(eventInfo.rawData, {
                    status: 'FAILED',
                    reason: upChainRes.message,
                  });
                  eventReport(eventInfo);
                  return;
                }
                const newProvided = curCredential.provided ?? [];
                const currentChainObj: any = ONCHAINLIST.find(
                  (i) => formatNetworkName === i.title
                );
                currentChainObj.attestationUID = upChainRes;
                currentChainObj.submitAddress = walletObj.address;
                // const existIndex = newProvided.findIndex(
                //   (i) => i.title === formatNetworkName
                // );
                // existIndex < 0 &&
                newProvided.push(currentChainObj);

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
                eventInfo.rawData = Object.assign(eventInfo.rawData, {
                  status: 'SUCCESS',
                  reason: '',
                });
                eventReport(eventInfo);
              } else {
                setActiveSendToChainRequest({
                  type: 'warn',
                  title: 'Unable to proceed',
                  desc: 'Please try again later.',
                });
                eventInfo.rawData = Object.assign(eventInfo.rawData, {
                  status: 'FAILED',
                  reason: 'attestByDelegationProxyFee error',
                });
                eventReport(eventInfo);
              }
            }
          } catch (e) {
            console.log('upper chain error:', e);
            // eventInfo.rawData = Object.assign(eventInfo.rawData, {
            //   status: 'FAILED',
            //   reason: e,
            // });
            // eventReport(eventInfo);
            console.dir(e);
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
        fromEvents,
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
      [connectedWallet?.address, handleSubmitConnectWallet]
    );

    useEffect(() => {
      if (visible) {
        setActiveNetworkName(undefined);
        setStep(3);
      }
    }, [visible]);
    const onClickClaimNFT = useCallback(() => {
      onSubmitActiveSendToChainRequestDialog();
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
        const isFromEventLINEA_DEFI_VOYAGE =
          activeCred?.event === 'LINEA_DEFI_VOYAGE' &&
          activeNetworkName === 'Linea Goerli';

        if (fromEvents === 'Badges') {
          return (
            <div className="claimEventsBtns">
              <PButton text="Get Early Bird NFT" onClick={onClickClaimNFT} />
              <PButton text="Check Rewards" onClick={onClickRewards} />
            </div>
          );
        } else if (fromEvents === 'Scroll') {
          return (
            <PButton
              text="Check Rewards"
              onClick={onSubmitActiveSendToChainRequestDialog}
            />
          );
        } else if (
          isFromEventLINEA_DEFI_VOYAGE ||
          fromEvents === 'LINEA_DEFI_VOYAGE'
        ) {
          const fn = () => {
            const targetUrl =
              eventDetail?.ext?.intractUrl || 'https://padolabs.org/events';
            window.open(targetUrl);
            onSubmitActiveSendToChainRequestDialog();
          };
          return <PButton text="Back to event" onClick={fn} />; //Check your campaign status
        } else {
          return null;
        }
      } else {
        return null;
      }
    }, [
      fromEvents,
      activeSendToChainRequest?.type,
      onClickClaimNFT,
      onClickRewards,
      eventDetail?.ext?.intractUrl,
    ]);
    const fetchEventDetail = useCallback(async () => {
      try {
        const res = await queryEventDetail({
          event: 'LINEA_DEFI_VOYAGE',
        });
        const { rc, result } = res;
        if (rc === 0) {
          setEventDetail(result);
          //     "startTime": "1699819200000",
          // "endTime": "1700942400000",
          //   "ext": {
          //     "intractUrl": "https://www.intract.io/linea"
          // }
        }
      } catch {}
    }, []);
    useEffect(() => {
      fromEvents === 'LINEA_DEFI_VOYAGE' && fetchEventDetail();
    }, [fromEvents, fetchEventDetail]);

    return (
      <div className="credSendToChainWrapper">
        {visible && step === 3 && (
          <TransferToChainDialog
            title="Submit Attestation"
            desc="Submit your attestation to one of the following blockchains."
            list={formatChainList}
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
            closeable={
              !fromEvents ||
              fromEvents === 'Scroll' ||
              fromEvents === 'LINEA_DEFI_VOYAGE'
            }
          />
        )}
      </div>
    );
  }
);

export default CredSendToChainWrapper;
