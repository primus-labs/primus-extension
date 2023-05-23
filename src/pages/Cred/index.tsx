import React, { useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import PTabs from '@/components/PTabs';
import './index.sass';
import DataSourceSearch from '@/components/DataSourceOverview/DataSourceSearch';
import ProofTypeList from '@/components/Cred/ProofTypeList';
import AttestationDialog from '@/components/Cred/AttestationDialog';
import CredList from '@/components/Cred/CredList';
import type { UserState } from '@/store/reducers';
import { postMsg } from '@/utils/utils';
import { useDispatch } from 'react-redux';
import type { Dispatch } from 'react';
import type { DataFieldItem } from '@/components/DataSourceOverview/DataSourcesDialog';


const Cred = () => {
  const dispatch: Dispatch<any> = useDispatch();
  const [step, setStep] = useState(0);
  const [activeAttestationType, setActiveAttestationType] = useState<string>('');
  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const navigate = useNavigate();

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
  
  const onSubmitAttestationDialog = async (item: DataFieldItem) => {
    setStep(1.5);
    // if (item.type === 'Assets') {
    //   setActiveSource(item);
    //   setStep(2);
    // } else if (item.type === 'Social') {
    //   authorize(item.name.toUpperCase(), () => {
    //     setStep(0);
    //     dispatch(setSocialSourcesAsync());
    //   });
    // }
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
      </main>
    </div>
  );
};

export default Cred;
