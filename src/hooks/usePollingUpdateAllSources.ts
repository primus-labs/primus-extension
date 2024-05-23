import React, {
  useEffect,
  useMemo,
  useCallback,
  useState,
  useRef,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';

// import useUpdateAllSources from '@/hooks/useUpdateAllSources';
import useUpdateAllSources from '@/hooks/useUpdateAllSources';
import useInterval from '@/hooks/useInterval';
import useAllSources from '@/hooks/useAllSources';
import { setSourceUpdateInfoAction } from '@/store/actions';
import { ONEMINUTE, DEFAULTDATASOURCEPOLLINGTIMENUM } from '@/config/constants';

import type { UserState } from '@/types/store';

const usePollingUpdateAllSources = () => {
  const [updating, updateF] = useUpdateAllSources();
  const updatedMintues = useRef(-1);
  const [countDownSwitch, setCountDownSwitch] = useState<boolean>(true);
  const dispatch = useDispatch();
  const { sourceMap2 } = useAllSources();
  const [hadSetPwd, setHadSetPwd] = useState<number>(0);
  const userPassword = useSelector((state: UserState) => state.userPassword);
  const sourceUpdateFrequency = useSelector(
    (state: UserState) => state.sourceUpdateFrequency
  );
  const sourceUpdateInfo = useSelector(
    (state: UserState) => state.sourceUpdateInfo
  );

  const hasDataSources = useMemo(() => {
    const allDataSources = [...Object.values(sourceMap2)];
    return allDataSources.length > 0;
  }, [sourceMap2]);
  const switchFlag = useMemo(() => {
    let f = false;
    if (hadSetPwd > 0) {
      f =
        ((hadSetPwd === 1 && !!userPassword) || hadSetPwd === 2) &&
        hasDataSources;
    }
    return f;
  }, [userPassword, hasDataSources, hadSetPwd]);

  const delay = useMemo(() => {
    if (sourceUpdateFrequency) {
      return Number(sourceUpdateFrequency) * ONEMINUTE;
    } else {
      return null;
    }
  }, [sourceUpdateFrequency]);
  const checkIfHadSetPwd = useCallback(async () => {
    let { keyStore } = await chrome.storage.local.get(['keyStore']);
    setHadSetPwd(keyStore ? 1 : 2);
  }, []);
  const countDownFn = useCallback(() => {
    if (!updating) {
      updatedMintues.current += 1;
      if (updatedMintues.current >= Number(DEFAULTDATASOURCEPOLLINGTIMENUM)) {
        updatedMintues.current = 0;
      }
    }
    dispatch(
      setSourceUpdateInfoAction({
        lastUpdateFromNow: updatedMintues.current,
      })
    );
  }, [dispatch, updating, updatedMintues.current]);
  useEffect(() => {
    if (!sourceUpdateInfo.pollingFlag) {
      dispatch(
        setSourceUpdateInfoAction({
          pollingFlag: switchFlag,
        })
      );
    }
  }, [dispatch, switchFlag]);
  useEffect(() => {
    checkIfHadSetPwd();
  }, []);
  useEffect(() => {
    if (!!userPassword) {
      checkIfHadSetPwd();
    }
  }, [userPassword]);
  // const [updating, updateF] = useUpdateAllSources(true);

  useEffect(() => {
    if (updating !== sourceUpdateInfo.lastUpdating) {
      dispatch(
        setSourceUpdateInfoAction({
          lastUpdating: updating,
        })
      );
    }
  }),
    [updating, dispatch];
  useEffect(() => {
    if (!sourceUpdateInfo.pollingFlag && !updating) {
      updatedMintues.current = -1;
    }
  }, [sourceUpdateInfo.pollingFlag, updating]);
  useEffect(() => {}, [sourceUpdateInfo.pollingFlag]);
  useInterval(updateF as () => void, delay, sourceUpdateInfo.pollingFlag, true);
  useInterval(countDownFn, 1 * ONEMINUTE, sourceUpdateInfo.pollingFlag, true);
};

export default usePollingUpdateAllSources;
