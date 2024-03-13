import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

// import useUpdateAllSources from '@/hooks/useUpdateAllSources';
import useUpdateAllSources from '@/hooks/useUpdateAllSources';
import useInterval from '@/hooks/useInterval';
import useAllSources from '@/hooks/useAllSources';
import { ONEMINUTE } from '@/config/constants';

import type { UserState } from '@/types/store';

const usePollingUpdateAllSources = () => {
  const { sourceMap2 } = useAllSources();
  const [hadSetPwd, setHadSetPwd] = useState<boolean>(false);
  const userPassword = useSelector((state: UserState) => state.userPassword);
  const sourceUpdateFrequency = useSelector(
    (state: UserState) => state.sourceUpdateFrequency
  );

  const hasDataSources = useMemo(() => {
    const allDataSources = [...Object.values(sourceMap2)];
    return allDataSources.length > 0;
  }, [sourceMap2]);
  const switchFlag = useMemo(() => {
    return ((hadSetPwd && !!userPassword) || !hadSetPwd) && hasDataSources;
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
    setHadSetPwd(!!keyStore);
  }, []);
  useEffect(() => {
    checkIfHadSetPwd();
  }, [checkIfHadSetPwd]);
  useEffect(() => {
    !!userPassword && checkIfHadSetPwd();
  }, [userPassword, checkIfHadSetPwd]);
  // const [updating, updateF] = useUpdateAllSources(true);
  const [updating, updateF] = useUpdateAllSources();

  useInterval(updateF as () => void, delay, switchFlag, true);
};

export default usePollingUpdateAllSources;
