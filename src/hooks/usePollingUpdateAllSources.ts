import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

// import useUpdateAllSources from '@/hooks/useUpdateAllSources';
import useUpdateExASocialSources from '@/hooks/useUpdateExASocialSources';
import useInterval from '@/hooks/useInterval';
import { ONEMINUTE } from '@/config/constants';

import type { UserState } from '@/types/store';

const usePollingUpdateAllSources = () => {
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
  const switchFlag = useMemo(() => {
    return !!userPassword && hasDataSources
  }, [userPassword, hasDataSources]);
  const delay = useMemo(() => {
    if (sourceUpdateFrequency) {
      return (Number(sourceUpdateFrequency) * ONEMINUTE);
    } else {
      return null;
    }
  }, [sourceUpdateFrequency]);

  // const [updating, updateF] = useUpdateAllSources(true);
  const [updating, updateF] = useUpdateExASocialSources();
  
  useInterval(updateF as () => void, delay, switchFlag, true);
};

export default usePollingUpdateAllSources;
