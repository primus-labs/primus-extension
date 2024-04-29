import React, {
  memo,
  useCallback,
  useEffect,
  useState,
  useMemo,
  useContext,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import BigNumber from 'bignumber.js';
import { getUserInfo } from '@/services/api/achievements';

import useAllSources from '@/hooks/useAllSources';
import useAssetsStatistic from '@/hooks/useAssetsStatistic';
import useSocialStatistic from '@/hooks/useSocialStatistic';
import { gte, sub, add, getCurrentDate, formatFullTime } from '@/utils/utils';
import { exportCsv } from '@/utils/exportFile';

import { BIGZERO } from '@/config/constants';
import type {
  DataSourceItemType,
  AssetsMap,
} from '@/components/DataSourceOverview/DataSourceList/DataSourceItem';
import PButton from '@/newComponents/PButton';
import PEye from '@/newComponents/PEye';
import iconUpdate from '@/assets/newImg/layout/iconUpdate.svg';
import AssetsBalance from '@/newComponents/AssetsBalance';
import UpdateDataSourceTip from '@/newComponents/UpdateDataSourceTip';
import './index.scss';
import { UserState } from '@/types/store';

const Overview = memo(() => {
  const {
    connectedSocialSourcesMap,
    connectedSocialSourcesList,
    hasConnectedSocialDataSources,
    formatTotalFollowers,
  } = useSocialStatistic();
  const { hasConnectedAssetsDataSources } = useAssetsStatistic();
  const { sourceMap } = useAllSources();
  console.log('22connectedDataSources', sourceMap); //delete
  const navigate = useNavigate();
  const sourceUpdateInfo = useSelector((state:UserState) => state.sourceUpdateInfo);
  const connectedOnChainSources = useMemo(() => {
    return sourceMap.onChainAssetsSources;
  }, [sourceMap]);
  const connectedExchangeSources = useMemo(() => {
    return sourceMap.exSources;
  }, [sourceMap]);
  const connectedKycSources = useMemo(() => {
    return sourceMap.kycSources;
  }, [sourceMap]);

  const accTagsFn = useCallback((item: any) => {
    let lowerCaseName = item.id;
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
    kycRows = [
      {
        label: 'DataType',
        value: 'Identity',
      },
    ];
    const activeKYCSourceNameArr = Object.keys(connectedKycSources);
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
      } = connectedKycSources[key];
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

    return kycRows;
  }, [connectedKycSources]);
  const assembleAssetsExcelParams = useCallback(async () => {
    let checkedExSourcesTotalBal: any = BIGZERO;
    const activeExSourceNameArr = Object.keys(connectedExchangeSources);
    const activeOnChainSourceNameArr = Object.keys(connectedOnChainSources);
    const activeExSourceCipherNameArr = activeExSourceNameArr.map(
      (i) => `${i}cipher`
    );

    const ciphers = await chrome.storage.local.get(activeExSourceCipherNameArr);
    let assetsRows: any[] = [];
    if (
      activeExSourceNameArr.length > 0 ||
      activeOnChainSourceNameArr.length > 0
    ) {
      activeExSourceNameArr
        .sort((a, b) =>
          sub(
            Number(connectedExchangeSources[b].totalBalance),
            Number(connectedExchangeSources[a].totalBalance)
          ).toNumber()
        )
        .forEach((key, idx) => {
          let { name, totalBalance, tokenListMap, label } =
            connectedExchangeSources[key];
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
              value: curCipher ?? '' + '\t',
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
            Number(connectedOnChainSources[b].totalBalance),
            Number(connectedOnChainSources[a].totalBalance)
          ).toNumber()
        )
        .forEach((key, idx) => {
          let { name, totalBalance, tokenListMap, label, address } =
            connectedOnChainSources[key];
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
  }, [connectedExchangeSources, connectedOnChainSources]);
  const assembleSocialExcelParams = useCallback(async () => {
    let socialRows: object[] = [];
    const activeSocialSourceNameArr = Object.keys(connectedSocialSourcesMap);
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
        } = connectedSocialSourcesMap[key];
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
            accountTags: accTagsFn(connectedSocialSourcesMap[key]),
          },
        ];
        socialRows.push(...curSourceRows);
      });
    }
    return socialRows;
  }, [accTagsFn, connectedSocialSourcesMap]);
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
  const handleExport = useCallback(async () => {
    const formatDate = new Date().toLocaleString();
    let cvsArr: string[] = await assembleExcelParams();
    exportCsv(cvsArr, `Data File${formatDate}`);
  }, [assembleExcelParams]);
  const handleAdd = useCallback(() => {
    navigate('/datas');
  }, [navigate]);

  return (
    <div className="dataOverview">
      <div className="title">
        <span>Data Overview</span>
        <div className="operations">
          <UpdateDataSourceTip />

          <PButton
            type="secondary"
            size="s"
            text="Export"
            className="exportBtn"
            onClick={handleExport}
          />
          <PButton
            type="primary"
            size="s"
            text="Add"
            className="addBtn"
            onClick={handleAdd}
          />
        </div>
      </div>
      <div className="overviewItems">
        {hasConnectedAssetsDataSources && <AssetsBalance />}
        {hasConnectedSocialDataSources && (
          <section className={`followers overviewItem`}>
            <h4 className="title">
              <span>Followers</span>
            </h4>
            <div className="content">
              <div className="num">{formatTotalFollowers}</div>
              <div className="from">
                <span>From</span>
                <ul className="sources">
                  {connectedSocialSourcesList.map((i: any) => {
                    return (
                      <li key={i.id}>
                        <img src={i.icon} alt="" />
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </section>
        )}
        {Object.values(connectedKycSources).length > 0 && (
          <section className={`identity overviewItem`}>
            <h4 className="title">
              <span>Identity Verification</span>
            </h4>
            <div className="content">
              <div className="val">Verified</div>
              <div className="from">
                <span>By</span>
                <ul className="sources">
                  {Object.values(connectedKycSources).map((i: any) => {
                    return (
                      <li key={i.id}>
                        <img src={i.icon} alt="" />
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
});

export default Overview;
