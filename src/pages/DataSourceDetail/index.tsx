import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { connect } from 'react-redux'
import { getSingleStorageSyncData } from '@/utils/utils'
import { DATASOURCEMAP } from '@/utils/constants'
import PageHeader from '@/components/PageHeader'
import PTabs from '@/components/PTabs'
import BackgroundAnimation from '@/components/BackgroundAnimation'
import AssetsDetail from '@/components/AssetsDetail'
import type { DataSourceType } from '@/components/AssetsDetail'
import PMask from '@/components/PMask'
import CreateAttesationDialog from '@/components/CreateAttesationDialog'
import AddSourceSucDialog from '@/components/AddSourceSucDialog'
import TransferToChainDialog from '@/components/TransferToChainDialog'
import type { DataFieldItem } from '@/components/DataFieldsDialog'
import type { ExchangeMeta } from '@/utils/constants'
import './index.sass';
import iconTool1 from '@/assets/img/iconTool1.svg'
import iconArbitrum from '@/assets/img/iconArbitrum.svg'
import iconOptimism from '@/assets/img/iconOptimism.svg'
import iconMina from '@/assets/img/iconMina.svg'
const proveToolList = [
  {
    icon: iconTool1,
    title: 'Tower'
  },
  {
    icon: iconArbitrum,
    title: 'Arbitrum'
  },
  {
    icon: iconOptimism,
    title: 'Optimism'
  },
  {
    icon: iconMina,
    title: 'Mina'
  },

]
const DataSourceDetail = () => {
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState(3)
  const [proveFlag, setProveFlag] = useState<boolean>(false)
  const [upChainFlag, setUpChainFlag] = useState<boolean>(false)
  const [activeSource, setActiveSource] = useState<ExchangeMeta>()
  const [dataSource, setDataSource] = useState<DataSourceType>()
  const handleChangeTab = () => {
  }
  const handleCloseMask = () => {
    setStep(0)
  }
  const getDataSource = async () => {
    const name = searchParams.get('name') as string
    const sName = name.toLowerCase()
    const icon = DATASOURCEMAP[sName].icon
    let res = (await getSingleStorageSyncData(sName)) as string
    // const activeSourceList = sourceNameList.filter(item => res[item as keyof typeof res]).map((item) => {
    const sData: DataSourceType = JSON.parse(res)
    sData.icon = icon
    sData.name = name
    // })
    console.log('getDataSource', sData)
    setDataSource(sData)
    const sourceInfo: ExchangeMeta = DATASOURCEMAP[sName as keyof typeof DATASOURCEMAP]
    setActiveSource(sourceInfo)
  }
  const handleProve = (name: string) => {
    setStep(proveFlag ? 3 : 1)
  }
  const handleSubmitCreateAttesationDialog = (proofs: string[]) => {
    // TODO prove
    setStep(2)
    setProveFlag(true)
  }


  const onSubmitAddSourceSucDialog = () => {
    setStep(0)
  }
  const onSubmitAddSourceSucDialog2 = () => {
    setStep(0)
    setUpChainFlag(true)
  }
  const handleSubmitTransferToChain = () => {
    setStep(4)
  }
  const handleCancelTransferToChain = () => {
    setStep(2)
  }
  useEffect(() => {
    getDataSource()
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
          <AssetsDetail onProve={handleProve} />
          {/* list={dataSourceList} */}
        </main>
      </div>
      {[1, 2, 3, 4].includes(step) && <PMask onClose={handleCloseMask} />}
      {step === 1 && <CreateAttesationDialog dataSource={dataSource} onSubmit={handleSubmitCreateAttesationDialog} />}
      {step === 2 && <AddSourceSucDialog onSubmit={onSubmitAddSourceSucDialog} activeSource={activeSource} desc="Your attestation is successfully granted!" />}
      {step === 3 && <TransferToChainDialog
        onSubmit={handleSubmitTransferToChain}
        onCancel={handleCancelTransferToChain}
        title='Provide Attestation'
        desc='Sending your proof/badge to one of the following chain. Allows dApp complete on-chain attestation.'
        list={proveToolList}
      />}
      {/* TODO */}
      {step === 4 && <AddSourceSucDialog onSubmit={onSubmitAddSourceSucDialog2} activeSource={activeSource} desc="Your attestation is recorded on-chain!" />}
    </div>
  );
};


export default connect(({ padoServicePort, binance }) => ({ padoServicePort, binance }), {})(DataSourceDetail);
