import React, { memo, useCallback } from 'react';
import { DATASOURCEMAP } from '@/config/dataSource';
import dayjs from 'dayjs';
import utc from 'dayjs-plugin-utc';
import type { SyntheticEvent } from 'react';

import PTag from '@/newComponents/PTag';
import PButton from '@/newComponents/PButton';
import connectData from '@/assets/newImg/dataSource/connectedData.svg';
import iconAttestationHumanity from '@/assets/newImg/dataSource/iconAttestationHumanity.svg';
import iconAttestationAssets from '@/assets/newImg/dataSource/iconAttestationAssets.svg';
import iconAttestationOnChain from '@/assets/newImg/dataSource/iconAttestationOnChain.svg';
import './index.scss';

type NavItem = {
  type: string;
  icon: any;
  desc: any;
  name: string;

  importType?: string;
  provider?: string;
};
interface PDropdownProps {
  onClick?: (item: NavItem) => void;

  // list: NavItem[];
}
const supportList = [
  // {
  //   title: 'On-chain Activities',
  //   desc: 'Largest ETH/USDC Uniswap transaction',
  //   type: 'Powered by Brevis',
  //   icon: iconAttestationOnChain,
  //   id: '1',
  //   webTemplateId: '2',
  // },

  {
    title: 'Assets Certificate',
    desc: 'Owns the specified token',
    icon: iconAttestationAssets,
    type: 'Web Data',
    id: '2',
    webTemplateId: '2323',
  },
  {
    title: 'Assets Certificate',
    desc: 'Asset balance ≥ specified amount',
    icon: iconAttestationAssets,
    id: '3',
    webTemplateId: '2323',
    type: 'Web Data',
  },
  {
    title: 'Humanity Verification',
    desc: 'Completed KYC Verification',
    icon: iconAttestationHumanity,
    type: 'Web Data',
    id: '4',
    webTemplateId: '2323',
  },
];
const Cards: React.FC<PDropdownProps> = memo(
  ({ onClick = (item: NavItem) => {} }) => {
    const handleDetail = useCallback((i) => {
      onClick && onClick(i);
    }, []);
    return (
      <ul className="supportSttestationCards">
        {supportList.map((i) => {
          return (
            <li
              className="supportSttestationCard"
              onClick={() => {
                handleDetail(i);
              }}
            >
              <div className="left">
                <img src={i.icon} alt="" />
                <div className="introTxt">
                  <div className="title">{i.title}</div>
                  <div className="desc">{i.desc}</div>
                </div>
              </div>
              <div className="right">
                <div className="provider">{i.type}</div>
                <PButton
                  className="createBtn"
                  text="Create"
                  type="text"
                  onClick={() => {
                    handleDetail(i);
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    );
  }
);

export default Cards;
