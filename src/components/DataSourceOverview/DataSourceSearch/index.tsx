import React, { useMemo, memo } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import PControledInput from '@/components/PControledInput';
import PSelect from '@/components/PSelect';

import type { UserState } from '@/types/store';

import type { Dispatch } from 'react';

import './index.sass';

const DataSourceSearch = memo(() => {
  const location = useLocation();
  const pathname = location.pathname;
  const exSources = useSelector((state: UserState) => state.exSources);
  const socialSources = useSelector((state: UserState) => state.socialSources);
  const activeSourceType = useSelector(
    (state: UserState) => state.activeSourceType
  );
  const filterWord = useSelector((state: UserState) => state.filterWord);
  const credentials = useSelector((state: UserState) => state.credentials);
  const dispatch: Dispatch<any> = useDispatch();
  const dataSourceTypeList = useMemo(() => {
    let defaultList = [
      {
        value: 'All',
        text: 'All',
      },
    ];
    if (pathname === '/cred') {
      const credentialList = Object.values(credentials);
      const assetsProofList = credentialList.filter(
        (i) => i.type === 'Assets Proof'
      );
      const tokenHoldingsList = credentialList.filter(
        (i) => i.type === 'Token Holdings'
      );
      const qualificationsList = credentialList.filter(
        (i) => i.type === 'Qualifications'
      );
      if (assetsProofList.length > 0) {
        defaultList.push({
          value: 'Asset',
          text: 'Asset',
        });
      }
      if (tokenHoldingsList.length > 0) {
        defaultList.push({
          value: 'Token',
          text: 'Token',
        });
      }
      if (qualificationsList.length > 0) {
        defaultList.push({
          value: 'Qualifications',
          text: 'Qualifications',
        });
      }
    } else {
      if (
        typeof exSources === 'object' &&
        Object.values(exSources).length > 0
      ) {
        defaultList.push({
          value: 'Assets',
          text: 'Assets',
        });
      }
      if (
        typeof socialSources === 'object' &&
        Object.values(socialSources).length > 0
      ) {
        defaultList.push({
          value: 'Social',
          text: 'Social',
        });
      }
    }
    return defaultList;
  }, [exSources, socialSources, pathname, credentials]);
  const handleChangeSelect = (val: string) => {
    dispatch({
      type: 'setActiveSourceType',
      payload: val,
    });
  };
  const handleChangeInput = (val: string) => {
    dispatch({
      type: 'setFilterWord',
      payload: val,
    });
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
});

export default DataSourceSearch;
