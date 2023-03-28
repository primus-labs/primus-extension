import React, { useState } from 'react';
import PInput from '@/components/PInput/index'
import Bridge from '@/components/Bridge/index'
import './index.sass'
import type { DataFieldItem } from '@/components/DataFieldsDialog'

export type GetDataFormProps = {
  name: string;
  apiKey: string;
  secretKey: string;
  passphase?: string;
}
interface GetDataDialogProps {
  activeSource?: DataFieldItem;
  onSubmit: (form: GetDataFormProps) => void
}

const GetDataDialog: React.FC<GetDataDialogProps> = ({ onSubmit, activeSource }) => {
  const requirePassphase = activeSource?.requirePassphase
  const icon = activeSource?.icon
  const name = activeSource?.name ?? ''
  const [apiKey, setApiKey] = useState<string>()
  const [secretKey, setSecretKey] = useState<string>()
  const [passphase, setPassphase] = useState<string>()
  const handleClickNext = () => {
    if (!apiKey || !secretKey || (requirePassphase && !passphase)) {
      return
    }
    const form = {
      name,
      apiKey,
      secretKey,
      passphase
    }
    requirePassphase && (form.passphase = passphase)
    onSubmit(form)
  }

  const handleChangeApiKey = (val: string) => {
    setApiKey(val)
  }
  const handleChangeSecretKey = (val: string) => {
    setSecretKey(val)
  }
  const handleChangePassphase = (val: string) => {
    setPassphase(val)
  }

  return (
    <div className="getDataDialog">
      <main>
        <div className="scrollList">
          <h1>Connect Data Source</h1>
          <h2>Please configure with your READ-ONLY API keys. PADO never accesses to your API keys or your data.</h2>
          <Bridge endIcon={icon} />
          <div className="formItem">
            <h6>API Key</h6>
            <PInput key="apiKey" type="text" onChange={handleChangeApiKey} copiable />
          </div>
          <div className="formItem">
            <h6>Secret Key</h6>
            <PInput key="secretKey" type="password" placeholder="Please enter Secret Key" onChange={handleChangeSecretKey} copiable />
          </div>
          {requirePassphase && <div className="formItem">
            <h6>PassPhase</h6>
            <PInput key="passPhase" type="password" placeholder="" onChange={handleChangePassphase} copiable />
          </div>}
          <div className="tipWrapper">
            <span>How to get API Key&Secret key?</span>
            <a href="">Click here</a>
          </div>
        </div>
      </main>
      <button className="nextBtn" onClick={handleClickNext}>
        Next
      </button>
    </div>
  );
};

export default GetDataDialog;
