import React, { useState, useEffect, memo } from 'react';
import { useSelector } from 'react-redux';
import useCheckIsConnectedWallet from '@/hooks/useCheckIsConnectedWallet';
import type { UserState } from '@/types/store';
import CurrentEvents from '@/newComponents/Events/CurrentEvents';
import PastEvents from '@/newComponents/Events/PastEvents';

import './index.scss';

const Events = memo(() => {
  const [checkIsConnectFlag, setCheckIsConnectFlag] = useState<boolean>(true);
  useCheckIsConnectedWallet(checkIsConnectFlag);
  const connectWalletDialogVisible = useSelector(
    (state: UserState) => state.connectWalletDialogVisible
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
        <PastEvents />
      </div>
    </div>
  );
});
export default Events;
