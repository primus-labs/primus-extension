import React, { memo, useCallback, useState, useMemo, FC } from 'react';
import { Pagination } from 'antd';
import { SUPPORRTEDQUERYCHAINMAP } from '@/config/chain';
import './index.scss';
const PAGESIZE = 8;
interface NFTListProps {
  list: any;
}

const NFTList: FC<NFTListProps> = memo(({ list }) => {
  const totolCount = list.length;
  const [current, setCurrent] = useState(1);
  const showList = useMemo(() => {
    const startK = (current - 1) * PAGESIZE;
    let newL = list.slice(startK, startK + PAGESIZE);
    return newL;
  }, [current, list]);
  const pageChangedFn = (page) => {
    if (page === 'pre') {
      page = current - 1;
    }
    if (page === 'next') {
      page = current + 1;
    }
    if (page < 1) {
      page = 1;
    }
    setCurrent(page);
  };

  return (
    <div className="NFTList">
      <ul className={`NFTItems ${totolCount >= PAGESIZE ? 'fullHeight' : ''}`}>
        {showList.map((i, k) => {
          return (
            <li className="NFTItem" key={k}>
              <div className="imgWrapper" style={{}}>
                <img src={i.imageUri} alt="" />
              </div>
              <div className="txtWrapper">
                <h5 className="NFTName">{i.name}</h5>
                <h6 className="collectionName">
                  <img src={SUPPORRTEDQUERYCHAINMAP[i.chain].icon} alt="" />
                  <span>{i.collectionName}</span>
                </h6>
              </div>
            </li>
          );
        })}
      </ul>
      {totolCount > PAGESIZE && (
        <div className={'pageComponent'}>
          <Pagination
            total={totolCount}
            onChange={pageChangedFn}
            showSizeChanger={false}
            pageSize={PAGESIZE}
          />
        </div>
      )}
    </div>
  );
});

export default NFTList;
