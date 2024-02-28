import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Banner from '@/newComponents/Home/Banner';
import AttestationTypeList from '@/newComponents/ZkAttestation/AttestationTypeList';
import { postMsg } from '@/utils/utils';
import empty from '@/assets/newImg/zkAttestation/empty.svg';

import './index.scss';

const Home = memo(() => {
  const hasConnected = useMemo(() => {
    return false;
  }, []);
  return (
    <div className="pageZkAttestation">
      <div className="pageContent">
        <Banner />
        <AttestationTypeList />
        {hasConnected ? (
          <></>
        ) : (
          <div className="hasNoContent">
            <img src={empty} alt="" />
            <div className="introTxt">
              <div className="title">No zkAttestation </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
export default Home;
