import React, { FC, memo } from 'react';
import SplicedIcons from '@/newComponents/SplicedIcons';
import './index.scss';

type ModuleStatisticsProps = {
  title?: string;
  num: number;
  iconList: any[];
};
const ModuleStatistics: FC<ModuleStatisticsProps> = memo(
  ({ title, num, iconList }) => {
    return (
      <section className={`moduleStatistics`}>
        {title && <h4 className="title">{title}</h4>}
        <div className="desc">
          <div className="num">{num}</div>
          <SplicedIcons list={iconList} />
        </div>
      </section>
    );
  }
);

export default ModuleStatistics;
