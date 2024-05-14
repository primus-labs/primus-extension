import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import SourceGroup from '@/components/DataSourceOverview/SourceGroups/SourceGroup';
import PBack from '@/components/PBack';
import PMask from '@/components/PMask';
import PButton from '@/components/PButton';
import PSelect from '@/components/PSelect';
import PBottomErrorTip from '@/components/PBottomErrorTip';
import {formatAddress} from '@/utils/utils'

import type { CredTypeItemType } from '@/types/cred';
import type { ExchangeMeta } from '@/types/dataSource';
import type { UserState } from '@/types/store';
import type { ConnectSourceType } from '@/types/dataSource';
import type { PROOFTYPEITEM, AttestionForm } from '@/types/cred';

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

const sourcesLabel = {
  ASSETS_PROOF: 'Assets',
  TOKEN_HOLDINGS: 'Tokens',
  IDENTIFICATION_PROOF: 'Identity',
  UNISWAP_PROOF: 'DeFi Transaction',
};

const AttestationDialog: React.FC<AttestationDialogProps> = memo(
  ({
    type,
    onClose,
    onSubmit,
    activeCred,
    activeSourceName,
    onBack,
    activeType = '',
  }) => {
    const [activeIdentityType, setActiveIdentityType] =
      useState<string>(activeType);
    const [searchParams] = useSearchParams();
    const fromEvents = searchParams.get('fromEvents');

    const [activeSource, setActiveSource] = useState<ConnectSourceType>();
    const [activeToken, setActiveToken] = useState<string>('');
    const [activeBaseValue, setActiveBaseValue] = useState<string>('');
    const [errorTip, setErrorTip] = useState<string>();

    const exSources = useSelector((state: UserState) => state.exSources);
    const onChainAssetsSources = useSelector(
      (state: UserState) => state.onChainAssetsSources
    );
    const proofTypes = useSelector((state: UserState) => state.proofTypes);
    const walletAddress = useSelector(
      (state: UserState) => state.walletAddress
    );
    const navigate = useNavigate();

    const activeAttestationTypeInfo = useMemo(() => {
      const obj = proofTypes.find((i:any) => i.credIdentifier === type);
      return obj as PROOFTYPEITEM;
    }, [type, proofTypes]);

    const connectedOnChainSourceList: ConnectSourceType[] = useMemo(() => {
      return Object.keys(onChainAssetsSources).map((key) => {
        const { address, icon, label } = onChainAssetsSources[key];
        const infoObj: ConnectSourceType = {
          name: formatAddress(address, 4, 2),
          icon,
          exUserId: undefined,
          label,
          address,
        };
        return infoObj;
      });
    }, [onChainAssetsSources]);

    const activeConnectedSourceList: ConnectSourceType[] = useMemo(() => {
      let l:any[] = [];
      if (type === 'UNISWAP_PROOF') {
        l = connectedOnChainSourceList.filter((i: any) => !i.disabled);
      } else {
        l = connectedOnChainSourceList;
      }
      if (activeCred) {
        l = l.map((i) =>
          Object.assign(i, {
            disabled: activeCred?.sourceUseridHash !== i.address?.toLowerCase(),
          })
        );
      }

      return l;
    }, [connectedOnChainSourceList, type, activeCred]);

    const activeSourceList = useMemo(() => {
      if (type === 'UNISWAP_PROOF' && activeToken) {
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
        return undefined;
      }
    }, [exSources, activeToken, type]);

    const identityList = useMemo(() => {
      const newArr: any = [
        {
          value: 'Largest ETH/USDC Swap Transaction',
          text: 'Largest ETH/USDC Swap Transaction',
        },
        // {
        //   value: 'Sum of WETH/USDC Swap Volume',
        //   text: 'Sum of WETH/USDC Swap Volume',
        // },
      ];
      return newArr;
    }, []);
    const handleChangeSelectIdentityType = useCallback((val: string) => {
      setActiveIdentityType(val);
      // setActiveWebDataSource('');// TODO
    }, []);

    const handleClickNext = async () => {
      if (activeConnectedSourceList.length === 0) {
        navigate('/datas');
      }

      if (activeConnectedSourceList.length > 0) {
        if (!activeSource) {
          setErrorTip('Please select one data source');
          return;
        }
        const form: AttestionForm = {
          source: 'brevis',
          type,
          exUserId: activeSource?.exUserId,
          label: activeSource?.label,
        };
        if (type === 'UNISWAP_PROOF') {
          // TODO
          form.sourceUseridHash =
            activeSource?.address?.toLowerCase() as string;
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
        
        // if (activeSourceName) {
        //   return;
        // }
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
          (activeSourceList &&
            activeSourceList.length > 0 &&
            activeSourceList.includes(item.name)) ||
          !activeSourceList
        ) {
          setActiveSource(item);
        }
      },
      [activeCred, activeSourceList, activeToken, type, activeSourceName]
    );

    
    useEffect(() => {
      if (activeCred) {
        const sourceInfo = activeConnectedSourceList.find(
          (i) =>
            i.address?.toLowerCase() ===
            activeCred.sourceUseridHash?.toLowerCase()
        );
        setActiveSource(sourceInfo);
      }
      if (activeSourceName) {
        const sourceInfo = activeConnectedSourceList.find(
          (i) => i.address?.toLowerCase() === activeSourceName?.toLowerCase()
        );
        setActiveSource(sourceInfo);
      }
    }, [activeCred, type, activeConnectedSourceList, activeSourceName]);
    // useEffect(() => {
    //   if (activeAttestationTypeInfo.credIdentifier === 'ASSETS_PROOF') {
    //     const baseValArr = JSON.parse(
    //       activeAttestationTypeInfo.credProofConditions
    //     );
    //     if (baseValArr.length === 1) setActiveBaseValue(baseValArr[0]);
    //   }
    // }, [activeAttestationTypeInfo]);
    useEffect(() => {
      if (identityList.length === 1) {
        setActiveIdentityType(identityList[0].value);
      }
    }, [identityList]);

    return (
      <PMask onClose={onClose}>
        <div className="padoDialog attestationDialog uniswapAttestationDialog">
          {!!onBack && <PBack onBack={onBack} />}
          <main>
            <header>
              <h1>{activeAttestationTypeInfo?.credTitle}</h1>
            </header>
            <div className="formContent">
              <div className="contItem">
                <div className="label">Proof Content</div>
                <div className="value">
                  <div className="pSelectWrapper">
                    <PSelect
                      options={identityList}
                      onChange={handleChangeSelectIdentityType}
                      val={activeIdentityType}
                      placeholder="Select content"
                      disabled={
                        !!activeCred
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="contItem contItemAssets">
                <div className="label">
                  Source of {sourcesLabel[type as keyof typeof sourcesLabel]}
                </div>
                <SourceGroup
                  onChange={(a) => {
                    handleClickData(a as ExchangeMeta);
                  }}
                  list={activeConnectedSourceList}
                  val={activeSource}
                />
              </div>
            </div>
          </main>
          <footer>
            <PButton
              text={activeConnectedSourceList.length === 0 ? 'OK' : 'Next'}
              className={
                activeConnectedSourceList.length === 0 ? 'gray' : undefined
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
