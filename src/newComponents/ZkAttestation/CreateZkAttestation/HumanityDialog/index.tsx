import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import {
  setActiveAttestation,
  setCredentialsAsync,
  setAttestLoading,
} from '@/store/actions';
import useMsgs from '@/hooks/useMsgs';
import useEventDetail from '@/hooks/useEventDetail';
import useAuthorization2 from '@/hooks/useAuthorization2';
import useAuthorizationDiscord from '@/hooks/useAuthorizationDiscord';
import { eventReport } from '@/services/api/usertracker';
import { getAccount } from '@/utils/utils';
import { BASEVENTNAME } from '@/config/events';
import { DATASOURCEMAP } from '@/config/dataSource';
import { ALLVERIFICATIONCONTENTTYPEEMAP } from '@/config/attestation';
import { CredVersion } from '@/config/attestation';
import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';
import type { DataSourceMapType } from '@/types/dataSource';

import PMask from '@/newComponents/PMask';
import PClose from '@/newComponents/PClose';
import SetDetail from './SetDetail';
import SetDataSource from './SetDataSource';
import SetProcessDialog from '@/newComponents/ZkAttestation/SubmitOnChain/SetProcessDialog';

import OrderItem from '@/newComponents/OrderItem';
import iconDone from '@/assets/newImg/layout/iconDone.svg';

import '../AssetDialog/index.scss';
import useAllSources from '@/hooks/useAllSources';

interface PButtonProps {
  // sourceName: string;
  type: string;
  onClose: () => void;
  onSubmit: () => void;
  presets?: any;
}

const Nav: React.FC<PButtonProps> = memo(
  ({ type, onClose, onSubmit, presets }) => {
    const { sourceMap2 } = useAllSources();
    const { pathname } = useLocation();
    const { msgs, addMsg, deleteMsg } = useMsgs();
    const authorize = useAuthorization2();
    const authDiscord = useAuthorizationDiscord();

    const dispatch: Dispatch<any> = useDispatch();
    const [searchParams] = useSearchParams();
    const fromEvents = searchParams.get('id');

    const [step, setStep] = useState<number>(1);
    const [assetForm, setAssetForm] = useState<any>({});

    const [BASEventDetail] = useEventDetail(BASEVENTNAME);
    const [activeSendToChainRequest, setActiveSendToChainRequest] =
      useState<any>({});
    const attestLoading = useSelector(
      (state: UserState) => state.attestLoading
    );
    const webProofTypes = useSelector(
      (state: UserState) => state.webProofTypes
    );
    const connectedWallet = useSelector(
      (state: UserState) => state.connectedWallet
    );
    const credentialsFromStore = useSelector(
      (state: UserState) => state.credentials
    );
    const activeAttestation = useSelector(
      (state: UserState) => state.activeAttestation
    );
    const padoServicePort = useSelector(
      (state: UserState) => state.padoServicePort
    );
    const dataSourceMetaInfo: DataSourceMapType = useMemo(() => {
      if (assetForm.dataSourceId) {
        return DATASOURCEMAP[assetForm.dataSourceId];
      } else {
        return {};
      }
    }, [assetForm.dataSourceId]);
    const dataSourceEl = useMemo(() => {
      return (
        <div className="dataSourceIntro">
          <img src={dataSourceMetaInfo?.icon} alt="" />
          <span>{dataSourceMetaInfo?.name}</span>
        </div>
      );
    }, [dataSourceMetaInfo]);
    const handleSubmitSetPwdDialog = useCallback((dataSourceId: string) => {
      setAssetForm((f) => ({ ...f, dataSourceId: dataSourceId }));
      setStep(2);
    }, []);

    const initCredList = useCallback(async () => {
      await dispatch(setCredentialsAsync());
    }, [dispatch]);
    const storeBASEventInfoFn = useCallback(
      async (address: any, taskExtraInfo: any) => {
        const res = await chrome.storage.local.get([BASEVENTNAME]);
        if (res[BASEVENTNAME]) {
          const lastInfo = JSON.parse(res[BASEVENTNAME]);
          const lastTasks = lastInfo.steps[1].tasks ?? {};
          if (!lastInfo.address) {
            lastInfo.address = address;
          }
          lastInfo.steps[1].status = 1;
          lastInfo.steps[1].tasks = {
            ...lastTasks,
            ...taskExtraInfo, //taskExtraInfo: {[GOOGLEWEBPROOFID]: fullAttestation.requestid,}
          };
          await chrome.storage.local.set({
            [BASEVENTNAME]: JSON.stringify(lastInfo),
          });
        }
      },
      []
    );
    const storeEventInfoFn = useCallback(async (fullAttestation) => {
      const {
        event: eventId,
        address: currentAddress,
        source,
        templateId,
        requestid,
      } = fullAttestation;
      const res = await chrome.storage.local.get([eventId]);
      if (res[eventId]) {
        const lastEventObj = JSON.parse(res[eventId]);
        const lastInfo = lastEventObj[currentAddress];
        if (lastInfo) {
          const { taskMap } = lastInfo;
          taskMap.attestation[templateId] = requestid;
          await chrome.storage.local.set({
            [eventId]: JSON.stringify(lastEventObj),
          });
        }
      }
    }, []);
    // const fetchGoogleUserInfo = useCallback(() => {
    //   const source = 'GOOGLE'
    //   const state = uuidv4();
    //   postMsg(padoServicePort, {
    //     fullScreenType: 'padoService',
    //     reqMethodName: 'checkIsLogin',
    //     params: {
    //       state,
    //       source,
    //     },
    //   });
    //   console.log('page_send:checkIsLogin request');
    //   const eventInfo = {
    //     eventType: 'DATA_SOURCE_INIT',
    //     rawData: { type: 'Social', dataSource: source },
    //   };
    //   eventReport(eventInfo);
    // }, []);
    const fetchAttestForGoogle = useCallback(
      async (form) => {
        const { dataSourceId } = form;
        const templateId = dataSourceId === 'google' ? '100' : '101';
        const authFn = dataSourceId === 'google' ? authorize : authDiscord; //TODO-discordAttestation
        const isFromBASEvent =
          dataSourceId === 'google' ? fromEvents === BASEVENTNAME : false;
        const schemaType =
          dataSourceId === 'google'
            ? isFromBASEvent
              ? BASEventDetail?.ext?.schemaType
              : 'GOOGLE_ACCOUNT_OWNER'
            : 'DISCORD_ACCOUNT_OWNER'; // TODO-discordAttestation
        const attestationId = uuidv4();

        const getCredAddrFn = async () => {
          let credAddress = connectedWallet?.address;
          if (isFromBASEvent) {
            const res = await chrome.storage.local.get([BASEVENTNAME]);
            if (res[BASEVENTNAME]) {
              const lastInfo = JSON.parse(res[BASEVENTNAME]);
              const lastCredAddress = lastInfo.address;
              if (lastCredAddress) {
                credAddress = lastCredAddress;
              }
            }
          }
          return credAddress;
        };
        const credAddress = await getCredAddrFn();
        const eventInfo: any = {
          eventType: 'API_ATTESTATION_GENERATE',
          rawData: {
            source: form.dataSourceId,
            schemaType,
            sigFormat: 'EAS-Ethereum',
            attestationId: attestationId,
            event: dataSourceId === 'google' ? fromEvents : false,
            address: credAddress,
          },
        };
        const storeGoogleCred = async (res: any) => {
          //w
          const { signatureInfo, signatureRawInfo } = res;

          const fullAttestation = {
            schemaType: signatureRawInfo.rawParam.schemaType,
            ...signatureInfo,
            ...signatureRawInfo,
            address: credAddress,
            ...form,
            source: dataSourceId,
            version: CredVersion,
            requestid: attestationId,
            sourceUseridHash: signatureRawInfo.rawParam.sourceUseridHash,
            event: fromEvents,
            templateId,
            dataSourceId,
            account: '',
            credVersion: CredVersion,
          };
          const storeRes = await chrome.storage.local.get([dataSourceId]);
          const acc = getAccount(
            DATASOURCEMAP[dataSourceId],
            JSON.parse(storeRes[dataSourceId])
          );
          fullAttestation.account = acc;
          if (fromEvents) {
            await storeEventInfoFn(fullAttestation);
          }
          const credentialsObj = {
            ...credentialsFromStore,
          };

          credentialsObj[attestationId] = fullAttestation;
          await chrome.storage.local.set({
            credentials: JSON.stringify(credentialsObj),
          });
          await initCredList();
          const msgObj = {
            type: 'suc',
            title: 'Humanity Verification is created!',
            desc: '',
            link: '/Attestation',
          };
          if (pathname !== '/Attestation') {
            msgObj.desc = 'See details in the Attestation page.';
          }
          const msgId = await addMsg(msgObj);
          const delay = msgObj?.link === pathname ? 5000 : 8000;
          let timer = setTimeout(() => {
            // console.log('222deleteMsg-timeout', delay); //delete
            deleteMsg(msgId);
          }, delay);
          // setActiveRequest({
          //   type: 'suc',
          //   title: 'Congratulations',
          //   desc: 'Your proof is created!',
          // });
          eventInfo.rawData.status = 'SUCCESS';
          eventInfo.rawData.reason = '';
          eventReport(eventInfo);
          dispatch(setActiveAttestation({ loading: 2 }));
          dispatch(setAttestLoading(2));
          //w
        };

        try {
          await authFn(form.dataSourceId.toUpperCase(), storeGoogleCred);
        } catch {
          setStep(-1);
          // addMsg({
          //   type: 'error',
          //   title: 'Unable to proceed',
          //   desc: 'Please try again later.',
          // });
          // google attest fail use dialog tip, not alert msg
          // setActiveRequest(undefined);
          dispatch(
            setActiveAttestation({
              loading: 3,
              msgObj: {
                type: 'warn',
                title: 'Unable to proceed',
                desc: 'Please try again later.',
                btnTxt: 'Try Again',
              },
            })
          );
          dispatch(setAttestLoading(3));
          eventInfo.rawData = Object.assign(eventInfo.rawData, {
            // attestationId: uniqueId,
            status: 'FAILED',
            reason: `attestFor${dataSourceId} network error`,
          });
          eventReport(eventInfo);
        }
      },
      [
        credentialsFromStore,
        initCredList,
        connectedWallet?.address,
        authorize,
        fromEvents,
        BASEventDetail?.ext?.schemaType,
        storeBASEventInfoFn,
        dispatch,
        addMsg,
        pathname,
        activeAttestation,
        sourceMap2,
      ]
    );
    const handleSubmitSetDetail = useCallback(
      async (form = {}) => {
        const { activeRequestAttestation: lastActiveRequestAttestationStr } =
          await chrome.storage.local.get(['activeRequestAttestation']);
        if (lastActiveRequestAttestationStr) {
          alert(
            'An attestation process is currently being generated. Please try again later.'
          );
          return;
        } else {
          await chrome.storage.local.remove([
            'padoZKAttestationJSSDKBeginAttest',
          ]);
        }
        // setAssetForm((f) => ({ ...f, ...form }));
        // 1.store attestation in process params in react store
        const activeAttestationParams = {
          ...assetForm,
          ...form,
          attestationType: type, // different
          fetchType: 'Web',
          // loading: 1,
        };
        dispatch(setActiveAttestation(activeAttestationParams));

        if (
          ['google', 'discord'].includes(activeAttestationParams.dataSourceId)
        ) {
          dispatch(setAttestLoading(1));
          dispatch(setActiveAttestation({ loading: 1 }));
          await fetchAttestForGoogle(activeAttestationParams);
        } else {
          dispatch(setAttestLoading(1));
          dispatch(setActiveAttestation({ loading: 1 }));
          // 2.check web proof template
          // templateName
          const contentObj =
            ALLVERIFICATIONCONTENTTYPEEMAP[
              activeAttestationParams.verificationContent
            ];
          const activeWebProofTemplate = webProofTypes.find(
            (i) =>
              i.dataSource === activeAttestationParams.dataSourceId &&
              (i.name === contentObj.label ||
                i.name === contentObj.templateName)
          );
          const currRequestTemplate = {
            ...activeWebProofTemplate,
            schemaType:
              fromEvents === BASEVENTNAME
                ? BASEventDetail?.ext?.schemaType ||
                  'BAS_EVENT_PROOF_OF_HUMANITY'
                : activeWebProofTemplate.schemaType,
            event: fromEvents,
            ...activeAttestationParams,
          };
          // different
          // const responses = currRequestTemplate.datasourceTemplate.responses;
          // const lastResponse = responses[responses.length - 1];
          // const lastResponseConditions = lastResponse.conditions;
          // const lastResponseConditionsSubconditions =
          //   lastResponseConditions.subconditions;
          // if (activeAttestationParams.verificationContent === 'Assets Proof') {
          //   // change verification value
          //   lastResponseConditions.value =
          //     activeAttestationParams.verificationValue;
          //   // for okx
          //   if (lastResponseConditionsSubconditions) {
          //     const lastSubCondition =
          //       lastResponseConditionsSubconditions[
          //         lastResponseConditionsSubconditions.length - 1
          //       ];
          //     lastSubCondition.value = activeAttestationParams.verificationValue;
          //   }
          // } else if (
          //   activeAttestationParams.verificationContent === 'Token Holding'
          // ) {
          //   if (lastResponseConditionsSubconditions) {
          //     const firstSubCondition = lastResponseConditionsSubconditions[0];
          //     firstSubCondition.value = activeAttestationParams.verificationValue;
          //   }
          // }
          const requestid = uuidv4();
          var eventInfo = {
            eventType: 'ATTESTATION_NEXT',
            rawData: {
              source: activeAttestationParams.dataSourceId,
              event: fromEvents,
              order: '1',
              requestid,
            },
          };
          eventReport(eventInfo);
          chrome.storage.local.remove([
            'beginAttest',
            'getAttestationResultRes',
          ]);

          // 3.send msg to content
          const currentWindowTabs = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });
          await chrome.runtime.sendMessage({
            type: 'pageDecode',
            name: 'init',
            params: {
              ...currRequestTemplate,
              requestid,
            },
            extensionTabId: currentWindowTabs[0].id,
            operation: 'attest',
          });
        }
      },
      [
        assetForm,
        fromEvents,
        BASEventDetail,
        dispatch,
        fetchAttestForGoogle,
        type,
      ]
    );
    useEffect(() => {
      if (presets) {
        setAssetForm(presets);
        setStep(2);
      }
    }, [presets]);
    useEffect(() => {
      if (['google', 'discord'].includes(assetForm.dataSourceId)) {
        if (attestLoading === 3) {
          setStep(3);
          setActiveSendToChainRequest({
            ...activeAttestation.msgObj,
            type: 'fail',
          });
        } else if (attestLoading === 0) {
          setActiveSendToChainRequest({});
        }
      }
    }, [attestLoading, activeAttestation.msgObj, assetForm.dataSourceId]);

    return (
      <>
        {step === 3 ? (
          <SetProcessDialog
            preset={DATASOURCEMAP[assetForm.dataSourceId].icon}
            onClose={onClose}
            onSubmit={handleSubmitSetDetail}
            activeRequest={activeSendToChainRequest}
          />
        ) : (
          <PMask>
            {/* onClose={onClose} closeable={!fromEvents} */}
            <div className="pDialog2 assetAttestationDialog onChainAttestationDialog">
              <PClose onClick={onClose} />
              <main>
                <header>
                  <h1>Create Attestation</h1>
                  <h2>You're creating {type.toLowerCase()}.</h2>
                </header>
                {presets ? (
                  <div className="dataSourceWrapper">
                    <label>Data Source</label>
                    {dataSourceEl}
                  </div>
                ) : (
                  <>
                    {step === 1 && (
                      <section className="detailWrapper">
                        <div className="step step1">
                          <OrderItem order="1" text="Connect data source" />
                        </div>
                      </section>
                    )}
                    {step === 2 && (
                      <section className="detailWrapper">
                        <div className="step step1 done">
                          <img className="iconDone" src={iconDone} alt="" />
                          <div className="txt">
                            <div className="title">Connect Data Source</div>
                            {dataSourceEl}
                          </div>
                        </div>
                        <div className="step step2">
                          <OrderItem
                            order="2"
                            text="Confirm attestation details"
                          />
                        </div>
                      </section>
                    )}
                  </>
                )}
                {step === 1 && (
                  <SetDataSource onSubmit={handleSubmitSetPwdDialog} />
                )}
                {step === 2 && (
                  <SetDetail
                    onSubmit={handleSubmitSetDetail}
                    presets={assetForm}
                  />
                )}
              </main>
            </div>
          </PMask>
        )}
      </>
    );
  }
);

export default Nav;
