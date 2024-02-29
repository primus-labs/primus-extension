import React, { useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { postMsg } from '@/utils/utils';
import useInterval from './useInterval';
import type { UserState } from '@/types/store';

const useKeepConnect = function useKeepConnect() {
  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const sendMsgFn = useCallback(() => {
    const msg = {
      fullScreenType: 'keepConnect',
    };
    postMsg(padoServicePort, msg);
  }, [padoServicePort]);
  useInterval(sendMsgFn, 500, true, false);
};
export default useKeepConnect;
