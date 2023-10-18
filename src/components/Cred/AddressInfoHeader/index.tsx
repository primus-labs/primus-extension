import React, { useState, useEffect, memo } from 'react';
import {useSelector} from 'react-redux'
import iconMy from '@/assets/img/iconMy.svg';
import './index.sass';
import type { UserState } from '@/types/store';

const AddressInfoHeader = memo(() => {
  const connectedWallet = useSelector(
    (state: UserState) => state.connectedWallet
  );
  return (
    <header className="addressInfoHeader">
      <div className="content">
        <div className="iconAddressWrapper">
          <img className="avatar" src={iconMy} alt="" />
        </div>
        <p className="address">{connectedWallet?.address}</p>
      </div>
    </header>
  );
});

export default AddressInfoHeader;
