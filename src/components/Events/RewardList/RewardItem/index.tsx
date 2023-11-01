import React, { useMemo, memo, useCallback } from 'react';
import imgNFT from '@/assets/img/events/nft.svg';
import iconOpenSea from '@/assets/img/events/iconOpenSea.svg'
import rightArrow from '@/assets/img/rightArrow.svg'
import type { Reward } from '@/types/event';

import './index.scss';

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
        <a
          href={`https://opensea.io/assets/matic/0x616bdf7e9041c6f76b0ff6de9af5da2c88a9ac98/${item.tokenId}`}
          rel="noreferrer"
          target="_blank"
          className="desc"
        >
          <img src={iconOpenSea} alt="" />
          <span>OpenSea</span>
          {/* <img className="suffix" src={rightArrow} alt="" /> */}
        </a>
      </div>
    );
  }
);

export default RewardItem;
