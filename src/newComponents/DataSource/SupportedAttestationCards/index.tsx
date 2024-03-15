import React, { memo, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import PButton from '@/newComponents/PButton';
import iconAttestationHumanity from '@/assets/newImg/zkAttestation/iconAttestationTypeIdentity.svg';
import iconAttestationAssets from '@/assets/newImg/zkAttestation/iconAttestationTypeAssets.svg';
import iconAttestationOnChain from '@/assets/newImg/zkAttestation/iconAttestationTypeOnChain.svg';

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
}
// verificationContent: '';
// verificationValue: '';
// account: string;
const attestationTypeMap = {
  1: {
    attestationType: 'On-chain Transaction',
    verificationContent: '1',
    desc: 'Largest ETH/USDC Uniswap transaction',
    type: 'Powered by Brevis',
    icon: iconAttestationOnChain,
    id: '1',
    webTemplateId: '2',
  },
  2: {
    attestationType: 'Assets Certification',
    verificationContent: 'Token Holding',
    desc: 'Owns a specified token',
    icon: iconAttestationAssets,
    type: 'Web Data',
    id: '2',
    webTemplateId: '2323',
  },
  3: {
    attestationType: 'Assets Certification',
    verificationContent: 'Assets Proof',
    desc: 'Asset balance ≥ specified amount',
    icon: iconAttestationAssets,
    id: '3',
    webTemplateId: '2323',
    type: 'Web Data',
  },
  4: {
    attestationType: 'Humanity Verification',
    verificationContent: 'Owns an account',
    verificationValue: 'N/A',
    desc: 'Owns an account',
    icon: iconAttestationHumanity,
    type: 'Web Data',
    id: '4',
    webTemplateId: '2323',
  },
  5: {
    attestationType: 'Humanity Verification',
    verificationContent: 'KYC Status',
    verificationValue: 'Basic Verification',
    desc: 'Completed KYC Verification',
    icon: iconAttestationHumanity,
    type: 'Web Data',
    id: '5',
    webTemplateId: '2323',
  },
};
const Cards: React.FC<PDropdownProps> = memo(
  ({ onClick = (item: NavItem) => {} }) => {
    const [searchParams] = useSearchParams();
    const dataSourceName = searchParams.get('dataSourceId');
    const supportList = useMemo(() => {
      if (dataSourceName === 'web3 wallet') return [attestationTypeMap[1]];
      if (dataSourceName === 'binance')
        return [
          attestationTypeMap[2],
          attestationTypeMap[3],
          attestationTypeMap[4],
          attestationTypeMap[5],
        ];
      if (dataSourceName === 'okx')
        return [
          attestationTypeMap[2],
          attestationTypeMap[3],
          attestationTypeMap[5],
        ];
      if (
        dataSourceName === 'x' ||
        dataSourceName === 'tiktok' ||
        dataSourceName === 'google'
      )
        return [attestationTypeMap[4]];
      if (dataSourceName === 'coinbase') return [attestationTypeMap[2]];
      // if (dataSourceName === 'zan') return [attestationTypeMap[5]];
      return [];
    }, []);
    const handleCreate = useCallback((i) => {
      onClick && onClick(i);
    }, []);
    return (
      <ul className="supportSttestationCards">
        {supportList.map((i) => {
          return (
            <li className="supportSttestationCard" key={i.id}>
              <div className="left">
                <img src={i.icon} alt="" />
                <div className="introTxt">
                  <div className="title">{i.attestationType}</div>
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
                    handleCreate(i);
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
