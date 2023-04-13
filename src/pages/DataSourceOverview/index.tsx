import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Dispatch } from 'react';
import { connect, useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router';
import PTabs from '@/components/PTabs'
import PInput from '@/components/PInput'
import PSelect from '@/components/PSelect'
import DataSourceList from '@/components/DataSourceList'
import DataSourcesDialog from '@/components/DataSourceOverview/DataSourcesDialog'
import DataSourcesExplainDialog from '@/components/DataSourceOverview/DataSourcesExplainDialog'
import type { DataFieldItem } from '@/components/DataSourceOverview/DataSourcesDialog'
import ConnectDataSourceDialog from '@/components/DataSourceOverview/ConnectDataSourceDialog'
import type { GetDataFormProps } from '@/components/DataSourceOverview/ConnectDataSourceDialog'
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog'
import AssetsOverview from '@/components/AssetsOverview'
import SocialOverview from '@/components/SocialOverview'

import { getMutipleStorageSyncData } from '@/utils/utils'
import { DATASOURCEMAP } from '@/utils/constants'
import type { ExchangeMeta } from '@/utils/constants'
import type { DataSourceItemList } from '@/components/DataSourceList'
import type { DataSourceItemType } from '@/components/DataSourceItem'
import './index.sass';
import type { UserState } from '@/store/reducers'
import { setExDataAsync, initExDataAsync, initSocialDataAsync, setSocialDataAction } from '@/store/actions'
import store from '@/store/index';
import DataUpdateBar from '@/components/DataUpdateBar'
import useAuthorization from '@/hooks/useAuthorization'

interface DataSourceOverviewProps {
  padoServicePort: chrome.runtime.Port,
  binance?: {
    totalBalance: any,
    tokenListMap: any
  },
  twitter: object
}

export type DataSourceStorages = {
  binance?: any,
  okx?: any,
  kucoin?: any,
  twitter?: any,
  coinbase?: any,
  [propName: string]: any
}
type PortMsg = {
  resMethodName: string;
  res: any;
}
type UserAction = {
  type: string;
  payload: any;
}
type ExKeysStorages = {
  [propName: string]: any;
}
const DataSourceOverview: React.FC<DataSourceOverviewProps> = ({ padoServicePort, binance, twitter }) => {
  const authorize = useAuthorization()
  const dispatch: Dispatch<any> = useDispatch()
  const exDatas = useSelector((state: UserState) => state.exDatas)
  const socialDatas = useSelector((state: UserState) => state.socialDatas)
  // console.log('store-exDatas&socialDatas', exDatas, socialDatas)
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [activeSource, setActiveSource] = useState<DataFieldItem>()
  // const [dataSourceList, setDataSourceList] = useState<DataSourceItemList>([])
  const [filterWord, setFilterWord] = useState<string>()
  const assetsDataSourceMap = useMemo(() => {
    const sourceNameList = Object.keys(exDatas)
    const existExNames = sourceNameList.filter(item => exDatas[item as keyof typeof exDatas])

    const reduceF = (prev: any, curr: string) => {
      const sourceData = exDatas[curr]
      const itemObj: DataSourceItemType = {
        ...DATASOURCEMAP[curr as keyof typeof exDatas],
        ...sourceData
      }
      // const { type } = DATASOURCEMAP[curr as keyof typeof exDatas]
      // if (type === 'Assets') {
      itemObj.assetsNo = Object.keys(sourceData.tokenListMap).length
      // }
      return {
        ...prev,
        [curr]: itemObj
      }
    }
    const dataMap = existExNames.reduce(reduceF, {})
    return dataMap
  }, [exDatas])
  const socialDataSourceMap = useMemo(() => {
    const sourceNameList = Object.keys(socialDatas)
    const existExNames = sourceNameList.filter(item => socialDatas[item as keyof typeof socialDatas])

    const reduceF = (prev: any, curr: string) => {
      const sourceData = socialDatas[curr]
      const itemObj: DataSourceItemType = {
        ...DATASOURCEMAP[curr as keyof typeof socialDatas],
        ...sourceData
      }
      return {
        ...prev,
        [curr]: itemObj
      }
    }
    const dataMap = existExNames.reduce(reduceF, {})
    return dataMap
  }, [socialDatas])
  const dataSourceMap = useMemo(() => {
    return { ...assetsDataSourceMap, ...socialDataSourceMap }
  }, [assetsDataSourceMap, socialDataSourceMap])
  const dataSourceList: DataSourceItemList = useMemo(() => {
    return Object.values(dataSourceMap)
  }, [dataSourceMap])
  const dataSourceTypeList = useMemo(() => {
    return [
      {
        value: 'All',
        text: 'All',
      },
      {
        value: 'Assets',
        text: 'Assets',
      },
      {
        value: 'Social',
        text: 'Social',
      },
    ]
  }, [])
  const activeDataSourceList = useMemo(() => {
    if (filterWord) {
      return dataSourceList.filter(item => {
        const lowerCaseName = item.name.toLowerCase()
        const lowerFilterWord = filterWord?.toLowerCase()
        return lowerCaseName.startsWith(lowerFilterWord as string)
      })
    } else {
      return dataSourceList
    }
  }, [dataSourceList, filterWord])
  const activeAssetsDataSourceList = useMemo(() => {
    return activeDataSourceList.filter(item => item.type === 'Assets')
  }, [activeDataSourceList])
  const activeSocialDataSourceList = useMemo(() => {
    return activeDataSourceList.filter(item => item.type === 'Social')
  }, [activeDataSourceList])

  const [activeSourceType, setActiveSourceType] = useState<string>('All')

  const handleChangeInput = (val: string) => {

  }
  const handleSearch = (val: string) => {
    setFilterWord(val)
  }
  const handleChangeSelect = (val: string) => {
    setActiveSourceType(val)
  }
  const handleChangeTab = () => {

  }
  const handleCheckDataSourceDetail = ({ type, name }: DataSourceItemType) => {
    navigate(`/dataDetail?type=${type}&name=${name}`)
  }
  const handleAdd = () => {
    setStep(1)
  }
  const handleCloseMask = () => {
    setStep(0)
  }
  const onSubmitDataSourcesDialog = async (item: DataFieldItem) => {
    if (item.type === 'Assets') {
      setActiveSource(item)
      setStep(2)
    } else if (item.type === 'Social') {
      authorize(item.name.toUpperCase(), () => {
        setStep(0)
      })
    }
  }


  const onCheckDataSourcesDialog = () => {
    setStep(1.5)
  }
  const onSubmitDataSourcesExplainDialog = () => {
    setStep(1)
  }
  const onSubmitConnectDataSourceDialogDialog = useCallback(async (form: GetDataFormProps) => {
    const lowerCaseSourceName = form?.name?.toLowerCase()
    await dispatch(setExDataAsync(form))
    const msg: any = {
      fullScreenType: 'networkreq',
      type: `setData-${lowerCaseSourceName}`,
      params: {
        ...form,
        exData: ((store.getState()) as UserState)[lowerCaseSourceName as keyof UserState] // TODO
      }
    }
    padoServicePort.postMessage(msg)
    console.log(`page_send:setData-${lowerCaseSourceName} request`);
    const padoServicePortListener = async function (message: any) {
      console.log(`page_get:setData-${lowerCaseSourceName}:`, message.res);
      if (message.resType === `setData-${lowerCaseSourceName}` && message.res) {
        setStep(3)
      }
      padoServicePort.onMessage.removeListener(padoServicePortListener);
    }
    padoServicePort.onMessage.addListener(padoServicePortListener)

  }, [dataSourceMap])
  const onSubmitAddSourceSucDialog = () => {
    setActiveSource(undefined)
    setStep(0)
  }

  return (
    <div className="pageDataSourceOverview">
      <main className="appContent">
        <PTabs onChange={handleChangeTab} />
        <div className="filterWrapper">
          <PSelect options={dataSourceTypeList} onChange={handleChangeSelect} />
          <div className="pSearch">
            <PInput onChange={handleChangeInput} type="text" placeholder="Search" onSearch={handleSearch} />
          </div>
        </div>
        {activeSourceType === 'All' && <DataSourceList onAdd={handleAdd} list={activeDataSourceList} onCheck={handleCheckDataSourceDetail} />}
        {activeSourceType === 'Assets' && <AssetsOverview list={activeAssetsDataSourceList} filterSource={filterWord} />}
        {activeSourceType === 'Social' && <SocialOverview list={activeSocialDataSourceList} filterSource={filterWord} />}
      </main>
      {step === 1 && <DataSourcesDialog onClose={handleCloseMask} onSubmit={onSubmitDataSourcesDialog} onCheck={onCheckDataSourcesDialog} />}
      {step === 1.5 && <DataSourcesExplainDialog onClose={handleCloseMask} onSubmit={onSubmitDataSourcesExplainDialog} />}
      {step === 2 && <ConnectDataSourceDialog onClose={handleCloseMask} onSubmit={onSubmitConnectDataSourceDialogDialog} activeSource={activeSource} />}
      {step === 3 && <AddSourceSucDialog onClose={handleCloseMask} onSubmit={onSubmitAddSourceSucDialog} activeSource={activeSource} desc="Data Connected!" />}
      <DataUpdateBar />
    </div>
  );
};


export default connect(({ padoServicePort, binance, twitter }) => ({ padoServicePort, binance, twitter }), {})(DataSourceOverview);
