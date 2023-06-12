import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PMask from '@/components/PMask';
import { DATASOURCEMAP } from '@/config/constants';
import type { ExchangeMeta } from '@/config/constants';
import { formatNumeral } from '@/utils/utils';

import type { DataFieldItem } from '@/components/DataSourceOverview/DataSourcesDialog';
import type { CredTypeItemType } from '@/components/Cred/CredItem';
import type { UserState, PROOFTYPEITEM } from '@/store/reducers';
import useUpdateAssetSource from '@/hooks/useUpdateAssetSources';
import { setExSourcesAsync } from '@/store/actions';
import type { Dispatch } from 'react';
import iconGreater from '@/assets/img/iconGreater.svg';
import PRadio from '@/components/PRadio';
import ConnectedDataSourceList from '@/components/Cred/ConnectedDataSourceList';

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
  onClose: () => void;
  onSubmit: () => void;
  type?: string;
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

const updateFrequencyList = [
  {
    text: '1min',
    value: '1',
  },
  {
    text: '3min',
    value: '3',
  },
  {
    text: '5min',
    value: '5',
  },
];
const ManageDataDialog: React.FC<AttestationDialogProps> = ({
  type,
  onClose,
  onSubmit,
  activeCred,
  activeSourceName,
}) => {
  const [updateFrequency, setUpdateFrequency] = useState<string>('3');
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
    if (activeSource) {
      const sourceLowerCaseName = activeSource.name.toLowerCase();
      (fetchExDatas as (name: string) => void)(sourceLowerCaseName);
    }
  }, [activeSource, fetchExDatas]);
  useEffect(() => {
    !fetchExDatasLoading && dispatch(setExSourcesAsync());
  }, [fetchExDatasLoading, dispatch]);
  const onChangeUpdateFrequency = () => {

  }
  return (
    <PMask onClose={onClose}>
      <div className="padoDialog manageDataDialog">
        <main>
          <h1>Manage Your Data</h1>
          <div className="scrollList">
            <div className="contItem">
              <div className="label">Update frequency</div>
              <div className="value">
                <div className="desc">
                  Choose a time frequency to updating your data:
                </div>
                <div className="con">
                  <PRadio
                    val={updateFrequency}
                    onChange={setUpdateFrequency}
                    options={updateFrequencyList}
                  />
                </div>
              </div>
            </div>
            <div className="contItem contItemAssets">
              <div className="label">Data Connected</div>
              <div className="value">
<ConnectedDataSourceList/>
              </div>
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

export default ManageDataDialog;
