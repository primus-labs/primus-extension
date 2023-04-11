import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux'
import { useNavigate } from 'react-router';
import PageHeader from '@/components/PageHeader'
import PTabs from '@/components/PTabs'
import PInput from '@/components/PInput'
import PSelect from '@/components/PSelect'
import DataSourceList from '@/components/DataSourceList'
import BackgroundAnimation from '@/components/BackgroundAnimation'
import PMask from '@/components/PMask'
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
import Authorization from '@/components/Authorization'
import './index.sass';

interface DataSourceOverviewProps {
  padoServicePort: chrome.runtime.Port,
  binance?: {
    totalBalance: any,
    tokenListMap: any
  }
}

type DataSourceStorages = {
  binance?: any,
  okx?: any,
  kucoin?: any,
  twitter?: any,
}

const DataSourceOverview: React.FC<DataSourceOverviewProps> = ({ padoServicePort, binance }) => {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [activeSourceUpperCaseName, setActiveSourceUpperCaseName] = useState<string>()
  const [activeSource, setActiveSource] = useState<DataFieldItem>()
  const [dataSourceList, setDataSourceList] = useState<DataSourceItemList>([])
  const [filterWord, setFilterWord] = useState<string>()
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
  const onSubmitDataSourcesDialog = (item: DataFieldItem) => {
    if (item.type === 'Assets') {
      setActiveSource(item)
      setStep(2)
    } else if (item.type === 'Social') {
      setActiveSourceUpperCaseName(item.name.toUpperCase())
      // handleClickOAuthSource(item.name)
    }
  }
  const handleSubmitAuthorization = () => {
    console.log('auth successfully')
    setActiveSourceUpperCaseName(undefined)
    setStep(0)
  }

  const onCheckDataSourcesDialog = () => {
    setStep(1.5)
  }
  const onSubmitDataSourcesExplainDialog = () => {
    setStep(1)
  }
  const onSubmitConnectDataSourceDialogDialog = async (form: GetDataFormProps) => {
    const { apiKey, secretKey } = form
    const sourceName = form?.name?.toLowerCase()
    const { type, requirePassphase }: ExchangeMeta = DATASOURCEMAP[sourceName as keyof typeof DATASOURCEMAP]
    if (type === 'Assets') {
      const msg: any = {
        fullScreenType: 'networkreq',
        type: `exchange-${sourceName}`,
        params: {
          apiKey,
          secretKey
        }
      }
      if (requirePassphase) {
        const { passphase } = form
        msg.params.passphase = passphase
      }

      padoServicePort.postMessage(msg)
      console.log(`page_send:exchange-${sourceName} request`);
      const padoServicePortListener = async function (message: any) {
        console.log(`page_get:exchange-${sourceName}:`, message.res);
        if (message.resType === `exchange-${sourceName}` && message.res) {
          setStep(3)
        }
      }
      padoServicePort.onMessage.addListener(padoServicePortListener)

    } else {
      // TODO social
    }
  }
  const onSubmitAddSourceSucDialog = () => {
    setActiveSource(undefined)
    setStep(0)
    getDataSourceList()// refresh data source
  }
  const getDataSourceList = async () => {
    const sourceNameList = Object.keys(DATASOURCEMAP)
    let res: DataSourceStorages = await getMutipleStorageSyncData(sourceNameList);
    const activeSourceList = sourceNameList.filter(item => res[item as keyof typeof res]).map((item) => {
      const sourceData = JSON.parse(res[item as keyof typeof res])
      // return ({
      //   ...DATASOURCEMAP[item as keyof typeof res],
      //   ...sourceData,
      //   assetsNo: Object.keys(sourceData.tokenListMap).length
      // })
      const itemObj = {
        ...DATASOURCEMAP[item as keyof typeof res],
        ...sourceData
      }
      const { type } = DATASOURCEMAP[item as keyof typeof res]
      if (type === 'Assets') {
        itemObj.assetsNo = Object.keys(sourceData.tokenListMap).length
      }
      return itemObj
    })
    console.log('getDataSourceList', activeSourceList)
    setDataSourceList(activeSourceList)
  }
  useEffect(() => {
    getDataSourceList()
  }, [])

  return (
    <div className="appPage appHome pageDataSourceOverview">
      <div className="baseLayer overviewLayer">
        <BackgroundAnimation />
      </div>
      <div className="pageLayer">
        <PageHeader />
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
      </div>
      <Authorization source={activeSourceUpperCaseName} onSubmit={handleSubmitAuthorization} />
      {step === 1 && <DataSourcesDialog onClose={handleCloseMask} onSubmit={onSubmitDataSourcesDialog} onCheck={onCheckDataSourcesDialog} />}
      {step === 1.5 && <DataSourcesExplainDialog onClose={handleCloseMask} onSubmit={onSubmitDataSourcesExplainDialog} />}
      {step === 2 && <ConnectDataSourceDialog onClose={handleCloseMask} onSubmit={onSubmitConnectDataSourceDialogDialog} activeSource={activeSource} />}
      {step === 3 && <AddSourceSucDialog onClose={handleCloseMask} onSubmit={onSubmitAddSourceSucDialog} activeSource={activeSource} desc="Data Connected!" />}
    </div>
  );
};


export default connect(({ padoServicePort, binance }) => ({ padoServicePort, binance }), {})(DataSourceOverview);
