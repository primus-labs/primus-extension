import React, { useState, useMemo } from 'react';
import { formatD, formatUD } from '@/utils/utils'
import type { TokenMap } from '@/components/DataSourceItem'
import PInput from '@/components/PInput'
import iconBNB from '@/assets/img/iconBNB.svg'
import './index.sass';

interface TokenTableProps {
  list: TokenMap[]
}

const TokenTable: React.FC<TokenTableProps> = ({ list }) => {
  console.log('TokenTable-list', list);
  const [filterToken, setFilterToken] = useState<string>()
  const activeList = useMemo(() => {
    if (filterToken) {
      const lowerFilterWord = filterToken?.toLowerCase()
      return list.filter(item => {
        const lowerCaseName = item.symbol.toLowerCase()
        return lowerCaseName.startsWith(lowerFilterWord as string)
      })
    } else {
      return list
    }
  }, [list, filterToken])

  const handleChangeInput = (val: string) => {
  }
  const handleSearch = (val: string) => {
    setFilterToken(val)
  }

  return (
    <section className="tokenListWrapper">
      <header>
        <span>Profile</span>
        <div className="pSearch">
          <PInput onChange={handleChangeInput} type="text" placeholder="Search" onSearch={handleSearch} />
        </div>
      </header>
      <ul className="tokens">
        <li className="tokenItem th" key="th">
          <div className="token">Token</div>
          <div className="price">Price</div>
          <div className="amount">Amount</div>
          <div className="value">USD Value</div>
        </li>
        {activeList.map(item => {
          return <li className="tokenItem tr" key={item.symbol}>
            <div className="token">
              <img src={`https://xuda-note.oss-cn-shanghai.aliyuncs.com/note/icon${item.symbol}.png`} alt="" />
              <span>{item.symbol}</span>
            </div>
            {/* TODO  */}
            <div className="price">{formatUD(item.price)}</div>
            <div className="amount">{formatD(item.amount, 6)}</div>
            <div className="value">{formatUD(item.value)}</div>
          </li>
        })}
      </ul>
    </section>
  );
};

export default TokenTable;
