import React, { memo, useCallback } from 'react';
import useSocialStatistic from '@/hooks/useSocialStatistic';
import ModuleStatistics from '../../ModuleStatistics';
import './index.scss';
import PButton from '@/newComponents/PButton';
import { useNavigate } from 'react-router-dom';

const SocialInsights = memo(() => {
  const {
    socialDataSourcesLen,
    socialDataSourcesIconList,
    formatTotalFollowing,
    formatTotalFollowers,
    formatTotalPosts,
  } = useSocialStatistic();
  const navigate = useNavigate();
  const handleMore = useCallback(() => {
    navigate('/dataDashboard');
  }, [navigate]);
  return (
    <div className="socialInsights">
      <div className="title">
        <span>Social Insights</span>
      </div>
      <div className="content">
        <ModuleStatistics
          title="Social Data Connected"
          num={socialDataSourcesLen}
          iconList={socialDataSourcesIconList}
        />
        <div className="descWrapper">
          <ul className="descItems">
            <li className="descItem">
              <div className="label">Followers</div>
              <div className="value">{formatTotalFollowers}</div>
            </li>
            <li className="descItem">
              <div className="label">Following</div>
              <div className="value">{formatTotalFollowing}</div>
            </li>
            <li className="descItem">
              <div className="label">Posts</div>
              <div className="value">{formatTotalPosts}</div>
            </li>
          </ul>
          <PButton type="text" text="View More" onClick={handleMore} className="moreBtn"/>
        </div>
      </div>
    </div>
  );
});

export default SocialInsights;
