import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import BigNumber from 'bignumber.js'
import { add } from '@/utils/utils'
import type { TokenMap, AssetsMap } from '@/components/DataSourceItem'
import { getSingleStorageSyncData } from '@/utils/utils'
import { DATASOURCEMAP } from '@/utils/constants'
import TokenTable from '@/components/TokenTable'
import iconArrowLeft from '@/assets/img/iconArrowLeft.svg'
import iconSuc from '@/assets/img/iconSuc.svg'
import iconAvatar from '@/assets/img/iconAvatar.svg'
import iconClock from '@/assets/img/iconClock.svg'
import './index.sass';

export type DataSourceType = {
  date: string;
  tokenListMap: AssetsMap;
  totalBalance: string,// TODO format amount
  [propName: string]: any
}
interface AssetsDetailProps {
  onProve: (name: string) => void
}
const AssetsDetail: React.FC<AssetsDetailProps> = ({ onProve }) => {
  const [searchParams] = useSearchParams()
  const [dataSource, setDataSource] = useState<DataSourceType>()
  const [proofList, setProofList] = useState([
    'Assets', 'Active User'
  ])
  const [activeSourceName, setActiveSourceName] = useState<string>()
  const totalAssetsBalance = useMemo(() => {
    if (dataSource) {
      const reduceF: (prev: BigNumber, curr: TokenMap) => BigNumber = (prev: BigNumber, curr: TokenMap) => {
        const { value } = curr
        return add(prev.toNumber(), (Number(value)))
      }
      const bal = (Object.values(dataSource.tokenListMap) as TokenMap[]).reduce(reduceF, new BigNumber(0))
      return `$${bal.toFixed(2)}`
    } else {
      return '$0.00'
    }
  }, [dataSource])
  const totalAssetsNo = useMemo(() => {
    if (dataSource) {
      const num = Object.keys(dataSource.tokenListMap).length
      return num
    } else {
      return 0
    }
  }, [dataSource])
  const totalAssetsList = useMemo(() => {
    if (dataSource) {
      const list = Object.values(dataSource.tokenListMap)
      return list
    } else {
      return []
    }
  }, [dataSource])
  const handleProve = (item: string) => {
    // 'Assets', 'Active User'
    onProve(item)
  }
  const getDataSource = async () => {
    const name = searchParams.get('name') as string
    const sName = name.toLowerCase()
    const icon = DATASOURCEMAP[sName].icon
    let res = (await getSingleStorageSyncData(sName)) as string
    // const activeSourceList = sourceNameList.filter(item => res[item as keyof typeof res]).map((item) => {
    const sData: DataSourceType = JSON.parse(res)
    sData.icon = icon
    // })
    console.log('getDataSource', sData)
    setDataSource(sData)
  }
  useEffect(() => {
    getDataSource()
  }, [])
  return (
    <div className="assetsDetail">
      <header>
        <img src={iconAvatar} alt="" className="avatar" />
        <h3>User Name</h3>
        <div className="descItems">
          <div className="descItem">
            {/* TODO */}
            <img src={dataSource?.icon} alt="" className="sourceIcon" />
            <div className="value">Binance</div>
          </div>
          <div className="descItem">
            <div className="label">ID: </div>
            <div className="value">tPekpYpExd</div>
          </div>
          <div className="descItem">
            <div className="label">Date: </div>
            <div className="value">{dataSource?.date}</div>
            {/* TODO */}
            <img src={iconClock} alt="" className="clockIcon" />
          </div>
        </div>
      </header>
      <section className="sourceStatisticsBar">
        <div className="descItem">
          <div className="label">Est Total Value</div>
          <div className="value">{totalAssetsBalance}</div>
          {/* TODO  */}
          <div className="btcValue">≈ 100 BTC</div>
        </div>
        <div className="descItem">
          <div className="label">Assets No. </div>
          <div className="value">{totalAssetsNo}</div>
        </div>
        <div className="descItem">
          <div className="label">PnL </div>
          {/* TODO */}
          <div className="value">200</div>
        </div>
      </section>
      <section className="proofsBar">
        {proofList.map(item => {
          return (<div key={item} className="proofCard" onClick={() => handleProve(item)}>
            <div className="cardC">
              <div className="label">{item}  Proof</div>
              <img className="iconSuc" src={iconSuc} alt="" />
              <img className="iconArrow" src={iconArrowLeft} alt="" />
            </div>
          </div>)
        })}
      </section>
      <TokenTable list={totalAssetsList} />
    </div>
  );
};

export default AssetsDetail;
