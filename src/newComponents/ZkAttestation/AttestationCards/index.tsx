import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

import dayjs from 'dayjs';
import { DATASOURCEMAP } from '@/config/dataSource';
import { PADOADDRESS, EASInfo } from '@/config/envConstants';
import useDataSource from '@/hooks/useDataSource';
import useAllSources from '@/hooks/useAllSources';
import { ATTESTATIONTYPEMAP } from '@/config/attestation';
import { getCurrentDate, formatAddress } from '@/utils/utils';
import { setCredentialsAsync } from '@/store/actions';
import type { SyntheticEvent, Dispatch } from 'react';
import type { UserState } from '@/types/store';
import type { CredTypeItemType } from '@/types/cred';

import PTag from '@/newComponents/PTag';
import PButton from '@/newComponents/PButton';
import iconUpdate from '@/assets/newImg/layout/iconUpdate.svg';

import './index.scss';
import { formatDate, div } from '../../../utils/utils';
import request from '@/utils/request';

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
    const dispatch: Dispatch<any> = useDispatch();
    const navigate = useNavigate();
    const [activeDataSourceName, setActiveDataSourceName] =
      useState<string>('');
    const credentialsFromStore = useSelector(
      (state: UserState) => state.credentials
    );
    const sysConfig = useSelector((state: UserState) => state.sysConfig);

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
      delete obj['1709201562550']; // TODO-newui

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
    const formatDate = (timestamp) => {
      return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
    };
    const getDataSourceMetaInfo = (dataSourceId) => {
      return DATASOURCEMAP[dataSourceId];
    };
    const getContent = (i) => {
      let str = '';
      if (i.attestationType === 'Assets Certificate') {
        if (i.verificationContent === 'Assets Proof') {
          str = 'Asset balance';
        } else if (i.verificationContent === 'Token Holding') {
          str = i.verificationContent;
        }
      }
      return str;
    };
    const getValue = (i) => {
      let str: any = '';
      if (i.attestationType === 'Assets Certificate') {
        if (i.verificationContent === 'Assets Proof') {
          str = `>=${i.verificationValue}`;
        } else if (i.verificationContent === 'Token Holding') {
          const dataSourceIconSrc = `${sysConfig.TOKEN_LOGO_PREFIX}icon${i.verificationValue}.png`;
          str = (
            <>
              <img src={dataSourceIconSrc} className="dataSourceIcon" alt="" />
              <span>{i.verificationValue}</span>
            </>
          );
        }
      }
      return str;
    };
    const getResult = (i) => {
      return i.uiTemplate.condition;
    };
    const handleOnChain = useCallback((i) => {}, []);
    const handleShare = useCallback((i) => {}, []);
    const handleCopy = useCallback((i) => {}, []);
    const handleMore = useCallback((i) => {
      handleDeleteCred(i);
    }, []);
    const initCredList = useCallback(async () => {
      await dispatch(setCredentialsAsync());
    }, [dispatch]);
    const handleDeleteCred = useCallback(
      async (item: CredTypeItemType) => {
        const curRequestid = item.requestid;
        const cObj = { ...credentialsFromStore };
        if (cObj[curRequestid]?.event === BASEVENTNAME) {
          const res = await chrome.storage.local.get([BASEVENTNAME]);
          if (res[BASEVENTNAME]) {
            const lastInfo = JSON.parse(res[BASEVENTNAME]);
            const { steps } = lastInfo;
            if (steps[2]?.status !== 1) {
              let newInfo = { ...lastInfo };
              const credTasks = steps[1]?.tasks;
              let newCredTasks = { ...credTasks };
              let newCredTasksStatus = steps[1]?.status;
              let webTemplateId;
              Object.keys(credTasks).forEach((k) => {
                if (credTasks[k] === item.requestid) {
                  webTemplateId = k;
                }
              });

              delete newCredTasks[webTemplateId];
              newCredTasksStatus =
                Object.values(newCredTasks).length > 0 ? 1 : 0;
              newInfo.steps[1] = {
                status: newCredTasksStatus,
                tasks: newCredTasks,
              };
              await chrome.storage.local.set({
                [BASEVENTNAME]: JSON.stringify(newInfo),
              });
            }
          }
        }
        delete cObj[curRequestid];
        await chrome.storage.local.set({
          credentials: JSON.stringify(cObj),
        });
        await initCredList();
      },
      [initCredList, credentialsFromStore]
    );
    // useEffect(() => {
    //   handleDeleteCred(credentialsFromStore[]);
    // }, [credentialsFromStore, handleDeleteCred]);

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
                  <div className="operations">
                    <PButton
                      className="shareBtn"
                      type="icon"
                      icon={<i className="iconfont icon-iconShare"></i>}
                      onClick={() => {
                        handleShare(i);
                      }}
                    />
                    <div title="Copy link to share">
                      <PButton
                        className="copyBtn"
                        type="icon"
                        icon={<i className="iconfont icon-iconCopy"></i>}
                        onClick={() => {
                          handleCopy(i);
                        }}
                      />
                    </div>
                    <PButton
                      className="moreBtn"
                      type="icon"
                      icon={<i className="iconfont icon-iconMore"></i>}
                      onClick={() => {
                        handleMore(i);
                      }}
                    />
                  </div>
                </div>
                <div className="brief">
                  <div className="splicedIcons">
                    <img
                      src={ATTESTATIONTYPEMAP[i.attestationType].icon}
                      alt=""
                    />
                    <img
                      src={getDataSourceMetaInfo(i.dataSourceId).icon}
                      alt=""
                    />
                  </div>
                  <div className="intro">
                    <div className="name">
                      {getDataSourceMetaInfo(i.dataSourceId).name}
                    </div>
                    <div className="updateTime">
                      <span> {formatDate(Number(i?.getDataTime))}</span>
                      <img src={iconUpdate} alt="" className="iconUpdate" />
                    </div>
                  </div>
                </div>
                <div className="details">
                  <div className="descItems">
                    {/* TODO-newui config uiTemplate */}
                    <div className="descItem">
                      <div className="label">Data account</div>
                      <div className="value">{i.account}</div>
                    </div>
                    <div className="descItem">
                      <div className="label">Content</div>
                      <div className="value">{getContent(i)}</div>
                    </div>
                    <div className="descItem">
                      <div className="label">Value</div>
                      <div className="value">{getValue(i)}</div>
                    </div>
                    <div className="descItem">
                      <div className="label">Result</div>
                      <div className="value">{getResult(i)}</div>
                    </div>
                  </div>
                  <div className="descItems">
                    <div className="descItem">
                      <div className="label">Create address</div>
                      <div className="value">
                        {formatAddress(i.address, 6, 4, '...')}
                      </div>
                    </div>
                    <div className="descItem">
                      <div className="label">Attest address</div>
                      <div className="value">
                        {formatAddress(PADOADDRESS, 6, 4, '...')}
                      </div>
                    </div>
                  </div>
                  <div className="descItems">
                    <div className="descItem">
                      <div className="label">On-chain</div>
                      <PButton
                        icon={<i className="iconfont icon-Add"></i>}
                        type="icon"
                        onClick={() => {
                          handleOnChain(i);
                        }}
                      />
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
