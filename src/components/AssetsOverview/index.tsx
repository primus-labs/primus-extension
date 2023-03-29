import React, { useState } from 'react';
import iconRefresh from '@/assets/img/iconRefresh.svg';
import './index.sass';
import type { DataSourceItemList } from '@/components/DataSourceList'
import BigNumber from 'bignumber.js'
import PInput from '@/components/PInput'
import iconBNB from '@/assets/img/iconBNB.svg'
interface AssetsOverviewProps {
  list: DataSourceItemList
}
const AssetsOverview: React.FC<AssetsOverviewProps> = ({ list }) => {
  const [filterWord, setFilterWord] = useState<string>()
  const formatTotalBalance = (totalBalance: string) => {
    return totalBalance ? `$${new BigNumber(totalBalance).toFixed(2)}` : '-'
  }
  const handleChangeInput = (val: string) => {

  }
  const handleSearch = (val: string) => {
    setFilterWord(val)
  }
  return (
    <div className="assetsOverview">
      <header className="updateBtn">
        <img src={iconRefresh} alt="" />
        <span>Data Update</span>
      </header>
      <section className="statisticsWrapper">
        <div className="card cardL">
          <header>Overview</header>
          <div className="cardCon">
            <div className="descItem mainDescItem">
              <div className="label">Total Balance</div>
              <div className="value">$4,959.70</div>
            </div>
            <div className="descItemsWrapper">
              <div className="descItem">
                <div className="label">PnL</div>
                <div className="value">
                  <span>$4,959.70</span>
                  <div className="percent raise fall">-1.29%</div>
                </div>
              </div>
              <div className="descItem">
                <div className="label">Assets No.</div>
                <div className="value">9</div>
              </div>
            </div>
          </div>
        </div>
        <div className="card cardR">
          <header>Proportion</header>
          <div className="cardCon">
          </div>
        </div>
      </section>
      <section className="sourcesWrapper">
        <header>Sources</header>
        <ul className="sources">
          {list.map(item => {
            return <li className="source">
              <div className="label">Data on {item.name}</div>
              <div className="value">
                <img src={item.icon} alt="" />
                <span>{formatTotalBalance(item.totalBalance)}</span>
              </div>
            </li>
          })}
        </ul>
      </section>
      <section className="tokenListWrapper">
        <header>
          <span>Profile</span>
          <div className="pSearch">
            <PInput onChange={handleChangeInput} type="text" placeholder="Search" onSearch={handleSearch} />
          </div>
        </header>
        <ul className="tokens">
          <li className="token th">
            <div className="token">Token</div>
            <div className="price">Price</div>
            <div className="amount">Amount</div>
            <div className="value">USD Value</div>
          </li>

          {list.map(item => {
            return <li className="token tr" key={item.name}>
              <div className="token">
                <img src={iconBNB} alt="" />
                <span>BTC</span>
              </div>
              <div className="price">$24,771.06</div>
              <div className="amount">0.036100</div>
              <div className="value">$894.24</div>
            </li>
          })}
        </ul>
      </section>
    </div>
  );
};

export default AssetsOverview;
