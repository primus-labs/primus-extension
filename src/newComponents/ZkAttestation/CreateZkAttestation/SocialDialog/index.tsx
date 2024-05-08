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

import { eventReport } from '@/services/api/usertracker';
import { getAccount, postMsg } from '@/utils/utils';
import {
  BASEVENTNAME,
  ETHSIGNEVENTNAME,
  LINEAEVENTNAME,
} from '@/config/events';
import { DATASOURCEMAP } from '@/config/dataSource';
import { ALLVERIFICATIONCONTENTTYPEEMAP } from '@/config/attestation';
import { CredVersion, GOOGLEWEBPROOFID } from '@/config/constants';
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

const Social: React.FC<PButtonProps> = memo(
  ({ type, onClose, onSubmit, presets }) => {
    const { sourceMap2 } = useAllSources();
    const { pathname } = useLocation();
    const { msgs, addMsg, deleteMsg } = useMsgs();
    const authorize = useAuthorization2();

    const dispatch: Dispatch<any> = useDispatch();
    const [searchParams] = useSearchParams();
    const fromEvents = searchParams.get('id');

    const [step, setStep] = useState<number>(1);
    const [assetForm, setAssetForm] = useState<any>({
      verificationContent: 'X Followers',
    });

    const [currentEventDetail] = useEventDetail(ETHSIGNEVENTNAME);
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
   
    const handleSubmitSetDetail = useCallback(
      async (form = {}) => {
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
              i.name === contentObj.templateName ||
              i.name === contentObj.value)
        );
        // sessionStorage.setItem('xFollowerCount', form?.verificationValue);
        
        // TODO-newui get account from attestation???
        let currRequestTemplate = {
          ...activeWebProofTemplate,
          schemaType:
            fromEvents === ETHSIGNEVENTNAME
              ? currentEventDetail?.ext?.schemaType || 'X_FOLLOWER_COUNT#1'
              : activeWebProofTemplate.schemaType,
          event: fromEvents,
          ...activeAttestationParams,
        };
        // different
        // handle X Followers
        if (activeAttestationParams.verificationContent === 'X Followers') {
          const xFollowerCount = sessionStorage.getItem('xFollowerCount');
          currRequestTemplate.datasourceTemplate.responses[1].conditions.subconditions[1].value =
            xFollowerCount;
          currRequestTemplate.schemaType =
            currentEventDetail?.ext?.schemaType || 'X_FOLLOWER_COUNT#1';
        }
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
          },
          extensionTabId: currentWindowTabs[0].id,
          operation: 'attest',
        });
      },
      [assetForm, fromEvents, currentEventDetail, dispatch, type]
    );
    useEffect(() => {
      if (presets) {
        setAssetForm(presets);
        setStep(2);
      }
    }, [presets]);
    useEffect(() => {
      if (assetForm.dataSourceId === 'google') {
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
            preset={DATASOURCEMAP['google'].icon}
            onClose={onClose}
            onSubmit={handleSubmitSetDetail}
            activeRequest={activeSendToChainRequest}
          />
        ) : (
          <PMask>
            <div className="pDialog2 assetAttestationDialog onChainAttestationDialog">
              <PClose onClick={onClose} />
              <main>
                <header>
                  <h1>Create zkAttestation</h1>
                  <h2>You're creating {type.toLowerCase()} proof.</h2>
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

export default Social;
