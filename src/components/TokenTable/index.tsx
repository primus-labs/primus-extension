import React, { useState, useMemo , useEffect, useCallback} from 'react';
import { useSelector, useDispatch } from 'react-redux'
import { formatD, formatUD,sub,getCurrentDate, postMsg,formatNumeral } from '@/utils/utils'
import type { TokenMap } from '@/components/DataSourceOverview/DataSourceItem'
// import PInput from '@/components/PInput'
import './index.sass';
import type { UserState } from '@/store/reducers'
import type { DataSourceItemType } from '@/components/DataSourceOverview/DataSourceItem'
import type { Dispatch } from 'react'
import { setSysConfigAction } from '@/store/actions'

interface TokenTableProps {
  list: TokenMap[] | DataSourceItemType[];
  type?: string;
}

const TokenTable: React.FC<TokenTableProps> = ({ list, type = 'Assets' }) => {
  // console.log('TokenTable-list', list);
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
  const activeList = useMemo(() => {
    if (filterToken) {
      const lowerFilterWord = filterToken?.toLowerCase()
      if (type === 'Assets') {
        return (list as TokenMap[]).filter(item => {
          const anchorName = item.symbol
          const lowerCaseName = anchorName.toLowerCase()
          return lowerCaseName.startsWith(lowerFilterWord as string)
        }).sort((a,b) => sub(Number(b.value),Number(a.value)).toNumber())
      } else {
        return (list as DataSourceItemType[]).filter(item => {
          const anchorName = item.name
          const lowerCaseName = anchorName.toLowerCase()
          return lowerCaseName.startsWith(lowerFilterWord as string)
        }).sort((a,b) => sub(Number(b.followers),Number(a.followers)).toNumber())
      }
    } else {
      if (type === 'Assets') {
        return (list as TokenMap[]).sort((a,b) => sub(Number(b.value),Number(a.value)).toNumber())
      } else {
        return (list as DataSourceItemType[]).sort((a,b) => sub(Number(b.followers),Number(a.followers)).toNumber())
      }
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
                {tokenLogoPrefix && <img src={`${tokenLogoPrefix}icon${item.symbol}.png`} alt="" />}
                
                <span>{item.symbol}</span>
              </div>
              <div className="price">{'$'+ (item.price === '0' ? '--': formatNumeral(item.price))}</div>
              <div className="amount">{formatNumeral(item.amount, {decimalPlaces: 6})}</div>
              <div className="value">{'$'+formatNumeral(item.value)}</div>
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
              <div className="followers">{formatNumeral((item.followers as string), {transferUnit:false,decimalPlaces:0}) }</div>
              <div className="posts">{formatNumeral((item.posts as string), {transferUnit:false,decimalPlaces:0}) }</div>
            </li>
          })}
        </ul>
      }
    </section>
  );
};

export default TokenTable;
