import React, { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PRadioNew from '@/components/PRadioNew';
import PMask from '@/components/PMask';
import PRadio from '@/components/PRadio';
import PButton from '@/components/PButton';
import PBottomErrorTip from '@/components/PBottomErrorTip';
import ConnectedDataSourceList from '@/components/ConnectedDataSourceList';
import IconClear from '@/components/Icons/IconClear';
import IconDownload from '@/components/Icons/IconDownload';
import ReconfirmDialog from './ReconfirmDialog';
import PBack from '@/components/PBack';
import { BIGZERO, DATASOURCEMAP } from '@/config/constants';
import { formatFullTime, getCurrentDate, sub } from '@/utils/utils';
import {
  setExSourcesAsync,
  setSocialSourcesAsync,
  setKYCsAsync,
  setCredentialsAsync,
  setOnChainAssetsSourcesAsync,
} from '@/store/actions';
import { setSourceUpdateFrequencyActionAsync } from '@/store/actions';
import { add } from '@/utils/utils';
import { exportCsv } from '@/utils/exportFile';

import type { ConnectSourceType } from '@/types/dataSource';
import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';
// import type { SocialDatas } from '@/types/dataSource';
import type {
  DataSourceItemType,
  AssetsMap,
} from '@/components/DataSourceOverview/DataSourceList/DataSourceItem';

import './index.scss';

interface ManageDataDialogProps {
  onClose: () => void;
  onSubmit: () => void;
  onBack: () => void;
}
const updateFrequencyListNew = [
  {
    label: '1min',
    disabled: false,
    defaultValue: false,
  },
  {
    label: '3min',
    disabled: false,
    defaultValue: true,
  },
  {
    label: '5min',
    disabled: false,
    defaultValue: false,
  },
];
const updateFrequencyList = [
  {
    label: '1min',
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
const activeRequest = {
  type: 'warn',
  title: 'Are your sure to delete?',
  desc: 'To re-connect, you will need to go through the process again.',
};
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
    const kycSources = useSelector((state: UserState) => state.kycSources);
    const onChainAssetsSources = useSelector(
      (state: UserState) => state.onChainAssetsSources
    );
    const sourceUpdateFrequency = useSelector(
      (state: UserState) => state.sourceUpdateFrequency
    );
    const activeSourceNameArr = useMemo(() => {
      const arr = activeSourceList.map((i) => i.name.toLowerCase());
      return arr;
    }, [activeSourceList]);
    const activeExSourceNameArr = useMemo(() => {
      const sourceArr = activeSourceList.filter(
        (i) => i.type === 'Assets' && !i.name.startsWith('0x')
      );
      const arr = sourceArr.map((i) => i.name.toLowerCase());
      return arr;
    }, [activeSourceList]);
    const activeExSourceCipherNameArr = useMemo(() => {
      const arr = activeExSourceNameArr.map((i) => `${i}cipher`);
      return arr;
    }, [activeExSourceNameArr]);
    const activeKYCSourceNameArr = useMemo(() => {
      const sourceArr = activeSourceList.filter((i) => i.type === 'Identity');
      const arr = sourceArr.map((i) => i.name.toLowerCase());
      return arr;
    }, [activeSourceList]);
    const activeSocialSourceNameArr = useMemo(() => {
      const sourceArr = activeSourceList.filter((i) => i.type === 'Social');
      const arr = sourceArr.map((i) => i.name.toLowerCase());
      return arr;
    }, [activeSourceList]);
    const activeOnChainSourceNameArr = useMemo(() => {
      const sourceArr = activeSourceList.filter(
        (i) => i.type === 'Assets' && i.name.startsWith('0x')
      );
      const arr = sourceArr.map((i: any) => i?.address);
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
        obj.authSource = DATASOURCEMAP[authSource]?.name ?? authSource;
      }
      if (keyStore) {
        const parseKeystore = JSON.parse(keyStore);
        const { address } = parseKeystore;
        obj.address = '0x' + address;
      }
      return obj;
    };
    // {item.createdTime ? getCurrentDate(item.createdTime) : '-'}
    // const accTagsFn = useCallback((item: DataSourceItemType) => {//TOOD
    const accTagsFn = useCallback((item: any) => {
      let lowerCaseName = item.name.toLowerCase();
      let formatTxt;
      switch (lowerCaseName) {
        case 'x':
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
    const assembleKYCExcelParams = useCallback(async () => {
      let kycRows: object[] = [];
      if (activeKYCSourceNameArr.length > 0) {
        kycRows = [
          {
            label: 'DataType',
            value: 'Identity',
          },
        ];
        activeKYCSourceNameArr.forEach((key, idx) => {
          const {
            name,
            fullName,
            countryName,
            idNumber,
            validUntil,
            docName,
            dateOfBirth,
            cipher,
          } = kycSources[key];
          const curSourceRows = [
            {
              empty: '',
              label: 'Source' + (idx + 1),
              value: name,
            },

            {
              empty: '',
              label: 'Ciphertext',
              value: cipher + '\t',
            },
            {
              empty: '',
              ProfileDetail: 'ProfileDetail',
              userName: 'Name',
              createdTime: 'DocumentType',
              followers: 'Country/Region',
              following: 'DocumentNumber',
              posts: 'DateofBirth',
              accountTags: 'DateofExpire',
            },
            {
              empty: '',
              empty2: '',
              userName: fullName,
              createdTime: docName,
              followers: countryName,
              following: idNumber,
              posts: dateOfBirth,
              accountTags: validUntil,
            },
          ];
          kycRows.push(...curSourceRows);
        });
      }
      return kycRows;
    }, [activeKYCSourceNameArr, kycSources]);
    const assembleAssetsExcelParams = useCallback(async () => {
      let checkedExSourcesTotalBal: any = BIGZERO;
      const ciphers = await chrome.storage.local.get(
        activeExSourceCipherNameArr
      );
      let assetsRows = [];
      if (
        activeExSourceNameArr.length > 0 ||
        activeOnChainSourceNameArr.length > 0
      ) {
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
              Number(totalBalance),
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

            let curCipher = ciphers[`${key}cipher`];
            // curCipher = curCipher.replace(/"/g, "'");
            // curCipher = '\"' + curCipher + '\"'
            // curCipher = curCipher.replace(/,/g, "，");
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
                value: curCipher + '\t',
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
        // on-chain Datas
        const exSourceLen = activeExSourceNameArr.length;

        activeOnChainSourceNameArr
          .sort((a, b) =>
            sub(
              Number(onChainAssetsSources[b].totalBalance),
              Number(onChainAssetsSources[a].totalBalance)
            ).toNumber()
          )
          .forEach((key, idx) => {
            let { name, totalBalance, tokenListMap, label, address } =
              onChainAssetsSources[key];
            checkedExSourcesTotalBal = add(
              Number(totalBalance),
              checkedExSourcesTotalBal
            );
            const tokensRows = Object.values(tokenListMap as AssetsMap)
              .sort((a, b) => sub(Number(b.value), Number(a.value)).toNumber())
              .reduce((prev: any[], token) => {
                let { symbol, amount, price, value, chain, address } =
                  token as any;
                prev.push({
                  empty: '',
                  empty2: '',
                  symbol: address ? symbol.split('---')[0] : symbol,
                  chain,
                  amount: amount + '\t',
                  price: price + '\t',
                  value: value + '\t',
                });
                return prev;
              }, []);

            let curSourceRows = [
              {
                empty: '',
                label: 'Source' + (exSourceLen + idx + 1),
                value: name,
              },
              {
                empty: '',
                label: 'Label',
                value: label,
              },
              {
                empty: '',
                label: 'Address',
                value: address,
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
                Blockchain: 'Blockchain',
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
      }

      return assetsRows;
    }, [
      activeExSourceCipherNameArr,
      exSources,
      activeExSourceNameArr,
      activeOnChainSourceNameArr,
      onChainAssetsSources,
    ]);
    const assembleSocialExcelParams = useCallback(async () => {
      let socialRows: object[] = [];
      if (activeSocialSourceNameArr.length > 0) {
        socialRows = [
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
      }
      return socialRows;
    }, [accTagsFn, activeSocialSourceNameArr, socialSources]);
    const assembleExcelParams = useCallback(async () => {
      let { id, address, authSource } = await getUserInfo();
      const basicRows = [
        {
          label: 'AccountID',
          value: id + '\t',
        },
        // {
        //   label: 'OAuthMethod',
        //   value: `${authSource}Account`,
        // },
        {
          label: 'PADO Account',
          value: address,
        },
        {
          label: 'UpdateTime',
          value: formatFullTime(+new Date()) + '\t',
        },
      ];
      const assetsRows: object[] = await assembleAssetsExcelParams();
      const socialRows: object[] = await assembleSocialExcelParams();
      const kycRows: object[] = await assembleKYCExcelParams();
      const allRows = [...basicRows, ...assetsRows, ...socialRows, ...kycRows];
      let cvsArr: string[] = allRows.map((i: any) => {
        const separtor = ';';
        // if (i.label === 'ApiCiphertext') {
        //   const specialStr = `${i.empty}${separtor}${i.label}${separtor}${i.value}\n`;
        //   return specialStr;
        // }
        return Object.values(i).join(separtor) + '\n';
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
        ...activeKYCSourceNameArr,
      ];
      await chrome.storage.local.remove(removeStorageKeyArr);
      // Delete credentials related to the exchange
      const { credentials: credentialsStr } = await chrome.storage.local.get([
        'credentials',
      ]);
      const credentialObj = credentialsStr ? JSON.parse(credentialsStr) : {};
      let newCredentialObj = { ...credentialObj };
      Object.keys(credentialObj).forEach((key) => {
        if (
          activeExSourceNameArr.includes(credentialObj[key].source) ||
          activeKYCSourceNameArr.includes(credentialObj[key].source)
        ) {
          const curCred = newCredentialObj[key]
          if (curCred.reqType !== 'web' && !curCred.provided) {
            delete newCredentialObj[key];
          }
        }
      });
      await chrome.storage.local.set({
        credentials: JSON.stringify(newCredentialObj),
      });
      // Delete on-chain datas
      if (activeOnChainSourceNameArr.length > 0) {
        const { onChainAssetsSources: onChainAssetsSourcesStr } =
          await chrome.storage.local.get(['onChainAssetsSources']);
        const onChainAssetsSourcesObj = onChainAssetsSourcesStr
          ? JSON.parse(onChainAssetsSourcesStr)
          : {};
        let newOnChainAssetsSourcesObj = { ...onChainAssetsSourcesObj };
        activeOnChainSourceNameArr.forEach((key) => {
          if (newOnChainAssetsSourcesObj[key]) {
            delete newOnChainAssetsSourcesObj[key];
          }
        });
        await chrome.storage.local.set({
          onChainAssetsSources: JSON.stringify(newOnChainAssetsSourcesObj),
        });
        dispatch(setOnChainAssetsSourcesAsync());
      }

      dispatch(setExSourcesAsync());
      dispatch(setSocialSourcesAsync());
      dispatch(setKYCsAsync());
      dispatch(setCredentialsAsync());

      setReconfirmVisible(false);
    }, [
      dispatch,
      activeSourceNameArr,
      activeExSourceNameArr,
      activeExSourceCipherNameArr,
      activeKYCSourceNameArr,
      activeOnChainSourceNameArr,
    ]);
    const onSubmitDialog = async () => {
      if (sourceUpdateFrequency !== updateFrequency) {
        await dispatch(setSourceUpdateFrequencyActionAsync(updateFrequency));
      }
      onSubmit();
    };
    const handleChange = useCallback((label: string | undefined) => {
      // label && setUpdateFrequency(label);
      if (label) {
        const num = label.charAt(0);
        setUpdateFrequency(num);
      }
    }, []);

    return (
      <>
        {reconfirmVisible ? (
          <ReconfirmDialog
            onClose={onClose}
            onSubmit={onConfirmReconfirm}
            onBack={() => {
              setReconfirmVisible(false);
            }}
          />
        ) : (
          <PMask onClose={onClose}>
            <div className="padoDialog manageDataDialog">
              <PBack onBack={onBack} />
              <main>
                <header>
                  <h1>Manage Data</h1>
                </header>
                <div className="formContent scrollList">
                  <div className="contItem">
                    <div className="label">Update Frequency</div>
                    <div className="value">
                      <PRadioNew
                        onChange={handleChange}
                        list={updateFrequencyListNew}
                      />
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
              <footer>
                <PButton text="OK" onClick={onSubmitDialog} />
                {errorTip && <PBottomErrorTip text={errorTip} />}
              </footer>
            </div>
          </PMask>
        )}
      </>
    );
  }
);

export default ManageDataDialog;
