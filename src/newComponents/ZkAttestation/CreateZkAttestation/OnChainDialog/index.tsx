import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { setActiveAttestation } from '@/store/actions';
import useEventDetail from '@/hooks/useEventDetail';
import { BASEVENTNAME, LINEAEVENTNAME } from '@/config/events';
import { DATASOURCEMAP } from '@/config/dataSource';
import { ALLVERIFICATIONCONTENTTYPEEMAP } from '@/config/attestation';
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
  type: string;
  onClose: () => void;
  onSubmit: () => void;
  presets?: any;
}

const Nav: React.FC<PButtonProps> = memo(
  ({ type, onClose, onSubmit, presets }) => {
    const dispatch: Dispatch<any> = useDispatch();
    const [searchParams] = useSearchParams();
    const fromEvents = searchParams.get('id');
    const [step, setStep] = useState<number>(1);
    const [assetForm, setAssetForm] = useState<any>({});

    const [BASEventDetail] = useEventDetail(BASEVENTNAME);
    const attestLoading = useSelector(
      (state: UserState) => state.attestLoading
    );
    const webProofTypes = useSelector(
      (state: UserState) => state.webProofTypes
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
    const handleSubmitSetDetail = useCallback(
      async (form) => {
        // setAssetForm((f) => ({ ...f, ...form }));
        // 1.store attestation in process params in react store
        const activeAttestationParams = {
          ...assetForm,
          ...form,
          attestationType: type, // TODO-newui
          fetchType: 'Web',
          // loading: 1,
        };
        dispatch(setActiveAttestation(activeAttestationParams));

        // 2.check web proof template
        const contentObj =
          ALLVERIFICATIONCONTENTTYPEEMAP[
            activeAttestationParams.verificationContent
          ];
        const activeWebProofTemplate = webProofTypes.find(
          (i) =>
            i.dataSource === activeAttestationParams.dataSourceId &&
            (i.name === contentObj.label || i.name === contentObj.templateName)
        );
        const currRequestTemplate = {
          ...activeWebProofTemplate,
          schemaType:
            fromEvents === BASEVENTNAME
              ? BASEventDetail?.ext?.schemaType || 'BAS_EVENT_PROOF_OF_HUMANITY'
              : activeWebProofTemplate.schemaType,
          event: fromEvents,
          ...activeAttestationParams,
        };
        const responses = currRequestTemplate.datasourceTemplate.responses;

        const lastResponse = responses[responses.length - 1];
        const lastResponseConditions = lastResponse.conditions;
        const lastResponseConditionsSubconditions =
          lastResponseConditions.subconditions;
        if (activeAttestationParams.verificationContent === 'Assets Proof') {
          // change verification value
          lastResponseConditions.value =
            activeAttestationParams.verificationValue;
          // for okx
          if (lastResponseConditionsSubconditions) {
            const lastSubCondition =
              lastResponseConditionsSubconditions[
                lastResponseConditionsSubconditions.length - 1
              ];
            lastSubCondition.value = activeAttestationParams.verificationValue;
          }
        } else if (
          activeAttestationParams.verificationContent === 'Token Holding'
        ) {
          if (lastResponseConditionsSubconditions) {
            const firstSubCondition = lastResponseConditionsSubconditions[0];
            firstSubCondition.value = activeAttestationParams.verificationValue;
          }
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
      [assetForm, fromEvents, BASEventDetail, dispatch, type]
    );

    return (
      <PMask>
        {/* onClose={onClose} closeable={!fromEvents} */}
        <div className="pDialog2 assetAttestationDialog onChainAttestationDialog">
          <PClose onClick={onClose} />
          <main>
            <header>
              <h1>Create zkAttestation</h1>
              <h2>You're creating {type.toLowerCase()} proof.</h2>
            </header>
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
            {step === 1 && (
              <SetDataSource onSubmit={handleSubmitSetPwdDialog} />
            )}
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
  }
);

export default Nav;
