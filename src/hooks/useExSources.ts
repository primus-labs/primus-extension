import React, {useState, useEffect, useCallback} from 'react'
import { DATASOURCEMAP } from '@/utils/constants'
import { getMutipleStorageSyncData } from '@/utils/utils'
import type { AssetsMap } from '@/components/DataSourceOverview/DataSourceItem'
import type { ExchangeMeta } from '@/utils/constants'

type ExInfo = {
  date: string;
  apiKey: string;
  totalBalance: string;
  tokenListMap: AssetsMap;
}
export type DataSourceStorages = {
  binance?: any,
  okx?: any,
  kucoin?: any,
  twitter?: any,
  coinbase?: any,
  [propName: string]: any
}
export type ExDataMap = {
  [propName: string]: ExInfo & ExchangeMeta
}

const useExSources = () => {
  const [assetsDataSourceMap, setAssetsDataSourceMap] = useState<ExDataMap>()
  const getExDatas = useCallback(async () => {
    const sourceNameList = Object.keys(DATASOURCEMAP).filter(i => DATASOURCEMAP[i].type === 'Assets')
    let res: DataSourceStorages = await getMutipleStorageSyncData(sourceNameList);
    
    const reduceF = (prev: ExDataMap, curr: string) => {
      const sourceData = JSON.parse(res[curr])
      prev[curr] = {
        ...DATASOURCEMAP[curr],
        ...sourceData,
        assetsNo: Object.keys(sourceData.tokenListMap).length
      }
      return prev
    }
    const exDatas = Object.keys(res).reduce(reduceF, {})
    setAssetsDataSourceMap(exDatas)
  },[])
  useEffect(() => {
    getExDatas()
  },[getExDatas])
  return [assetsDataSourceMap, getExDatas]
}

export default useExSources