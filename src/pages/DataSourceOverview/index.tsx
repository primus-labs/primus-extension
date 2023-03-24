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



interface DataSourceOverviewProps {
  networkreqPort: chrome.runtime.Port
}


const DataSourceOverview: React.FC<DataSourceOverviewProps> = ({ networkreqPort }) => {
  const [maskVisible, setMaskVisible] = useState(false)
  const [step, setStep] = useState(0)
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
    // TODO refresh data source
  }
  useEffect(() => {
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
          <DataSourceList onAdd={handleAdd} />
        </main>
      </div>
      {[1, 2, 3, 4].includes(step) && <PMask onClose={handleCloseMask} />}
      {step === 1 && <DataFieldsDialog onSubmit={onSubmitDataFieldsDialog} />}
      {step === 2 && <GetaDataDialog onSubmit={onSubmitGetDataDialog} />}
      {step === 3 && <AddSourceSucDialog onSubmit={onSubmitAddSourceSucDialog} />}
    </div>
  );
};


export default connect(({ networkreqPort }) => ({ networkreqPort }), {})(DataSourceOverview);
