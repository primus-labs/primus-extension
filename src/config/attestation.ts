import iconAttestationTypeAssets from '@/assets/newImg/zkAttestation/iconAttestationTypeAssets.svg';
import iconAttestationTypeSocial from '@/assets/newImg/zkAttestation/iconAttestationTypeSocial.svg';
import iconAttestationTypeIdentity from '@/assets/newImg/zkAttestation/iconAttestationTypeIdentity.svg';
import iconAttestationTypeOnChain from '@/assets/newImg/zkAttestation/iconAttestationTypeOnChain.svg';
import iconAttestationTypeQualification from '@/assets/newImg/zkAttestation/iconAttestationTypeQualification.svg';
import iconAttestationTypeGame from '@/assets/newImg/zkAttestation/iconAttestationTypeGame.svg';
import iconAttestationTypeAIGC from '@/assets/newImg/zkAttestation/iconAttestationTypeAIGC.svg';

import type {
  ATTESTATIONTYPEITEMTYPE,
  ASSETSVERIFICATIONCONTENTTYPEITEM,
} from '@/types/cred';

type ATTESTATIONTYPEMAPTYPE = {
  [propName: string]: ATTESTATIONTYPEITEMTYPE;
};

export const ATTESTATIONTYPEMAP: ATTESTATIONTYPEMAPTYPE = {
  'Assets Certificate': {
    id: 'Assets Certificate',
    name: 'Assets Certificate',
    icon: iconAttestationTypeAssets,
  },
  'Social Activities': {
    id: 'Social Activities',
    name: 'Social Activities',
    icon: iconAttestationTypeSocial,
    disabled: true,
  },
  'Humanity Verification': {
    id: 'Humanity Verification',
    name: 'Humanity Verification',
    icon: iconAttestationTypeIdentity,
  },
  'On-chain Transaction': {
    id: 'On-chain Transaction',
    name: 'On-chain Transaction',
    icon: iconAttestationTypeOnChain,
  },
  'Qualification Certificate': {
    id: 'Qualification Certificate',
    name: 'Qualification Certificate',
    icon: iconAttestationTypeQualification,
    disabled: true,
  },
  'Game Achievements': {
    id: 'Game Achievements',
    name: 'Game Achievements',
    icon: iconAttestationTypeGame,
    disabled: true,
  },
  'AIGC Proof': {
    id: 'AIGC Proof',
    name: 'AIGC Proof',
    icon: iconAttestationTypeAIGC,
    disabled: true,
  },
};
export const ATTESTATIONTYPELIST: ATTESTATIONTYPEITEMTYPE[] =
  Object.values(ATTESTATIONTYPEMAP);

type ATTESTATIONTYPEITEMTYPEMAP = {
  [propName: string]: ASSETSVERIFICATIONCONTENTTYPEITEM;
};
export const ASSETSVERIFICATIONCONTENTTYPEEMAP: ATTESTATIONTYPEITEMTYPEMAP = {
  'Assets Proof': {
    value: 'Assets Proof',
    label: 'Assets balance ≥ specified amount',
  },
  'Token Holding': {
    value: 'Token Holding',
    label: 'Owns a specified token',
  },
};
export const ASSETSVERIFICATIONCONTENTTYPELIST: ASSETSVERIFICATIONCONTENTTYPEITEM[] =
  Object.values(ASSETSVERIFICATIONCONTENTTYPEEMAP);
export const ASSETSVERIFICATIONVALUETYPEEMAP: ATTESTATIONTYPEITEMTYPEMAP = {
  '10': {
    value: '10',
    label: '$10',
  },
  '100': {
    value: '100',
    label: '$100',
  },
  '500': {
    value: '500',
    label: '$500',
  },
  '1000': {
    value: '1000',
    label: '$1000',
  },
};
export const ASSETSVERIFICATIONVALUETYPELIST: ASSETSVERIFICATIONCONTENTTYPEITEM[] =
  Object.values(ASSETSVERIFICATIONVALUETYPEEMAP);
// const attestationTypeMap = {
//   1: {
//     title: 'On-chain Transaction Proof',
//     desc: 'Largest ETH/USDC Uniswap transaction',
//     type: 'Powered by Brevis',
//     icon: iconAttestationOnChain,
//     id: '1',
//     webTemplateId: '2',
//   },
//   2: {
//     title: 'Assets Certificate Proof',
//     desc: 'Owns the specified token',
//     icon: iconAttestationAssets,
//     type: 'Web Data',
//     id: '2',
//     webTemplateId: '2323',
//   },
//   3: {
//     title: 'Assets Certificate Proof',
//     desc: 'Asset balance ≥ specified amount',
//     icon: iconAttestationAssets,
//     id: '3',
//     webTemplateId: '2323',
//     type: 'Web Data',
//   },
//   4: {
//     title: 'Humanity Verification Proof',
//     desc: 'Owns the account',
//     icon: iconAttestationHumanity,
//     type: 'Web Data',
//     id: '4',
//     webTemplateId: '2323',
//   },
//   5: {
//     title: 'Humanity Verification Proof',
//     desc: 'Completed KYC Verification',
//     icon: iconAttestationHumanity,
//     type: 'Web Data',
//     id: '5',
//     webTemplateId: '2323',
//   },
// };
