import React, { memo, useCallback, useMemo } from 'react';
import './index.scss';
import PButton from '@/newComponents/PButton';
import { useNavigate } from 'react-router-dom';
import useRewardsStatistics from '@/hooks/useRewardsStatistics';
import iconPado from '@/assets/img/content/iconPado.svg';
const Rewards = memo(() => {
  const { rewardsList } = useRewardsStatistics();
  console.log('rewardsList', rewardsList);
  const navigate = useNavigate();
  const showList = useMemo(() => {
    return rewardsList.slice(0,2)
  }, [rewardsList]);
  const handleDetail = useCallback(() => {
    navigate('/events/rewards');
  }, [navigate]);

  return (
    <div className="rewards">
      <div className="title">
        <span>Rewards</span>
      </div>
      <div className="content">
        <ul className="rewardItems">
          {showList
            .filter((i) => i)
            .map((i, k) => {
              return (
                <li className="rewardItem" key={k}>
                  <div className="bg">
                    <img src={i?.img} alt="" />
                    <div className="bgMaskTop"></div>
                  </div>
                  <div className="content">
                    <div className="cardContent">
                      <div className="picWrapper">
                        <img src={i?.img} alt="" />
                      </div>
                      <div className="txtWrapper">
                        <div className="title">{i.title}</div>
                        <div className="desc">
                          <img src={iconPado} alt="" />
                          &nbsp;
                          <p>{i.desc}</p>
                        </div>
                      </div>
                    </div>
                    <PButton
                      type="text"
                      text="View Details"
                      onClick={handleDetail}
                      className="detailsBtn"
                    />
                  </div>
                </li>
              );
            })}
        </ul>
      </div>
    </div>
  );
});

export default Rewards;
