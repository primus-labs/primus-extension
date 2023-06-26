import React, { FC, useState, useEffect, memo } from 'react';

import iconPolygonID from '@/assets/img/iconPolygonID.svg';
import './index.sass';

interface PolygonIdAddressInfoHeaderProps {
  address: string
}
const PolygonIdAddressInfoHeader: FC<PolygonIdAddressInfoHeaderProps> = memo(({address}) => {
  
  return (
    <header className="polygonIdAddressInfoHeader">
      <div className="content">
        <div className="iconAddressWrapper">
          <img className="avatar" src={iconPolygonID} alt="" />
        </div>
        <p className="address">{address}</p>
      </div>
    </header>
  );
});

export default PolygonIdAddressInfoHeader;
