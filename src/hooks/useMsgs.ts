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
  console.log('222useMsgas-msgs', msgs);
  const deleteMsg = useCallback(
    async (id, oldMsgs = {}) => {
      const lastMsgs =
        msgs && Object.keys(msgs).length > 0 ? { ...msgs } : oldMsgs;
    
      if (lastMsgs[id]) {
        delete lastMsgs[id];
        dispatch(setMsgs(lastMsgs));
      }
    },
    [msgs, dispatch, pathname]
  );
  const addMsg = useCallback(
    (infoObj) => {
      const id = Date.now() + '';
      const newObj = {
        id,
        ...infoObj,
      };
      setMsgObj(newObj);

      const newMsgs = {
        // ...msgs,
        [id]: newObj,
      };
      dispatch(setMsgs(newMsgs));

      console.log('222useMsgas-addMsg', msgs, newObj);
      // const delay = newObj?.link === pathname ? 5000 : 8000;
      // let timer = setTimeout(() => {
      //   deleteMsg(newObj?.id, newMsgs);
      // }, delay);
    },
    [msgs, dispatch, deleteMsg]
  );

  useEffect(() => {
    console.log('222useMsgs-useEffect', msgObj); //delete
    if (msgObj?.id) {
      const delay = msgObj?.link === pathname ? 5000 : 8000;
      let timer = setTimeout(() => {
        deleteMsg(msgObj?.id);
      }, delay);
      console.log('222useMsgs-useEffect2', msgObj?.id, timer); //delete
      // return () => {
      //   clearTimeout(timer);
      // }
      return () => {
      }
    }
  }, [msgObj]);

  return { msgs, addMsg, deleteMsg };
};
export default useMsgs;
