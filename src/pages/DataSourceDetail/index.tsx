import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PTabs from '@/components/PTabs'
import AssetsDetail from '@/components/DataSourceDetail/AssetsDetail'
import type { DataSourceType } from '@/components/DataSourceDetail/AssetsDetail'
import CreateAttesationDialog from '@/components/DataSourceDetail/CreateAttesationDialog'
import OnChainSucDialog from '@/components/DataSourceDetail/OnChainSucDialog'
import TransferToChainDialog from '@/components/DataSourceDetail/TransferToChainDialog'
import './index.sass';

import type { ExDataType } from '@/hooks/useExSource';
import { useSelector } from 'react-redux';
import type { UserState } from '@/store/reducers';
import {ONCHAINLIST} from '@/utils/constants'

const DataSourceDetail = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sourceName = (searchParams.get('name') as string).toLowerCase()
  const exSources = useSelector(
    (state: UserState) => state.exSources
  );
  const activeSource = useMemo(() => {
    return exSources[sourceName] ?? {}
  }, [exSources, sourceName])
  const [step, setStep] = useState(0)
  const [assetsProveFlag, setAssetsProveFlag] = useState<boolean>(false)
  const [userProveFlag, setUserProveFlag] = useState<boolean>(false)
  const [upChainFlag, setUpChainFlag] = useState<boolean>(false)
  const [activeOperateItem, setActiveOperateItem] = useState<string>('')
  const handleChangeTab = (val: string) => {
    navigate('/datas')
  };
  const handleCloseMask = () => {
    setStep(0)
  }

  const handleProve = (name: string) => {
    setActiveOperateItem(name)
    if (name === 'Assets') {
      setStep(assetsProveFlag ? 3 : 1)
    } else {
      setStep(userProveFlag ? 3 : 1)
    }
  }
  const handleSubmitCreateAttesationDialog = (proofs: string[]) => {
    // TODO prove
    setStep(2)
    if (activeOperateItem === 'Assets') {
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

  return (
    <div className="pageDataSourceDetail">
      <main className="appContent">
        <PTabs onChange={handleChangeTab} />
        <AssetsDetail
          onProve={handleProve}
          assetsProveFlag={assetsProveFlag}
          userProveFlag={userProveFlag}
        />
      </main>
      {step === 1 && (
        <CreateAttesationDialog
          type={activeOperateItem}
          onClose={handleCloseMask}
          dataSource={activeSource as DataSourceType}
          onSubmit={handleSubmitCreateAttesationDialog}
        />
      )}
      {step === 2 && (
        <OnChainSucDialog
          onClose={handleCloseMask}
          onSubmit={onSubmitAddSourceSucDialog}
          activeSource={activeSource as ExDataType}
          desc="Your attestation is successfully granted!"
        />
      )}
      {step === 3 && (
        <TransferToChainDialog
          onClose={handleCloseMask}
          onSubmit={handleSubmitTransferToChain}
          onCancel={handleCancelTransferToChain}
          title="Provide Attestation"
          desc="Send your proof to one of the following chain. Provide an on-chain attestation for dApps."
          list={ONCHAINLIST}
          tip="Please select one chain to provide attestation"
          checked={false}
          backable={false}
        />
      )}
      {step === 4 && (
        <OnChainSucDialog
          onClose={handleCloseMask}
          onSubmit={onSubmitAddSourceSucDialog2}
          activeSource={activeSource as ExDataType}
          desc="Your attestation is recorded on-chain!"
        />
      )}
    </div>
  );
};


export default DataSourceDetail
