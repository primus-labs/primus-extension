import iconAttestationTypeAssets from '@/assets/newImg/zkAttestation/iconAttestationTypeAssets.svg';
import iconAttestationTypeSocial from '@/assets/newImg/zkAttestation/iconAttestationTypeSocial.svg';
import iconAttestationTypeIdentity from '@/assets/newImg/zkAttestation/iconAttestationTypeIdentity.svg';
import iconAttestationTypeOnChain from '@/assets/newImg/zkAttestation/iconAttestationTypeOnChain.svg';
import iconAttestationTypeQualification from '@/assets/newImg/zkAttestation/iconAttestationTypeQualification.svg';
import iconAttestationTypeGame from '@/assets/newImg/zkAttestation/iconAttestationTypeGame.svg';
import iconAttestationTypeAIGC from '@/assets/newImg/zkAttestation/iconAttestationTypeAIGC.svg';
import iconAttestationTypeAssetsForDark from '@/assets/newImg/zkAttestation/iconAttestationTypeAssetsForDark.svg';
import iconAttestationTypeSocialForDark from '@/assets/newImg/zkAttestation/iconAttestationTypeSocialForDark.svg';
import iconAttestationTypeIdentityForDark from '@/assets/newImg/zkAttestation/iconAttestationTypeIdentityForDark.svg';
import iconAttestationTypeOnChainForDark from '@/assets/newImg/zkAttestation/iconAttestationTypeOnChainForDark.svg';
import iconAttestationTypeQualificationForDark from '@/assets/newImg/zkAttestation/iconAttestationTypeQualificationForDark.svg';
import iconAttestationTypeGameForDark from '@/assets/newImg/zkAttestation/iconAttestationTypeGameForDark.svg';
import iconAttestationTypeAIGCForDark from '@/assets/newImg/zkAttestation/iconAttestationTypeAIGCForDark.svg';

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

// Assets Verification content/value options
export const ASSETSVERIFICATIONCONTENTTYPEEMAP: ATTESTATIONTYPEITEMTYPEMAP = {
  'Assets Proof': {
    value: 'Assets Proof',
    label: 'Asset balance',
  },
  'Token Holding': {
    value: 'Token Holding',
    label: 'Token holding',
  },
  'Spot 30-Day Trade Vol': {
    value: 'Spot 30-Day Trade Vol',
    label: 'Spot 30-day trade vol',
  },
};

export const ASSETSVERIFICATIONVALUETYPEEMAP: ATTESTATIONTYPEITEMTYPEMAP = {
  // '0.01': {
  //   value: '0.01',
  //   label: '> $0.01',
  // }, //delete TEST-assetsbalance
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

export const ASSETSVOLVERIFICATIONVALUETYPEEMAP: ATTESTATIONTYPEITEMTYPEMAP = {
  // '0': {
  //   value: '0',
  //   label: '> $0',
  // }, // TEST-spot30dVol
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
export const ASSETSVOLVERIFICATIONVALUETYPELIST: ASSETSVERIFICATIONCONTENTTYPEITEM[] =
  Object.values(ASSETSVOLVERIFICATIONVALUETYPEEMAP);

export const ASSETSVERIFICATIONCONTENTTYPELIST: ASSETSVERIFICATIONCONTENTTYPEITEM[] =
  Object.values(ASSETSVERIFICATIONCONTENTTYPEEMAP);

// Social Connections content/value options
export const SOCIALVERIFICATIONCONTENTTYPEEMAP: ATTESTATIONTYPEITEMTYPEMAP = {
  'X Followers': {
    value: 'X Followers',
    label: 'Followers number',
  },
};
export const SOCIALVERIFICATIONCONTENTTYPELIST: ASSETSVERIFICATIONCONTENTTYPEITEM[] =
  Object.values(SOCIALVERIFICATIONCONTENTTYPEEMAP);
export const SOCIALVERIFICATIONVALUETYPEEMAP: ATTESTATIONTYPEITEMTYPEMAP = {
  '1': {
    value: '1',
    label: '> 1',
  },
  '500': {
    value: '500',
    label: '> 500',
  },
};
export const SOCIALVERIFICATIONVALUETYPELIST: ASSETSVERIFICATIONCONTENTTYPEITEM[] =
  Object.values(SOCIALVERIFICATIONVALUETYPEEMAP);

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
  'GPT message': {
    value: 'GPT message',
    label: 'GPT message',
    templateName: 'GPT message',
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

// On-chain Transactions content/value options
export const ONCHAINVERIFICATIONCONTENTTYPEEMAP: ATTESTATIONTYPEITEMTYPEMAP = {
  // '1': {
  //   value: '1',
  //   label: 'Largest ETH/USDC Uniswap transaction',
  // },
  // '2': {
  //   value: '2',
  //   label: 'Sum of WETH/USDC Uniswap Volume',
  // },
  '3': {
    value: '3',
    label: 'Has transactions on BNB Chain',
  },
};
export const ONCHAINVERIFICATIONCONTENTTYPELIST: ASSETSVERIFICATIONCONTENTTYPEITEM[] =
  Object.values(ONCHAINVERIFICATIONCONTENTTYPEEMAP);

export const ALLVERIFICATIONCONTENTTYPEEMAP: ATTESTATIONTYPEITEMTYPEMAP = {
  ...ASSETSVERIFICATIONCONTENTTYPEEMAP,

  ...HUMANITYVERIFICATIONCONTENTTYPEMAP,
  ...ONCHAINVERIFICATIONCONTENTTYPEEMAP,
  ...SOCIALVERIFICATIONCONTENTTYPEEMAP,
};

export const ATTESTATIONTYPEMAP: ATTESTATIONTYPEMAPTYPE = {
  'Assets Verification': {
    id: 'Assets Verification',
    name: 'Assets Verification',
    icon: {
      dark: iconAttestationTypeAssetsForDark,
      light: iconAttestationTypeAssets,
    },
    color: 'yellow',
    childMap: ASSETSVERIFICATIONCONTENTTYPEEMAP,
    chartBarColor: '#FFB700',
    show: true,
    shortName: 'assets',
  },

  'Humanity Verification': {
    id: 'Humanity Verification',
    name: 'Humanity Verification',
    icon: {
      dark: iconAttestationTypeIdentityForDark,
      light: iconAttestationTypeIdentity,
    },
    color: 'gray',
    childMap: HUMANITYVERIFICATIONCONTENTTYPEMAP,
    chartBarColor: '#7B889B',
    show: true,
    shortName: 'humanity',
  },
  'Social Connections': {
    id: 'Social Connections',
    name: 'Social Connections',
    icon: {
      dark: iconAttestationTypeSocialForDark,
      light: iconAttestationTypeSocial,
    },
    color: 'teal',
    childMap: SOCIALVERIFICATIONCONTENTTYPEEMAP,
    chartBarColor: '#08BDBA',
    show: true,
    shortName: 'social',
  },
  'On-chain Transactions': {
    id: 'On-chain Transactions',
    name: 'On-chain Transactions',
    icon: {
      dark: iconAttestationTypeOnChainForDark,
      light: iconAttestationTypeOnChain,
    },
    color: 'blue',
    childMap: ONCHAINVERIFICATIONCONTENTTYPEEMAP,
    chartBarColor: '#1192E8',
    disabled: true,
    show: true,
    shortName: 'on-chain',
  },
  'Qualification Certificate': {
    id: 'Qualification Certificate',
    name: 'Qualification Certificate',
    icon: {
      dark: iconAttestationTypeQualificationForDark,
      light: iconAttestationTypeQualification,
    },
    disabled: true,
    shortName: 'qualification',
  },
  'Game Achievements': {
    id: 'Game Achievements',
    name: 'Game Achievements',
    icon: {
      dark: iconAttestationTypeGameForDark,
      light: iconAttestationTypeGame,
    },
    disabled: true,
    shortName: 'game',
  },
  'AIGC Proof': {
    id: 'AIGC Proof',
    name: 'AIGC Proof',
    icon: {
      dark: iconAttestationTypeAIGCForDark,
      light: iconAttestationTypeAIGC,
    },
    disabled: true,
    shortName: 'AIGC',
  },
};
export const ATTESTATIONTYPELIST: ATTESTATIONTYPEITEMTYPE[] =
  Object.values(ATTESTATIONTYPEMAP);

export const CredVersion = '1.0.5';
// const attestationTypeMap = {
//   1: {
//     title: 'On-chain Transactions Proof',
//     desc: 'Largest ETH/USDC Uniswap transaction',
//     type: 'Powered by Brevis',
//     icon: iconAttestationOnChain,
//     id: '1',
//     webTemplateId: '2',
//   },
//   2: {
//     title: 'Assets Verification Proof',
//     desc: 'Owns the specified token',
//     icon: iconAttestationAssets,
//     type: 'Web Data',
//     id: '2',
//     webTemplateId: '2323',
//   },
//   3: {
//     title: 'Assets Verification Proof',
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
