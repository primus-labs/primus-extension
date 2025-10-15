import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { setActiveAttestation } from '@/store/actions';
import { setAttestLoading } from '@/store/actions';
import useAttestBrevis from '@/hooks/useAttestBrevis';
import useEventDetail from '@/hooks/useEventDetail';
import { BASEVENTNAME } from '@/config/events';
import { DATASOURCEMAP } from '@/config/dataSource';
import { formatAddress } from '@/utils/utils';
import { switchAccount } from '@/services/wallets/metamask';

import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';
import type { DataSourceMapType } from '@/types/dataSource';

import PMask from '@/newComponents/PMask';
import PClose from '@/newComponents/PClose';
import SetDetail from './SetDetail';
import SetDataSource from './SetDataSource';
import OrderItem from '@/newComponents/OrderItem';
import SetProcessDialog from '@/newComponents/ZkAttestation/SubmitOnChain/SetProcessDialog';
import iconDone from '@/assets/newImg/layout/iconDone.svg';
import iconWalletMetamask from '@/assets/img/iconWalletMetamask.svg';
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
    const { attestBrevisFn, attestBrevisRequestProcess } = useAttestBrevis();
    const dispatch: Dispatch<any> = useDispatch();
    const [searchParams] = useSearchParams();
    const fromEvents = searchParams.get('id');
    const [step, setStep] = useState<number>(1);
    const [assetForm, setAssetForm] = useState<any>({});
    const [activeSendToChainRequest, setActiveSendToChainRequest] =
      useState<any>({});

    const [BASEventDetail] = useEventDetail(BASEVENTNAME);
    const attestLoading = useSelector(
      (state: UserState) => state.attestLoading
    );
    const webProofTypes = useSelector(
      (state: UserState) => state.webProofTypes
    );
    const activeAttestation = useSelector(
      (state: UserState) => state.activeAttestation
    );
    const connectedWallet = useSelector(
      (state: UserState) => state.connectedWallet
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
      async (form: any = {}) => {
        // setAssetForm((f) => ({ ...f, ...form }));
        // 1.store attestation in process params in react store
        const activeAttestationParams = {
          ...assetForm,
          ...form,
          attestationType: type,
          fetchType: 'API',
          // loading: 1,
        };
        // form.sourceUseridHash = activeSource?.address?.toLowerCase() as string;
        dispatch(
          setActiveAttestation({ ...activeAttestationParams, loading: 1 })
        );
        dispatch(setAttestLoading(1));
        // 2.check select account if connected
        // 3.request
        if (activeAttestationParams.dataSourceId === 'web3 wallet') {
          setStep(3);
          const curConnectedAddr = connectedWallet?.address;
          // if did‘t connected with the selected account
          if (
            curConnectedAddr?.toLowerCase() !== form?.account?.toLowerCase()
          ) {
            const formatAddr = formatAddress(
              form?.account || '',
              7,
              5,
              '......'
            );
            setActiveSendToChainRequest({
              type: 'loading',
              title: 'Attesting...',
              desc: `Check your wallet to confirm the connection with ${formatAddr}`,
            });
            const newAddr = await switchAccount(connectedWallet?.provider);
            if (form?.account?.toLowerCase() === newAddr?.toLowerCase()) {
              setActiveSendToChainRequest({
                type: 'loading',
                title: 'Attesting...',
                desc: `This may take a few seconds.`,
              });
              attestBrevisFn(activeAttestationParams);
            } else {
              setActiveSendToChainRequest({
                type: 'warn',
                title: 'Incorrect wallet address',
                desc: `Check your wallet to confirm the connection with ${formatAddr}`,
              });
              dispatch(setAttestLoading(3));
            }
            return;
          } else {
            setActiveSendToChainRequest({
              type: 'loading',
              title: 'Attesting...',
              desc: `This may take a few seconds.`,
            });
            attestBrevisFn(activeAttestationParams);
          }
        }
      },
      [assetForm, fromEvents, BASEventDetail, dispatch, type, connectedWallet]
    );
    useEffect(() => {
      attestBrevisRequestProcess &&
        setActiveSendToChainRequest(attestBrevisRequestProcess);
    }, [attestBrevisRequestProcess]);
    useEffect(() => {
      if (presets) {
        setAssetForm(presets);
        setStep(2);
      }
    }, [presets]);
    return (
      <>
        {step === 3 ? (
          <SetProcessDialog
            preset={
              assetForm.dataSourceId === 'web3 wallet'
                ? iconWalletMetamask
                : DATASOURCEMAP['coinbase'].icon
            }
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
                  <h1>Create Attestation</h1>
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
                {/* {step === 1 && (
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
                )} */}
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
