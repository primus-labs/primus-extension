import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';

import EventsCards from '@/newComponents/Events/EventCards';
import {
  SCROLLEVENTNAME,
  BASEVENTNAME,
  LINEAEVENTNAME,
  LUCKYDRAWEVENTNAME,
  eventMetaMap,
} from '@/config/events';
import iconDataSourceBinance from '@/assets/img/iconDataSourceBinance.svg';
import iconNetworkLinea from '@/assets/img/credit/iconNetworkLinea.svg';
import './index.scss';

interface PDropdownProps {
  onClick?: (item: NavItem) => void;
  // list: NavItem[];
}
const Cards: React.FC<PDropdownProps> = memo(
  ({ onClick = (item: NavItem) => {} }) => {
    const filterdList = useMemo(() => {
      var newList = [
        {
          id: LINEAEVENTNAME,
          combineType: '1', // 0： pado，1:pado combine with partner
          parterIcon: iconNetworkLinea, // required when combineType is 1

          periodType: '1', // 0: period，1:long period
          // period: {startTime,endTime}, // required when periodType is 0
          chainDesc: 'Linea Voyage XP', // required when period is 1

          picTxt: 'The Linea Voyage Proof of Humanity',

          title: 'The Linea Voyage: Proof of Humanity',
          desc: 'Complete an attestation with a KYCed account on Binance.',
          gift: '100 PADO points',
        },
        {
          id: BASEVENTNAME,
          combineType: '1',
          parterIcon: iconDataSourceBinance,

          periodType: '1',
          chainDesc: 'BAS XPS',

          picTxt: 'BAS Attestation Alliance',

          title: 'BAS Attestation Alliance',
          desc: 'Bringing more traditional data attestations to the BNB ecosystem.',
          gift: '100 PADO points',
        },
        {
          id: '2',
          combineType: '0',

          periodType: '1',
          chainDesc: 'PADO Early Birld NFT',

          picTxt: 'PADO Early Bird NFT Rewards',

          title: 'BNBChain Attestation Alliance',
          desc: 'Complete an attestation with any kind of Asset Certificate.',
          gift: '100 PADO points',
        },
      ];

      return newList;
    }, []);
    const handleJoin = useCallback((i) => {}, []);
    return (
      <div className="currentEvents">
        <h2 className="title">Current events</h2>
        <EventsCards list={filterdList} onClick={handleJoin} />
      </div>
    );
  }
);

export default Cards;
