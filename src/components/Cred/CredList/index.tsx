import React, {useMemo} from 'react';
import emptyBox from '@/assets/img/emptyBox.svg';
import iconDataSourceBinance from '@/assets/img/iconDataSourceBinance.svg';
import iconTool1 from '@/assets/img/iconTool1.svg';
import iconArbitrum from '@/assets/img/iconArbitrum.svg';
import iconOptimism from '@/assets/img/iconOptimism.svg';
import iconMina from '@/assets/img/iconMina.png';

import CredItem from '../CredItem';
import type { CredTypeItemType } from '../CredItem';
import './index.sass';

const credList: CredTypeItemType[] = [
  {
    type: 'Assets Proof',
    icon: iconDataSourceBinance,
    name: 'Binance',
    id: '111',
    label: '111',
    date: 'May 02, 2023',
    provided: [iconTool1, iconArbitrum, iconOptimism],
  },
  {
    type: 'Assets Proof',
    icon: iconDataSourceBinance,
    name: 'Binance',
    id: '111',
    label: '111',
    date: 'May 02, 2023',
    provided: [iconTool1, iconArbitrum, iconOptimism],
  },
  {
    type: 'Assets Proof',
    icon: iconDataSourceBinance,
    name: 'Binance',
    id: '111',
    label: '111',
    date: 'May 02, 2023',
    provided: [iconTool1, iconArbitrum, iconOptimism],
  },
  {
    type: 'Assets Proof',
    icon: iconDataSourceBinance,
    name: 'Binance',
    id: '111',
    label: '111',
    date: 'May 02, 2023',
    provided: [iconTool1, iconArbitrum, iconOptimism],
  },
];
interface CredTypeListProps {
  onChange?: (item: CredTypeItemType) => void;
}
const ProofTypeList: React.FC<CredTypeListProps> = ({ onChange }) => {
  const activeList = useMemo(() => {
    if(credList.length <= 3) {
      return credList.map(i => {
        i.expand = true
        return i
      })
    }
    return credList
  }, [credList])
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
      {credList.length > 0 && (
        <ul className="credList">
          {activeList.map((item,index) => (
            <li
              className="credTypeItemWrapper"
              onClick={() => {
                onChange && onChange(item);
              }}
              key={index}
            >
              <CredItem item={item} />
            </li>
          ))}
        </ul>
      )}
      {credList.length === 0 && (
        <div className="empty">
          <img src={emptyBox} alt="" />
          <p>You don’t have any credentials yet.</p>
        </div>
      )}
    </section>
  );
};

export default ProofTypeList;
