import React, { useState, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { DATASOURCEMAPVALUES } from '@/config/dataSource';
import { ATTESTATIONTYPEMAP, ATTESTATIONTYPELIST } from '@/config/attestation';

import type { UserState } from '@/types/store';
import PInput from '@/newComponents/PInput';
import PSelect from '@/newComponents/PSelect';
import iconSearch from '@/assets/newImg/layout/iconSearch.svg';
import './index.scss';

const Search: React.FC = () => {
  const dispatch = useDispatch();
  const attestationQueryStr = useSelector(
    (state: UserState) => state.attestationQueryStr
  );
  const attestationQueryType = useSelector(
    (state: UserState) => state.attestationQueryType
  );
  const tList = useMemo(() => {
    const newArr = ATTESTATIONTYPELIST.filter((i) => !i.disabled).map((i) => ({
      label: i.name,
      value: i.id,
    }));
    newArr.unshift({
      value: 'All',
      label: 'All',
    });
    return newArr;
  }, []);
  const handleChangeStr = useCallback((v) => {
    dispatch({
      type: 'setAttestationQueryStr',
      payload: v,
    });
  }, []);
  const handleChangeType = useCallback((v) => {
    dispatch({
      type: 'setAttestationQueryType',
      payload: v,
    });
  }, []);
  return (
    <div className="dataSourceSearchBar attestationSearchBar">
      <PSelect
        className="serachType"
        placeholder="Select verification category"
        list={tList}
        value={attestationQueryType as string}
        onChange={handleChangeType}
        prefix={<i className="iconfont icon-iconFilter prefix"></i>}
      />
      <PInput
        className="serachStr"
        placeholder="Data source, Data account, Create address"
        type="text"
        onChange={handleChangeStr}
        onSearch={handleChangeStr}
        value={attestationQueryStr}
        prefix={<img src={iconSearch} className="prefix" />}
      />
    </div>
  );
};

export default Search;
