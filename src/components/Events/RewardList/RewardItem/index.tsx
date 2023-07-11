import React, { useMemo, memo } from 'react';
import qrCodeDefault from '@/assets/img/qrCodeDefault.svg';
import iconOpensea from '@/assets/img/events/iconOpensea.svg'
import rightArrow from '@/assets/img/rightArrow.svg'
import type {
  SocialDataSourceData,
  SourceData,
  ExData,
  SocialData,
  KYCData,
} from '@/types/dataSource';

import './index.sass';

interface DataSourceItemProps {
  item?: SourceData;
  onCheck?: (item: SourceData) => void;
}

const RewardItem: React.FC<DataSourceItemProps> = memo(
  ({ item: source, onCheck }) => {
    return (
      <div className="rewardItem">
        <img src={qrCodeDefault} alt="" />
        <p className="title">On-boarding #001</p>
        <div className="desc">
          <img src={iconOpensea} alt="" />
          <span>Opensea</span>
          <img className="suffix" src={rightArrow} alt="" />
        </div>
      </div>
    );
  }
);

export default RewardItem;
