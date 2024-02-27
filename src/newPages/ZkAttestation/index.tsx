import React, { useState, useEffect, memo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Banner from '@/newComponents/Home/Banner';
import AttestationTypeList from '@/newComponents/ZkAttestation/AttestationTypeList';
import { postMsg } from '@/utils/utils';
import './index.scss';

const Home = memo(() => {
  return (
    <div className="pageZkAttestation">
      <div className="pageContent">
        <Banner />
        <AttestationTypeList/>
      </div>
    </div>
  );
});
export default Home;
