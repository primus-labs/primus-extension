import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PMask from '@/components/PMask';
import { exportJson, formatTime } from '@/utils/utils';
import { setExSourcesAsync, setSocialSourcesAsync } from '@/store/actions';
import PRadio from '@/components/PRadio';
import ConnectedDataSourceList from '@/components/Cred/ConnectedDataSourceList';
import IconClear from '@/components/Icons/IconClear';
import IconDownload from '@/components/Icons/IconDownload';
import Reconfirm from '@/components/Setting/ReConfirm';
import PBack from '@/components/PBack';
import { setSourceUpdateFrequencyActionAsync } from '@/store/actions';
import type { ConnectSourceType } from '@/types/dataSource';
import type { Dispatch } from 'react';
import type { UserState } from '@/store/reducers';
import type { ExDatas } from '@/types/store';
import type { SocialDatas } from '@/types/dataSource';
import {add} from '@/utils/utils'
import BigNumber from 'bignumber.js';

import './index.sass';

interface ManageDataDialogProps {
  onClose: () => void;
  onSubmit: () => void;
  onBack: () => void;
}

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

const ManageDataDialog: React.FC<ManageDataDialogProps> = ({
  onClose,
  onSubmit,
  onBack,
}) => {
  const [reconfirmVisible, setReconfirmVisible] = useState<boolean>(false);
  const [activeSourceList, setActiveSourceList] = useState<ConnectSourceType[]>(
    []
  );
  const [updateFrequency, setUpdateFrequency] = useState<string>('3');
  const dispatch: Dispatch<any> = useDispatch();
  const exSources = useSelector((state: UserState) => state.exSources);
  const socialSources = useSelector((state: UserState) => state.socialSources);
  const sourceUpdateFrequency = useSelector(
    (state: UserState) => state.sourceUpdateFrequency
  );
  const activeSourceNameArr = useMemo(() => {
    const arr = activeSourceList.map((i) => i.name.toLowerCase());
    return arr;
  }, [activeSourceList]);
  const activeExSourceNameArr = useMemo(() => {
    const sourceArr = activeSourceList.filter((i) => i.type === 'Assets');
    const arr = sourceArr.map((i) => i.name.toLowerCase());
    return arr;
  }, [activeSourceList]);
  const activeExSourceCipherNameArr = useMemo(() => {
    const arr = activeExSourceNameArr.map((i) => `${i}cipher`);
    return arr;
  }, [activeExSourceNameArr]);
  const activeSocialSourceNameArr = useMemo(() => {
    const sourceArr = activeSourceList.filter((i) => i.type === 'Social');
    const arr = sourceArr.map((i) => i.name.toLowerCase());
    return arr;
  }, [activeSourceList]);
  useEffect(() => {
    setUpdateFrequency(sourceUpdateFrequency);
  }, []);
  const onChangeDataSource = useCallback(
    (sources: ConnectSourceType | ConnectSourceType[] | undefined) => {
      setActiveSourceList(sources as ConnectSourceType[]);
    },
    []
  );
  const onClear = async () => {
    if (activeSourceNameArr.length < 1) {
      alert('Please select at least one data source');
      return;
    }
    setReconfirmVisible(true);
  };
  const onDownload = useCallback(async () => {
    if (activeSourceNameArr.length < 1) {
      alert('Please select at least one data source');
      return;
    }
    let checkedExSources: ExDatas = {};
    let checkedExSourcesTotalBal: any = '0'
    activeExSourceNameArr.forEach((key) => {
      const { name, type, totalBalance, tokenListMap, apiKey, timestamp } =
        exSources[key];
      checkedExSources[key] = {
        name,
        type,
        totalBalance,
        tokenListMap,
        apiKey,
        updateTime: formatTime(timestamp),
      };
      checkedExSourcesTotalBal = add(
        totalBalance,
        checkedExSourcesTotalBal
      );
    });
    let checkedSocialSources: SocialDatas = {};
    activeSocialSourceNameArr.forEach((key) => {
      const {
        name,
        type,
        followers,
        followings,
        posts,
        verified,
        timestamp,
        createdTime,
        userName,
        screenName,
      } = socialSources[key];
      checkedSocialSources[key] = {
        name,
        type,
        followers,
        followings,
        posts,
        verified,
        createdTime,
        updateTime: formatTime(timestamp),
        userName,
        screenName,
      };
    });
    const ciphers = await chrome.storage.local.get(activeExSourceCipherNameArr);
    const exportObj = {
      ...ciphers,
      ...checkedExSources,
      ...checkedSocialSources,
      totalBalance: checkedExSourcesTotalBal.toFixed(),
    };
    // TODO social data
    const jsonStr = JSON.stringify(exportObj, null, '\t');
    const formatDate = new Date().toLocaleString();
    exportJson(jsonStr, `Data File${formatDate}`);
  }, [
    exSources,
    socialSources,
    activeExSourceNameArr,
    activeSocialSourceNameArr,
    activeExSourceCipherNameArr,
    activeSourceNameArr.length,
  ]);

  const onCancelReconfirm = useCallback(() => {
    setReconfirmVisible(false);
  }, []);
  const onConfirmReconfirm = useCallback(async () => {
    const removeStorageKeyArr = [
      ...activeSourceNameArr,
      ...activeExSourceCipherNameArr,
    ];
    await chrome.storage.local.remove(removeStorageKeyArr);
    dispatch(setExSourcesAsync());
    dispatch(setSocialSourcesAsync());
    const { credentials: credentialsStr } = await chrome.storage.local.get([
      'credentials',
    ]);
    const credentialObj = credentialsStr ? JSON.parse(credentialsStr) : {};
    let newCredentialObj = { ...credentialObj };
    Object.keys(credentialObj).forEach((key) => {
      if (activeExSourceNameArr.includes(credentialObj[key].source)) {
        delete newCredentialObj[key];
      }
    });
    await chrome.storage.local.set({
      credentials: JSON.stringify(newCredentialObj),
    });
    setReconfirmVisible(false);
  }, [
    dispatch,
    activeSourceNameArr,
    activeExSourceNameArr,
    activeExSourceCipherNameArr,
  ]);
  const onSubmitDialog = async () => {
    if (sourceUpdateFrequency !== updateFrequency) {
      await dispatch(setSourceUpdateFrequencyActionAsync(updateFrequency));
    }
    onSubmit();
  };

  return (
    <PMask onClose={onClose}>
      <div className="padoDialog manageDataDialog">
        <PBack onBack={onBack} />
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
                <div className="operations">
                  <div className="operationItem" onClick={onDownload}>
                    <IconDownload />
                  </div>
                  <div className="operationItem" onClick={onClear}>
                    <IconClear />
                  </div>
                </div>
                <ConnectedDataSourceList
                  mutiple
                  onChange={onChangeDataSource}
                />
              </div>
            </div>
          </div>
        </main>
        <button className="nextBtn" onClick={onSubmitDialog}>
          <span>OK</span>
        </button>

        {reconfirmVisible && (
          <Reconfirm
            onCancel={onCancelReconfirm}
            onConfirm={onConfirmReconfirm}
          />
        )}
      </div>
    </PMask>
  );
};

export default ManageDataDialog;
