import React, { memo, useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
  EARLYBIRDNFTEVENTNAME,
  SCROLLEVENTNAME,
  LUCKYDRAWEVENTNAME,
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
    var eventNames = [
      EARLYBIRDNFTEVENTNAME,
      SCROLLEVENTNAME,
      LUCKYDRAWEVENTNAME,
    ];
    const l = eventNames.map((eName) => {
      if (eName === EARLYBIRDNFTEVENTNAME) {
        return {
          id: EARLYBIRDNFTEVENTNAME,
          combineType: '0',

          periodType: '1',

          picTxt: 'Early Bird NFT Rewards',
          title: 'Early Bird Rewards',
          desc: 'Complete an attestation with any kind of Asset Certificate.',
          points: [
            {
              pointIconFont: 'icon-iconBlockChain',
              pointDesc: 'Early Birld NFT',
            },
            { pointIconFont: 'icon-iconGift', pointDesc: '100 points' },
          ],
        };
      } else {
        const details = events[eName] || { startTime: '0', endTime: '0' };

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

            picTxt: 'Scroll Attestation Launch Compaign',

            title: 'Scroll Attestation Launch Compaign',
            desc: 'Join this Campaign on QuestN to submit your first zkAttestation on-chain.',

            points: [
              {
                pointIconFont: 'icon-iconCalendar',
                pointDesc: 'Nov. 20,2023-Dec.01,2023',
              },
              {
                pointIconFont: 'icon-iconGift',
                pointDesc: 'Limited event badge',
              },
            ],
          };
        } else if (eName === LUCKYDRAWEVENTNAME) {
          return {
            id: LUCKYDRAWEVENTNAME,
            combineType: '0',
            // parterIcon: iconDataSourceBinance,

            periodType: '0',
            period: { startTime, endTime },

            picTxt: 'Primus Lucky Draw for Product Debut',

            title: 'Primus Lucky Draw for Product Debut',
            desc: 'Create an attestation to confirm your humanity through an exchange accounts.',

            points: [
              {
                pointIconFont: 'icon-iconCalendar',
                pointDesc: 'Oct. 23,2023-Oct.29,2023',
              },
              {
                pointIconFont: 'icon-iconGift',
                pointDesc: '1000 usdt & limited commemorative badges',
              },
            ],
          };
        }
      }
    });
    return l;
  }, [events]);

  return (
    <div className="currentEvents pastEvents">
      <h2 className="title">Past events</h2>
      <EventsCards list={filterdList} />
    </div>
  );
});

export default Cards;
