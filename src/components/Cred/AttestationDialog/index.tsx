import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PMask from '@/components/PMask';
import { DATASOURCEMAP } from '@/utils/constants';
import type { ExchangeMeta } from '@/utils/constants';
import type { DataFieldItem } from '@/components/DataSourceOverview/DataSourcesDialog';
import type { CredTypeItemType } from '@/components/Cred/CredItem';
import PSelect from '@/components/PSelect';
import iconInfoGray from '@/assets/img/iconInfoGray.svg';

import type { UserState } from '@/store/reducers';

import './index.sass';

interface AttestationDialogProps {
  type: string;
  onClose: () => void;
  onSubmit: (
    item: DataFieldItem,
    token: string,
    activeCred?: CredTypeItemType
  ) => void;
  onCheck?: () => void;
  activeCred?: CredTypeItemType;
}

const attestationDescMap = {
  'Assets Proof': {
    title: 'Assets Proof',
    desc: 'Proof you have a certain amount of assets, which may come from bank deposits or from an crypto exchange balance. PADO uses TLS-MPC to validate your data authenticity.',
    content: 'Assets balance greater than',
  },
  'Token Holdings': {
    title: 'Token Holdings',
    desc: 'Proof that you hold a certain kind of TOKEN. PADO uses TLS-MPC to validate your data authenticity.',
    content: 'Hold this kind of Token',
  },
};
const AttestationDialog: React.FC<AttestationDialogProps> = ({
  type,
  onClose,
  onSubmit,
  activeCred,
}) => {
  const navigate = useNavigate();
  const [activeSource, setActiveSource] = useState<DataFieldItem>();
  const [activeToken, setActiveToken] = useState<string>('');
  const [errorTip, setErrorTip] = useState<string>();
  const exSources = useSelector((state: UserState) => state.exSources);
  const sysConfig = useSelector((state: UserState) => state.sysConfig);
  const tokenLogoPrefix = useMemo(() => {
    return sysConfig.TOKEN_LOGO_PREFIX;
  }, [sysConfig]);
  const activeAttestationTypeInfo = useMemo(() => {
    return attestationDescMap[type as keyof typeof attestationDescMap];
  }, [type]);
  const connectedSourceList: DataFieldItem[] = useMemo(() => {
    return Object.keys(exSources).map((key) => {
      const sourceInfo: ExchangeMeta =
        DATASOURCEMAP[key as keyof typeof DATASOURCEMAP];
      const { name, icon, type, requirePassphase } = sourceInfo;
      const infoObj: DataFieldItem = {
        name,
        icon,
        type,
        requirePassphase,
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
      } else if (type === 'Token Holdings' && !activeToken) {
        setErrorTip('Please select one token');
        return;
      } else {
        onSubmit(activeSource as DataFieldItem, activeToken, activeCred);
      }
    }
  };

  const handleClickData = (item: DataFieldItem) => {
    if (activeCred && activeSource) {
      if (activeSource?.name !== item.name) {
        return
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
    (item: DataFieldItem) => {
      let defaultClassName = 'networkItem';
      if (activeCred && activeSource) {
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
    [activeSource, activeSourceList, activeCred]
  );
  useEffect(() => {
    if (activeCred) {
      const sourceInfo = connectedSourceList.find(
        (i) => i.name === activeCred.name
      );
      setActiveSource(sourceInfo);
      if (type === 'Assets Proof') {
        
      } else if (type === 'Token Holdings') {
        activeCred.holdingToken && setActiveToken(activeCred.holdingToken);
      }
    }
  }, [activeCred, type, connectedSourceList]);

  return (
    <PMask onClose={onClose}>
      <div className="padoDialog attestationDialog">
        <main>
          <h1>{activeAttestationTypeInfo.title}</h1>
          <h2>{activeAttestationTypeInfo.desc}</h2>
          <div className="scrollList">
            <div className="contItem">
              <div className="label">Proof content</div>
              <div className="value">
                <div className="desc">{activeAttestationTypeInfo.content}</div>
                {type === 'Assets Proof' && <div className="con">$1,000</div>}
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
