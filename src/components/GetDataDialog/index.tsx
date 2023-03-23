import React, { useState } from 'react';
import PInput from '@/components/PInput/index'
import iconB from '@/assets/img/iconB.svg';
import iconUser from '@/assets/img/iconUser.svg';
import iconConnect from '@/assets/img/iconConnect.svg';

import './index.sass'

export type DataFieldItem = {
  icon: any;
  name: string;
  title: string
}
interface CretateAccountDialogProps {
  onSubmit: (name: DataFieldItem) => void,
  // onCancel: () => void
}
const GetDataDialog: React.FC<CretateAccountDialogProps> = ({ onSubmit }) => {
  const [pwd, setPwd] = useState<string>()
  const [confirm, setConfirm] = useState<string>()
  const handleClickNext = () => {
    // onSubmit()// TODO
  }

  const handleChangePwd = (val: string) => {
    setPwd(val)
  }
  const handleChangeConfirm = (val: string) => {
    setConfirm(val)
  }

  return (
    <div className="getDataDialog">
      <main>
        <h1>Get data</h1>
        <h2>Use your API keys to get data from Binance. .......</h2>

        <div className="bridgeWrapper">
          <img className="from" src={iconUser} alt="" />
          <img className="connectSymbol" src={iconConnect} alt="" />
          <img className="to" src={iconB} alt="" />
        </div>
        <div className="formItem">
          <h6>API Key</h6>
          <PInput type="text" onChange={handleChangePwd} copiable />
        </div>
        <div className="formItem">
          <h6>Secret Key</h6>
          <PInput type="password" placeholder="Please enter Secret Key" onChange={handleChangeConfirm} copiable />
        </div>
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
