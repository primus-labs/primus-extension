import React, { useMemo, useState, memo } from 'react';
import emptyBox from '@/assets/img/emptyBox.svg';
import CredItem from '../CredItem';
import type { CredTypeItemType } from '../CredItem';
import './index.sass';

interface CredListProps {
  onChange?: (item: CredTypeItemType) => void;
  onUpChain: (item: CredTypeItemType) => void;
  onViewQrcode: (item: CredTypeItemType) => void;
  onUpdate: (item: CredTypeItemType) => void;
  onDelete: (item: CredTypeItemType) => void;
  list: CredTypeItemType[]
}
const CredList: React.FC<CredListProps> = ({
  onChange,
  onUpChain,
  onViewQrcode,
  onUpdate,
  onDelete,
  list,
}) => {
  const activeList = useMemo(() => {
    if (list.length <= 3) {
      return list.map((i) => {
        i.expand = true;
        return i;
      });
    }
    return list;
  }, [list]);
  
  return (
    <section className="credListWrapper">
      <header className="credListHeader">
        <h2 className="title">Credentials</h2>
        <div className="statisticsWrapper">
          <div className="statisticsItem">
            <div className="value">3</div>
            <div className="label">Attested</div>
          </div>
          <div className="separtor"></div>
          <div className="statisticsItem">
            <div className="value">3</div>
            <div className="label">Provided</div>
          </div>
        </div>
      </header>
      {list.length > 0 && (
        <ul className="credList">
          {activeList.map((item, index) => (
            <li
              className="credTypeItemWrapper"
              onClick={() => {
                onChange && onChange(item);
              }}
              key={index}
            >
              <CredItem
                item={item}
                onUpChain={onUpChain}
                onViewQrcode={onViewQrcode}
                onDelete={onDelete}
                onUpdate={onUpdate}
              />
            </li>
          ))}
        </ul>
      )}
      {list.length === 0 && (
        <div className="empty">
          <img src={emptyBox} alt="" />
          <p>You don’t have any credentials yet.</p>
        </div>
      )}
    </section>
  );
};

export default memo(CredList);
