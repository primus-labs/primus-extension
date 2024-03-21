import React, { memo, useCallback, useMemo, FC } from 'react';
import dayjs from 'dayjs';
import useAllSources from '@/hooks/useAllSources';
import { sub, formatNumeral, getCurrentDate } from '@/utils/utils';
import './index.scss';

const TokenTable: FC = memo(({}) => {
  const { sourceMap } = useAllSources();
  const connectedSocialSources = useMemo(() => {
    return sourceMap.socialSources;
  }, [sourceMap]);
  const sortedList = useMemo(() => {
    const orderedSocialList = Object.values(connectedSocialSources).sort(
      (a: any, b: any) =>
        sub(Number(b.followers), Number(a.followers)).toNumber()
    );
    return orderedSocialList;
  }, []);

  const formatTxtFn = useCallback((item, key) => {
    let formatTxt;
    const val = item[key];
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
  const accTagsFn = useCallback((item) => {
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
  const formatDate = (timestamp) => {
    return dayjs(timestamp).format('YYYY/MM/DD');
  };

  return (
    <div className="tokenTable social">
      <ul className="tokenItems">
        <li className="tokenItem th">
          <div className="token">Social Platform</div>
          <div>Account Name</div>
          <div>Created Time</div>
          <div>Followers </div>
          <div>Following</div>
          <div>Posts</div>
          <div>Account Info</div>
        </li>
        {sortedList.map((j: any) => {
          return (
            <li className="tokenItem tr" key={j.id}>
              <div className="token">
                <img src={j.icon} alt="" />
                <span>{j.name}</span>
              </div>
              <div>
                {j.id === 'x' ? j.screenName : j.userName ?? j.screenName}
              </div>
              <div>{j.createdTime ? formatDate(j.createdTime) : '-'}</div>
              <div>{formatTxtFn(j, 'followers')}</div>
              <div>{formatTxtFn(j, 'followings')}</div>
              <div className="posts">{formatTxtFn(j, 'posts')}</div>
              <div className="verified">{accTagsFn(j)}</div>
            </li>
          );
        })}
      </ul>
    </div>
  );
});

export default TokenTable;
