import React, { useMemo } from 'react';
import PControledInput from '@/components/PControledInput';
import PSelect from '@/components/PSelect';
import { useSelector } from 'react-redux';
import type { UserState } from '@/store/reducers';
import { useDispatch } from 'react-redux';
import type { Dispatch } from 'react'
import './index.sass';
interface TokenTableProps { }

const DataSourceSearch: React.FC<TokenTableProps> = ({ }) => {
  const exSources = useSelector(
    (state: UserState) => state.exSources
  );
  const socialSources = useSelector(
    (state: UserState) => state.socialSources
  );
  const activeSourceType = useSelector(
    (state: UserState) => state.activeSourceType
  );
  const filterWord = useSelector(
    (state: UserState) => state.filterWord
  );
  const dispatch: Dispatch<any> = useDispatch()
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
    dispatch({
      type: 'setActiveSourceType',
      payload: val
    })
  };
  const handleChangeInput = (val: string) => {
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
