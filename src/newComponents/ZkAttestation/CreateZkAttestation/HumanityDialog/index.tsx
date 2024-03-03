import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import {
  setActiveAttestation,
  setCredentialsAsync,
  setAttestLoading,
} from '@/store/actions';
import useEventDetail from '@/hooks/useEventDetail';
import useAuthorization2 from '@/hooks/useAuthorization2';

import { eventReport } from '@/services/api/usertracker';

import { BASEVENTNAME, LINEAEVENTNAME } from '@/config/events';
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
import OrderItem from '@/newComponents/OrderItem';
import iconDone from '@/assets/newImg/layout/iconDone.svg';

import '../AssetDialog/index.scss';

interface PButtonProps {
  // sourceName: string;
  onClose: () => void;
  onSubmit: () => void;
}

const Nav: React.FC<PButtonProps> = memo(({ onClose, onSubmit }) => {
  const authorize = useAuthorization2();

  const dispatch: Dispatch<any> = useDispatch();
  const [searchParams] = useSearchParams();
  const fromEvents = searchParams.get('fromEvents');
  const [step, setStep] = useState<number>(1);
  const [assetForm, setAssetForm] = useState<any>({});

  const [BASEventDetail] = useEventDetail(BASEVENTNAME);
  const attestLoading = useSelector((state: UserState) => state.attestLoading);
  const webProofTypes = useSelector((state: UserState) => state.webProofTypes);
  const connectedWallet = useSelector(
    (state: UserState) => state.connectedWallet
  );
  const credentialsFromStore = useSelector(
    (state: UserState) => state.credentials
  );
  const dataSourceMetaInfo: DataSourceMapType = useMemo(() => {
    if (assetForm.dataSourceId) {
      return DATASOURCEMAP[assetForm.dataSourceId];
    } else {
      return {};
    }
  }, [assetForm.dataSourceId]);
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
  const fetchAttestForGoogle = useCallback(
    async (form) => {
      const isFromBASEvent = fromEvents === BASEVENTNAME;
      const schemaType = isFromBASEvent
        ? BASEventDetail?.ext?.schemaType
        : 'GOOGLE_ACCOUNT_OWNER';
      const attestationId = uuidv4();
      const eventInfo: any = {
        eventType: 'API_ATTESTATION_GENERATE',
        rawData: {
          source: form.dataSourceId,
          schemaType,
          sigFormat: 'EAS-Ethereum',
          attestationId: attestationId,
        },
      };
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
      const storeGoogleCred = async (res: any) => {
        //w
        const { signatureInfo, signatureRawInfo } = res;
        const credAddress = await getCredAddrFn();
        const fullAttestation = {
          ...signatureInfo,
          ...signatureRawInfo,
          address: credAddress,
          ...form,
          source: form.dataSourceId,
          version: CredVersion,
          requestid: attestationId,
          sourceUseridHash: signatureRawInfo.rawParam.sourceUseridHash,
          event: fromEvents,
        };
        if (isFromBASEvent) {
          await storeBASEventInfoFn(connectedWallet?.address, {
            [GOOGLEWEBPROOFID]: fullAttestation.requestid,
          });
        }

        const credentialsObj = { ...credentialsFromStore };
        credentialsObj[attestationId] = fullAttestation;
        await chrome.storage.local.set({
          credentials: JSON.stringify(credentialsObj),
        });
        await initCredList();
        alert('Humanity Verification is created!');
        // setActiveRequest({
        //   type: 'suc',
        //   title: 'Congratulations',
        //   desc: 'Your proof is created!',
        // });
        eventInfo.rawData.status = 'SUCCESS';
        eventInfo.rawData.reason = '';
        eventReport(eventInfo);
        //w
      };

      try {
        authorize(form.dataSourceId.toUpperCase(), storeGoogleCred);
      } catch {
        setStep(-1);
        // setActiveRequest(undefined);
        alert('attestForGoogle network error');
        eventInfo.rawData = Object.assign(eventInfo.rawData, {
          // attestationId: uniqueId,
          status: 'FAILED',
          reason: 'attestForGoogle network error',
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
    ]
  );
   const handleSubmitSetDetail = useCallback(
     async (form) => {
       // setAssetForm((f) => ({ ...f, ...form }));
       // 1.store attestation in process params in react store
       const activeAttestationParams = {
         ...assetForm,
         ...form,
         attestationType: 'Humanity Verification', // TODO-newui different
         fetchType: 'Web',
         // loading: 1,
       };
       dispatch(setActiveAttestation(activeAttestationParams));

       if (activeAttestationParams.dataSourceId === 'google') {
         await fetchAttestForGoogle(activeAttestationParams);
         dispatch(setActiveAttestation({loading:2}));
         dispatch(setAttestLoading(2));
       } else {
         // 2.check web proof template
         // templateName
         const contentObj =
           ALLVERIFICATIONCONTENTTYPEEMAP[
             activeAttestationParams.verificationContent
           ];
         const activeWebProofTemplate = webProofTypes.find(
           (i) =>
             i.dataSource === activeAttestationParams.dataSourceId &&
             (i.name === contentObj.label || i.name === contentObj.templateName)
         );
         // TODO-newui get account from attestation???
         const currRequestTemplate = {
           ...activeWebProofTemplate,
           schemaType:
             fromEvents === BASEVENTNAME
               ? BASEventDetail?.ext?.schemaType ||
                 'BAS_EVENT_PROOF_OF_HUMANITY'
               : activeWebProofTemplate.schemaType,
           event: fromEvents,
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

         // 3.send msg to content
         const currentWindowTabs = await chrome.tabs.query({
           active: true,
           currentWindow: true,
         });
         await chrome.runtime.sendMessage({
           type: 'pageDecode',
           name: 'inject',
           params: {
             ...currRequestTemplate,
           },
           extensionTabId: currentWindowTabs[0].id,
         });
       }
     },
     [assetForm, fromEvents, BASEventDetail, dispatch, fetchAttestForGoogle]
   );

  return (
    <PMask>
      {/* onClose={onClose} closeable={!fromEvents} */}
      <div className="pDialog2 assetAttestationDialog onChainAttestationDialog">
        <PClose onClick={onClose} />
        <main>
          <header>
            <h1>Create zkAttestation</h1>
            <h2>You're creating assets certification.</h2>
          </header>
          {step === 1 && (
            <section className="detailWrapper">
              <div className="step step1">
                <OrderItem order="1" text="Choose data source" />
              </div>
            </section>
          )}
          {step === 2 && (
            <section className="detailWrapper">
              <div className="step step1 done">
                <img className="iconDone" src={iconDone} alt="" />
                <div className="txt">
                  <div className="title">Choose Data Source</div>
                  <div className="dataSourceIntro">
                    <img src={dataSourceMetaInfo.icon} alt="" />
                    <span>{dataSourceMetaInfo.name}</span>
                  </div>
                </div>
              </div>
              <div className="step step2">
                <OrderItem order="2" text="Confirm attestation details" />
              </div>
            </section>
          )}
          {step === 1 && <SetDataSource onSubmit={handleSubmitSetPwdDialog} />}
          {step === 2 && (
            <SetDetail
              onSubmit={handleSubmitSetDetail}
              dataSourceId={assetForm.dataSourceId}
            />
          )}
        </main>
      </div>
    </PMask>
  );
});

export default Nav;
