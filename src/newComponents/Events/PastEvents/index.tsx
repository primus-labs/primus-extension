import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
  SCROLLEVENTNAME,
  BASEVENTNAME,
  LINEAEVENTNAME,
  LUCKYDRAWEVENTNAME,
  eventMetaMap,
} from '@/config/events';
import type { UserState } from '@/types/store';

import EventsCards from '@/newComponents/Events/EventCards';
import iconNetworkScroll from '@/assets/img/credit/iconNetworkScroll.svg';
import './index.scss';

interface PDropdownProps {
  onClick?: (item) => void;
}
const Cards: React.FC<PDropdownProps> = memo(({ onClick = (item) => {} }) => {
  const events = useSelector((state: UserState) => state.events);
  console.log('222events', events);
  const filterdList = useMemo(() => {
    var eventNames = [SCROLLEVENTNAME, LUCKYDRAWEVENTNAME];
    const l = eventNames.map((eName) => {
      const details = events[eName] || { startTime: '0', endTime :'0'};

      const { startTime, endTime, ext } = details;
      // const metaInfo = eventMetaMap[eName];
      // const { combineType, icon: parterIcon } = metaInfo;

      // const periodType = ext?.isLongTermEvent ? '1' : '0';

      // return {
      //   id: eName,
      //   combineType,
      //   parterIcon,
      //   periodType,
      //   period: { startTime, endTime },
      // };

      if (eName === SCROLLEVENTNAME) {
        return {
          id: SCROLLEVENTNAME,
          combineType: '1', // 0： pado，1:pado combine with partner
          parterIcon: iconNetworkScroll, // required when combineType is 1

          periodType: '0', // 0: period，1:long period
          period: { startTime, endTime }, // required when periodType is 0
          // chainDesc: '', // required when periodType is 1

          picTxt: 'Scroll zkAttestation Launch Compaign',

          title: 'Scroll zkAttestation Launch Compaign',
          desc: 'Join this Campaign on QuestN to submit your first zkAttestation on-chain.',
          gift: 'Limited event badge',
        };
      } else if (eName === LUCKYDRAWEVENTNAME) {
        return {
          id: LUCKYDRAWEVENTNAME,
          combineType: '0',
          // parterIcon: iconDataSourceBinance,

          periodType: '0',
          period: { startTime, endTime },

          picTxt: 'PADO Lucky Draw for Product Debut',

          title: 'PADO Lucky Draw for Product Debut',
          desc: 'Create an attestation to confirm your humanity through an exchange accounts.',
          gift: '1000 usdt & limited commemorative badges',
        };
      }
    });
    return l;
  }, [events]);
  const handleJoin = useCallback((i) => {}, []);
  return (
    <div className="currentEvents pastEvents">
      <h2 className="title">Past events</h2>
      <EventsCards list={filterdList} onClick={handleJoin} />
    </div>
  );
});

export default Cards;
