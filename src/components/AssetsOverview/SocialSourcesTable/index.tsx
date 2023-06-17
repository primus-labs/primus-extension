import React, { useMemo, memo, useCallback } from 'react';
import { sub, getCurrentDate, formatNumeral } from '@/utils/utils';
import type { DataSourceItemType } from '@/components/DataSourceOverview/DataSourceItem';
import './index.sass';

interface TokenTableProps {
  list: DataSourceItemType[];
}

const TokenTable: React.FC<TokenTableProps> = memo(({ list }) => {
  // console.log('SocialSources-list', list,);
  const currentList = useMemo(() => {
    return list;
  }, [list]);
  const activeList = useMemo(() => {
    return (currentList as DataSourceItemType[]).sort((a, b) =>
      sub(Number(b.followers), Number(a.followers)).toNumber()
    );
  }, [currentList]);

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
  const formatTxtFn = useCallback((item: DataSourceItemType, key: string) => {
    let formatTxt;
    const val = item[key as keyof DataSourceItemType];
    if (val === null) {
      formatTxt = '-';
    } else {
      formatTxt = formatNumeral(val, {
        transferUnit: false,
        decimalPlaces: 0,
      });
    }
    return formatTxt;
  }, []);

  return (
    <section className="tokenListWrapper social">
      <header>
        <span>Profile</span>
      </header>
      <ul className="tokens social">
        <li className="tokenItem th" key="th">
          <div className="innerWrapper">
            <div className="token">Social</div>
            <div className="userName">User Name</div>
            <div className="createTime">Created Time</div>
            <div className="followers">Followers</div>
            <div className="following">Following</div>
            <div className="posts">Posts</div>
            <div className="verified">Acc. Tags</div>
          </div>
        </li>
        {(activeList as DataSourceItemType[]).map((item) => {
          return (
            <li className="tokenItem tr" key={item.name}>
              <div className="innerWrapper">
                <div className="token">
                  <img src={item.icon} alt="" />
                  <span>{item.name}</span>
                </div>
                <div className="userName">
                  {item.userName ?? item.screenName}
                </div>

                <div className="createTime">
                  {item.createdTime ? getCurrentDate(item.createdTime) : '-'}
                </div>
                <div className="followers">
                  {formatTxtFn(item, 'followers')}
                </div>
                <div className="following">
                  {formatTxtFn(item, 'followings')}
                </div>
                <div className="posts">{formatTxtFn(item, 'posts')}</div>
                <div className="verified">{accTagsFn(item)}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
});

export default TokenTable;
