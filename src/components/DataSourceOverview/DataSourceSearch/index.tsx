import React, { useState, useMemo } from 'react';
import PControledInput from '@/components/PControledInput';
import PSelect from '@/components/PSelect';
import useExSources from '@/hooks/useExSources';
import useSocialSources from '@/hooks/useSocialSources';
import { useSelector } from 'react-redux';
import type { UserState } from '@/store/reducers';
import { useDispatch } from 'react-redux';
import type { Dispatch } from 'react'
import './index.sass';
interface TokenTableProps { }

const DataSourceSearch: React.FC<TokenTableProps> = ({ }) => {
  const [exSources, refreshExSources] = useExSources();
  const [socialSources, refreshSocialSources] = useSocialSources();
  const activeSourceType = useSelector(
    (state: UserState) => state.activeSourceType
  );
  const filterWord = useSelector(
    (state: UserState) => state.filterWord
  );
  const dispatch: Dispatch<any> = useDispatch()
  // const [activeSourceType, setActiveSourceType] = useState<string>('All');
  // const [filterWord, setFilterWord] = useState<string>();
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
    // setActiveSourceType(val);
    dispatch({
      type: 'setActiveSourceType',
      payload: val
    })
  };
  const handleChangeInput = (val: string) => {
    // setFilterWord(val);
    dispatch({
      type: 'setFilterWord',
      payload: val
    })
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
