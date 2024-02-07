import React, { useState, useEffect, memo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import Banner from '@/newComponents/Home/Banner';
import { postMsg } from '@/utils/utils';
import './home.scss';

const Home = memo(() => {
  return (
    <div className="pageHome">
      <div className="pageContent">
        <Banner />
      </div>
    </div>
  );
});
export default Home;
