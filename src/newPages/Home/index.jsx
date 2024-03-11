import React, { useState, useEffect, memo, useCallback } from 'react';
import Slider from '@/newComponents/Events/Slider';
import Overview from '@/newComponents/Home/Overview';
import Support from '@/newComponents/Home/Support';
import DataSources from '@/newComponents/Home/DataSources';

import './index.scss';

const Home = memo(() => {
  return (
    <div className="pageHome">
      <div className="pageContent">
        <Slider />
        <div className="pRow">
          <Overview />
          <Support />
        </div>
        <DataSources />
      </div>
    </div>
  );
});
export default Home;
