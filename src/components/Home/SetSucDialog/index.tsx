import React, { useEffect, useState } from 'react';
import { getSingleStorageSyncData } from '@/utils/utils';
import PMask from '@/components/PMask'
import PHeader from '@/components/Layout/PHeader'
import iconETH from '@/assets/img/iconETH.svg';
import iconChecked from '@/assets/img/iconChecked.svg';

import iconSuc from '@/assets/img/iconSuc.svg';
import './index.sass'

interface SetSucDialogProps {
  onClose: () => void;
  onSubmit: () => void
}

const SetSucDialog: React.FC<SetSucDialogProps> = ({ onClose, onSubmit }) => {
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
    <PMask onClose={onClose}>
      <div className="padoDialog setSucDialog">
        <main>
          <PHeader />
          <img className="iconSuc" src={iconSuc} alt="" />
          <h1>Congratulations</h1>
          <h2>You have signed up successfully!</h2>
          <ul className="descItems">
            <li className="descItem">
              <img className="iconChecked" src={iconChecked} alt="" />
              <span>{email}</span>
            </li>
            <li className="descItem">
              <img className="iconChecked" src={iconChecked} alt="" />
              <span>{accountAddr}</span>
            </li>
          </ul>
        </main>
        <button className="nextBtn" onClick={handleClickNext}>
          <span>OK</span>
        </button>
      </div>
    </PMask>
  );
};

export default SetSucDialog;
