import React, { useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import PTabs from '@/components/PTabs';
import './index.sass';
import DataSourceSearch from '@/components/DataSourceOverview/DataSourceSearch';
import ProofTypeList from '@/components/Cred/ProofTypeList';
import AttestationDialog from '@/components/Cred/AttestationDialog';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';

import CredList from '@/components/Cred/CredList';
import type { UserState } from '@/store/reducers';
import { postMsg } from '@/utils/utils';
import { useDispatch } from 'react-redux';
import type { Dispatch } from 'react';
import type { DataFieldItem } from '@/components/DataSourceOverview/DataSourcesDialog';
import type {ActiveRequestType} from '@/pages/DataSourceOverview'

const Cred = () => {
  const dispatch: Dispatch<any> = useDispatch();
  const [step, setStep] = useState(0);
  const [activeAttestationType, setActiveAttestationType] = useState<string>('');
  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const navigate = useNavigate();
  const [activeRequest, setActiveRequest] = useState<ActiveRequestType>();


  const handleChangeTab = (val: string) => {
    if (val === 'Data') {
      dispatch({
        type: 'setActiveSourceType',
        payload: 'All',
      });
    }
  };
  const handleChangeProofType = (title: string) => {
    setStep(1)
    setActiveAttestationType(title)
  };
  const handleCloseMask = () => {
    setStep(0);
  };
  
  const onSubmitAttestationDialog = async (item: DataFieldItem, token: string) => {
    setStep(2);
    setActiveRequest({
      type: 'loading',
      title: 'Attestation is processing',
      desc: 'It may take a few minutes.',
    });
    setTimeout(() => {
      setActiveRequest({
        type: 'suc',
        title: 'Congratulations',
        desc: 'Your attestation is recorded on-chain!',
      });
    }, 2000)
  };
  const onSubmitActiveRequestDialog = () => {
    if (activeRequest?.type === 'suc') {
      setStep(0);
      // refresh attestation list
      return;
    } 
  };
  return (
    <div className="pageDataSourceOverview">
      <main className="appContent">
        <PTabs onChange={handleChangeTab} />
        <DataSourceSearch />
        <ProofTypeList onChange={handleChangeProofType} />
        <CredList />
        {step === 1 && (
          <AttestationDialog
            type={activeAttestationType}
            onClose={handleCloseMask}
            onSubmit={onSubmitAttestationDialog}
          />
        )}

        {step === 2 && (
          <AddSourceSucDialog
            onClose={handleCloseMask}
            onSubmit={onSubmitActiveRequestDialog}
            type={activeRequest?.type}
            title={activeRequest?.title}
            desc={activeRequest?.desc}
            headerType="attestation"
          />
        )}
      </main>
    </div>
  );
};

export default Cred;
