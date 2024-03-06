import React, { useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { postMsg } from '@/utils/utils';
import useInterval from './useInterval';
import type { UserState } from '@/types/store';
import type { Dispatch } from 'react';

const useKeepConnect = function useKeepConnect() {
  const dispatch: Dispatch<any> = useDispatch();

  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  // const sendMsgFn = useCallback(() => {
  //   const msg = {
  //     fullScreenType: 'keepConnect',
  //   };
  //   postMsg(padoServicePort, msg);
  // }, [padoServicePort]);
  // useInterval(sendMsgFn, 500, true, false);

  const addDisconnectListener = useCallback(() => {
    const onDisconnectFullScreen = (port: chrome.runtime.Port) => {
      console.log('onDisconnectFullScreen port in page', port);
      dispatch({
        type: 'setPort',
      });
    };
    padoServicePort.onDisconnect.addListener(onDisconnectFullScreen);
  }, [dispatch, padoServicePort.onDisconnect]);
  useEffect(() => {
    addDisconnectListener();
  }, [addDisconnectListener]);
};
export default useKeepConnect;
