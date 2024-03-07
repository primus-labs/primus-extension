import React, { useRef, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { UserState } from '@/types/store';

const useMsgs = function useMsgs() {
  const dispatch = useDispatch();
  const msgs = useSelector((state: UserState) => state.msgs);
  const setMsgsFn = useCallback(
    (infoObj) => {
      const id = Date.now();
      const newMsgs = {
        ...msgs,
        id: {
          id,
          ...infoObj,
          // type: 'error',
          // title: 'Unable to proceed',
          // desc: 'Please try again later.',
        },
      };
      dispatch(setMsgs(newMsgs));
    },
    [msgs, dispatch]
  );
  return [msgs, setMsgsFn];
};
export default useMsgs;
