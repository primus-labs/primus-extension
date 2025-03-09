import React, { memo, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PButton from '@/newComponents/PButton';
import iconAttestationHumanity from '@/assets/newImg/zkAttestation/iconAttestationTypeIdentity.svg';
import iconAttestationAssets from '@/assets/newImg/zkAttestation/iconAttestationTypeAssets.svg';
import iconAttestationOnChain from '@/assets/newImg/zkAttestation/iconAttestationTypeOnChain.svg';
import iconAttestationTypeSocial from '@/assets/newImg/zkAttestation/iconAttestationTypeSocial.svg';
import iconProviderBrevis from '@/assets/newImg/zkAttestation/iconProviderBrevis.svg';
import './index.scss';

import { UserState } from '@/types/store';
import { ATTESTATIONTYPEMAP as ATTESTATIONTYPEINFOMAP } from '@/config/attestation';

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
const attestationTypeMap: any = {
  1: {
    attestationType: 'On-chain Transactions',
    verificationContent: '1',
    desc: 'Largest ETH/USDC Uniswap transaction',
    type: 'Powered by Brevis',
    id: '1',
    webTemplateId: '2',
  },
  2: {
    attestationType: 'Assets Verification',
    verificationContent: 'Token Holding',
    desc: 'Token holding',
    type: 'Web Data',
    id: '2',
    webTemplateId: '2323',
  },
  3: {
    attestationType: 'Assets Verification',
    verificationContent: 'Assets Proof',
    desc: 'Asset balance',
    id: '3',
    webTemplateId: '2323',
    type: 'Web Data',
  },
  4: {
    attestationType: 'Humanity Verification',
    verificationContent: 'Account ownership',
    verificationValue: 'Account owner',
    desc: 'Account ownership',
    type: 'Web Data',
    id: '4',
    webTemplateId: '2323',
  },
  5: {
    attestationType: 'Humanity Verification',
    verificationContent: 'KYC Status',
    verificationValue: 'Basic Verification',
    desc: 'KYC status',
    type: 'Web Data',
    id: '5',
    webTemplateId: '2323',
  },
  15: {
    attestationType: 'Social Connections',
    verificationContent: 'X Followers',
    desc: 'Followers number',
    type: 'Web Data',
    id: '15',
    webTemplateId: '15',
  },
  16: {
    attestationType: 'Assets Verification',
    verificationContent: 'Spot 30-Day Trade Vol',
    desc: 'Spot 30-day trade vol',
    type: 'Web Data',
    id: '16',
    webTemplateId: '16',
  },
  17: {
    attestationType: 'Assets Verification',
    verificationContent: 'Spot 30-Day Trade Vol',
    desc: 'Spot 30-day trade vol',
    type: 'Web Data',
    id: '17',
    webTemplateId: '17',
  },
  101: {
    attestationType: 'On-chain Transactions',
    verificationContent: '3',
    verificationValue: 'since 2024 July',
    desc: 'Has transactions on BNB Chain',
    type: 'Provider',
    provider: {
      name: 'Brevis',
      icon: iconProviderBrevis,
    },
    id: '101',
    webTemplateId: '101',
  },
  22: {
    attestationType: 'Assets Verification',
    verificationContent: 'Spot 30-Day Trade Vol',
    desc: 'Spot 30-day trade vol',
    type: 'Web Data',
    id: '22',
    webTemplateId: '22',
  },
  23: {
    attestationType: 'Assets Verification',
    verificationContent: 'Spot 30-Day Trade Vol',
    desc: 'Spot 30-day trade vol',
    type: 'Web Data',
    id: '23',
    webTemplateId: '23',
  },
};
const Cards: React.FC<PDropdownProps> = memo(
  ({ onClick = (item: NavItem) => {} }) => {
    const [searchParams] = useSearchParams();
    const dataSourceName = searchParams.get('dataSourceId');
    const theme = useSelector((state: UserState) => state.theme);
    const supportList = useMemo(() => {
      if (dataSourceName === 'web3 wallet') {
        return [attestationTypeMap[101]];
      }
      if (dataSourceName === 'binance')
        return [
          attestationTypeMap[2],
          attestationTypeMap[3],
          attestationTypeMap[16],
          attestationTypeMap[4],
          attestationTypeMap[5],
        ];
      if (dataSourceName === 'okx')
        return [
          attestationTypeMap[2],
          attestationTypeMap[3],
          attestationTypeMap[17],
          attestationTypeMap[5],
        ];
      if (['tiktok', 'google', 'discord'].includes(dataSourceName as string))
        return [attestationTypeMap[4]];
      if (dataSourceName === 'x') {
        return [attestationTypeMap[4], attestationTypeMap[15]];
      }
      if (dataSourceName === 'coinbase') return [attestationTypeMap[2]];
      if (dataSourceName === 'bitget') return [attestationTypeMap[22]];
      if (dataSourceName === 'bybit') return [attestationTypeMap[23]];
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
                <img
                  src={ATTESTATIONTYPEINFOMAP[i.attestationType].icon[theme]}
                  alt=""
                />
                <div className="introTxt">
                  <div className="title">{i.attestationType}</div>
                  <div className="desc">{i.desc}</div>
                </div>
              </div>
              <div className="right">
                <div className="provider">
                  {i.type === 'Provider' ? (
                    <>
                      <span>by</span>
                      <img src={i.provider?.icon} alt="" />
                      <span>{i.provider?.name}</span>
                    </>
                  ) : (
                    i.type
                  )}
                </div>

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
