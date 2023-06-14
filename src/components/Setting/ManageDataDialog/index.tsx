import React, { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PMask from '@/components/PMask';
import { exportJson } from '@/utils/utils';
import { setExSourcesAsync } from '@/store/actions';
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
  const [activeSourceNames, setActiveSourceNames] = useState<string[]>([]);
  const [updateFrequency, setUpdateFrequency] = useState<string>('3');
  const dispatch: Dispatch<any> = useDispatch();
  const exSources = useSelector((state: UserState) => state.exSources);
  const sourceUpdateFrequency = useSelector(
    (state: UserState) => state.sourceUpdateFrequency
  );
  useEffect(() => {
    setUpdateFrequency(sourceUpdateFrequency);
  }, []);
  const onChangeDataSource = useCallback(
    (sources: ConnectSourceType | ConnectSourceType[] | undefined) => {
      const sourceNameArr = (sources as ConnectSourceType[]).map((i) =>
        i.name.toLowerCase()
      );
      setActiveSourceNames(sourceNameArr);
    },
    []
  );
  const onClear = async () => {
    if (activeSourceNames.length < 1) {
      alert('Please select at least one data source');
      return;
    }
    setReconfirmVisible(true);
  };
  const onDownload = useCallback(async () => {
    if (activeSourceNames.length < 1) {
      alert('Please select at least one data source');
      return;
    }
    let checkedExSources: ExDatas = {};
    activeSourceNames.forEach((key) => {
      const { name, totalBalance, tokenListMap, apiKey, date } = exSources[key];
      checkedExSources[key] = {
        name,
        totalBalance,
        tokenListMap,
        apiKey,
        date,
      };
    });
    const cipherNameArr = activeSourceNames.map((i) => `${i}cipher`);
    const ciphers = await chrome.storage.local.get(cipherNameArr);
    const exportObj = { ...ciphers, ...checkedExSources };
    const jsonStr = JSON.stringify(exportObj, null, '\t');
    const formatDate = new Date().toLocaleString();
    exportJson(jsonStr, `Data File${formatDate}`);
  }, [activeSourceNames, exSources]);

  const onCancelReconfirm = useCallback(() => {
    setReconfirmVisible(false);
  }, []);
  const onConfirmReconfirm = useCallback(async () => {
    const cipherNameArr = activeSourceNames.map((i) => `${i}cipher`);
    const removeStorageKeyArr = [...activeSourceNames, ...cipherNameArr];
    await chrome.storage.local.remove(removeStorageKeyArr);
    dispatch(setExSourcesAsync());
    const { credentials: credentialsStr } = await chrome.storage.local.get([
      'credentials',
    ]);
    const credentialObj = credentialsStr ? JSON.parse(credentialsStr) : {};
    let newCredentialObj = { ...credentialObj };
    Object.keys(credentialObj).forEach((key) => {
      if (activeSourceNames.includes(credentialObj[key].source)) {
        delete newCredentialObj[key];
      }
    });
    await chrome.storage.local.set({
      credentials: JSON.stringify(newCredentialObj),
    });
    setReconfirmVisible(false);
  }, [activeSourceNames, dispatch]);
  const onSubmitDialog = async () => {
    await dispatch(setSourceUpdateFrequencyActionAsync(updateFrequency));
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
