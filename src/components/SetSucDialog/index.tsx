import React, { useEffect, useState } from 'react';
import { getSingleStorageSyncData } from '@/utils/utils';
import './index.sass'
import iconETH from '@/assets/img/iconETH.svg';
import iconChecked from '@/assets/img/iconChecked.svg';
import iconSuc from '@/assets/img/iconSuc.svg';

interface SetSucDialogProps {
  onSubmit: () => void
}

const SetSucDialog: React.FC<SetSucDialogProps> = ({ onSubmit }) => {
  const [accountAddr, setAccountAddr] = useState<string>()
  const [email, setEmail] = useState<string>()
  const handleClickNext = () => {
    onSubmit()
  }
  const initPage = async () => {
    const keyStoreStr = await getSingleStorageSyncData('keyStore');
    const parseKeyStore = JSON.parse(keyStoreStr as string)
    setAccountAddr(parseKeyStore.address)
    const userInfo: any = await getSingleStorageSyncData('userInfo');
    if (userInfo) {
      const em = JSON.parse(userInfo).email
      setEmail(em)
    }
  }
  useEffect(() => {
    initPage()
  }, [])
  return (
    <div className="pDialog authDialog setSucDialog">
      <header className="createAccountDialogHeader">
        <i></i>
        <span>{email}</span>
        <img src={iconChecked} alt="back" />
      </header>
      <header className="setPwdDialogHeader">
        <div className="headerContent">
          <div className="iconWrapper">
            <img src={iconETH} alt="" />
          </div>
          <p className="address">{accountAddr}</p>
        </div>
      </header>
      <main>
        <img src={iconSuc} alt="" />
        <h1>Congratulations</h1>
        <h2>Your setup was successful</h2>
      </main>
      <button className="nextBtn" onClick={handleClickNext}>
        <span>OK</span>
      </button>
    </div>
  );
};

export default SetSucDialog;
