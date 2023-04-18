import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { connect } from 'react-redux'
import { getSingleStorageSyncData } from '@/utils/utils'
import { DATASOURCEMAP } from '@/utils/constants'
import PTabs from '@/components/PTabs'
import AssetsDetail from '@/components/AssetsDetail/AssetsDetail'
import type { DataSourceType } from '@/components/AssetsDetail/AssetsDetail'
import PMask from '@/components/PMask'
import CreateAttesationDialog from '@/components/AssetsDetail/CreateAttesationDialog'
import AddSourceSucDialog from '@/components/AddSourceSucDialog'
import TransferToChainDialog from '@/components/TransferToChainDialog'
import type { DataFieldItem } from '@/components/DataSourceOverview/DataSourcesDialog'
import type { ExchangeMeta } from '@/utils/constants'
import './index.sass';
import iconTool1 from '@/assets/img/iconTool1.svg'
import iconArbitrum from '@/assets/img/iconArbitrum.svg'
import iconOptimism from '@/assets/img/iconOptimism.svg'
import iconMina from '@/assets/img/iconMina.svg'
import useExSource from '@/hooks/useExSource';

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
  const sourceName = (searchParams.get('name') as string).toLowerCase()
  const [activeSource, getDataSource] = useExSource()
  const [step, setStep] = useState(0)
  const [proveFlag, setProveFlag] = useState<boolean>(false)
  const [upChainFlag, setUpChainFlag] = useState<boolean>(false)
  const [dataSource, setDataSource] = useState<DataSourceType>()
  const handleChangeTab = () => {
  }
  const handleCloseMask = () => {
    setStep(0)
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
    (getDataSource as (name: string) => void)(sourceName);
  }, [sourceName, getDataSource])

  return (
    <div className="pageDataSourceDetail">
      <main className="appContent">
        <PTabs onChange={handleChangeTab} />
        <AssetsDetail onProve={handleProve} />
      </main>
      {[1, 2, 3, 4].includes(step) && <PMask onClose={handleCloseMask} />}
      {step === 1 && <CreateAttesationDialog dataSource={dataSource} onSubmit={handleSubmitCreateAttesationDialog} />}
      {step === 2 && <AddSourceSucDialog onSubmit={onSubmitAddSourceSucDialog} activeSource={activeSource} desc="Your attestation is successfully granted!" />}
      {step === 3 && <TransferToChainDialog
        onClose={handleCloseMask}
        onSubmit={handleSubmitTransferToChain}
        onCancel={handleCancelTransferToChain}
        title='Provide Attestation'
        desc='Sending your proof/badge to one of the following chain. Allows dApp complete on-chain attestation.'
        list={proveToolList}
      />}
      {step === 4 && <AddSourceSucDialog onSubmit={onSubmitAddSourceSucDialog2} activeSource={activeSource} desc="Your attestation is recorded on-chain!" />}
    </div>
  );
};


export default connect(({ padoServicePort, binance }) => ({ padoServicePort, binance }), {})(DataSourceDetail);
