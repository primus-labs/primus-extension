import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { setActiveAttestation, setAttestLoading } from '@/store/actions';
import useEventDetail from '@/hooks/useEventDetail';
import { postMsg } from '@/utils/utils';
import { BASEVENTNAME, LINEAEVENTNAME } from '@/config/events';
import { DATASOURCEMAP } from '@/config/dataSource';
import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';
import type { DataSourceMapType } from '@/types/dataSource';

import PMask from '@/newComponents/PMask';
import PClose from '@/newComponents/PClose';
import SetDetail from './SetDetail';
import SetDataSource from './SetDataSource';
import OrderItem from '@/newComponents/OrderItem';
import iconDone from '@/assets/newImg/layout/iconDone.svg';
import SetProcessDialog from '@/newComponents/ZkAttestation/SubmitOnChain/SetProcessDialog';

import './index.scss';

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
    const [activeSendToChainRequest, setActiveSendToChainRequest] =
      useState<any>({});
    const [BASEventDetail] = useEventDetail(BASEVENTNAME);
    const webProofTypes = useSelector(
      (state: UserState) => state.webProofTypes
    );
    const padoServicePort = useSelector(
      (state: UserState) => state.padoServicePort
    );
    const attestLoading = useSelector(
      (state: UserState) => state.attestLoading
    );
    const activeAttestation = useSelector(
      (state: UserState) => state.activeAttestation
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
    const handleSubmitSetDetail = useCallback(
      async (form = {}) => {
        // setAssetForm((f) => ({ ...f, ...form }));
        // 1.store attestation in process params in react store
        let activeAttestationParams = {
          ...assetForm,
          ...form,
          attestationType: type,
          fetchType: 'Web',
          // loading: 1,
        };
        // if (activeAttestation.loading === 3) {
        //   debugger
        //   activeAttestationParams = { ...activeAttestation };
        // }
        dispatch(setActiveAttestation(activeAttestationParams));
        dispatch(setAttestLoading(1));
        dispatch(setActiveAttestation({ loading: 1 }));
        if (activeAttestationParams.dataSourceId === 'coinbase') {
          setActiveSendToChainRequest({
            type: 'loading',
            title: 'Attesting...',
            desc: 'This may take a few seconds.',
          });
          setStep(3);
          const getCoinbaseAttestationParams = {
            source: activeAttestationParams.dataSourceId,
            type: 'TOKEN_HOLDINGS',
            exUserId: '',
            label: '',
            token: activeAttestationParams.verificationValue,
          };
          const msg = {
            fullScreenType: 'algorithm',
            reqMethodName: 'getAttestation',
            params: {
              ...getCoinbaseAttestationParams,
            },
          };
          postMsg(padoServicePort, msg);
          console.log(`page_send:getAttestation:`, form);
        } else {
          // 2.check web proof template
          const activeWebProofTemplate = webProofTypes.find(
            (i) =>
              i.dataSource === activeAttestationParams.dataSourceId &&
              i.name === activeAttestationParams.verificationContent
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
              lastSubCondition.value =
                activeAttestationParams.verificationValue;
            }
          } else if (
            activeAttestationParams.verificationContent === 'Token Holding'
          ) {
            if (lastResponseConditionsSubconditions) {
              const firstSubCondition = lastResponseConditionsSubconditions[0];
              firstSubCondition.value =
                activeAttestationParams.verificationValue;
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
        }
      },
      [assetForm, fromEvents, BASEventDetail, dispatch, type, activeAttestation]
    );
    useEffect(() => {
      if (presets) {
        setAssetForm(presets);
        setStep(2);
      }
    }, [presets]);
    useEffect(() => {
      if (assetForm.dataSourceId === 'coinbase') {
        if (attestLoading === 2) {
          setActiveSendToChainRequest({
            type: 'suc',
            title: 'Congratulations',
            desc: 'Attestation created!',
          });
        } else if (attestLoading === 3) {
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
            preset={DATASOURCEMAP['coinbase'].icon}
            onClose={onClose}
            onSubmit={handleSubmitSetDetail}
            activeRequest={activeSendToChainRequest}
          />
        ) : (
          <PMask>
            {/* onClose={onClose} closeable={!fromEvents} */}
            <div className="pDialog2 assetAttestationDialog">
              <PClose onClick={onClose} />
              <main>
                <header>
                  <h1>Create zkAttestation</h1>
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
