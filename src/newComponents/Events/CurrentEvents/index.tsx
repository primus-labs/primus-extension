import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';

import EventsCards from '@/newComponents/Events/EventCards';
import {
  SCROLLEVENTNAME,
  BASEVENTNAME,
  LINEAEVENTNAME,
  LUCKYDRAWEVENTNAME,
  eventMetaMap,
  EARLYBIRDNFTEVENTNAME,
  ETHSIGNEVENTNAME,
} from '@/config/events';
import iconDataSourceBinance from '@/assets/img/iconDataSourceBinance.svg';
import iconNetworkLinea from '@/assets/img/credit/iconNetworkLinea.svg';
import iconEventPartnerSign from '@/assets/newImg/events/iconEventPartnerSign.svg';
import './index.scss';

interface PDropdownProps {}
const Cards: React.FC<PDropdownProps> = memo(({}) => {
  const filterdList = useMemo(() => {
    var newList = [
      {
        id: LINEAEVENTNAME,
        combineType: '1', // 0： pado，1:pado combine with partner
        parterIcon: iconNetworkLinea, // required when combineType is 1

        periodType: '1', // 0: period，1:long period
        // period: {startTime,endTime}, // required when periodType is 0

        picTxt: 'The Linea Voyage Proof of Humanity',

        title: 'The Linea Voyage: Proof of Humanity',
        desc: 'Complete an attestation with a KYCed account on Binance.',
        points: [
          {
            pointIconFont: 'icon-iconBlockChain',
            pointDesc: 'Linea Voyage XP',
          },
          { pointIconFont: 'icon-iconGift', pointDesc: '100 PADO points' },
        ],
        // chainDesc: 'Linea Voyage XP', // required when period is 1
      },
      {
        id: BASEVENTNAME,
        combineType: '1',
        parterIcon: iconDataSourceBinance,

        periodType: '1',

        picTxt: 'BAS Attestation Alliance',

        title: 'BAS Attestation Alliance',
        desc: 'Bringing more traditional data attestations to the BNB ecosystem.',
        points: [
          {
            pointIconFont: 'icon-iconBlockChain',
            pointDesc: 'BAS XPS',
          },
          { pointIconFont: 'icon-iconGift', pointDesc: '100 PADO points' },
        ],
      },
      {
        id: ETHSIGNEVENTNAME,
        combineType: '1',
        parterIcon: iconEventPartnerSign, // required when combineType is 1

        periodType: '1', // 0: period，1:long period
        // period: {startTime,endTime}, // required when periodType is 0

        picTxt: 'SignX Program',

        title: 'SignX Program',
        desc: 'Building Trust in Trustless Systems',
        points: [
          { pointIconFont: 'icon-iconGift', pointDesc: '100 PADO points' },
        ],
      },
      {
        id: EARLYBIRDNFTEVENTNAME,
        combineType: '0',

        periodType: '1',

        picTxt: 'PADO Early Bird NFT Rewards',
        title: 'BNBChain Attestation Alliance',
        desc: 'Complete an attestation with any kind of Asset Certificate.',
        points: [
          {
            pointIconFont: 'icon-iconBlockChain',
            pointDesc: 'PADO Early Birld NFT',
          },
          { pointIconFont: 'icon-iconGift', pointDesc: '100 PADO points' },
        ],
      },
    ];

    return newList;
  }, []);
  return (
    <div className="currentEvents">
      <h2 className="title">Current events</h2>
      <EventsCards list={filterdList} />
    </div>
  );
});

export default Cards;
