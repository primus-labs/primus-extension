import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';

import dayjs from 'dayjs';
import { utils } from 'ethers';
import { getCurrentDate, formatAddress } from '@/utils/utils';
import { setCredentialsAsync, setActiveOnChain } from '@/store/actions';
import { getUserInfo } from '@/services/api/achievements';
import useDataSource from '@/hooks/useDataSource';
import useAllSources from '@/hooks/useAllSources';
import { compareVersions } from '@/utils/utils';
import { ETHSIGNEVENTNAME, eventMetaMap } from '@/config/events';
import { DATASOURCEMAP } from '@/config/dataSource';
import { PADOADDRESS } from '@/config/envConstants';
import { EASInfo, CURENV } from '@/config/chain';
import {
  ATTESTATIONTYPEMAP,
  ASSETSVERIFICATIONCONTENTTYPEEMAP,
  ALLVERIFICATIONCONTENTTYPEEMAP,
} from '@/config/attestation';

import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';
// import type { CredTypeItemType } from '@/types/cred';

import ShareComponent from '@/newComponents/Ahievements/ShareComponent';
import PTag from '@/newComponents/PTag';
import PButton from '@/newComponents/PButton';
import PDropdown from '@/newComponents/PDropdown';
// import iconUpdate from '@/assets/newImg/layout/iconUpdate.svg';
import ConfirmDeleteDialog from '../ConfirmDeleteDialog';
import SplicedIcons from '@/newComponents/SplicedIcons';
import './index.scss';
import iconProviderBrevis from '@/assets/newImg/zkAttestation/iconProviderBrevis.svg';
import useAssetsStatistic from '@/hooks/useAssetsStatistic';
import testModeTag from '@/assets/newImg/zkAttestation/testModeTag.svg';
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
    const { tokenIconFn } = useAssetsStatistic();
    const dispatch: Dispatch<any> = useDispatch();
    const navigate = useNavigate();
    const [activeDataSourceName, setActiveDataSourceName] =
      useState<string>('');
    const [confirmDeleteDialogVisible, setConfirmDeleteDialogVisible] =
      useState<boolean>(false);
    const [activeCredId, setActiveCredId] = useState<string>();
    const [visibleShareDiag, setVisibleShareDiag] = useState<boolean>(false);
    const [shareType, setShareType] = useState('certificate');
    const [totalScore, setTotalScore] = useState(0);
    const [referralCode, setRefferralCode] = useState('');

    const credentialsFromStore = useSelector(
      (state: UserState) => state.credentials
    );

    const sysConfig = useSelector((state: UserState) => state.sysConfig);
    const theme = useSelector((state: UserState) => state.theme);
    // console.log('222credentialsFromStore', credentialsFromStore); //delete
    const attestationQueryStr = useSelector(
      (state: UserState) => state.attestationQueryStr
    );
    const attestationQueryType = useSelector(
      (state: UserState) => state.attestationQueryType
    );

    const filterdList: any = useMemo(() => {
      const obj = { ...credentialsFromStore };

      var newList = Object.values(obj).filter((a: any) => {
        return (
          a.source in DATASOURCEMAP && a.attestationType in ATTESTATIONTYPEMAP
        );
      });
      newList = newList.sort((a: any, b: any) => {
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
      console.log('222credentialsFromStore-compatible-sorted', newList);
      return newList;
    }, [credentialsFromStore, attestationQueryStr, attestationQueryType]);
    const isDisableMoreFn = useCallback((i) => {
      const isDeleteDisable =
        (i?.provided?.length && i?.provided?.length > 0) || i.event;
      return isDeleteDisable;
    }, []);
    const otherOperationsFn = useCallback(
      (i) => {
        const isDeleteDisable = isDisableMoreFn(i);
        return [
          {
            value: 'Delete',
            label: 'Delete',
            disabled: isDeleteDisable,
          },
          // {
          //   value: 'Bind to DID',
          //   label: 'Bind to DID',
          //   disabled: true,
          // },
        ];
      },
      [isDisableMoreFn]
    );
    const formatDate = (timestamp) => {
      return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
    };
    const getDataSourceMetaInfo = (source) => {
      return DATASOURCEMAP[source];
    };
    const getContent = (i) => {
      let str = i.verificationContent;
      if (
        ['Assets Verification', 'On-chain Transactions'].includes(
          i.attestationType
        )
      ) {
        str = ALLVERIFICATIONCONTENTTYPEEMAP[i.verificationContent].label;
      }
      // if (i.attestationType === 'Assets Verification') {
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
      if (i.attestationType === 'Assets Verification') {
        if (
          ['Assets Proof', 'Spot 30-Day Trade Vol'].includes(
            i.verificationContent
          )
        ) {
          str = `> $${i.verificationValue}`;
        } else if (i.verificationContent === 'Token Holding') {
          const dataSourceIconSrc = tokenIconFn(
            { symbol: i.verificationValue },
            i.dataSourceId ?? i.source
          );
          str = (
            <>
              <img src={dataSourceIconSrc} className="dataSourceIcon" alt="" />
              <span>{i.verificationValue}</span>
            </>
          );
        }
      } else if (i.attestationType === 'Social Connections') {
        if (i.verificationContent === 'X Followers') {
          str = `> ${i.verificationValue}`;
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
      if (['coinbase', 'google', 'discord', 'web3 wallet'].includes(i.source)) {
        return 'Verified';
      }
      if (i.attestationType === 'Social Connections') {
        if (i.verificationContent === 'X Followers') {
          if (i.event === ETHSIGNEVENTNAME) {
            if (i.verificationValue === '1') {
              return 'Get Started';
            }
            if (i.verificationValue === '500') {
              return 'Famous';
            }
          }
        }
      }
      return i?.uiTemplate?.condition ?? 'Verified';
    };
    const handleOnChain = useCallback(
      (i) => {
        dispatch(setActiveOnChain({ loading: 1, requestid: i.requestid }));
      },
      [dispatch]
    );
    const handleShare = useCallback((i) => {
      setActiveCredId(i.requestid);
      setVisibleShareDiag(true);
    }, []);
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

    const txDetailUrlFn = useCallback((item: any, currentCred) => {
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
      if (item.title === 'opBNB') {
        const chainInfo = EASInfo[chainShowName as keyof typeof EASInfo] as any;
        const compareRes = compareVersions('1.0.3', currentCred.credVersion);
        if (compareRes > -1) {
          // old version <= 1.0.3
          return `${chainInfo?.transactionDetailUrl}/${item.attestationUID}`;
        } else {
          return `${chainInfo.bucketDetailUrl}${item.attestationUID}`;
        }
      }
      const chainInfo = EASInfo[chainShowName as keyof typeof EASInfo] as any;
      return `${chainInfo?.transactionDetailUrl}/${item.attestationUID}`;
    }, []);
    // useEffect(() => {
    //   handleDeleteCred(credentialsFromStore[]);
    // }, [credentialsFromStore, handleDeleteCred]);
    const handleSharePageClose = () => {
      setActiveCredId(undefined);
      setVisibleShareDiag(false);
    };
    const getUserInfoFn = async () => {
      const res = await getUserInfo();
      const { rc, result } = res;
      if (rc === 0) {
        setRefferralCode(result.referralCode);
        setTotalScore(result.totalScore);
      }
    };
    useEffect(() => {
      getUserInfoFn();
    }, []);

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
                        icon={<i className="iconfont icon-iconShareActive"></i>}
                        onClick={() => {
                          handleShare(i);
                        }}
                      />
                      {/* <div title="Copy link to share">
                        <PButton
                          className="copyBtn"
                          type="icon"
                          icon={<i className="iconfont icon-iconCopy"></i>}
                          onClick={() => {
                            handleCopy(i);
                          }}
                        />
                      </div> */}
                      <div
                        onClick={() => {
                          handleShowMore(i);
                        }}
                        onMouseEnter={() => {
                          handleShowMore(i);
                        }}
                        onMouseLeave={handleHideMore}
                        className={
                          i.event || i?.provided?.length > 0
                            ? 'moreBtnWrapper'
                            : 'moreBtnWrapper withHover'
                        }
                      >
                        <PButton
                          className="moreBtn"
                          type="icon"
                          icon={<i className="iconfont icon-iconMore"></i>}
                          onClick={() => {}}
                          disabled={isDisableMoreFn(i)}
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
                    <div className="left">
                      <SplicedIcons
                        list={[
                          ATTESTATIONTYPEMAP[i.attestationType]?.icon[theme],
                          getDataSourceMetaInfo(i.source)?.icon,
                        ]}
                      />
                      <div className="intro">
                        <div className="name">
                          {getDataSourceMetaInfo(i.source).name}
                        </div>
                        <div className="updateTime">
                          <span> {formatDate(Number(i?.getDataTime))}</span>
                          {/* <img src={iconUpdate} alt="" className="iconUpdate" /> */}
                        </div>
                      </div>
                    </div>
                    {i.source === 'web3 wallet' && (
                      <div className="provider">
                        <span>by</span>
                        <img src={iconProviderBrevis} alt="" />
                        <span>Brevis</span>
                      </div>
                    )}
                  </div>
                  <div className="details">
                    <div className="descItems">
                      <div className="descItem">
                        <div className="label">Content</div>
                        <div className="value longValue">{getContent(i)}</div>
                      </div>
                      <div className="descItem">
                        <div className="label">Condition</div>
                        <div className="value">{getValue(i)}</div>
                      </div>
                      <div className="descItem">
                        <div className="label">Result</div>
                        <div className="value">{getResult(i)}</div>
                      </div>
                    </div>
                    <div className="descItems descItemsWithNumberValue">
                      <div className="descItem">
                        <div className="label">Data account</div>
                        <div className="value">
                          {/* {i.attestationType === 'On-chain Transactions'
                            ? formatAddress(
                                utils.getAddress(i.address),
                                7,
                                5,
                                '...'
                              )
                            : i.account
                            ? `${i.dataSourceId === 'x' ? '@' : ''}${i.account}`
                            : i.sourceUseridHash} */}
                          {i.attestationType === 'On-chain Transactions'
                            ? formatAddress(
                                utils.getAddress(i.address),
                                7,
                                5,
                                '...'
                              )
                            : i.account
                            ? i.account
                            : i.sourceUseridHash}
                        </div>
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
                            {!i.attestOrigin &&
                              (i.event
                                ? `(${
                                    eventMetaMap[i.event]?.nameInAttestation
                                  })`
                                : i?.provided?.length > 0
                                ? `(${i?.provided?.length})`
                                : '')}
                          </span>
                          {i.attestOrigin && '('}
                          <span className="attestOrigin">{i.attestOrigin}</span>
                          {i.attestOrigin && ')'}
                        </div>
                        <div className="value onChain">
                          {/* <span>12345466789111</span> */}
                          <div className="chains">
                            {i.provided?.map((c, k) => (
                              <a
                                href={txDetailUrlFn(c, i)}
                                target="_blank"
                                rel="noreferrer"
                                key={k}
                              >
                                <img src={c.icon} alt="" />
                              </a>
                            ))}
                          </div>
                          {!(
                            CURENV === 'production' &&
                            [
                              'Scroll Sepolia',
                              'Sepolia',
                              'BSCTestnet',
                              'opBNBTestnet',
                            ].includes(i.chainName)
                          ) &&
                            i.type !== 'ASSETS_PROOF' &&
                            i.type !== 'TOKEN_HOLDINGS' &&
                            !(i.event && i?.provided?.length > 0) && (
                              <PButton
                                icon={<i className="iconfont icon-Add"></i>}
                                type="icon"
                                onClick={() => {
                                  handleOnChain(i);
                                }}
                              />
                            )}
                          {CURENV === 'production' &&
                            [
                              'Scroll Sepolia',
                              'Sepolia',
                              'BSCTestnet',
                              'opBNBTestnet',
                            ].includes(i.chainName) && (
                              <img className="testModeTag" src={testModeTag} />
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
        {visibleShareDiag && (
          <ShareComponent
            onClose={handleSharePageClose}
            shareType={shareType}
            scoreShareProps={{
              score: totalScore,
              referralCode,
              attestationType:
                credentialsFromStore[activeCredId as string].attestationType,
            }}
          />
        )}
      </div>
    );
  }
);

export default Cards;
