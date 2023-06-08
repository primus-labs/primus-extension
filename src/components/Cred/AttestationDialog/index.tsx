import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PMask from '@/components/PMask';
import { DATASOURCEMAP } from '@/config/constants';
import type { ExchangeMeta } from '@/config/constants';
import { formatNumeral } from '@/utils/utils';

import type { DataFieldItem } from '@/components/DataSourceOverview/DataSourcesDialog';
import type { CredTypeItemType } from '@/components/Cred/CredItem';
import PSelect from '@/components/PSelect';
import iconInfoGray from '@/assets/img/iconInfoGray.svg';
import type { UserState, PROOFTYPEITEM } from '@/store/reducers';
import useUpdateAssetSource from '@/hooks/useUpdateAssetSources';
import { setExSourcesAsync } from '@/store/actions';
import type { Dispatch } from 'react';
import iconGreater from '@/assets/img/iconGreater.svg';

import './index.sass';

export type AttestionForm = {
  token?: string;
  baseValue?: string;
  source: string;
  type: string;
  exUserId?: string;
  label?: string;
  requestid?: string;
};
interface AttestationDialogProps {
  type: string;
  onClose: () => void;
  onSubmit: (form: AttestionForm, activeCred?: CredTypeItemType) => void;
  onCheck?: () => void;
  activeCred?: CredTypeItemType;
  activeSourceName?: string;
}
type ConnectSourceType = {
  name: string;
  icon: any;
  exUserId?: string;
  label?: string;
};

const AttestationDialog: React.FC<AttestationDialogProps> = ({
  type,
  onClose,
  onSubmit,
  activeCred,
  activeSourceName,
}) => {
  const dispatch: Dispatch<any> = useDispatch();
  const [fetchExDatasLoading, fetchExDatas] = useUpdateAssetSource();
  const navigate = useNavigate();
  const [activeSource, setActiveSource] = useState<ConnectSourceType>();
  const [activeToken, setActiveToken] = useState<string>('');
  const [activeBaseValue, setActiveBaseValue] = useState<string>('');
  const [errorTip, setErrorTip] = useState<string>();
  const exSources = useSelector((state: UserState) => state.exSources);
  const sysConfig = useSelector((state: UserState) => state.sysConfig);
  const proofTypes = useSelector((state: UserState) => state.proofTypes);
  const tokenLogoPrefix = useMemo(() => {
    return sysConfig.TOKEN_LOGO_PREFIX;
  }, [sysConfig]);
  const activeAttestationTypeInfo = useMemo(() => {
    const obj = proofTypes.find((i) => i.credTitle === type);
    return obj as PROOFTYPEITEM;
  }, [type, proofTypes]);
  const connectedSourceList: ConnectSourceType[] = useMemo(() => {
    return Object.keys(exSources).map((key) => {
      const sourceInfo: ExchangeMeta =
        DATASOURCEMAP[key as keyof typeof DATASOURCEMAP];
      const { name, icon } = sourceInfo;
      const { exUserId, label } = exSources[key];
      const infoObj: ConnectSourceType = {
        name,
        icon,
        exUserId,
        label,
      };
      return infoObj;
    });
  }, [exSources]);
  const tokenList = useMemo(() => {
    let list = [];
    if (!activeSource?.name) {
      const reduceF = (prev: string[], curr: any) => {
        const { tokenListMap } = curr;
        const curTokenList = Object.keys(tokenListMap);
        prev.concat([...curTokenList]);
        curTokenList.forEach((token) => {
          if (!prev.includes(token)) {
            prev.push(token);
          }
        });
        return prev;
      };
      list = Object.values(exSources).reduce(reduceF, []);
    } else {
      const sourceLowerCaseName = activeSource.name.toLowerCase();
      list = Object.keys(exSources[sourceLowerCaseName].tokenListMap);
    }
    const formatList = list.map((i) => ({
      text: i,
      value: i,
      icon: `${tokenLogoPrefix}icon${i}.png`,
    }));
    return formatList;
  }, [exSources, activeSource, tokenLogoPrefix]);
  const activeSourceList = useMemo(() => {
    if (activeToken) {
      const reduceF = (prev: string[], curr: any) => {
        const { tokenListMap, name } = curr;
        const curTokenList = Object.keys(tokenListMap);
        if (curTokenList.includes(activeToken)) {
          prev.push(name);
        }
        return prev;
      };
      const alist = Object.values(exSources).reduce(reduceF, []);
      return alist;
    } else {
      return [];
    }
  }, [exSources, activeToken]);
  const handleChangeSelect = (val: string) => {
    if (!val) {
      setActiveSource(undefined);
    }
    setActiveToken(val);
  };

  const handleClickNext = () => {
    if (connectedSourceList.length === 0) {
      navigate('/datas');
    }

    if (connectedSourceList.length > 0) {
      if (!activeSource) {
        setErrorTip('Please select one data source');
        return;
      }
      const form: AttestionForm = {
        source: activeSource.name.toLowerCase(),
        type,
        exUserId: activeSource?.exUserId,
        label: activeSource?.label,
      };

      if (type === 'Token Holdings') {
        if (!activeToken) {
          setErrorTip('Please select one token');
          return;
        } else {
          form.token = activeToken;
        }
      }
      if (type === 'Assets Proof') {
        if (!activeBaseValue) {
          setErrorTip('Please select one baseValue');
          return;
        } else {
          form.baseValue = activeBaseValue;
        }
      }
      if (activeCred?.requestid) {
        form.requestid = activeCred?.requestid;
        onSubmit(form, activeCred);
      } else {
        onSubmit(form);
      }
    }
  };

  const handleClickData = (item: ConnectSourceType) => {
    if ((activeCred || activeSourceName) && activeSource) {
      if (activeSource?.name !== item.name) {
        return;
      }
    }
    if (
      (activeSourceList.length > 0 &&
        activeSourceList.includes(item.name) &&
        !activeSource) ||
      activeSourceList.length === 0
    ) {
      setActiveSource(item);
    }
  };
  const liClassNameCallback = useCallback(
    (item: ConnectSourceType) => {
      let defaultClassName = 'networkItem';
      if ((activeCred || activeSourceName) && activeSource) {
        if (activeSource?.name !== item.name) {
          defaultClassName += ' disabled';
        }
      } else {
        if (activeSourceList.length > 0) {
          if (activeSourceList.includes(item.name) && !activeSource) {
            defaultClassName += ' excitable';
          } else {
            defaultClassName += ' disabled';
          }
        }
      }
      if (activeSource?.name === item.name) {
        defaultClassName += ' active';
      }
      return defaultClassName;
    },
    [activeSource, activeSourceList, activeCred, activeSourceName]
  );
  useEffect(() => {
    if (activeCred) {
      const sourceInfo = connectedSourceList.find(
        (i) => i.name.toLowerCase() === activeCred.source.toLowerCase()
      );
      setActiveSource(sourceInfo);
      if (type === 'Assets Proof') {
      } else if (type === 'Token Holdings') {
        activeCred.holdingToken && setActiveToken(activeCred.holdingToken);
      }
    }
  }, [activeCred, type, connectedSourceList]);
  useEffect(() => {
    if (activeSourceName) {
      const sourceInfo = connectedSourceList.find(
        (i) => i.name.toLowerCase() === activeSourceName.toLowerCase()
      );
      setActiveSource(sourceInfo);
    }
  }, [activeSourceName, connectedSourceList]);
  useEffect(() => {
    if (activeAttestationTypeInfo.credTitle === 'Assets Proof') {
      const baseValArr = JSON.parse(
        activeAttestationTypeInfo.credProofConditions
      );
      if (baseValArr.length === 1) setActiveBaseValue(baseValArr[0]);
    }
  }, [activeAttestationTypeInfo]);
  useEffect(() => {
    if (activeSource) {
      const sourceLowerCaseName = activeSource.name.toLowerCase();
      (fetchExDatas as (name: string) => void)(sourceLowerCaseName);
    }
  }, [activeSource, fetchExDatas]);
  useEffect(() => {
    !fetchExDatasLoading && dispatch(setExSourcesAsync());
  }, [fetchExDatasLoading, dispatch]);
  return (
    <PMask onClose={onClose}>
      <div className="padoDialog attestationDialog">
        <main>
          <h1>{activeAttestationTypeInfo.credTitle}</h1>
          <h2>{activeAttestationTypeInfo.credDetails}</h2>
          <div className="scrollList">
            <div className="contItem">
              <div className="label">Proof content</div>
              <div className="value">
                <div className="desc">
                  {activeAttestationTypeInfo.credProofContent}
                  {type === 'Assets Proof' && (
                    <img src={iconGreater} className="iconGreater" alt="" />
                  )}
                </div>
                {type === 'Assets Proof' && (
                  <div className="con">
                    $
                    {activeBaseValue
                      ? formatNumeral(activeBaseValue, {
                          decimalPlaces: 0,
                        })
                      : ''}
                  </div>
                )}
                {type === 'Token Holdings' && (
                  <div className="pSelectWrapper">
                    <PSelect
                      showIcon={true}
                      options={tokenList}
                      onChange={handleChangeSelect}
                      val={activeToken}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="contItem contItemAssets">
              <div className="label">Source of assets</div>
              {connectedSourceList.length > 0 && (
                <ul className="dataList">
                  {connectedSourceList.map((item) => {
                    return (
                      <li
                        className={liClassNameCallback(item)}
                        key={item.name}
                        onClick={() => {
                          handleClickData(item);
                        }}
                      >
                        <img src={item.icon} alt="" />
                        <h6>{item.name}</h6>
                      </li>
                    );
                  })}
                </ul>
              )}
              {connectedSourceList.length === 0 && (
                <div className="emptyContent">
                  <img src={iconInfoGray} alt="" />
                  <h2>
                    You haven’t connected any data sources yet. Please go to the
                    Data page to add some.
                  </h2>
                </div>
              )}
            </div>
          </div>
        </main>
        {connectedSourceList.length === 0 ? (
          <button className="nextBtn gray" onClick={handleClickNext}>
            <span>OK</span>
          </button>
        ) : (
          <button className="nextBtn" onClick={handleClickNext}>
            {errorTip && (
              <div className="tipWrapper">
                <div className="errorTip">{errorTip}</div>
              </div>
            )}
            <span>Next</span>
          </button>
        )}
      </div>
    </PMask>
  );
};

export default AttestationDialog;
