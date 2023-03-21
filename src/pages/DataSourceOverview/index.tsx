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
import './index.sass';

const Lock = () => {
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
          <DataSourceList />
        </main>
      </div>
    </div>
  );
};

export default Lock;
