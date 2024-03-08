import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setMsgs } from '@/store/actions';
import type { UserState } from '@/types/store';

const useMsgs = function useMsgs() {
  const dispatch = useDispatch();
  const [msgId, setMsgId] = useState<string>();
  const msgs = useSelector((state: UserState) => state.msgs);
  const addMsg = useCallback(
    (infoObj) => {
      const id = Date.now() + '';
      setMsgId(id);
      const newMsgs = {
        ...msgs,
        [id]: {
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
  const deleteMsg = useCallback(
    async (id) => {
      const lastMsgs = { ...msgs };
      if (lastMsgs[id]) {
        delete lastMsgs[id];
        dispatch(setMsgs(lastMsgs));
      }
    },
    [msgs, dispatch]
  );
  useEffect(() => {
    if (msgId) {
      let timer = setTimeout(() => {
        deleteMsg(msgId);
      }, 5000);
      return () => {
        clearTimeout(timer);
      }
    }
  }, [msgId]);
 
  return { msgs, addMsg, deleteMsg };
};
export default useMsgs;
