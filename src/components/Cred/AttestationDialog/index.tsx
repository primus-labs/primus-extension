import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import PMask from '@/components/PMask'
import { DATASOURCEMAP } from '@/utils/constants';
import type { ExchangeMeta } from '@/utils/constants';
import type {DataFieldItem} from '@/components/DataSourceOverview/DataSourcesDialog'
import PSelect from '@/components/PSelect';

import type { UserState } from '@/store/reducers';

import './index.sass';


interface AttestationDialogProps {
  type: string;
  onClose: () => void;
  onSubmit: (item: DataFieldItem) => void;
  onCheck?: () => void;
  // onCancel: () => void
}

const proofDescMap = {
  'Assets Proof': {
    title: 'Assets Proof',
    desc: 'Proof you have a certain amount of assets, which may come from bank deposits or from an crypto exchange balance. PADO uses TLS-MPC to validate your data authenticity.',
    content: 'Assets balance greater than:',
  },
  'Token Holdings': {
    title: 'Token Holdings',
    desc: 'Proof that you hold a certain kind of TOKEN. PADO uses TLS-MPC to validate your data authenticity.',
    content: 'Hold this kind of Token:',
  },
};
const AttestationDialog: React.FC<AttestationDialogProps> = ({
  type,
  onClose,
  onSubmit,
}) => {
  const [activeItem, setActiveItem] = useState<DataFieldItem>();
  const [activeToken, setActiveToken] = useState<string>('');
  const [errorTip, setErrorTip] = useState<string>();
  const exSources = useSelector((state: UserState) => state.exSources);
  const sysConfig = useSelector((state: UserState) => state.sysConfig);
  const tokenLogoPrefix = useMemo(() => {
    return sysConfig.TOKEN_LOGO_PREFIX;
  }, [sysConfig]);
  const activeProof = useMemo(() => {
    return proofDescMap[type as keyof typeof proofDescMap];
  }, [type]);
  const list: DataFieldItem[] = useMemo(() => {
    return Object.keys(exSources).map((key) => {
      const sourceInfo: ExchangeMeta =
        DATASOURCEMAP[key as keyof typeof DATASOURCEMAP];
      const { name, icon, type, requirePassphase } = sourceInfo;
      const infoObj: DataFieldItem = {
        name,
        icon,
        type,
        requirePassphase
      };
      return infoObj;
    });
  }, [exSources]);
  const tokenList = useMemo(() => {
    let list = [];
    if (!activeItem?.name) {
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
      const sourceLowerCaseName = activeItem.name.toLowerCase();
      list = Object.keys(exSources[sourceLowerCaseName].tokenListMap);
    }
    const formatList = list.map((i) => ({
      text: i,
      value: i,
      icon: `${tokenLogoPrefix}icon${i}.png`,
    }));
    return formatList;
  }, [exSources, activeItem, tokenLogoPrefix]);
  const handleChangeSelect = (val: string) => {
    setActiveToken(val)
  };

  const handleClickNext = () => {
    if (!activeItem) {
      setErrorTip('Please select one data source');
      return;
    }
    onSubmit(activeItem);
  };

  const handleClickData = (item: DataFieldItem) => {
    setActiveItem(item);
  };

  return (
    <PMask onClose={onClose}>
      <div className="padoDialog attestationDialog">
        <main>
          <h1>{activeProof.title}</h1>
          <h2>{activeProof.desc}</h2>
          <div className="scrollList">
            <div className="contItem">
              <div className="label">Proof content:</div>
              <div className="value">
                <div className="desc">{activeProof.content}</div>
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
              <div className="label">Source of assets:</div>
              <ul className="dataList">
                {list.map((item) => {
                  return (
                    <li
                      className={
                        activeItem?.name === item.name
                          ? 'networkItem active'
                          : 'networkItem'
                      }
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
            </div>
          </div>
        </main>
        <button className="nextBtn" onClick={handleClickNext}>
          {errorTip && (
            <div className="tipWrapper">
              <div className="errorTip">{errorTip}</div>
            </div>
          )}
          <span>Next</span>
        </button>
      </div>
    </PMask>
  );
};

export default AttestationDialog;
