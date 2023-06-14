import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import useUpdateAllSources from '@/hooks/useUpdateAllSources';
import { setExSourcesAsync, setSocialSourcesAsync } from '@/store/actions';
import { ONEMINUTE } from '@/config/constants';

import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';

const usePollingUpdateAllSources = () => {
  const [flag, setFlag] = useState<boolean>(false);
  const [pollingSourcesTimer, setPollingSourcesTimer] = useState<any>();

  const userPassword = useSelector((state: UserState) => state.userPassword);
  const sourceUpdateFrequency = useSelector(
    (state: UserState) => state.sourceUpdateFrequency
  );
  const exSources = useSelector((state: UserState) => state.exSources);
  const socialSources = useSelector((state: UserState) => state.socialSources);

  const hasDataSources = useMemo(() => {
    const allDataSources = [
      ...Object.values(exSources),
      ...Object.values(socialSources),
    ];
    return allDataSources.length > 0;
  }, [exSources, socialSources]);

  const dispatch: Dispatch<any> = useDispatch();
  const [updating, updateF] = useUpdateAllSources(true);

  const pollingDataSources = useCallback(() => {
    // console.log(
    //   '222222pollingDataSources',
    //   sourceUpdateFrequency,
    //   pollingSourcesTimer
    // );
    if (pollingSourcesTimer) {
      clearInterval(pollingSourcesTimer);
    }
    const timer = setInterval(() => {
      (updateF as () => void)();
    }, Number(sourceUpdateFrequency) * ONEMINUTE);
    setPollingSourcesTimer(timer);
    (updateF as () => void)();
    // }, [pollingSourcesTimer, sourceUpdateFrequency, updateF]);
  }, [sourceUpdateFrequency, updateF]);

  const open = () => {
    setFlag(true);
  };
  const close = () => {
    setFlag(false);
    if (pollingSourcesTimer) {
      clearInterval(pollingSourcesTimer);
    }
  };

  useEffect(() => {
    if (flag) {
      if (userPassword && hasDataSources) {
        pollingDataSources();
      }
    }
  }, [flag, userPassword, hasDataSources, pollingDataSources]);
  useEffect(() => {
    if (!updating) {
      dispatch(setExSourcesAsync());
      dispatch(setSocialSourcesAsync());
    }
  }, [updating, dispatch]);
  // useEffect(() => {
  //   console.log('pollingSourcesTimer', pollingSourcesTimer);
  // }, [pollingSourcesTimer]);
  useEffect(() => {
    return () => {
      if (pollingSourcesTimer) {
        clearInterval(pollingSourcesTimer);
      }
    };
  }, []);

  return [open, close];
};

export default usePollingUpdateAllSources;
