import React, { memo, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import PHeader from '@/components/Layout/PHeader';
import PageHeader from '@/components/Layout/PageHeader';

const ActiveHeader = memo(() => {
  const location = useLocation();
  const pathname = useMemo(() => {
    return location.pathname;
  }, [location]);
  // const pathname = location.pathname;
  const isIndex = useMemo(() => {
    return ['/', '/lock'].includes(pathname);
  }, [pathname]);

  return <>{isIndex ? <PHeader /> : <PageHeader />}</>;
});
export default ActiveHeader;
