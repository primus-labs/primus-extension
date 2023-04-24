import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux'
import { formatD, formatUD } from '@/utils/utils'
import type { TokenMap } from '@/components/DataSourceOverview/DataSourceItem'
// import PInput from '@/components/PInput'
import './index.sass';
import type { UserState } from '@/store/reducers'
import type { DataSourceItemType } from '@/components/DataSourceOverview/DataSourceItem'
import { getCurrentDate } from '@/utils/utils'
interface TokenTableProps {
  list: TokenMap[] | DataSourceItemType[];
  type?: string;
}

const TokenTable: React.FC<TokenTableProps> = ({ list, type = 'Assets' }) => {
  // console.log('TokenTable-list', list);
  const tokenLogoPrefix = useSelector((state: UserState) => state.sysConfig.TOKEN_LOGO_PREFIX)
  const [filterToken, setFilterToken] = useState<string>()
  const activeList = useMemo(() => {
    if (filterToken) {
      const lowerFilterWord = filterToken?.toLowerCase()
      if (type === 'Assets') {
        return (list as TokenMap[]).filter(item => {
          const anchorName = item.symbol
          const lowerCaseName = anchorName.toLowerCase()
          return lowerCaseName.startsWith(lowerFilterWord as string)
        })
      } else {
        return (list as DataSourceItemType[]).filter(item => {
          const anchorName = item.name
          const lowerCaseName = anchorName.toLowerCase()
          return lowerCaseName.startsWith(lowerFilterWord as string)
        })
      }

    } else {
      return list
    }
  }, [list, filterToken, type])

  // const handleChangeInput = (val: string) => {
  // }
  // const handleSearch = (val: string) => {
  //   setFilterToken(val)
  // }

  return (
    <section className="tokenListWrapper">
      <header>
        <span>Profile</span>
        {/* <div className="pSearch">
          <PInput onChange={handleChangeInput} type="text" placeholder="Search" onSearch={handleSearch} />
        </div> */}
      </header>
      {type === 'Assets' ?
        <ul className="tokens">
          <li className="tokenItem th" key="th">
            <div className="token">Token</div>
            <div className="price">Price</div>
            <div className="amount">Amount</div>
            <div className="value">USD Value</div>
          </li>
          {(activeList as TokenMap[]).map(item => {
            return <li className="tokenItem tr" key={item.symbol}>
              <div className="token">
                <img src={`${tokenLogoPrefix}icon${item.symbol}.png`} alt="" />
                <span>{item.symbol}</span>
              </div>
              <div className="price">{formatUD(item.price)}</div>
              <div className="amount">{formatD(item.amount, 6)}</div>
              <div className="value">{formatUD(item.value)}</div>
            </li>
          })}
        </ul> :
        <ul className="tokens social">
          <li className="tokenItem th" key="th">
            <div className="token">Social</div>
            <div className="userName">User Name</div>
            <div className="verified">Verified</div>
            <div className="createTime">Created Time</div>
            <div className="followers">Followers</div>
            <div className="post">Post</div>
          </li>
          {(activeList as DataSourceItemType[]).map(item => {
            return <li className="tokenItem tr" key={item.name}>
              <div className="token">
                <img src={item.icon} alt="" />
                <span>{item.name}</span>
              </div>
              <div className="userName">{item.userName}</div>
              <div className="verified">{item.verified ? 'Y' : 'N'}</div>
              <div className="createdTime">{getCurrentDate(item.createdTime)}</div>
              <div className="followers">{item.followers}</div>
              <div className="posts">{item.posts}</div>
            </li>
          })}
        </ul>
      }
    </section>
  );
};

export default TokenTable;
