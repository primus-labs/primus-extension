import React, { memo, useCallback } from 'react';
import useSocialStatistic from '@/hooks/useSocialStatistic';
import ModuleStatistics from '../../ModuleStatistics';
import './index.scss';
import PButton from '@/newComponents/PButton';
import { useNavigate } from 'react-router-dom';
import useRewardsStatistics from '@/hooks/useRewardsStatistics';
import iconPado from '@/assets/newImg/layout/iconPado.svg';
const Rewards = memo(() => {
  const { rewardsList } = useRewardsStatistics();
  console.log('rewardsList', rewardsList);
  const navigate = useNavigate();
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
          {rewardsList.filter(i => i)
            .map((i, k) => {
              return (
                <li className="rewardItem" key={k}>
                  <div className="bg">
                    <img src={i?.img} alt="" />
                    <div className="bgMask"></div>
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
