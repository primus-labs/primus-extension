import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { setMsgs } from '@/store/actions';
import type { UserState } from '@/types/store';

const useMsgs = function useMsgs() {
  const { pathname } = useLocation();
  const dispatch = useDispatch();
  const [msgObj, setMsgObj] = useState<any>();
  const msgs = useSelector((state: UserState) => state.msgs);
  const addMsg = useCallback(
    (infoObj) => {
      const id = Date.now() + '';
      const newObj = {
        id,
        ...infoObj,
      };
      setMsgObj(newObj);
      const newMsgs = {
        ...msgs,
        [id]: newObj,
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
    if (msgObj?.id) {
      const delay = msgObj?.link === pathname ? 5000 : 8000;
      let timer = setTimeout(() => {
        deleteMsg(msgObj?.id);
      }, delay); // TODO-newui
      // return () => {
      //   clearTimeout(timer);
      // }
    }
  }, [msgObj]);

  return { msgs, addMsg, deleteMsg };
};
export default useMsgs;
