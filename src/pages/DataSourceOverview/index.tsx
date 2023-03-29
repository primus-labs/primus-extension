import React, { useState, useEffect, useMemo } from 'react';
import { connect } from 'react-redux'
import PageHeader from '@/components/PageHeader'
import PTabs from '@/components/PTabs'
import PInput from '@/components/PInput'
import PSelect from '@/components/PSelect'
import DataSourceList from '@/components/DataSourceList'
import BackgroundAnimation from '@/components/BackgroundAnimation'
import PMask from '@/components/PMask'
import DataFieldsDialog from '@/components/DataFieldsDialog'
import DataFieldsExplainDialog from '@/components/DataFieldsExplainDialog'
import type { DataFieldItem } from '@/components/DataFieldsDialog'
import GetaDataDialog from '@/components/GetDataDialog'
import type { GetDataFormProps } from '@/components/GetDataDialog'
import AddSourceSucDialog from '@/components/AddSourceSucDialog'
import AssetsOverview from '@/components/AssetsOverview'
import SocialOverview from '@/components/SocialOverview'

import { getMutipleStorageSyncData } from '@/utils/utils'
import { DATASOURCEMAP } from '@/utils/constants'
import type { ExchangeMeta } from '@/utils/constants'
import type { DataSourceItemList } from '@/components/DataSourceList'
import './index.sass';

interface DataSourceOverviewProps {
  networkreqPort: chrome.runtime.Port,
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

const DataSourceOverview: React.FC<DataSourceOverviewProps> = ({ networkreqPort, binance }) => {
  const [step, setStep] = useState(0)
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
  const handleAdd = () => {
    setStep(1)
  }
  const handleCloseMask = () => {
    setStep(0)
  }
  const onSubmitDataFieldsDialog = (item: DataFieldItem) => {
    setActiveSource(item)
    setStep(2)
  }
  const onCheckDataFieldsDialog = () => {
    setStep(1.5)
  }
  const onSubmitDataFieldsExplainDialog = () => {
    setStep(1)
  }
  const onSubmitGetDataDialog = async (form: GetDataFormProps) => {
    const { apiKey, secretKey } = form
    const sourceName = form?.name?.toLowerCase()
    const { type, requirePassphase }: ExchangeMeta = DATASOURCEMAP[sourceName as keyof typeof DATASOURCEMAP]
    if (type === 'Assets') {
      const msg: any = {
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
      networkreqPort.postMessage(msg)
      console.log(`page_send:exchange-${sourceName} request`);
      const networkreqPortListener = async function (message: any) {
        console.log(`page_get:exchange-${sourceName}:`, message.res);
        if (message.resType === `exchange-${sourceName}` && message.res) {
          setStep(3)
        }
      }
      networkreqPort.onMessage.addListener(networkreqPortListener)

    } else {
      // TODO social
    }
  }
  const onSubmitAddSourceSucDialog = () => {
    setActiveSource(undefined)
    setStep(0)
    getDataSourceList()// refresh data source
  }
  const handleClearStorage = () => {
    chrome.storage.local.remove(['userInfo', 'keyStore', 'binance'], () => {
      console.log("remove 'userinfo' & 'keyStore' successfully")
    })
  }
  const getDataSourceList = async () => {
    const sourceNameList = Object.keys(DATASOURCEMAP)
    let res: DataSourceStorages = await getMutipleStorageSyncData(sourceNameList);
    const activeSourceList = sourceNameList.filter(item => res[item as keyof typeof res]).map((item) => {
      const sourceData = JSON.parse(res[item as keyof typeof res])
      return ({
        ...DATASOURCEMAP[item as keyof typeof res],
        ...sourceData,
        assetsNo: Object.keys(sourceData.tokenListMap).length
      })

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
        <PageHeader />
        <main className="appContent">
          <PTabs onChange={handleChangeTab} />
          <div className="filterWrapper">
            <PSelect options={dataSourceTypeList} onChange={handleChangeSelect} />
            <div className="pSearch">
              <PInput onChange={handleChangeInput} type="text" placeholder="Search" onSearch={handleSearch} />
            </div>
          </div>
          {activeSourceType === 'All' && <DataSourceList onAdd={handleAdd} list={activeDataSourceList} />}
          {activeSourceType === 'Assets' && <AssetsOverview />}
          {activeSourceType === 'Social' && <SocialOverview />}
          {/* // TODO DEL!!! */}
          <button className="clearStorageBtn" onClick={handleClearStorage}>点这里，从头再来</button>
        </main>
      </div>
      {[1, 2, 3, 4, 1.5].includes(step) && <PMask onClose={handleCloseMask} />}
      {step === 1 && <DataFieldsDialog onSubmit={onSubmitDataFieldsDialog} onCheck={onCheckDataFieldsDialog} />}
      {step === 1.5 && <DataFieldsExplainDialog onSubmit={onSubmitDataFieldsExplainDialog} />}
      {step === 2 && <GetaDataDialog onSubmit={onSubmitGetDataDialog} activeSource={activeSource} />}
      {step === 3 && <AddSourceSucDialog onSubmit={onSubmitAddSourceSucDialog} activeSource={activeSource} />}
    </div>
  );
};


export default connect(({ networkreqPort, binance }) => ({ networkreqPort, binance }), {})(DataSourceOverview);
