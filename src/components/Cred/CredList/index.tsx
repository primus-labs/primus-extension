import React, { useMemo, memo } from 'react';
import CredItem from './CredItem';
import EmptyDataSourceItem from '@/components/DataSourceOverview/DataSourceList/EmptyDataSourceItem';

import type { CredTypeItemType } from '@/types/cred';

import './index.scss';

interface CredListProps {
  onChange?: (item: CredTypeItemType) => void;
  onUpChain: (item: CredTypeItemType) => void;
  onViewQrcode: (item: CredTypeItemType) => void;
  onBindPolygonID: (item: CredTypeItemType) => void;
  onUpdate: (item: CredTypeItemType) => void;
  onDelete: (item: CredTypeItemType) => void;
  list: CredTypeItemType[];
  onAdd: () => void;
}
const CredList: React.FC<CredListProps> = memo(
  ({
    onChange,
    onUpChain,
    onViewQrcode,
    onBindPolygonID,
    onUpdate,
    onDelete,
    list,
    onAdd,
  }) => {
    return (
      <section className="credListWrapper">
        {list.length < 1 && <EmptyDataSourceItem onAdd={onAdd} />}
        {list.length > 0 && (
          <ul className="credList">
            {list.map((item, index) => (
              <li
                className="credTypeItemWrapper"
                onClick={() => {
                  onChange && onChange(item);
                }}
                key={item.requestid}
              >
                <CredItem
                  item={item}
                  onUpChain={onUpChain}
                  onViewQrcode={onViewQrcode}
                  onBindPolygonID={onBindPolygonID}
                  onDelete={onDelete}
                  onUpdate={onUpdate}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    );
  }
);

export default memo(CredList);
