import React, { memo, useCallback, useState, useMemo, FC } from 'react';
import { Pagination } from 'antd';
import { SUPPORRTEDQUERYCHAINMAP } from '@/config/chain';
import './index.scss';
const PAGESIZE = 10;
interface NFTListProps {
  list: any;
}

const NFTList: FC<NFTListProps> = memo(({ list }) => {
  const totolCount = list.length;
  const [current, setCurrent] = useState(1);

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
      <ul className="NFTItems">
        {list.map((i, k) => {
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
      {totolCount > 0 && (
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
