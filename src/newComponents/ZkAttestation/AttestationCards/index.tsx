import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

import dayjs from 'dayjs';
import { getCurrentDate, formatAddress } from '@/utils/utils';
import { setCredentialsAsync, setActiveOnChain } from '@/store/actions';
import useDataSource from '@/hooks/useDataSource';
import useAllSources from '@/hooks/useAllSources';
import { BASEVENTNAME } from '@/config/events';
import { DATASOURCEMAP } from '@/config/dataSource';
import { PADOADDRESS, EASInfo } from '@/config/envConstants';
import { ATTESTATIONTYPEMAP } from '@/config/attestation';

import type { SyntheticEvent, Dispatch } from 'react';
import type { UserState } from '@/types/store';
import type { CredTypeItemType } from '@/types/cred';

import PTag from '@/newComponents/PTag';
import PButton from '@/newComponents/PButton';
import PDropdown from '@/newComponents/PDropdown';
import iconUpdate from '@/assets/newImg/layout/iconUpdate.svg';
import ConfirmDeleteDialog from '../ConfirmDeleteDialog';
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
    const [confirmDeleteDialogVisible, setConfirmDeleteDialogVisible] =
      useState<boolean>(false);
    const [activeCredId, setActiveCredId] = useState<string>();

    const credentialsFromStore = useSelector(
      (state: UserState) => state.credentials
    );
    const sysConfig = useSelector((state: UserState) => state.sysConfig);

    console.log('222credentialsFromStore', credentialsFromStore); //delete
    const { deleteFn: deleteDataSourceFn } =
      useDataSource(activeDataSourceName);
    const attestationQueryStr = useSelector(
      (state: UserState) => state.attestationQueryStr
    );
    const attestationQueryType = useSelector(
      (state: UserState) => state.attestationQueryType
    );

    const filterdList: any = useMemo(() => {
      const obj = { ...credentialsFromStore };
      delete obj['1709201562550']; // TODO-newui

      var newList = Object.values(obj);
      if (attestationQueryType && attestationQueryType !== 'All') {
        newList = newList.filter((i: any) => {
          return i.attestationType === attestationQueryType;
        });
      }
      if (attestationQueryStr) {
        newList = newList.filter((i: any) => {
          const lowerCaseStr = attestationQueryStr.toLowerCase();
          return (
            i.source?.startsWith(lowerCaseStr) ||
            i.account?.startsWith(lowerCaseStr) ||
            i.address?.startsWith(lowerCaseStr)
          );
        });
      }
      return newList;
    }, [credentialsFromStore, attestationQueryStr, attestationQueryType]);
    const otherOperationsFn = useCallback((i) => {
      // if (item?.provided?.length && item?.provided?.length > 0) {
      //   return [
      //     {
      //       icon: iconClear,
      //       text: 'Delete',
      //     },
      //   ];
      // }
      // if (item.type === 'UNISWAP_PROOF') {
      //   return [
      //     {
      //       icon: iconClear,
      //       text: 'Delete',
      //     },
      //   ];
      // }
      const isDeleteDisable = i?.provided?.length && i?.provided?.length > 0;
      return [
        {
          value: 'Delete',
          label: 'Delete',
          disabled: isDeleteDisable,
        },
        {
          value: 'Bind to DID',
          label: 'Bind to DID',
          disabled: true,
        },
      ];
    }, []);
    const formatDate = (timestamp) => {
      return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
    };
    const getDataSourceMetaInfo = (source) => {
      return DATASOURCEMAP[source];
    };
    const getContent = (i) => {
      let str = '';
      if (i.attestationType === 'Assets Certificate') {
        if (i.verificationContent === 'Assets Proof') {
          str = 'Asset balance';
        } else if (i.verificationContent === 'Token Holding') {
          str = i.verificationContent;
        }
      } else if (i.attestationType === 'Humanity Verification') {
        if (i.verificationContent === 'KYC Status') {
          str = i.verificationContent;
        } else if (i.verificationContent === 'Owns an account') {
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
      } else if (i.attestationType === 'Humanity Verification') {
        if (i.verificationContent === 'KYC Status') {
          str = i.verificationValue;
        } else if (i.verificationContent === 'Owns an account') {
          str = i.verificationValue;
        }
      }
      return str;
    };
    const getResult = (i) => {
      if (['coinbase', 'google'].includes(i.source)) {
        return 'Verified';
      }
      return i?.uiTemplate?.condition;
    };
    const handleOnChain = useCallback(
      (i) => {
        dispatch(setActiveOnChain({ loading: 1, requestid: i.requestid }));
      },
      [dispatch]
    );
    const handleShare = useCallback((i) => {}, []);
    const handleCopy = useCallback((i) => {}, []);
    const handleShowMore = useCallback((i) => {
      setActiveCredId(i.requestid);
    }, []);
    const initCredList = useCallback(async () => {
      await dispatch(setCredentialsAsync());
    }, [dispatch]);
    const handleDeleteCred = useCallback(async () => {
      const curRequestid = activeCredId as string;
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
              if (credTasks[k] === requestid) {
                webTemplateId = k;
              }
            });

            delete newCredTasks[webTemplateId];
            newCredTasksStatus = Object.values(newCredTasks).length > 0 ? 1 : 0;
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
    }, [initCredList, credentialsFromStore, activeCredId]);
    const handleHideMore = () => {
      setActiveCredId(undefined);
    };
    const handleClickDropdownItem = useCallback(
      (operation: string) => {
        // setActiveItem(operation);
        if (operation === 'Update') {
          // onUpdate(item);
        } else if (operation === 'Delete') {
          // handleDeleteCred(activeCredId);
          setConfirmDeleteDialogVisible(true);
        }
      },
      [activeCredId]
    );
    const handleSubmitConfirmDeleteDialog = useCallback(() => {
      setConfirmDeleteDialogVisible(false);
      handleDeleteCred();
    }, [handleDeleteCred]);
    const handleCloseConfirmDeleteDialog = useCallback(() => {
      setConfirmDeleteDialogVisible(false);
    }, []);
    const txDetailUrlFn = useCallback((item: any) => {
      let chainShowName = item.title;
      if (item.title === 'BNB') {
        chainShowName = 'BNB';
      }
      if (item.title === 'ArbitrumOne') {
        chainShowName = 'Arbitrum';
      }
      if (item.title === 'BNB Greenfield') {
        const chainInfo = EASInfo[chainShowName as keyof typeof EASInfo] as any;
        return `${chainInfo.bucketDetailUrl}/${item.bucketName}`;
      }
      const chainInfo = EASInfo[chainShowName as keyof typeof EASInfo] as any;
      return `${chainInfo?.transactionDetailUrl}/${item.attestationUID}`;
    }, []);
    // useEffect(() => {
    //   handleDeleteCred(credentialsFromStore[]);
    // }, [credentialsFromStore, handleDeleteCred]);

    return (
      <div className="attestationsWrapper">
        <ul className="attestationCards">
          {filterdList.map((i) => {
            return (
              <li className="attestationCard" key={i.name}>
                <div className="cardContent">
                  <div className="header">
                    <PTag
                      text={`${i.attestationType}`}
                      color={ATTESTATIONTYPEMAP[i.attestationType].color}
                    />
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
                      <div
                        onClick={() => {
                          handleShowMore(i);
                        }}
                        onMouseEnter={() => {
                          handleShowMore(i);
                        }}
                        onMouseLeave={handleHideMore}
                        className="moreBtnWrapper"
                      >
                        <PButton
                          className="moreBtn"
                          type="icon"
                          icon={<i className="iconfont icon-iconMore"></i>}
                          onClick={() => {}}
                        />
                        {activeCredId === i.requestid && (
                          <div
                            className="dropdownWrapper"
                            onMouseEnter={() => {
                              handleShowMore(i);
                            }}
                            onMouseLeave={handleHideMore}
                          >
                            <PDropdown
                              list={otherOperationsFn(i)}
                              onClick={handleClickDropdownItem}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="brief">
                    <div className="splicedIcons">
                      <img
                        src={ATTESTATIONTYPEMAP[i.attestationType].icon}
                        alt=""
                      />
                      <img src={getDataSourceMetaInfo(i.source).icon} alt="" />
                    </div>
                    <div className="intro">
                      <div className="name">
                        {getDataSourceMetaInfo(i.source).name}
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
                        <div className="value onChain">
                          <div className="chains">
                            {i.provided?.map((c, k) => (
                              <a
                                href={txDetailUrlFn(c)}
                                target="_blank"
                                rel="noreferrer"
                                key={k}
                              >
                                <img src={c.icon} alt="" />
                              </a>
                            ))}
                          </div>
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
                </div>
              </li>
            );
          })}
        </ul>
        {confirmDeleteDialogVisible && (
          <ConfirmDeleteDialog
            onClose={handleCloseConfirmDeleteDialog}
            onSubmit={handleSubmitConfirmDeleteDialog}
          />
        )}
      </div>
    );
  }
);

export default Cards;
