import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import PMask from '@/components/PMask';
import PRadio from '@/components/PRadio';
import ConnectedDataSourceList from '@/components/Cred/ConnectedDataSourceList';
import IconClear from '@/components/Icons/IconClear';
import IconDownload from '@/components/Icons/IconDownload';
import Reconfirm from '@/components/Setting/ReConfirm';
import PBack from '@/components/PBack';

import { BIGZERO, DATASOURCEMAP } from '@/config/constants';
import { formatFullTime, getCurrentDate, sub } from '@/utils/utils';
import { setExSourcesAsync, setSocialSourcesAsync } from '@/store/actions';
import { setSourceUpdateFrequencyActionAsync } from '@/store/actions';
import { add } from '@/utils/utils';
import { exportCsv } from '@/utils/exportFile';

import type { ConnectSourceType } from '@/types/dataSource';
import type { Dispatch } from 'react';
import type { UserState } from '@/store/reducers';
import type { ExDatas } from '@/types/store';
// import type { SocialDatas } from '@/types/dataSource';
import type { DataSourceItemType } from '@/components/DataSourceOverview/DataSourceItem';
import type { AssetsMap } from '@/components/DataSourceOverview/DataSourceItem';

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

const ManageDataDialog: React.FC<ManageDataDialogProps> = memo(
  ({ onClose, onSubmit, onBack }) => {
    const [errorTip, setErrorTip] = useState<string>();
    const [reconfirmVisible, setReconfirmVisible] = useState<boolean>(false);
    const [activeSourceList, setActiveSourceList] = useState<
      ConnectSourceType[]
    >([]);
    const [updateFrequency, setUpdateFrequency] = useState<string>('3');
    const dispatch: Dispatch<any> = useDispatch();
    const exSources = useSelector((state: UserState) => state.exSources);
    const socialSources = useSelector(
      (state: UserState) => state.socialSources
    );
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
        (sources as ConnectSourceType[]).length > 0 && setErrorTip('');
      },
      []
    );
    const onClear = async () => {
      if (activeSourceNameArr.length < 1) {
        // alert('Please select at least one data source');
        setErrorTip('Please select at least one data source');
        return;
      }
      setReconfirmVisible(true);
    };
    const getUserInfo = async () => {
      const { userInfo, keyStore } = await chrome.storage.local.get([
        'userInfo',
        'keyStore',
      ]);
      let obj: any = {};
      if (userInfo) {
        const parseUserInfo = JSON.parse(userInfo);
        const { id, authSource } = parseUserInfo;
        obj.id = id;
        obj.authSource = DATASOURCEMAP[authSource].name;
      }
      if (keyStore) {
        const parseKeystore = JSON.parse(keyStore);
        const { address } = parseKeystore;
        obj.address = '0x' + address;
      }
      return obj;
    };
    // {item.createdTime ? getCurrentDate(item.createdTime) : '-'}
    const accTagsFn = useCallback((item: DataSourceItemType) => {
      let lowerCaseName = item.name.toLowerCase();
      let formatTxt;
      switch (lowerCaseName) {
        case 'twitter':
          formatTxt = item.verified ? 'Verified' : 'Not Verified';
          break;
        case 'discord':
          const flagArr = item.remarks?.flags.split(',');
          const flagArrLen = flagArr.length;
          const activeFlag =
            flagArr[flagArrLen - 1] === 'Bot'
              ? flagArr[flagArrLen - 2]
              : flagArr[flagArrLen - 1];
          formatTxt = activeFlag;
          break;
        default:
          formatTxt = '-';
          break;
      }
      return formatTxt;
    }, []);
    const assembleAssetsExcelParams = useCallback(async () => {
      let checkedExSourcesTotalBal: any = BIGZERO;
      const ciphers = await chrome.storage.local.get(
        activeExSourceCipherNameArr
      );
      debugger;
      let assetsRows = [];

      activeExSourceNameArr
        .sort((a, b) =>
          sub(
            Number(exSources[b].totalBalance),
            Number(exSources[a].totalBalance)
          ).toNumber()
        )
        .forEach((key, idx) => {
          let { name, totalBalance, tokenListMap, label } = exSources[key];
          checkedExSourcesTotalBal = add(
            totalBalance,
            checkedExSourcesTotalBal
          );
          const tokensRows = Object.values(tokenListMap as AssetsMap)
            .sort((a, b) => sub(Number(b.value), Number(a.value)).toNumber())
            .reduce((prev: any[], token) => {
              let { symbol, amount, price, value } = token;
              prev.push({
                empty: '',
                empty2: '',
                symbol,
                amount: amount + '\t',
                price: price + '\t',
                value: value + '\t',
              });
              return prev;
            }, []);

          let curSourceRows = [
            {
              empty: '',
              label: 'Source' + (idx + 1),
              value: name,
            },
            {
              empty: '',
              label: 'Label',
              value: label,
            },
            {
              empty: '',
              label: 'ApiCiphertext',
              value: ciphers[`${key}cipher`] + '\t',
            },
            {
              empty: '',
            },
            {
              empty: '',
              label: 'Balance(USD)',
              value: totalBalance + '\t',
            },
            {
              empty: '',
              TokenListMap: 'TokenListMap',
              symbol: 'TokenName',
              amount: 'Amount',
              price: 'Price(USD)',
              value: 'Value(USD)',
            },
            ...tokensRows,
          ];
          assetsRows.push(...curSourceRows);
        });
      assetsRows.unshift(
        {
          label: 'DataType',
          value: 'Assets',
        },
        {
          empty: '',
          label: 'TotalBalance(USD)',
          value: checkedExSourcesTotalBal.toFixed(),
        }
      );
      return assetsRows;
    }, [activeExSourceCipherNameArr, exSources, activeExSourceNameArr]);
    const assembleSocialExcelParams = useCallback(async () => {
      const socialRows: object[] = [
        {
          label: 'DataType',
          value: 'Social',
        },
      ];
      activeSocialSourceNameArr.forEach((key, idx) => {
        const {
          name,
          followers,
          followings,
          posts,
          createdTime,
          userName,
          screenName,
        } = socialSources[key];
        const curSourceRows = [
          {
            empty: '',
            label: 'Source' + (idx + 1),
            value: name,
          },
          {
            empty: '',
            ProfileDetail: 'ProfileDetail',
            userName: 'UserName',
            createdTime: 'CreatedTime',
            followers: 'Followers',
            following: 'Following',
            posts: 'Posts',
            accountTags: 'AccountTags',
          },
          {
            empty: '',
            empty2: '',
            userName: userName || screenName,
            createdTime: createdTime ? getCurrentDate(createdTime, ' ') : '-',
            followers: followers || '-',
            following: followings,
            posts: posts || '-',
            accountTags: accTagsFn(socialSources[key]),
          },
        ];
        socialRows.push(...curSourceRows);
      });
      return socialRows;
    }, [accTagsFn, activeSocialSourceNameArr, socialSources]);
    const assembleExcelParams = useCallback(async () => {
      let { id, address, authSource } = await getUserInfo();
      const basicRows = [
        {
          label: 'AccountID',
          value: id + '\t',
        },
        {
          label: 'OAuthMethod',
          value: `${authSource}Account`,
        },
        {
          label: 'OnchainAddress',
          value: address,
        },
        {
          label: 'UpdateTime',
          value: formatFullTime(+new Date()) + '\t',
        },
      ];
      const assetsRows: object[] = await assembleAssetsExcelParams();
      const socialRows: object[] = await assembleSocialExcelParams();
      const allRows = [...basicRows, ...assetsRows, ...socialRows];
      let cvsArr: string[] = allRows.map((i) => {
        return Object.values(i).join() + '\n';
      });
      // TODO
      return cvsArr;
    }, [assembleAssetsExcelParams, assembleSocialExcelParams]);
    const onDownload = useCallback(async () => {
      if (activeSourceNameArr.length < 1) {
        setErrorTip('Please select at least one data source');
        return;
      }
      const formatDate = new Date().toLocaleString();
      let cvsArr: string[] = await assembleExcelParams();
      exportCsv(cvsArr, `Data File${formatDate}`);
    }, [assembleExcelParams, activeSourceNameArr.length]);

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
            {errorTip && (
              <div className="tipWrapper">
                <div className="errorTip">{errorTip}</div>
              </div>
            )}
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
  }
);

export default ManageDataDialog;
