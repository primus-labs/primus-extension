import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { WALLETLIST } from '@/config/constants';
import type { WALLETITEMTYPE } from '@/config/constants';
import SourceGroup from '@/components/DataSourceOverview/SourceGroups/SourceGroup';
import PTabsNew from '@/components/PTabsNew';
import PButton from '@/components/PButton';
import WebDataSourceList from '@/components/WebDataSourceList';
import PBack from '@/components/PBack';
import PMask from '@/components/PMask';
import PSelect from '@/components/PSelect';
import PBottomErrorTip from '@/components/PBottomErrorTip';
import { DATASOURCEMAP } from '@/config/constants';
import { formatNumeral } from '@/utils/utils';
import iconGreater from '@/assets/img/iconGreater.svg';
import iconInfoGray from '@/assets/img/iconInfoGray.svg';
import iconWalletMetamask from '@/assets/img/iconWalletMetamask.svg';
import iconWebDataSource from '@/assets/img/credit/iconWebDataSource.svg';
import iconWebDataSourceBiance from '@/assets/img/credit/iconWebDataSourceBiance.svg';
import iconWebDataSourceCoinbase from '@/assets/img/credit/iconWebDataSourceCoinbase.svg';
import iconWebDataSourceOKX from '@/assets/img/credit/iconWebDataSourceOKX.svg';
import type { CredTypeItemType } from '@/types/cred';
import type { ExchangeMeta } from '@/types/dataSource';
import type { UserState } from '@/types/store';
import type { ConnectSourceType } from '@/types/dataSource';
import type { PROOFTYPEITEM, AttestionForm } from '@/types/cred';
import type { TabItem } from '@/components/PTabsNew';
import './index.scss';

interface AttestationDialogProps {
  type: string;
  onClose: () => void;
  onSubmit: (form: AttestionForm) => void;
  onCheck?: () => void;
  activeCred?: CredTypeItemType;
  activeSourceName?: string;
  onBack?: () => void;
  activeType?: string;
}
const supportAssetCredList = ['binance', 'okx'];
const supportTokenCredList = ['binance', 'okx', 'coinbase'];
const sourcesLabel = {
  ASSETS_PROOF: 'Assets',
  TOKEN_HOLDINGS: 'Tokens',
  IDENTIFICATION_PROOF: 'Identity',
  UNISWAP_PROOF: 'Assets',
};
const fromEventsMap = {
  Badges: 'Webpage Data',
  NFTs: 'API Data',
  LINEA_DEFI_VOYAGE: 'Webpage Data',
};
const tabList: TabItem[] = [
  {
    text: 'API Data',
    tooltip: 'Data you connected from the Data Page',
  },
  {
    text: 'Webpage Data',
  },
];

const AttestationDialog: React.FC<AttestationDialogProps> = memo(
  ({
    type,
    onClose,
    onSubmit,
    activeCred,
    activeSourceName = '',
    onBack,
    activeType = '',
  }) => {
    const [refreshWebList, setRefreshWebList] = useState<boolean>(false);
    const [searchParams] = useSearchParams();
    const fromEvents = searchParams.get('fromEvents');
    const [activeWebDataSource, setActiveWebDataSource] =
      useState<string>(activeSourceName);
    const [activeTab, setActiveTab] = useState<string>('API Data');
    const [activeIdentityType, setActiveIdentityType] =
      useState<string>(activeType);
    const [activeSource, setActiveSource] = useState<ConnectSourceType>();
    const [activeToken, setActiveToken] = useState<string>('');
    const [activeBaseValue, setActiveBaseValue] = useState<string>('');
    const [errorTip, setErrorTip] = useState<string>();

    const exSources = useSelector((state: UserState) => state.exSources);
    const kycSources = useSelector((state: UserState) => state.kycSources);
    const sysConfig = useSelector((state: UserState) => state.sysConfig);
    const proofTypes = useSelector((state: UserState) => state.proofTypes);
    const walletAddress = useSelector(
      (state: UserState) => state.walletAddress
    );
    const webProofTypes = useSelector(
      (state: UserState) => state.webProofTypes
    );
    const activeWebProofTypes = useMemo(() => {
      // return webProofTypes.filter((i) => i.category === 'IDENTIFICATION_PROOF');
      let newArr: any[] = [];
      webProofTypes.forEach((r: any) => {
        const existObj = newArr.find((i) => i.id === r.id);
        if (!existObj && r.category === 'IDENTIFICATION_PROOF') {
          newArr.push(r);
        }
      });
      return newArr;
    }, [webProofTypes]);

    const navigate = useNavigate();
    const identityList = useMemo(() => {
      const newArr: any = [];
      const l = activeWebProofTypes.map((r) => {
        let obj: any = {
          value: r.name,
          text: r.name,
        };
        if (fromEvents === 'LINEA_DEFI_VOYAGE') {
          if (r.name !== 'KYC Status') {
            obj.disabled = true;
          }
        }
        const isExist = newArr.find((i: any) => i.value === obj.value);
        if (!isExist) {
          newArr.push(obj);
        }
        return obj;
      });

      return newArr;
    }, [activeWebProofTypes, fromEvents]);
    useEffect(() => {
      if (identityList.length === 1) {
        setActiveIdentityType(identityList[0].value);
      }
    }, [identityList]);
    const webDataSourceList = useMemo(() => {
      let l: any = [
        // {
        //   name: 'coinbase',
        //   icon: iconWebDataSourceCoinbase,
        //   disabled: true,
        // },
        {
          name: 'okx',
          icon: iconWebDataSourceOKX,
          disabled: true,
        },
      ];
      webProofTypes.forEach((r:any) => {
        const existIdx = l.findIndex((i: any) => i.name === r.dataSource);
        const isFromLINEA_DEFI_VOYAGE =
          fromEvents === 'LINEA_DEFI_VOYAGE' && r.dataSource === 'binance';
        if (existIdx < 0) {
          l.unshift({
            name: r.dataSource,
            icon: r.bgImg,
            disabled: fromEvents === 'LINEA_DEFI_VOYAGE' ? r.dataSource !== 'binance' :r.name !== activeIdentityType,
          });
        } else {
          if (l[existIdx].disabled) {
            l.splice(existIdx, 1);
            l.unshift({
              name: r.dataSource,
              icon: r.bgImg,
              disabled:
                fromEvents === 'LINEA_DEFI_VOYAGE'
                  ? r.dataSource !== 'binance'
                  : r.name !== activeIdentityType,
            });
          }
        }
      });
      // l = [...new Set(l)]
      l = l.sort((a: any, b: any) => a.disabled - b.disabled);
      const disabledArr = l.filter((a: any) => a.disabled).sort((a: any, b: any) => (a.name + '').localeCompare(b.name + ''));
      const abledArr = l
        .filter((a: any) => !a.disabled)
        .sort((a: any, b: any) => (a.name + '').localeCompare(b.name + ''));
      return [...abledArr,...disabledArr];
    }, [webProofTypes, activeIdentityType, fromEvents]);
    const activeWebTemplate = useMemo(() => {
      const aWT = activeWebProofTypes.find((i) => {
        if (fromEvents === 'LINEA_DEFI_VOYAGE') {
          return i.id === '1'; // binance KYC
        }
        if (activeCred) {
          return i.id === activeCred?.templateId;
        }
        if (activeType && activeWebDataSource) {
          return i.name === activeType && i.dataSource === activeWebDataSource;
        }
        return false;
      });
      return aWT;
    }, [
      activeWebProofTypes,
      activeCred,
      fromEvents,
      activeType,
      activeWebDataSource,
    ]);
    const activeWebDataSourceObj = useMemo(() => {
      const obj = webDataSourceList.find(
        (i: any) => i.name === activeWebTemplate?.dataSource
      );
      return obj
    }, [activeWebTemplate, webDataSourceList]);
    const emptyCon = useMemo(() => {
      let el;
      switch (type) {
        case 'ASSETS_PROOF':
          el = (
            <div className="emptyTips">
              <p>You haven’t connected data from Binance and OKX.</p>
              <p>Please go to the Data page to add.</p>
            </div>
          );
          break;
        case 'TOKEN_HOLDINGS':
          el = (
            <div className="emptyTips">
              <p>You haven’t connected data from Binance, Coinbase, and OKX.</p>
              <p>Please go to the Data page to add.</p>
            </div>
          );
          break;
        case 'IDENTIFICATION_PROOF':
          el = (
            <div className="emptyTips">
              <p>You haven’t connected any identity data.</p>
              <p>Please go to the Data page to add.</p>
            </div>
          );
          break;
      }
      return el;
    }, [type]);
    const tokenLogoPrefix = useMemo(() => {
      return sysConfig.TOKEN_LOGO_PREFIX;
    }, [sysConfig]);
    const activeAttestationTypeInfo = useMemo(() => {
      const obj = proofTypes.find((i:any) => i.credIdentifier === type);
      return obj as PROOFTYPEITEM;
    }, [type, proofTypes]);
    const connectedExSourceList: ConnectSourceType[] = useMemo(() => {
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
    const connectedKYCSourceList: ConnectSourceType[] = useMemo(() => {
      return Object.keys(kycSources).map((key) => {
        const sourceInfo: ExchangeMeta =
          DATASOURCEMAP[key as keyof typeof DATASOURCEMAP];
        const { name, icon } = sourceInfo;
        const { exUserId, label } = kycSources[key];
        const infoObj: ConnectSourceType = {
          name,
          icon,
          exUserId,
          label,
        };
        return infoObj;
      });
    }, [kycSources]);
    const activeConnectedSourceList: ConnectSourceType[] = useMemo(() => {
      if (type === 'IDENTIFICATION_PROOF') {
        if (
          !activeIdentityType ||
          (activeIdentityType && activeIdentityType === 'KYC Status')
        ) {
          return connectedKYCSourceList;
        } else {
          return [];
        }
      } else if (type === 'ASSETS_PROOF') {
        return connectedExSourceList.filter((i) =>
          supportAssetCredList.includes(i.name.toLowerCase())
        );
      } else if (type === 'TOKEN_HOLDINGS') {
        return connectedExSourceList.filter((i) =>
          supportTokenCredList.includes(i.name.toLowerCase())
        );
      } else if (type === 'UNISWAP_PROOF') {
        return WALLETLIST.filter((i: WALLETITEMTYPE) => !i.disabled);
      } else {
        return connectedExSourceList;
      }
    }, [
      connectedExSourceList,
      connectedKYCSourceList,
      type,
      activeIdentityType,
    ]);
    const tokenList = useMemo(() => {
      let list: string[] = [];
      if (type !== 'TOKEN_HOLDINGS') {
        return [];
      }
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
    }, [exSources, activeSource, tokenLogoPrefix, type]);
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
    const baseValueArr = useMemo(() => {
      if (activeAttestationTypeInfo.credIdentifier === 'ASSETS_PROOF') {
        const baseValArr = JSON.parse(
          activeAttestationTypeInfo.credProofConditions
        );
        return baseValArr;
      } else {
        return [];
      }
    }, [activeAttestationTypeInfo]);
    const baseValueList = useMemo(() => {
      return baseValueArr.map((i: string) => {
        return {
          text: '$' + i,
          value: i,
        };
      });
    }, [baseValueArr]);
    const formatTabList = useMemo(() => {
      if (fromEvents) {
        const newList = tabList.map((i) => {
          if (
            i.text !== fromEventsMap[fromEvents as keyof typeof fromEventsMap]
          ) {
            i.disabled = true;
          }
          return i;
        });
        return newList;
      } else {
        const newList = tabList.map((i) => {
          if (activeCred) {
            if (activeCred?.reqType === 'web') {
              if (i.text !== 'Webpage Data') {
                i.disabled = true;
              }
            } else {
              if (i.text === 'Webpage Data') {
                i.disabled = true;
              }
            }
          }
          return i;
        });
        return newList;
      }
    }, [fromEvents, activeCred]);

    const handleChangeSelect = useCallback((val: string) => {
      if (!val) {
        setActiveSource(undefined);
      }
      setActiveToken(val);
      // setActiveSource(undefined);
    }, []);
    const handleChangeSelectIdentityType = useCallback((val: string) => {
      setActiveIdentityType(val);
      setActiveWebDataSource('');
      setRefreshWebList((f) => !f);
    }, []);
    const handleChangeTab = useCallback((val: string) => {
      setActiveTab(val);
    }, []);

    const onChangeWebDataSource = useCallback(
      (i: any) => {
        if (activeCred) {
          return;
        } else {
          if (!activeIdentityType) {
            setErrorTip('Please select the proof content first');
          } else {
            if (i) {
              setActiveWebDataSource(i?.name);
            } else {
              setActiveWebDataSource('');
            }
          }
        }
      },
      [activeIdentityType, activeCred]
    );
    const handleChangeSelectBaseValue = useCallback((val: string) => {
      if (!val) {
        setActiveBaseValue('');
      }
      setActiveBaseValue(val);
    }, []);
    const handleClickNext = async () => {
      if (
        activeTab === 'API Data' &&
        !activeSource &&
        activeConnectedSourceList.length === 0 &&
        !fromEvents
      ) {
        navigate('/datas');
      }
      if (activeTab === 'API Data') {
        if (activeConnectedSourceList.length > 0) {
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

          if (type === 'TOKEN_HOLDINGS') {
            if (!activeToken) {
              setErrorTip('Please select one token');
              return;
            } else {
              form.token = activeToken;
            }
          }
          if (type === 'ASSETS_PROOF') {
            if (!activeBaseValue) {
              setErrorTip('Please select one baseValue');
              return;
            } else {
              form.baseValue = activeBaseValue;
            }
          }

          if (type === 'IDENTIFICATION_PROOF') {
            // credential?: string;
            const sourceLowerCaseName = activeSource.name.toLowerCase();
            const res = await chrome.storage.local.get([sourceLowerCaseName]);
            form.credential = JSON.parse(res[sourceLowerCaseName]).credential;
            form.userIdentity = walletAddress;
            form.verifyIdentity = walletAddress;
            form.proofType = type;
          }
          if (type === 'UNISWAP_PROOF') {
            // TODO
          }
          if (activeCred?.requestid) {
            form.requestid = activeCred?.requestid;
            onSubmit(form);
          } else {
            onSubmit(form);
          }
        }
      } else {
        if (!activeIdentityType) {
          setErrorTip('Please select one proof content');
          return;
        }
        if (!activeWebDataSource) {
          setErrorTip('Please select one data source');
          return;
        }

        const form: AttestionForm = {
          source: activeWebDataSource.toLowerCase(),
          type,
          proofContent: activeIdentityType,
          proofClientType: activeTab,
        };
        if (fromEvents === 'LINEA_DEFI_VOYAGE') {
          form.event = 'LINEA_DEFI_VOYAGE';
        }
        if (activeCred?.requestid) {
          form.requestid = activeCred?.requestid;
          onSubmit(form);
        } else {
          onSubmit(form);
        }
      }
    };
    const handleClickData = useCallback(
      (item: ConnectSourceType) => {
        if (type === 'TOKEN_HOLDINGS' && !activeToken) {
          setErrorTip('Please select one data source');
          return;
        }
        if (activeSourceName) {
          return;
        }
        if ((activeCred || activeSourceName) && activeSource) {
          if (activeSource?.name !== item.name) {
            return;
          }
        }

        if (!activeCred && activeSource?.name === item.name) {
          setActiveSource(undefined);
          return;
        }
        if (
          (activeSourceList.length > 0 &&
            activeSourceList.includes(item.name)) ||
          activeSourceList.length === 0
        ) {
          setActiveSource(item);
        }
      },
      [activeCred, activeSourceList, activeToken, type, activeSourceName]
    );
    const liClassNameCallback = useCallback(
      (item: ConnectSourceType) => {
        let defaultClassName = 'networkItem';
        if ((activeCred || activeSourceName) && activeSource) {
          if (activeSource?.name !== item.name) {
            defaultClassName += ' disabled';
          }
        } else {
          if (activeSourceList.length > 0) {
            // if (activeSourceList.includes(item.name)) {
            //   defaultClassName += ' excitable';
            // }
            if (!activeSourceList.includes(item.name)) {
              defaultClassName += ' disabled';
            }
          }
        }
        if (activeSourceList.length > 0) {
          if (activeSourceList.includes(item.name)) {
            defaultClassName += ' excitable';
          }
        }
        if (activeSource?.name === item.name) {
          defaultClassName += ' active';
        }
        if (!activeIdentityType || activeCred) {
          defaultClassName += ' disabled';
        }
        return defaultClassName;
      },
      [
        activeSource,
        activeSourceList,
        activeCred,
        activeSourceName,
        activeIdentityType,
      ]
    );

    useEffect(() => {
      if (activeSourceName) {
        const sourceInfo = activeConnectedSourceList.find(
          (i) => i.name.toLowerCase() === activeSourceName.toLowerCase()
        );
        setActiveSource(sourceInfo);
      }
    }, [activeSourceName, activeConnectedSourceList]);
    useEffect(() => {
      if (activeCred) {
        const sourceInfo = activeConnectedSourceList.find(
          (i) => i.name.toLowerCase() === activeCred.source.toLowerCase()
        );
        setActiveSource(sourceInfo);
        if (type === 'TOKEN_HOLDINGS') {
          activeCred.holdingToken && setActiveToken(activeCred.holdingToken);
        }
        if (type === 'IDENTIFICATION_PROOF' && activeCred?.reqType === 'web') {
          setActiveIdentityType(activeWebTemplate?.name);
          setActiveTab('Webpage Data');
          setActiveWebDataSource(activeWebTemplate?.dataSource);
        }
      }
    }, [activeCred, type, activeConnectedSourceList, activeWebTemplate]);

    useEffect(() => {
      if (activeAttestationTypeInfo.credIdentifier === 'ASSETS_PROOF') {
        const baseValArr = JSON.parse(
          activeAttestationTypeInfo.credProofConditions
        );
        if (baseValArr.length === 1) setActiveBaseValue(baseValArr[0]);
      }
    }, [activeAttestationTypeInfo]);
    useEffect(() => {
      if (baseValueArr.length === 1) setActiveBaseValue(baseValueArr[0]);
    }, [baseValueArr]);
    useEffect(() => {
      if (fromEvents) {
        const aT = fromEventsMap[fromEvents as keyof typeof fromEventsMap];
        setActiveTab(aT);
        // TODO
        if (fromEvents === 'LINEA_DEFI_VOYAGE') {
          setActiveIdentityType('KYC Status');
          setActiveWebDataSource('binance');
        }
      }
    }, [fromEvents]);
    useEffect(() => {
      if (activeType) {
        setActiveTab('Webpage Data');
      }
      
    }, [activeType])

    return (
      <PMask onClose={onClose} closeable={fromEvents !== 'LINEA_DEFI_VOYAGE'}>
        <div className="padoDialog attestationDialog identityAttestationDialog">
          {!!onBack && <PBack onBack={onBack} />}
          <main>
            <header>
              <h1>{activeAttestationTypeInfo.credTitle}</h1>
              {/* <h2>{activeAttestationTypeInfo.credDetails}</h2> */}
            </header>
            <div className="formContent">
              <div className="contItem contItemNew">
                <div className="label">Proof Content</div>
                <div className="value">
                  {type === 'IDENTIFICATION_PROOF' && (
                    <div className="pSelectWrapper">
                      <PSelect
                        options={identityList}
                        onChange={handleChangeSelectIdentityType}
                        val={activeIdentityType}
                        disabled={
                          !!activeCred || fromEvents === 'LINEA_DEFI_VOYAGE'
                        }
                        placeholder="Select content"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="contItem contItemAssets">
                <div className="label">
                  Source of {sourcesLabel[type as keyof typeof sourcesLabel]}
                </div>
                <div className="valueWrapper">
                  <PTabsNew
                    onChange={handleChangeTab}
                    value={activeTab}
                    list={formatTabList}
                  />
                  {activeTab === 'API Data' ? (
                    <>
                      {activeConnectedSourceList.length > 0 && (
                        <SourceGroup
                          onChange={(a) => {
                            handleClickData(a as ExchangeMeta);
                          }}
                          list={activeConnectedSourceList}
                        />
                      )}
                      {activeConnectedSourceList.length === 0 && (
                        <div className="emptyContent">
                          <img src={iconInfoGray} alt="" />
                          <h2>{emptyCon}</h2>
                        </div>
                      )}
                    </>
                  ) : (
                    <WebDataSourceList
                      list={webDataSourceList}
                      onChange={onChangeWebDataSource}
                      disabled={!activeIdentityType || !!activeCred}
                      val={activeWebDataSourceObj}
                    />
                  )}
                </div>
              </div>
            </div>
          </main>
          <footer>
            <PButton
              text={
                activeConnectedSourceList.length === 0 &&
                webDataSourceList.length === 0
                  ? 'OK'
                  : 'Next'
              }
              className={
                activeConnectedSourceList.length === 0 &&
                webDataSourceList.length === 0
                  ? 'gray'
                  : undefined
              }
              onClick={handleClickNext}
            />
            {errorTip && <PBottomErrorTip text={errorTip} />}
          </footer>
        </div>
      </PMask>
    );
  }
);

export default AttestationDialog;
