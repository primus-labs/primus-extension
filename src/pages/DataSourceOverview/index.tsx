import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux'
import PageHeader from '@/components/PageHeader'
import PTabs from '@/components/PTabs'
import PInput from '@/components/PInput'
import PSelect from '@/components/PSelect'
import DataSourceList from '@/components/DataSourceList'
import AuthDialog from '@/components/AuthDialog'
import CreateAccountDialog from '@/components/CreateAccountDialog'
import SetPwdDialog from '@/components/SetPwdDialog'
import SetSucDialog from '@/components/SetSucDialog'
import BackgroundAnimation from '@/components/BackgroundAnimation'
import AsideAnimation from '@/components/AsideAnimation'
import PMask from '@/components/PMask'
import DataFieldsDialog from '@/components/DataFieldsDialog'
import type { DataFieldItem } from '@/components/DataFieldsDialog'
import GetaDataDialog from '@/components/GetDataDialog'
import type { GetDataFormProps } from '@/components/GetDataDialog'
import AddSourceSucDialog from '@/components/AddSourceSucDialog'
import './index.sass';
import { getMutipleStorageSyncData } from '@/utils/utils'
import { DATASOURCEMAP } from '@/utils/constants'
import type { DataSourceItemList } from '@/components/DataSourceList'

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
  const [maskVisible, setMaskVisible] = useState(false)
  const [step, setStep] = useState(0)
  const [dataSourceList, setDataSourceList] = useState<DataSourceItemList>([])
  const handleClickStart = () => {
    setMaskVisible(true)
    setStep(1)
  }
  const handleChangeSearch = (val: string) => {

  }
  const handleChangeSelect = (val: string) => {

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
    setStep(2)
  }
  const onSubmitGetDataDialog = async (form: GetDataFormProps) => {
    networkreqPort.postMessage({
      type: 'exchange-binance',
      params: { ...form }
    })
    console.log("page_send:exchange-binance request");
    const networkreqPortListener = async function (message: any) {
      console.log("page_get:exchange-binance:", message.res);
      if (message.resType === 'exchange-binance' && message.res) {
        setStep(3)
      }
    }
    networkreqPort.onMessage.addListener(networkreqPortListener)
  }
  const onSubmitAddSourceSucDialog = () => {
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
    chrome.management.setEnabled(
      'fmkadmapgofadopljbjfkapdkoienihi',
      true,
      () => {
        console.log('you can use react developer tool')
      },
    )
    chrome.management.setEnabled(
      'lmhkpmbekcpmknklioeibfkpmmfibljd',
      true,
      () => {
        console.log('you can use redux developer tool')
      },
    )

  }, [])

  return (
    <div className="appPage appHome pageDataSourceOverview">
      <div className="baseLayer overviewLayer">
        <BackgroundAnimation />
        <PageHeader />
        <main className="appContent">
          <PTabs onChange={handleChangeTab} />
          <div className="filterWrapper">
            <PSelect onChange={handleChangeSelect} />
            <div className="pSearch">
              <PInput onChange={handleChangeSearch} type="text" placeholder="Search" />
            </div>
          </div>
          <DataSourceList onAdd={handleAdd} list={dataSourceList} />
          {/* // TODO DEL!!! */}
          <button className="clearStorageBtn" onClick={handleClearStorage}>点这里，从头再来</button>
        </main>
      </div>
      {[1, 2, 3, 4].includes(step) && <PMask onClose={handleCloseMask} />}
      {step === 1 && <DataFieldsDialog onSubmit={onSubmitDataFieldsDialog} />}
      {step === 2 && <GetaDataDialog onSubmit={onSubmitGetDataDialog} />}
      {step === 3 && <AddSourceSucDialog onSubmit={onSubmitAddSourceSucDialog} />}
    </div>
  );
};


export default connect(({ networkreqPort, binance }) => ({ networkreqPort, binance }), {})(DataSourceOverview);
