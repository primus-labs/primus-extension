import React, { useState, useEffect } from 'react';
import PHeader from '@/components/PHeader'
import PTabs from '@/components/PTabs'
import PInput from '@/components/PInput'
import PSelect from '@/components/PSelect'
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
        <header className="appHeader">
          <PHeader />
        </header>
        <main className="appContent">
          <PTabs onChange={handleChangeTab} />
          <div className="filterWrapper">
            <PSelect onChange={handleChangeSelect} />
            <div className="pSearch">
              <PInput onChange={handleChangeSearch} type="text" placeholder="Search" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Lock;
