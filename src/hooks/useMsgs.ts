import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { setMsgsAsync } from '@/store/actions';
import type { UserState } from '@/types/store';
import type { Dispatch } from 'react';

const useMsgs = function useMsgs() {
  const { pathname } = useLocation();
  const dispatch: Dispatch<any> = useDispatch();
  const [msgObj, setMsgObj] = useState<any>();
  const msgs = useSelector((state: UserState) => state.msgs);
  const deleteMsg = useCallback(
    async (id, oldMsgs = {}) => {
      // const lastMsgs =
      //   msgs && Object.keys(msgs).length > 0 ? { ...msgs } : oldMsgs;

      const { msgs: lastMsgsStr } = await chrome.storage.local.get(['msgs']);
      const lastMsgs = JSON.parse(lastMsgsStr);
      if (lastMsgs[id]) {
        delete lastMsgs[id];
        dispatch(setMsgsAsync(lastMsgs));
      }
    },
    [msgs, dispatch, pathname]
  );
  const deleteErrorMsgs = useCallback(async () => {
    // const { msgs: lastMsgsStr } = await chrome.storage.local.get(['msgs']);
    // if (lastMsgsStr) {
    //   const lastMsgs = JSON.parse(lastMsgsStr);
    //   const toBeDeleteIds = Object.keys(lastMsgs).filter(
    //     (i) => lastMsgs[i].type === 'error' || lastMsgs[i].type === 'warn'
    //   );
    //   toBeDeleteIds.forEach((i) => {
    //     delete lastMsgs[i];
    //   });
    //   dispatch(setMsgsAsync(lastMsgs));
    // }
    await chrome.storage.local.remove(['msgs']);
    dispatch(setMsgsAsync({}));
  }, [msgs, dispatch]);

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
      dispatch(setMsgsAsync(newMsgs));

      console.log('222useMsgs-addMsg', msgs, newObj);
      // const delay = newObj?.link && newObj?.link !== pathname ? 8000 : 5000;
      // let timer = setTimeout(() => {
      //   console.log('222useMsgs-timeout', newObj, msgs);
      //   deleteMsg(newObj?.id);
      // }, delay);
      return id;
    },
    [msgs, dispatch, pathname]
  );

  useEffect(() => {
    // console.log('222useMsgs-useEffect1', msgObj);
    if (msgObj?.id) {
      let delay = msgObj?.link && msgObj?.link !== pathname ? 10000 : 8000;
      // if (msgObj?.type === 'suc') {
      //   delay = 8000;
      // }
      if (msgObj.type !== 'error') {
        let timer = setTimeout(() => {
          // console.log('222useMsgs-useEffect-timeout', delay); //delete
          deleteMsg(msgObj?.id);
        }, delay);
      }

      // console.log('222useMsgs-useEffect2', msgObj?.id, timer);
      //delete
      // return () => {
      //   clearTimeout(timer);
      // }
      return () => {};
    }
  }, [msgObj]);

  return { msgs, addMsg, deleteMsg, deleteErrorMsgs };
};
export default useMsgs;
