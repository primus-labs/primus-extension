import React, { memo, useCallback } from 'react';
import './index.scss';
import PButton from '@/newComponents/PButton';
import { useNavigate } from 'react-router-dom';

const Overview = memo(() => {
  const navigate = useNavigate();
  const itemMap = {
    dataSource: {
      id: 'dataSource',
      title: 'Data connected',
      num: 0,
      operationName: 'Connect Data Source',
      link: '/datas',
    },
    zkAttestation: {
      id: 'zkAttestation',
      title: 'zkAttestation',
      num: 0,
      operationName: 'Create zkAttestation',
      link: '/zkAttestation',
    },
    achievement: {
      id: 'achievement',
      title: 'Points Earned',
      num: 0,
      operationName: 'Earn points',
      link: '/achievements',
    },
  };
  const handleClick = useCallback(
    (link) => {
      navigate(link);
    },
    [navigate]
  );
  return (
    <div className="homeOverview">
      <div className="title">
        <h2>Overview</h2>
        {/* <div className="updateTip">
          <span>Updated 4mins ago</span>
          <i className="iconfont "></i>
        </div> */}
      </div>
      <ul className="overviewItems">
        {Object.values(itemMap).map((i,k) => {
          return (
            <li className="overviewItem" key={ k}>
              <h4 className="title">{i.title}</h4>
              <div className="desc">
                <div className="num">{i.num}</div>
                <PButton
                  className="operationBtn"
                  text={i.operationName}
                  type="text"
                  onClick={() => {
                    handleClick(i.link);
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
});

export default Overview;
