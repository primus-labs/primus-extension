import React, { useState } from 'react';
import PInput from '@/components/PInput/index'
import Bridge from '@/components/Bridge/index'
import './index.sass'

export type GetDataFormProps = {
  apiKey: string;
  secretKey: string;
  passPhase?: string;
}
interface GetDataDialogProps {
  needPassword?: boolean;
  onSubmit: (form: GetDataFormProps) => void
}

const GetDataDialog: React.FC<GetDataDialogProps> = ({ onSubmit, needPassword = false }) => {
  const [apiKey, setApiKey] = useState<string>('AH2jrvzC91cNrgItJhTftQTfhwnqbT573ZdnjYeTrVUUJFaojyxBM8fhk0vzt9lH')
  const [secretKey, setSecretKey] = useState<string>('8qOOSo8JVNahkwTkVMWvYbz9TKnk4rNdeUXO5REwULe0WewkGb9VUi2wN0oXykIO')
  const [passphase, setPasspahse] = useState<string>()
  const handleClickNext = () => {
    if (!apiKey || !secretKey || (needPassword && !passphase)) {
      return
    }
    const form = {
      apiKey,
      secretKey,
      passphase
    }
    needPassword && (form.passphase = passphase)
    onSubmit(form)
  }

  const handleChangePwd = (val: string) => {
    setApiKey(val)
  }
  const handleChangeConfirm = (val: string) => {
    setSecretKey(val)
  }
  const handleChangePassphase = (val: string) => {
    setPasspahse(val)
  }

  return (
    <div className="getDataDialog">
      <main className={needPassword ? 'compactMain' : ''}>
        <h1>Get data</h1>
        <h2>Use your API keys to get data from Binance. .......</h2>
        <Bridge />
        <div className="formItem">
          <h6>API Key</h6>
          <PInput key="apiKey" type="text" onChange={handleChangePwd} copiable />
        </div>
        <div className="formItem">
          <h6>Secret Key</h6>
          <PInput key="secretKey" type="password" placeholder="Please enter Secret Key" onChange={handleChangeConfirm} copiable />
        </div>
        {needPassword && <div className="formItem">
          <h6>PassPhase</h6>
          <PInput key="passPhase" type="password" placeholder="" onChange={handleChangePassphase} copiable />
        </div>}
        <div className="tipWrapper">
          <span>How to get API Key&Secret key?</span>
          <a href="">Click here</a>
        </div>
      </main>
      <button className="nextBtn" onClick={handleClickNext}>
        Next
      </button>
    </div>
  );
};

export default GetDataDialog;
