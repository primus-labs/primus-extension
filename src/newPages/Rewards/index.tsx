import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveOnChain } from '@/store/actions'
import type { UserState } from '@/types/store';
import type { Dispatch } from 'react';
import CurrentEvents from '@/newComponents/Events/CurrentEvents';
import RewardsWrapper from '@/newComponents/Rewards/RewardsWrapper';

import './index.scss';

const Home = memo(() => {
  const dispatch:Dispatch<any> = useDispatch()
  const [visibleAssetDialog, setVisibleAssetDialog] = useState<string>('');
  const [visibleOnChainDialog, setVisibleOnChainDialog] = useState<boolean>(false);
  const credentialsFromStore = useSelector(
    (state: UserState) => state.credentials
  );
  const attestLoading = useSelector((state: UserState) => state.attestLoading);
  const activeOnChain = useSelector((state: UserState) => state.activeOnChain);
  const hasConnected = useMemo(() => {
    return Object.keys(credentialsFromStore).length > 0;
  }, [credentialsFromStore]);
  
  return (
    <div className="pageRewards">
      <div className="pageContent">
        <RewardsWrapper/>
      </div>
    </div>
  );
});
export default Home;
