import React, {  memo } from 'react';
import iconMy from '@/assets/img/iconMy.svg';
import './index.scss';
interface AddressInfoHeaderProps {
  address: string;
  icon?: any;
}
const AddressInfoHeader: React.FC<AddressInfoHeaderProps> = memo(
  ({ address = '', icon = iconMy }) => {
    return (
      <header className="addressInfoHeader">
        <div className="content">
          <div className="iconAddressWrapper">
            <img className="avatar" src={icon} alt="" />
          </div>
          <p className="address">{address}</p>
        </div>
      </header>
    );
  }
);

export default AddressInfoHeader;
