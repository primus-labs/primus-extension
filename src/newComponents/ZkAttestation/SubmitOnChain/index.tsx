import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { setCredentialsAsync, setActiveConnectWallet } from '@/store/actions';
import useCheckIsConnectedWallet from '@/hooks/useCheckIsConnectedWallet';
import useEventDetail from '@/hooks/useEventDetail';
import useWallet from '@/hooks/useWallet';
import {
  attestByDelegationProxy,
  attestByDelegationProxyFee,
  bulkAttest,
} from '@/services/chains/eas.js';
import { formatAddress } from '@/utils/utils';
import { strToHexSha256 } from '@/utils/utils';
import { compareVersions, getAuthUserIdHash } from '@/utils/utils';

import { regenerateAttestation } from '@/services/api/cred';
import { eventReport } from '@/services/api/usertracker';

import {
  ONCHAINLIST,
  EASInfo,
  LINEASCHEMANAME,
  SCROLLSCHEMANAME,
  BNBSCHEMANAME,
  BNBGREENFIELDSCHEMANAME,
  FIRSTVERSIONSUPPORTEDNETWORKNAME,
} from '@/config/chain';
import { BASEVENTNAME, SCROLLEVENTNAME } from '@/config/events';
import { PADOADDRESS } from '@/config/envConstants';
import { CredVersion } from '@/config/attestation';

import type { CredTypeItemType } from '@/types/cred';
import type { Dispatch } from 'react';
import { newWALLETITEMTYPE } from '@/types/config';

import SetDialog from './SetDialog';
import SetProcessDialog from './SetProcessDialog';
import type { UserState } from '@/types/store';
import './index.scss';

interface PButtonProps {
  list?: newWALLETITEMTYPE[];
  // visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

const defaultList = ONCHAINLIST.map((i: any) => {
  const { title, showName, icon, disabled } = i;
  return {
    id: title,
    name: showName,
    icon,
    disabled,
  };
});
const Nav: React.FC<PButtonProps> = memo(
  ({ onClose, onSubmit, list = defaultList }) => {
    const dispatch: Dispatch<any> = useDispatch();
    const [BASEventDetail] = useEventDetail(BASEVENTNAME);

    const [searchParams] = useSearchParams();
    const fromEvents = searchParams.get('id');
    const [step, setStep] = useState<number>(1);
    const [activeRequest, setActiveRequest] = useState<any>({});
    const [activeSendToChainRequest, setActiveSendToChainRequest] =
      useState<any>({});
    const [chainId, setChainId] = useState<string | number>('');
    const [checkIsConnectFlag, setCheckIsConnectFlag] =
      useState<boolean>(false);
    const { connected } = useCheckIsConnectedWallet(checkIsConnectFlag);
    const connectedWallet = useSelector(
      (state: UserState) => state.connectedWallet
    );
    const credentialsFromStore = useSelector(
      (state: UserState) => state.credentials
    );
    const activeOnChain = useSelector(
      (state: UserState) => state.activeOnChain
    );
    const BASEventDetailExt = useMemo(() => {
      return BASEventDetail?.ext;
    }, [BASEventDetail]);
    const activeOnChainAttestation = useMemo(() => {
      return credentialsFromStore[activeOnChain.requestid];
    }, [credentialsFromStore, activeOnChain.requestid]);
    const presetIcon = useMemo(() => {
      if (chainId) {
        return EASInfo[chainId].icon;
      } else {
        return null;
      }
    }, [chainId]);
    const handleCloseConnectWalletProcessDialog = useCallback(() => {
      onClose();
    }, []);

    const handleCloseConnectWallet = useCallback(() => {
      onClose();
    }, [onClose]);

    const initCredList = useCallback(async () => {
      await dispatch(setCredentialsAsync());
    }, [dispatch]);
    const LineaSchemaNameFn = useCallback(
      (networkName?: string) => {
        const formatNetworkName = (networkName ?? chainId) as string;
        let Name;
        if (formatNetworkName?.startsWith('Linea')) {
          Name = LINEASCHEMANAME;
        } else if (
          formatNetworkName &&
          (formatNetworkName.indexOf('BSC') > -1 ||
            formatNetworkName.indexOf('BNB Greenfield') > -1)
        ) {
          Name = BNBSCHEMANAME;
        } else if (
          formatNetworkName &&
          formatNetworkName.indexOf('Scroll') > -1
        ) {
          Name = SCROLLSCHEMANAME;
        } else if (
          formatNetworkName &&
          formatNetworkName.indexOf('BNB Greenfield') > -1
        ) {
          Name = BNBGREENFIELDSCHEMANAME;
        } else {
          Name = 'EAS';
          // Name = 'EAS-Ethereum';
        }
        return Name;
      },
      [chainId]
    );
    const getBASInfoFn = useCallback(async () => {
      const res = await chrome.storage.local.get([BASEVENTNAME]);
      if (res[BASEVENTNAME]) {
        const lastInfo = JSON.parse(res[BASEVENTNAME]);
        return lastInfo[connectedWallet?.address];
      } else {
        return {};
      }
    }, [connectedWallet?.address]);
    const toBeUpperChainCredsFn = useCallback(async () => {
      let credArrNew: CredTypeItemType[] = Object.values(credentialsFromStore);
      const lastBASInfoObj = (await getBASInfoFn()) as any;
      if (lastBASInfoObj?.taskMap && lastBASInfoObj?.taskMap?.attestation) {
        const toBeUpperChainCredRequestids = [
          ...new Set(Object.values(lastBASInfoObj?.taskMap?.attestation)),
        ];
        const Creds = credArrNew.filter((c: any) =>
          toBeUpperChainCredRequestids.includes(c.requestid)
        );
        console.log('222toBeUpperChainCreds:', Creds);
        return Creds;
      } else {
        return [];
      }
    }, [credentialsFromStore, getBASInfoFn]);
    const BASEventFn = useCallback(
      async (
        walletObj: any,
        LineaSchemaName: string,
        formatNetworkName?: string
      ) => {
        if (formatNetworkName === 'BNB Greenfield') {
          chrome.runtime.sendMessage({
            type: 'padoWebsite',
            name: 'upperChain',
            params: {
              operation: 'openPadoWebsite',
              eventName: BASEVENTNAME,
              chainName: chainId,
            },
          });
        } else {
          const toBeUpperChainCreds = await toBeUpperChainCredsFn();
          const upChainItems = toBeUpperChainCreds.map((i: any) => {
            return {
              data: i?.encodedData,
              signature: i?.signature,
              attesteraddr: PADOADDRESS,
              receipt: i?.address,
              type:
                i?.reqType === 'web' || i?.source === 'google'
                  ? 'web'
                  : i?.type, // TODO-newui
              schemaName: i?.schemaName ?? LineaSchemaName,
            };
          });
          const firstToBeUpperChainCred = toBeUpperChainCreds[0];
          if (formatNetworkName !== FIRSTVERSIONSUPPORTEDNETWORKNAME) {
            const regenerateAttestationParamsArr = toBeUpperChainCreds.map(
              (i: any) => {
                return {
                  rawParam:
                    i.source === 'google'
                      ? i.rawParam
                      : Object.assign(i, {
                          ext: { event: SCROLLEVENTNAME },
                        }),
                  greaterThanBaseValue: true,
                  signature: i?.signature,
                  newSigFormat: LineaSchemaName,
                  sourceUseridHash: i?.sourceUseridHash,
                };
              }
            );
            const requestArr = regenerateAttestationParamsArr.map((i) => {
              return regenerateAttestation(i);
            });
            const signResArr = await Promise.all(requestArr);
            signResArr.forEach((i, k) => {
              const { rc, result } = i;
              if (rc === 0) {
                upChainItems[k].signature = result.result.signature;
                upChainItems[k].data = result.result.encodedData;
              }
            });
          }
          const upChainParams = {
            networkName: formatNetworkName,
            metamaskprovider: walletObj.provider,
            items: upChainItems,
            eventSchemauid: BASEventDetailExt?.schemaUid,
          };

          let upChainRes = await bulkAttest(upChainParams);
          // burying point
          console.log('222123upChainParams.items', upChainParams.items);
          let upChainType = upChainParams.items[0].type;
          if (upChainType === 'web') {
            upChainType = firstToBeUpperChainCred?.schemaType;
          }
          const eventType = `${upChainType}-${upChainParams.items[0].schemaName}`;
          let upchainNetwork = upChainParams.networkName;
          if (
            process.env.NODE_ENV === 'production' &&
            upChainParams.networkName === 'Linea Goerli'
          ) {
            upchainNetwork = 'Linea Mainnet';
          }
          let eventInfoArr = toBeUpperChainCreds.map((i: any) => {
            const uniqueId = strToHexSha256(i?.signature);
            var eventInfo: any = {
              eventType: 'UPPER_CHAIN',
              rawData: {
                network: upchainNetwork,
                type: eventType,
                source: i.source,
                attestationId: uniqueId,
              },
            };
            return eventInfo;
          }, []);
          if (upChainRes) {
            if (upChainRes.error) {
              if (upChainRes.error === 1) {
                setActiveSendToChainRequest({
                  // type: 'warn',
                  type: 'fail',
                  title: 'Unable to proceed',
                  desc: 'Your balance is insufficient',
                });
              } else if (upChainRes.error === 2) {
                setActiveSendToChainRequest({
                  // type: 'warn',
                  type: 'fail',
                  title: 'Unable to proceed',
                  desc: 'Please try again later.',
                });
              }
              eventInfoArr = eventInfoArr.map((i) => {
                return {
                  ...i,
                  rawData: Object.assign(i.rawData, {
                    status: 'FAILED',
                    reason: upChainRes.message,
                  }),
                };
              });
              const requestArr = eventInfoArr.map((i) => {
                return eventReport(i);
              });
              await Promise.all(requestArr);
              return;
            }
            const currentChainObj: any = ONCHAINLIST.find(
              (i: any) => formatNetworkName === i.title
            );
            // currentChainObj.attestationUID = upChainRes;
            // TODO???
            currentChainObj.submitAddress = walletObj.address;

            // for (let i = 0; i < toBeUpperChainCreds.length; i++) {
            //   const cred = toBeUpperChainCreds[i];
            //   const newProvided = cred.provided ?? [];
            //   // currentChainObj.attestationUID = upChainRes[i];
            //   newProvided.push({
            //     ...currentChainObj,
            //     attestationUID: upChainRes[i],
            //   });
            //   cred.provided = newProvided;
            //   credentialsFromStore[cred.requestid] = cred;
            //   console.log(
            //     '222add chain provider attestationUID:',
            //     upChainRes[i],
            //     newProvided
            //   );
            //   console.log(
            //     '222after add chain provider cred:',
            //     credentialsFromStore[cred.requestid].provided,
            //     cred.provided
            //   );
            // }
            toBeUpperChainCreds.forEach(async (i, k) => {
              const newProvided = i.provided ?? [];
              // const existIndex = newProvided.findIndex(
              //   (i) => i.title === formatNetworkName
              // );
              // existIndex < 0 &&
              newProvided.push({
                ...currentChainObj,
                attestationUID: upChainRes[k],
              });
              credentialsFromStore[i.requestid] = Object.assign(i, {
                provided: newProvided,
              });
            });
            await chrome.storage.local.set({
              credentials: JSON.stringify(credentialsFromStore),
            });

            await initCredList();

            const res = await chrome.storage.local.get([BASEVENTNAME]);
            if (res[BASEVENTNAME]) {
              const lastInfo = JSON.parse(res[BASEVENTNAME]);
              lastInfo.steps[2].status = 1;
              await chrome.storage.local.set({
                [BASEVENTNAME]: JSON.stringify(lastInfo),
              });

              setActiveSendToChainRequest({
                type: 'suc',
                title: 'Congratulations',
                desc: 'Your attestation is recorded on-chain!',
              });

              eventInfoArr = eventInfoArr.map((i) => {
                return {
                  ...i,
                  rawData: Object.assign(i.rawData, {
                    status: 'SUCCESS',
                    reason: '',
                  }),
                };
              });
              const requestArr = eventInfoArr.map((i) => {
                return eventReport(i);
              });
              await Promise.all(requestArr);
            }
          } else {
            setActiveSendToChainRequest({
              // type: 'warn',
              type: 'fail',
              title: 'Unable to proceed',
              desc: 'Please try again later.',
            });
            eventInfoArr = eventInfoArr.map((i) => {
              return {
                ...i,
                rawData: Object.assign(i.rawData, {
                  status: 'FAILED',
                  reason: 'attestByDelegationProxyFee error',
                }),
              };
            });
            const requestArr = eventInfoArr.map((i) => {
              return eventReport(i);
            });
            await Promise.all(requestArr);
          }
        }
      },
      [
        chainId,
        BASEventDetailExt,
        credentialsFromStore,
        initCredList,
        toBeUpperChainCredsFn,
      ]
    );
    const storeEventInfoFn = useCallback(async (fullAttestation) => {
      const {
        event: eventId,
        address: currentAddress,
        requestid,
      } = fullAttestation;
      const res = await chrome.storage.local.get([eventId]);
      if (res[eventId]) {
        const lastEventObj = JSON.parse(res[eventId]);
        const lastInfo = lastEventObj[currentAddress];
        if (lastInfo) {
          const { taskMap } = lastInfo;
          taskMap.onChain['onChain'] = requestid;
          await chrome.storage.local.set({
            [eventId]: JSON.stringify(lastEventObj),
          });
        }
      }
    }, []);

    const sucFn = useCallback(
      async (walletObj: any, formatNetworkName?: string) => {
        try {
          let LineaSchemaName = LineaSchemaNameFn(formatNetworkName);
          if (fromEvents === 'Scroll') {
            // scrollEventFn(walletObj, LineaSchemaName);// TODO-newui
          } else if (fromEvents === BASEVENTNAME) {
            BASEventFn(walletObj, LineaSchemaName, formatNetworkName);
          } else {
            let curType = activeOnChainAttestation?.type;
            if (
              activeOnChainAttestation?.reqType === 'web' ||
              activeOnChainAttestation?.source === 'google'
            ) {
              curType = 'web';
            }
            if (activeOnChainAttestation?.source === 'coinbase') {
              curType = 'TOKEN_HOLDINGS';
            }

            let upChainParams: any = {
              networkName: formatNetworkName,
              metamaskprovider: walletObj.provider,
              receipt: activeOnChainAttestation?.address, // TODO DEL!!! for uniswap proof
              // receipt: '0xd4b69e8d62c880e9dd55d419d5e07435c3538342',
              attesteraddr: PADOADDRESS,
              data: activeOnChainAttestation?.encodedData,
              signature: activeOnChainAttestation?.signature,
              type: curType,
              schemaName:
                activeOnChainAttestation?.schemaName ?? LineaSchemaName, // TODO-basevent
            };

            let versionForComparison = activeOnChainAttestation?.version ?? '';

            let upChainRes;
            const cObj = { ...credentialsFromStore };
            const curRequestid = activeOnChainAttestation?.requestid as string;
            const curCredential = cObj[curRequestid];
            if (curCredential?.event === BASEVENTNAME) {
              const schemaUidObj = BASEventDetailExt?.schemaUidInfo.find(
                (i) => i.sigFormat === LineaSchemaName
              );
              upChainParams.eventSchemauid = schemaUidObj.schemaUid;
            } // TODO-basevent
            if (formatNetworkName !== FIRSTVERSIONSUPPORTEDNETWORKNAME) {
              const requestParams: any = {
                rawParam:
                  curCredential.type === 'UNISWAP_PROOF' ||
                  curCredential.source === 'google'
                    ? curCredential.rawParam
                    : Object.assign(curCredential, {
                        ext: null,
                      }),
                greaterThanBaseValue: true,
                signature: curCredential.signature,
                newSigFormat: LineaSchemaName, // TODO-basevent
                sourceUseridHash:
                  curCredential.type === 'UNISWAP_PROOF'
                    ? undefined
                    : curCredential.sourceUseridHash,
              };
              if (activeOnChainAttestation?.source === 'zan') {
                const authUseridHash = await getAuthUserIdHash();
                requestParams.dataToBeSigned = {
                  source: activeOnChainAttestation?.source,
                  type: activeOnChainAttestation?.type,
                  authUseridHash: authUseridHash,
                  recipient: activeOnChainAttestation?.address,
                  timestamp: +new Date() + '',
                  result: true,
                };
              }
              if (activeOnChainAttestation?.type === 'UNISWAP_PROOF') {
                requestParams.dataToBeSigned =
                  activeOnChainAttestation?.dataToBeSigned;
              }
              const { rc, result } = await regenerateAttestation(requestParams);
              if (rc === 0) {
                upChainParams.signature = result.result.signature;
                upChainParams.data = result.result.encodedData;
              }
              versionForComparison = CredVersion;
            }

            upChainRes = await attestByDelegationProxyFee(upChainParams);

            // burying point
            let upChainType = upChainParams.type;
            if (upChainParams.type === 'web') {
              upChainType = activeOnChainAttestation?.schemaType;
            }
            const eventType = `${upChainType}-${upChainParams.schemaName}`;
            let upchainNetwork = upChainParams.networkName;
            if (
              process.env.NODE_ENV === 'production' &&
              upChainParams.networkName === 'Linea Goerli'
            ) {
              upchainNetwork = 'Linea Mainnet';
            }
            const uniqueId = strToHexSha256(upChainParams.signature as string);
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
                    // type: 'warn',
                    type: 'fail',
                    title: 'Unable to proceed',
                    desc: 'Your balance is insufficient',
                  });
                } else if (upChainRes.error === 2) {
                  setActiveSendToChainRequest({
                    // type: 'warn',
                    type: 'fail',
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
                (i: any) => formatNetworkName === i.title
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
              await storeEventInfoFn(activeOnChainAttestation);
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
                // type: 'warn',
                type: 'fail',
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
          setActiveSendToChainRequest({
            // type: 'warn',
            type: 'fail',
            title: 'Unable to proceed',
            desc: 'Please try again later.',
          });
          console.log('upper chain error:', e);
          // eventInfo.rawData = Object.assign(eventInfo.rawData, {
          //   status: 'FAILED',
          //   reason: e,
          // });
          // eventReport(eventInfo);
          console.dir(e);
        }
      },
      [
        fromEvents,
        BASEventDetailExt,
        // chainId,
        BASEventFn,
        LineaSchemaNameFn,
        activeOnChainAttestation,
      ]
    );
    const handleSubmitConnectWallet = useCallback(
      async (cId) => {
        setChainId(cId);
        setStep(2);
        // setActiveSendToChainRequest({
        //   type: 'loading',
        //   title: 'Processing',
        //   desc: 'Please complete the transaction in your wallet.',
        // });
        setActiveSendToChainRequest({
          type: 'loading',
          title: 'Requesting Connection',
          desc: 'Check your wallet to confirm the connection and submit your attestation to Linea.',
        });
        if (cId !== 'BNB Greenfield') {
          await dispatch(setActiveConnectWallet({ network: EASInfo[cId] }));
        }
        setCheckIsConnectFlag(true);
      },
      [dispatch]
    );
    useEffect(() => {
      if (connected && chainId) {
        sucFn(connectedWallet, chainId as string);
      }
    }, [connected, chainId, connectedWallet]);
    // useEffect(() => {
    //   if (visible) {
    //     setStep(1);
    //     setActiveRequest({});
    //   }
    // }, [visible]);
    return (
      <div className={'submitOnChain'}>
        {step === 1 && (
          <SetDialog
            list={list}
            onClose={handleCloseConnectWallet}
            onSubmit={handleSubmitConnectWallet}
          />
        )}
        {step === 2 && (
          <>
            {connected ? (
              <SetProcessDialog
                preset={presetIcon}
                onClose={handleCloseConnectWalletProcessDialog}
                onSubmit={() => {}}
                activeRequest={activeSendToChainRequest}
              />
            ) : (
              <></>
            )}
          </>
        )}
      </div>
    );
  }
);

export default Nav;
