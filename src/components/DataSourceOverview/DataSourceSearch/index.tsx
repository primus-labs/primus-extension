import React, { useState, useMemo } from 'react';
import PControledInput from '@/components/PControledInput';
import PSelect from '@/components/PSelect';
import useExSources from '@/hooks/useExSources';
import useSocialSources from '@/hooks/useSocialSources';

import './index.sass';
interface TokenTableProps {}

const DataSourceSearch: React.FC<TokenTableProps> = ({}) => {
  const [exSources, refreshExSources] = useExSources();
  const [socialSources, refreshSocialSources] = useSocialSources();
  const [activeSourceType, setActiveSourceType] = useState<string>('All');
  const [filterWord, setFilterWord] = useState<string>();
  const dataSourceTypeList = useMemo(() => {
    let deaultList = [
      {
        value: 'All',
        text: 'All',
      },
    ];
    if (typeof exSources === 'object' && Object.values(exSources).length > 0) {
      deaultList.push({
        value: 'Assets',
        text: 'Assets',
      });
    }
    if (
      typeof socialSources === 'object' &&
      Object.values(socialSources).length > 0
    ) {
      deaultList.push({
        value: 'Social',
        text: 'Social',
      });
    }
    return deaultList;
  }, [exSources, socialSources]);
  const handleChangeSelect = (val: string) => {
    setActiveSourceType(val);
  };
  const handleChangeInput = (val: string) => {
    setFilterWord(val);
  };
  return (
    <div className="dataSourceSearch">
      <PSelect
        options={dataSourceTypeList}
        onChange={handleChangeSelect}
        val={activeSourceType}
      />
      <div className="pSearch">
        <PControledInput
          onChange={handleChangeInput}
          type="text"
          placeholder="Search"
          value={filterWord}
        />
      </div>
    </div>
  );
};

export default DataSourceSearch;
