import React, {  memo } from 'react';
import iconMy from '@/assets/img/iconMy.svg';
import './index.sass';
interface AddressInfoHeaderProps {
  address: string;
}
const AddressInfoHeader: React.FC<AddressInfoHeaderProps> = memo(({address  = ''}) => {
  return (
    <header className="addressInfoHeader">
      <div className="content">
        <div className="iconAddressWrapper">
          <img className="avatar" src={iconMy} alt="" />
        </div>
        <p className="address">{address}</p>
      </div>
    </header>
  );
});

export default AddressInfoHeader;
