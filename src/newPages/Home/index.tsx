import React, { memo } from 'react';
// import Banner from '@/newComponents/Home/Banner';
import './index.scss';

const Home: React.FC = memo(({}) => {
  return (
    <div className="pageHome">
      <div className="pageContent">{/* <Banner /> */}</div>
    </div>
  );
});

export default Home;
