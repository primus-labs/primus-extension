import React, { useState, useMemo , useEffect, useCallback} from 'react';
import { useSelector, useDispatch } from 'react-redux'
import { formatD, formatUD,sub,getCurrentDate, postMsg,formatNumeral } from '@/utils/utils'
import type { TokenMap } from '@/components/DataSourceOverview/DataSourceItem'
// import PInput from '@/components/PInput'
import './index.sass';
import type { UserState } from '@/store/reducers'
import type { DataSourceItemType } from '@/components/DataSourceOverview/DataSourceItem'
import PFilter from '@/components/PFilter'
import type { Dispatch } from 'react'
import { setSysConfigAction } from '@/store/actions'

interface TokenTableProps {
  list: TokenMap[] | DataSourceItemType[];
  type?: string;
  flexibleAccountTokenMap?: any;
  spotAccountTokenMap?: any;
  name?:string;
}
const navs = [
  {
    label: 'All',
    disabled: false,
    defaultValue: true
  },
  {
    label: 'Spot',
    disabled: false,
    defaultValue: true
  },
  {
    label: 'Flexible',
    disabled: false,
    defaultValue: true
  },
 ]
const TokenTable: React.FC<TokenTableProps> = ({ list, type = 'Assets',flexibleAccountTokenMap,spotAccountTokenMap , name}) => {
  console.log('TokenTable-list', list,name,spotAccountTokenMap,flexibleAccountTokenMap);
  const [filterAccount, setFilterAccount] = useState<string | undefined>()
  const [dorpdownVisible, setDorpdownVisible] = useState<boolean>(false)
  const [activeItem,setActiveItem] = useState<string>()
  const sysConfig = useSelector((state: UserState) => state.sysConfig)
  const padoServicePort = useSelector((state: UserState) => state.padoServicePort)
  const tokenLogoPrefix = useMemo(() => {
    console.log('TokenTable-sysConfig', sysConfig)
    return sysConfig.TOKEN_LOGO_PREFIX
  }, [sysConfig])
  const dispatch: Dispatch<any> = useDispatch()
  const getSysConfig = useCallback(async () => {
    const padoServicePortListener = async function (message: any) {
      if (message.resMethodName === 'getSysConfig') {
        console.log("page_get:getSysConfig:", message.res);
        const configMap = message.res.reduce((prev: any, curr: any) => {
          const { configName, configValue } = curr
          prev[configName] = configValue
          return prev
        }, {})
        dispatch(setSysConfigAction(configMap))
      }
    }
    padoServicePort.onMessage.addListener(padoServicePortListener)
    postMsg(padoServicePort, {
      fullScreenType: 'padoService',
      reqMethodName: 'getSysConfig',
    })
    console.log("page_send:getSysConfig request",padoServicePort);
  }, [dispatch, padoServicePort])
  useEffect(() => {
    if(!sysConfig.TOKEN_LOGO_PREFIX) {
      getSysConfig()
    }
  }, [sysConfig])
  const [filterToken, setFilterToken] = useState<string>()
  const currentList = useMemo(() => {
    if (filterAccount === undefined || filterAccount === 'All') {
      return list
    }
    if (filterAccount === 'Spot') {
      return Object.values(spotAccountTokenMap)
    }
    if (filterAccount === 'Flexible') {
      return Object.values(flexibleAccountTokenMap)
    }
  }, [list, flexibleAccountTokenMap, spotAccountTokenMap , filterAccount])
  const activeList = useMemo(() => {
    if (filterToken) {
      const lowerFilterWord = filterToken?.toLowerCase()
      if (type === 'Assets') {
        return (currentList as TokenMap[]).filter(item => {
          const anchorName = item.symbol
          const lowerCaseName = anchorName.toLowerCase()
          return lowerCaseName.startsWith(lowerFilterWord as string)
        }).sort((a,b) => sub(Number(b.value),Number(a.value)).toNumber())
      } else {
        return (currentList as DataSourceItemType[]).filter(item => {
          const anchorName = item.name
          const lowerCaseName = anchorName.toLowerCase()
          return lowerCaseName.startsWith(lowerFilterWord as string)
        }).sort((a,b) => sub(Number(b.followers),Number(a.followers)).toNumber())
      }
    } else {
      if (type === 'Assets') {
        return (currentList as TokenMap[]).sort((a,b) => sub(Number(b.value),Number(a.value)).toNumber())
      } else {
        return (currentList as DataSourceItemType[]).sort((a,b) => sub(Number(b.followers),Number(a.followers)).toNumber())
      }
    }

  }, [currentList, filterToken, type])

  // const handleChangeInput = (val: string) => {
  // }
  // const handleSearch = (val: string) => {
  //   setFilterToken(val)
  // }
  const handleCheckDetail = (symbol:string) => {
    const activeS = symbol === activeItem? undefined: symbol
    setActiveItem(activeS)
  }
  const liClassName = useCallback((item:TokenMap) => {
    let cN = 'tokenItem tr'
    if (name === 'binance' ) {
      cN += ' new'
      if (activeItem === item.symbol) {
        if (spotAccountTokenMap[item.symbol]?.amount > 0 ) {
          cN += ' expand'
        }
        if (flexibleAccountTokenMap[item.symbol]?.amount > 0 ) {
          cN += ' expandPlus'
        }
      }
    }
    return cN
  }, [name,activeItem,spotAccountTokenMap,flexibleAccountTokenMap])
  const handleChangeFilter = (filterAccount: string | undefined) => {
    setFilterAccount(filterAccount)
  }
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
          <li className={name === 'binance' ? "tokenItem th new": "tokenItem th"} key="th">
            <div className="innerWrapper">
              <div className="token">Token</div>
              <div className="price">Price</div>
              <div className="amount">Amount</div>
              <div className="value">USD Value</div>
            </div>
            <div className="accountFilterWrapper"><PFilter onChange={handleChangeFilter}/></div>
          </li>
          {(activeList as TokenMap[]).map(item => {
            return <li className={liClassName(item)} key={item.symbol}>
              <div className="innerWrapper">
                <div className="token">
                  {tokenLogoPrefix && <img src={`${tokenLogoPrefix}icon${item.symbol}.png`} alt="" />}
                  <span>{item.symbol}</span>
                </div>
                <div className="price">{'$'+ (item.price === '0' ? '--': formatNumeral(item.price))}</div>
                <div className="amount">{formatNumeral(item.amount, {decimalPlaces: 6})}</div>
                <div className="value">{'$'+formatNumeral(item.value)}</div>
              </div>
              {name === 'binance' && filterAccount === 'All' && <div className="arrowWrapper" onClick={() => handleCheckDetail(item.symbol)}></div>}
              {activeItem === item.symbol && filterAccount === 'All' && <div className="detailWrapper">
                {spotAccountTokenMap[item.symbol]?.amount > 0 && <div className="descItem">
                  <div className="token">
                    <div className="label">Spot</div>
                  </div>
                  <div className="price"></div>
                  <div className="amount">{formatNumeral(spotAccountTokenMap[item.symbol]?.amount || '0', {decimalPlaces: 6})}</div>
                  <div className="value">{'$'+formatNumeral(spotAccountTokenMap[item.symbol]?.value  || '0')}</div>
                </div>}
                {flexibleAccountTokenMap[item.symbol]?.amount > 0 && <div className="descItem">
                  <div className="token">
                    <div className="label">Flexible</div>
                  </div>
                  <div className="price"></div>
                  <div className="amount">{formatNumeral(flexibleAccountTokenMap[item.symbol]?.amount || '0', {decimalPlaces: 6})}</div>
                  <div className="value">{'$'+formatNumeral(flexibleAccountTokenMap[item.symbol]?.value  || '0') }</div>
                </div>}
              </div>}
            </li>
          })}
        </ul> :
        <ul className="tokens social">
          <li className="tokenItem th" key="th">
            <div className="innerWrapper">
              <div className="token">Social</div>
              <div className="userName">User Name</div>
              <div className="verified">Verified</div>
              <div className="createTime">Created Time</div>
              <div className="followers">Followers</div>
              <div className="post">Posts</div>
              </div>  
          </li>
          {(activeList as DataSourceItemType[]).map(item => {
            return <li className="tokenItem tr" key={item.name}>
               <div className="innerWrapper">
              <div className="token">
                <img src={item.icon} alt="" />
                <span>{item.name}</span>
              </div>
              <div className="userName">{item.userName}</div>
              <div className="verified">{item.verified ? 'Y' : 'N'}</div>
              <div className="createdTime">{getCurrentDate(item.createdTime)}</div>
              <div className="followers">{formatNumeral((item.followers as string), {transferUnit:false,decimalPlaces:0}) }</div>
              <div className="posts">{formatNumeral((item.posts as string), {transferUnit:false,decimalPlaces:0}) }</div>
              </div>
            </li>
          })}
        </ul>
      }
    </section>
  );
};

export default TokenTable;
