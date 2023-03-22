import React, { useState, useEffect } from 'react';
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
import './index.sass';

const Lock = () => {
  const [step, setStep] = useState(1)
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
  const onSubmitGetDataDialog = () => {
    setStep(3)
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
    </div>
  );
};

export default Lock;
