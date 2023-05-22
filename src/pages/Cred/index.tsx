import React, { useState, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import PTabs from '@/components/PTabs';
import './index.sass';
import DataSourceSearch from '@/components/DataSourceOverview/DataSourceSearch';

import type { UserState } from '@/store/reducers';
import { postMsg } from '@/utils/utils';
import { useDispatch } from 'react-redux';
import type { Dispatch } from 'react';

const Cred = () => {
  const dispatch: Dispatch<any> = useDispatch();
  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const handleChangeTab = (val: string) => {
    if (val === 'Data') {
      dispatch({
        type: 'setActiveSourceType',
        payload: 'All',
      });
    }
  };
  const handleChangeProofType = (title: string) => {};

  return (
    <div className="pageDataSourceOverview">
      <main className="appContent">
        <PTabs onChange={handleChangeTab} />
        <DataSourceSearch />
        {/* <ProofTypeList onChange={handleChangeProofType} /> */}
        cred
      </main>
    </div>
  );
};

export default Cred;
