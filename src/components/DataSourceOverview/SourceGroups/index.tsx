import React, { FC, memo, useState, useMemo } from 'react';

import SourceGroup from './SourceGroup';
import SourceGroupTypes from './SourceGroupTypes';
import { DATASOURCEMAP } from '@/config/constants';

import type { ExchangeMeta } from '@/types/dataSource';

import './index.sass';

interface SourceGroupsProps {
  onChange: (item: ExchangeMeta) => void;
}
const SourceGroups: FC<SourceGroupsProps> = memo(({ onChange }) => {
  const [activeTab, setActiveTab] = useState<string>('Assets');

  const handleChangeType = (item: string) => {
    setActiveTab(item);
  };
  const allSourcesList: ExchangeMeta[] = useMemo(() => {
    return Object.keys(DATASOURCEMAP).map((key) => {
      const sourceInfo: ExchangeMeta =
        DATASOURCEMAP[key as keyof typeof DATASOURCEMAP];
      const { name, icon, type, requirePassphase, desc, iconWithCircle } =
        sourceInfo;
      const infoObj: ExchangeMeta = {
        name,
        icon,
        type,
        desc,
        requirePassphase,
        iconWithCircle,
      };
      return infoObj;
    });
  }, []);
  const activeSourceList: ExchangeMeta[] = useMemo(() => {
    let activeList: ExchangeMeta[] = allSourcesList.filter(
      (i) => i.type === activeTab
    );
    return activeList;
  }, [allSourcesList, activeTab]);

  return (
    <div className="SourceGroups">
      <SourceGroupTypes onChange={handleChangeType} />
      <SourceGroup onChange={(a) => {onChange(a as ExchangeMeta);}} list={activeSourceList} />
    </div>
  );
});
export default SourceGroups;
