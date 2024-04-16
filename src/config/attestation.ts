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

type ATTESTATIONTYPEITEMTYPEMAP = {
  [propName: string]: ASSETSVERIFICATIONCONTENTTYPEITEM;
};

// Assets Certification content/value options
export const ASSETSVERIFICATIONCONTENTTYPEEMAP: ATTESTATIONTYPEITEMTYPEMAP = {
  'Assets Proof': {
    value: 'Assets Proof',
    label: 'Asset balance',
  },
  'Token Holding': {
    value: 'Token Holding',
    label: 'Token holding',
  },
};
export const ASSETSVERIFICATIONCONTENTTYPELIST: ASSETSVERIFICATIONCONTENTTYPEITEM[] =
  Object.values(ASSETSVERIFICATIONCONTENTTYPEEMAP);
export const ASSETSVERIFICATIONVALUETYPEEMAP: ATTESTATIONTYPEITEMTYPEMAP = {
  '0.01': {
    value: '0.01',
    label: '> $0.01',
  }, //delete TODO-newui
  '10': {
    value: '10',
    label: '> $10',
  },
  '100': {
    value: '100',
    label: '> $100',
  },
  '500': {
    value: '500',
    label: '> $500',
  },
  '1000': {
    value: '1000',
    label: '> $1000',
  },
};
export const ASSETSVERIFICATIONVALUETYPELIST: ASSETSVERIFICATIONCONTENTTYPEITEM[] =
  Object.values(ASSETSVERIFICATIONVALUETYPEEMAP);

// Humanity Verification content/value options
export const HUMANITYVERIFICATIONCONTENTTYPEMAP: ATTESTATIONTYPEITEMTYPEMAP = {
  'KYC Status': {
    value: 'KYC Status',
    label: 'KYC Status',
  },
  'Account ownership': {
    value: 'Account ownership',
    label: 'Account ownership',
    templateName: 'Account Ownership',
  },
};
export const HUMANITYVERIFICATIONCONTENTTYPELIST: ASSETSVERIFICATIONCONTENTTYPEITEM[] =
  Object.values(HUMANITYVERIFICATIONCONTENTTYPEMAP);
export const HUMANITYVERIFICATIONVALUETYPEEMAP: ATTESTATIONTYPEITEMTYPEMAP = {
  'Basic Verification': {
    value: 'Basic Verification',
    label: 'Basic Verification',
  },
  // 'Advanced Verification': {
  //   value: 'Advanced Verification',
  //   label: 'Advanced Verification',
  // },
};
export const HUMANITYVERIFICATIONVALUETYPELIST: ASSETSVERIFICATIONCONTENTTYPEITEM[] =
  Object.values(HUMANITYVERIFICATIONVALUETYPEEMAP);

// On-chain Transaction content/value options
export const ONCHAINVERIFICATIONCONTENTTYPEEMAP: ATTESTATIONTYPEITEMTYPEMAP = {
  '1': {
    value: '1',
    label: 'Largest ETH/USDC Uniswap Transaction',
  },
  // '2': {
  //   value: '2',
  //   label: 'Sum of WETH/USDC Uniswap Volume',
  // },
};
export const ONCHAINVERIFICATIONCONTENTTYPELIST: ASSETSVERIFICATIONCONTENTTYPEITEM[] =
  Object.values(ONCHAINVERIFICATIONCONTENTTYPEEMAP);

export const ALLVERIFICATIONCONTENTTYPEEMAP: ATTESTATIONTYPEITEMTYPEMAP = {
  ...ASSETSVERIFICATIONCONTENTTYPEEMAP,
  ...HUMANITYVERIFICATIONCONTENTTYPEMAP,
  ...ONCHAINVERIFICATIONCONTENTTYPEEMAP,
};

export const ATTESTATIONTYPEMAP: ATTESTATIONTYPEMAPTYPE = {
  'Assets Certification': {
    id: 'Assets Certification',
    name: 'Assets Certification',
    icon: iconAttestationTypeAssets,
    color: 'yellow',
    childMap: ASSETSVERIFICATIONCONTENTTYPEEMAP,
    chartBarColor: '#FFB700',
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
    color: 'gray',
    childMap: HUMANITYVERIFICATIONCONTENTTYPEMAP,
    chartBarColor: '#7B889B',
  },
  'On-chain Transaction': {
    id: 'On-chain Transaction',
    name: 'On-chain Transaction',
    icon: iconAttestationTypeOnChain,
    color: 'blue',
    childMap: ONCHAINVERIFICATIONCONTENTTYPEEMAP,
    chartBarColor: '#1192E8',
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

export const CredVersion = '1.0.4';
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
//     title: 'Assets Certification Proof',
//     desc: 'Owns the specified token',
//     icon: iconAttestationAssets,
//     type: 'Web Data',
//     id: '2',
//     webTemplateId: '2323',
//   },
//   3: {
//     title: 'Assets Certification Proof',
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
