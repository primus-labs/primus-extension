import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { DATASOURCEMAP } from '@/config/dataSource';
import useDataSource from '@/hooks/useDataSource';
import useAllSources from '@/hooks/useAllSources';
import { ATTESTATIONTYPEMAP } from '@/config/attestation';
import { getCurrentDate } from '@/utils/utils';
import type { SyntheticEvent } from 'react';
import type { UserState } from '@/types/store';

import PTag from '@/newComponents/PTag';
import PButton from '@/newComponents/PButton';

import './index.scss';

type NavItem = {
  type: string;
  icon: any;
  desc: any;
  name: string;

  importType?: string;
  provider?: string;
};
interface PDropdownProps {
  onClick?: (item: NavItem) => void;
  // list: NavItem[];
}
const Cards: React.FC<PDropdownProps> = memo(
  ({ onClick = (item: NavItem) => {} }) => {
    const navigate = useNavigate();
    const [activeDataSourceName, setActiveDataSourceName] =
      useState<string>('');
    const credentialsFromStore = useSelector(
      (state: UserState) => state.credentials
    );
    console.log('222credentialsFromStore', credentialsFromStore); //delete
    const { deleteFn: deleteDataSourceFn } =
      useDataSource(activeDataSourceName);
    const dataSourceQueryStr = useSelector(
      (state: UserState) => state.dataSourceQueryStr
    );
    const dataSourceQueryType = useSelector(
      (state: UserState) => state.dataSourceQueryType
    );
    const filterdList: any = useMemo(() => {
      const obj = { ...credentialsFromStore };
      delete obj['1709201562550'];

      var newList = Object.values(obj);
      if (dataSourceQueryType && dataSourceQueryType !== 'All') {
        newList = newList.filter((i) => {
          return i.type === dataSourceQueryType;
        });
      }
      if (dataSourceQueryStr) {
        newList = newList.filter((i) => {
          const curName = i.showName ?? i.name;
          const lowerCaseName = curName.toLowerCase();
          return lowerCaseName.startsWith(dataSourceQueryStr);
        });
      }
      return newList;
    }, [credentialsFromStore, dataSourceQueryStr, dataSourceQueryType]);

    const handleConnect = useCallback(
      (i) => {
        // onClick && onClick(i);
        navigate(`/datas/data?dataSourceId=${i.id}`);
      },
      [navigate]
    );
    const handleDelete = useCallback(
      (i) => {
        setActiveDataSourceName(i.name);
        deleteDataSourceFn(i.name);
        // TODO-newui badge
      },
      [deleteDataSourceFn]
    );

    return (
      <ul className="attestationCards">
        {filterdList.map((i) => {
          return (
            <li
              className="attestationCard"
              onClick={() => {
                handleConnect(i);
              }}
              key={i.name}
            >
              <div className="cardContent">
                <div className="header">
                  <PTag text={`${i.attestationType}`} color="yellow" />

                  {/* <div className="connections">
                      <PButton
                        className="deleteBtn"
                        type="icon"
                        icon={<i className="iconfont icon-iconDelete"></i>}
                        onClick={() => {
                          handleDelete(i);
                        }}
                      />
                    </div> */}
                </div>
                <div className="brief">
                  <div className="splicedIcons">
                    <img
                      src={ATTESTATIONTYPEMAP[i.attestationType].icon}
                      alt=""
                    />
                    <img src={DATASOURCEMAP[i.dataSourceId].icon} alt="" />
                  </div>
                  <div className="intro">
                    <div className="name">
                      {DATASOURCEMAP[i.dataSourceId].name}
                    </div>
                    <div className="updateTime">
                      <span> {getCurrentDate(Number(i?.getDataTime))}</span>
                      <i className="iconfont icon-iconDelete"></i>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }
);

export default Cards;
