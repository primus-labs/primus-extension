import React, { useMemo, memo, useCallback } from 'react';
import imgNFT from '@/assets/img/events/nft.svg';
import iconOpenSea from '@/assets/img/events/iconOpenSea.svg'
import rightArrow from '@/assets/img/rightArrow.svg'
import type { Reward } from '@/types/event';

import './index.sass';

interface RewardItemProps {
  item: Reward;
  // onCheck?: (item: SourceData) => void;
}

const RewardItem: React.FC<RewardItemProps> = memo(
  ({ item }) => {
    return (
      <div className="rewardItem">
        <img src={item.image} alt="" />
        <p className="title">{item.name}</p>
        <a href={`https://testnets.opensea.io/account`} className="desc">
          <img src={iconOpenSea} alt="" />
          <span>OpenSea</span>
          <img className="suffix" src={rightArrow} alt="" />
        </a>
      </div>
    );
  }
);

export default RewardItem;
