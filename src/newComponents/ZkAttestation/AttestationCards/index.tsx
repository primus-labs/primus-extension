import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

import dayjs from 'dayjs';
import { utils } from 'ethers';
import { getCurrentDate, formatAddress } from '@/utils/utils';
import { setCredentialsAsync, setActiveOnChain } from '@/store/actions';
import useDataSource from '@/hooks/useDataSource';
import useAllSources from '@/hooks/useAllSources';
import { BASEVENTNAME, eventMetaMap } from '@/config/events';
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
import SplicedIcons from '@/newComponents/SplicedIcons';
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

      var newList = Object.values(obj).sort((a: any, b: any) => {
        return b.getDataTime - a.getDataTime;
      });
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
      const isDeleteDisable =
        (i?.provided?.length && i?.provided?.length > 0) || i.event;
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
      let str = i.verificationContent;
      if (
        i.attestationType === 'Assets Certification' &&
        i.verificationContent === 'Assets Proof'
      ) {
        str = 'Asset balance';
      }
      // if (i.attestationType === 'Assets Certification') {
      //   if (i.verificationContent === 'Assets Proof') {
      //     str = 'Asset balance';
      //   } else if (i.verificationContent === 'Token Holding') {
      //     str = i.verificationContent;
      //   }
      // } else if (i.attestationType === 'Humanity Verification') {
      //   if (i.verificationContent === 'KYC Status') {
      //     str = i.verificationContent;
      //   } else if (i.verificationContent === 'Account ownership') {
      //     str = i.verificationContent;
      //   }
      // }
      return str;
    };
    const getValue = (i) => {
      let str: any = i.verificationValue;
      if (i.attestationType === 'Assets Certification') {
        if (i.verificationContent === 'Assets Proof') {
          str = `> $${i.verificationValue}`;
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
      // else if (i.attestationType === 'Humanity Verification') {
      //   if (i.verificationContent === 'KYC Status') {
      //     str = i.verificationValue;
      //   } else if (i.verificationContent === 'Account ownership') {
      //     str = i.verificationValue;
      //   }
      // }
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
      delete cObj[curRequestid];
      await chrome.storage.local.set({
        credentials: JSON.stringify(cObj),
      });
      await initCredList();
    }, [initCredList, credentialsFromStore, activeCredId]);
    const handleHideMore = () => {
      // setActiveCredId(undefined);
    };
    const handleClickDropdownItem = useCallback(
      (operation: string, i) => {
        setActiveCredId(i.requestid);
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
                      color={ATTESTATIONTYPEMAP[i.attestationType]?.color}
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
                       
                          <div
                            className="dropdownWrapper"
                            onMouseEnter={() => {
                              handleShowMore(i);
                            }}
                            onMouseLeave={handleHideMore}
                          >
                            <PDropdown
                              list={otherOperationsFn(i)}
                              onClick={(operationType) => {
                                handleClickDropdownItem(operationType, i);
                              }}
                            />
                          </div>
                        
                      </div>
                    </div>
                  </div>
                  <div className="brief">
                    <SplicedIcons
                      list={[
                        ATTESTATIONTYPEMAP[i.attestationType]?.icon,
                        getDataSourceMetaInfo(i.source)?.icon,
                      ]}
                    />
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
                        <div className="label">Data account</div>
                        <div className="value">{i.account}</div>
                      </div>
                      <div className="descItem">
                        <div className="label">Create address</div>
                        <div className="value">
                          {formatAddress(
                            utils.getAddress(i.address),
                            7,
                            5,
                            '...'
                          )}
                        </div>
                      </div>
                      <div className="descItem">
                        <div className="label">Attest address</div>
                        <div className="value">
                          {formatAddress(
                            utils.getAddress(PADOADDRESS),
                            7,
                            5,
                            '...'
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="descItems">
                      <div className="descItem onChain">
                        <div className="label">
                          <span>On-chain</span>

                          <span>
                            {i.event
                              ? `(${eventMetaMap[i.event].nameInAttestation})`
                              : ''}
                          </span>
                        </div>
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
                          {!(i.event && i?.provided?.length > 0) && (
                            <PButton
                              icon={<i className="iconfont icon-Add"></i>}
                              type="icon"
                              onClick={() => {
                                handleOnChain(i);
                              }}
                            />
                          )}
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
