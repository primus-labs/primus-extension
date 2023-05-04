import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getSingleStorageSyncData } from '@/utils/utils'
import { DATASOURCEMAP } from '@/utils/constants'
import PTabs from '@/components/PTabs'
import AssetsDetail from '@/components/DataSourceDetail/AssetsDetail'
import type { DataSourceType } from '@/components/DataSourceDetail/AssetsDetail'
import PMask from '@/components/PMask'
import CreateAttesationDialog from '@/components/DataSourceDetail/CreateAttesationDialog'

import OnChainSucDialog from '@/components/DataSourceDetail/OnChainSucDialog'
import TransferToChainDialog from '@/components/DataSourceDetail/TransferToChainDialog'
import type { DataFieldItem } from '@/components/DataSourceOverview/DataSourcesDialog'
import type { ExchangeMeta } from '@/utils/constants'
import './index.sass';
import iconTool1 from '@/assets/img/iconTool1.svg'
import iconArbitrum from '@/assets/img/iconArbitrum.svg'
import iconOptimism from '@/assets/img/iconOptimism.svg'
import iconMina from '@/assets/img/iconMina.svg'
import useExSource from '@/hooks/useExSource';
import type { ExDataType } from '@/hooks/useExSource';
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
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sourceName = (searchParams.get('name') as string).toLowerCase()
  const [activeSource, getDataSource] = useExSource()
  const [step, setStep] = useState(0)
  const [assetsProveFlag, setAssetsProveFlag] = useState<boolean>(false)
  const [userProveFlag, setUserProveFlag] = useState<boolean>(false)
  const [upChainFlag, setUpChainFlag] = useState<boolean>(false)
  const [dataSource, setDataSource] = useState<DataSourceType>()
  const [activeOperateItem, setActiveOperateItem] = useState<string>('')
  const [activeSourceType, setActiveSourceType] = useState<string>('All');
  const handleChangeTab = (val:string) => {
    navigate('/datas')
  };
  const handleCloseMask = () => {
    setStep(0)
  }

  const handleProve = (name: string) => {
    setActiveOperateItem(name)
    if(name === 'Assets') {
      setStep(assetsProveFlag ? 3 : 1)
    } else {
      setStep(userProveFlag ? 3 : 1)
    }
  }
  const handleSubmitCreateAttesationDialog = (proofs: string[]) => {
    // TODO prove
    setStep(2)
    if(activeOperateItem === 'Assets') {
      setAssetsProveFlag(true)
    } else {
      setUserProveFlag(true)
    }
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
        <PTabs onChange={handleChangeTab}/>
        <AssetsDetail onProve={handleProve} assetsProveFlag={assetsProveFlag} userProveFlag={userProveFlag}/>
      </main>
      {step === 1 && <CreateAttesationDialog type={activeOperateItem} onClose={handleCloseMask} dataSource={activeSource as DataSourceType} onSubmit={handleSubmitCreateAttesationDialog} />}
      {step === 2 && <OnChainSucDialog onClose={handleCloseMask} onSubmit={onSubmitAddSourceSucDialog} activeSource={activeSource as ExDataType} desc="Your attestation is successfully granted!" />}
      {step === 3 && <TransferToChainDialog
        onClose={handleCloseMask}
        onSubmit={handleSubmitTransferToChain}
        onCancel={handleCancelTransferToChain}
        title='Provide Attestation'
        desc='Send your proof to one of the following chain. Provide an on-chain attestation for dApps.'
        list={proveToolList}
        tip="Please select one chain to provide attestation"
        checked={false}
        backable={false}
      />}
      {step === 4 && <OnChainSucDialog onClose={handleCloseMask} onSubmit={onSubmitAddSourceSucDialog2} activeSource={activeSource as ExDataType} desc="Your attestation is recorded on-chain!" />}
    </div>
  );
};


export default DataSourceDetail
