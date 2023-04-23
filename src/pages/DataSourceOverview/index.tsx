import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Dispatch } from 'react';
import { connect, useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router';
import PTabs from '@/components/PTabs'
import PInput from '@/components/PInput'
import PSelect from '@/components/PSelect'
import DataSourceList from '@/components/DataSourceOverview/DataSourceList'
import DataSourcesDialog from '@/components/DataSourceOverview/DataSourcesDialog'
import DataSourcesExplainDialog from '@/components/DataSourceOverview/DataSourcesExplainDialog'
import type { DataFieldItem } from '@/components/DataSourceOverview/DataSourcesDialog'
import ConnectDataSourceDialog from '@/components/DataSourceOverview/ConnectDataSourceDialog'
import type { GetDataFormProps } from '@/components/DataSourceOverview/ConnectDataSourceDialog'
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog'
import RequestLoadingDialog from '@/components/DataSourceOverview/RequestLoadingDialog'
import AssetsOverview from '@/components/AssetsOverview/AssetsOverview'
import SocialOverview from '@/components/AssetsOverview/SocialOverview'
import { getMutipleStorageSyncData } from '@/utils/utils'
import { DATASOURCEMAP } from '@/utils/constants'
import type { ExchangeMeta } from '@/utils/constants'
import type { DataSourceItemList } from '@/components/DataSourceOverview/DataSourceList'
import type { DataSourceItemType } from '@/components/DataSourceOverview/DataSourceItem'
import './index.sass';
import DataUpdateBar from '@/components/DataSourceOverview/DataUpdateBar'
import useAuthorization from '@/hooks/useAuthorization'
import useAllSources from '@/hooks/useAllSources'
import useExSources from '@/hooks/useExSources'
import useSocialSources from '@/hooks/useSocialSources'

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
const DataSourceOverview: React.FC<DataSourceOverviewProps> = ({ padoServicePort, binance, twitter }) => {
  const authorize = useAuthorization()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  // const [loading, setLoading] = useState(false)
  const [activeSource, setActiveSource] = useState<DataFieldItem>()
  const [filterWord, setFilterWord] = useState<string>()
  const [exSources, refreshExSources] = useExSources()
  const [socialSources, refreshSocialSources] = useSocialSources()

  const dataSourceList: DataSourceItemList = useMemo(() => {
    return Object.values({ ...exSources, ...socialSources })
  }, [exSources, socialSources])
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
        setStep(0);
        (refreshSocialSources as () => void)()
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
    // setLoading(true)
    setStep(2.5)
    const reqType = `set-${lowerCaseSourceName}`
    const msg: any = {
      fullScreenType: 'networkreq',
      type: reqType,
      params: {
        ...form,
      }
    }
    padoServicePort.postMessage(msg)
    console.log(`page_send:${reqType} request`);
    const padoServicePortListener = async function (message: any) {
      console.log(`page_get:${reqType}:`, message.res);
      if (message.resType === `${reqType}` && message.res) {
        setStep(3);
        // setLoading(false);
        (refreshExSources as () => void)()
      }
      padoServicePort.onMessage.removeListener(padoServicePortListener);
    }
    padoServicePort.onMessage.addListener(padoServicePortListener)

  }, [padoServicePort, refreshExSources])

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
        {activeSourceType === 'Assets' && <AssetsOverview filterSource={filterWord} />}
        {activeSourceType === 'Social' && <SocialOverview filterSource={filterWord} />}
      </main>
      {step === 1 && <DataSourcesDialog onClose={handleCloseMask} onSubmit={onSubmitDataSourcesDialog} onCheck={onCheckDataSourcesDialog} />}
      {step === 1.5 && <DataSourcesExplainDialog onClose={handleCloseMask} onSubmit={onSubmitDataSourcesExplainDialog} />}
      {step === 2 && <ConnectDataSourceDialog onClose={handleCloseMask} onSubmit={onSubmitConnectDataSourceDialogDialog} activeSource={activeSource} />}
      {step === 2.5 && <RequestLoadingDialog onClose={handleCloseMask} onSubmit={onSubmitAddSourceSucDialog} activeSource={activeSource} title="Data being requested" desc="It may take a few minutes." />}
      {step === 3 && <AddSourceSucDialog onClose={handleCloseMask} onSubmit={onSubmitAddSourceSucDialog} activeSource={activeSource} desc="Data Connected!" />}
      <DataUpdateBar type={activeSourceType} />
    </div>
  );
};

export default connect(({ padoServicePort }) => ({ padoServicePort }), {})(DataSourceOverview);
