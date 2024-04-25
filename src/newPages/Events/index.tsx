import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveOnChain } from '@/store/actions';
import useCheckIsConnectedWallet from '@/hooks/useCheckIsConnectedWallet';
import type { UserState } from '@/types/store';
import type { Dispatch } from 'react';
import CurrentEvents from '@/newComponents/Events/CurrentEvents';
import PastEvents from '@/newComponents/Events/PastEvents';

import './index.scss';

const Events = memo(() => {
  const [checkIsConnectFlag, setCheckIsConnectFlag] = useState<boolean>(true);
  useCheckIsConnectedWallet(checkIsConnectFlag);
  const connectWalletDialogVisible = useSelector(
    (state) => state.connectWalletDialogVisible
  );
  useEffect(() => {
    if (connectWalletDialogVisible === 0) {
      setCheckIsConnectFlag(false);
    }
  }, [connectWalletDialogVisible]);
  return (
    <div className="pageEvents">
      <div className="pageContent">
        <CurrentEvents />
        <PastEvents/>
      </div>
    </div>
  );
});
export default Events;
