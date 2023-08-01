import React, { useMemo, memo } from 'react';
import BigNumber from 'bignumber.js';
import iconSuc from '@/assets/img/iconSuc.svg';
import { gte, formatNumeral, formatAddress } from '@/utils/utils';
import type { ExchangeMeta } from '@/types/dataSource';
import type {
  SocialDataSourceData,
  SourceData,
  ExData,
  SocialData,
  KYCData,
  onChainAssetsData,
} from '@/types/dataSource';

import './index.sass';

export type TokenMap = {
  symbol: string;
  price: string;
  amount: string;
  value: string;
  logo?: string;
  isNative?: boolean;
};
export type AssetsMap = {
  [propName: string]: TokenMap;
};
export type DataSourceData = {
  tokenListMap?: AssetsMap;
  totalBalance?: string;
  assetsNo?: number;
  label?: string;
  flexibleAccountTokenMap?: any;
  spotAccountTokenMap?: any;
};
export type DataSourceItemType = {
  date: string;
  pnlAmount?: string;
  pnlPercent?: string;
  pnl?: string;
} & ExchangeMeta &
  DataSourceData &
  SocialDataSourceData &
  onChainAssetsData;
type SourceDescItem = {
  name: string;
  sourceKey: string;
};
interface DataSourceItemProps {
  item: SourceData;
  onCheck: (item: SourceData) => void;
}

const DataSourceItem: React.FC<DataSourceItemProps> = memo(
  ({ item: source, onCheck }) => {
    const {
      icon,
      name,
      type,
      date,
      totalBalance,
      pnl,
      followers,
      posts,
      followings,
      label,
      userName,
      screenName,
      address,
      tokenListMap,
    } = source as ExData & SocialData & KYCData & onChainAssetsData;
    const formatSource = {
      ...source,
      totalBalance: totalBalance ? `$${formatNumeral(totalBalance)}` : '--',
      pnlAmount: pnl
        ? gte(Number(pnl), 0)
          ? `+$${formatNumeral(pnl, { decimalPlaces: 4 })}`
          : `-$${formatNumeral(new BigNumber(Number(pnl)).abs().toFixed(), {
              decimalPlaces: 4,
            })}`
        : '--',
      followers:
        followers &&
        `${formatNumeral(followers, {
          transferUnit: false,
          decimalPlaces: 0,
        })}`,
      posts:
        posts &&
        `${formatNumeral(posts, { transferUnit: false, decimalPlaces: 0 })}`,
      followings:
        followings &&
        `${formatNumeral(followings, {
          transferUnit: false,
          decimalPlaces: 0,
        })}`,
      assetsNo: tokenListMap ? Object.keys(tokenListMap).length : 0,
    };
    const formatAddr = useMemo(() => {
      if (address) {
        return formatAddress(address, 4, 4);
      }
      return '';
    }, [address]);
    const descArr: SourceDescItem[] = useMemo(() => {
      const descTypeMap = {
        Social: [
          {
            name: 'Total Followers',
            sourceKey: 'followers',
          },
          {
            name: 'Total Following',
            sourceKey: 'followings',
          },
          {
            name: 'Total Posts',
            sourceKey: 'posts',
          },
        ],
        Assets: [
          {
            name: 'Total Balance',
            sourceKey: 'totalBalance',
          },
          {
            name: 'PnL',
            sourceKey: 'pnlAmount',
          },
          {
            name: 'Assets No.',
            sourceKey: 'assetsNo',
          },
        ],
        Identity: [
          {
            name: 'Name',
            sourceKey: 'fullName',
          },
          {
            name: 'Document Type',
            sourceKey: 'docName',
          },
          {
            name: 'Date of Expiry',
            sourceKey: 'validUntil',
          },
        ],
      };
      return descTypeMap[type];
    }, [type]);
    const handleClick = () => {
      if (type === 'Social' || type === 'Identity') {
        return;
      }
      onCheck(source);
    };
    const activeClassName = useMemo(() => {
      let defalutClass = 'dataSourceItem';
      if (type === 'Social') {
        defalutClass += ' deactive';
      }
      return defalutClass;
    }, [type]);
    const tagClassName = useMemo(() => {
      let defaultCN = 'tag';
      defaultCN += ` ${type}`;
      return defaultCN;
    }, [type]);

    return (
      <div className={activeClassName} onClick={handleClick}>
        <div className="dataSourceItemT">
          <div
            className={type === 'Assets' && label ? 'TLeft' : 'TLeft noLabel'}
          >
            <img src={icon} alt="" />
            <div className="TLeftCon">
              <h6>{name === 'On-chain Assets' ? formatAddr : name}</h6>
              {type === 'Social' && (
                <div className="desc">
                  <span className="label">User:&nbsp;</span>
                  <span className="value">{userName ?? screenName}</span>
                </div>
              )}
              {type === 'Assets' && label && (
                <div className="desc">
                  <span className="label">Label:&nbsp;</span>
                  <span className="value">{label}</span>
                </div>
              )}
            </div>
          </div>
          <div className="TRight titleWrapper">
            <div className="dateWrapper">
              <img src={iconSuc} alt="" />
              <span>{date}</span>
            </div>
            <div className={tagClassName}>{type}</div>
          </div>
        </div>
        <div className="dataSourceItemC">
          {descArr.map((item) => {
            return (
              <div
                key={item.name}
                className={
                  type === 'Identity' ? 'descItem Identity' : 'descItem'
                }
              >
                <div className="descT">{item.name}</div>
                <div className="descC">
                  {formatSource[item.sourceKey as keyof typeof source] ?? '-'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

export default DataSourceItem;
