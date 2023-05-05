import React, {useState, useEffect, useCallback} from 'react'
import { DATASOURCEMAP } from '@/utils/constants'
import type { AssetsMap } from '@/components/DataSourceOverview/DataSourceItem'
import type { ExchangeMeta } from '@/utils/constants'

type ExInfo = {
  date: string;
  apiKey: string;
  totalBalance: string;
  tokenListMap: AssetsMap;
  pnl?:string;
  label?:string;
  flexibleAccountTokenMap: AssetsMap;
  spotAccountTokenMap: AssetsMap;
}
export type DataSourceStorages = {
  binance?: any,
  okx?: any,
  kucoin?: any,
  twitter?: any,
  coinbase?: any,
  [propName: string]: any
}
export type ExDataType = ExInfo & ExchangeMeta

const useExSource = () => {
  const [assetDataSourceMap, setAssetDataSourceMap] = useState<ExDataType>()
  const getExDatas = useCallback(async (name:string) => {
    let res: DataSourceStorages = await chrome.storage.local.get(name);
    const storageData = res[name]
    // console.log('$$$$$$$$$', storageData)
    if(storageData) {
      let sourceData = JSON.parse(storageData)
      sourceData = {
        ...sourceData,
        ...DATASOURCEMAP[name],
        assetsNo: Object.keys(sourceData.tokenListMap).length
      }
      setAssetDataSourceMap(sourceData)
    } else {
      setAssetDataSourceMap(undefined)
    }
  },[])
  // useEffect(() => {
  //   getExDatas()
  // },[name, getExDatas])
  return [assetDataSourceMap, getExDatas]
}

export default useExSource