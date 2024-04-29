import iconNetworkScroll from '@/assets/img/credit/iconNetworkScroll.svg';

import iconDataSourceBinance from '@/assets/img/iconDataSourceBinance.svg';
import iconNetworkLinea from '@/assets/img/credit/iconNetworkLinea.svg';
import iconEventPartnerSign from '@/assets/newImg/events/iconEventPartnerSign.svg';

export const BADGELOTTRYTIMESTR = '2023-10-29 12:00:00';
export const SCROLLEVENTNAME = 'SCROLL_LAUNCH_CAMPAIGN';
export const BASEVENTNAME = 'BAS_EVENT_PROOF_OF_HUMANITY';
export const LINEAEVENTNAME = 'LINEA_DEFI_VOYAGE';
export const LUCKYDRAWEVENTNAME = 'PRODUCT_DEBUT';
export const EARLYBIRDNFTEVENTNAME = 'Early_Bird_NFT';
export const ETHSIGNEVENTNAME = 'SIGNX_X_PROGRAM';
export const EVENTNAMEMAP = {
  [ETHSIGNEVENTNAME]: 'SignX Program',
  [BASEVENTNAME]: 'BAS Event',
  [LINEAEVENTNAME]: 'Linea Voyage',
  [SCROLLEVENTNAME]: 'Scroll zkAttestation',
  [LUCKYDRAWEVENTNAME]: 'PADO Lucky Draw',
};
export const eventMetaMap = {
  [BASEVENTNAME]: {
    combineType: '1',
    icon: iconDataSourceBinance,
    title: 'BNBChain Attestation Alliance',
    longDesc:
      'The BNB Attestation Service (BAS) is an infrastructure built on the BNB ecosystem for generating attestation to verify information. BAS assists users in on-chain or off-chain verification, allowing them to assert ownership of attestation by storing them in Greenfield.',
    periodType: '1',

    // chainDesc: 'BAS XPS',
    // gift: '100 PADO points',
    points: [
      {
        pointIconFont: 'icon-iconBlockChain',
        pointDesc: 'BAS XPS',
      },
      { pointIconFont: 'icon-iconGift', pointDesc: '100 PADO points' },
    ],

    nameInAttestation: 'BAS event-specific',
    picTxt: 'BAS Attestation Alliance',
    desc: 'Bringing more traditional data attestations to the BNB ecosystem.',

    chainIds: ['BSC'], // , 'BNB Greenfield'
    taskMap: {
      follow: {
        x: 0,
        discord: 0,
      },
      attestation: {
        2: 0, // biance account
        6: 0, // tiktok account
        100: 0, // google account
        3: 0, //  x account
      },
      onChain: {
        BSC: 0,
      },
    },
  },
  [LINEAEVENTNAME]: {
    combineType: '1',
    icon: iconNetworkLinea,
    title: 'The Linea Voyage: Proof of Humanity',
    longDesc:
      "PADO's zkAttestation capability enables the secure and private application of off-chain data to the blockchain. Through this collaboration, we aim to familiarize users with zkAttestation and enhance the on-chain ecosystem of Linea.",
    periodType: '1',
    // chainDesc: 'Linea Voyage XP',
    // gift: '100 PADO points',
    points: [
      {
        pointIconFont: 'icon-iconBlockChain',
        pointDesc: 'Linea Voyage XP',
      },
      { pointIconFont: 'icon-iconGift', pointDesc: '100 PADO points' },
    ],

    nameInAttestation: 'Linea voyage specific',
    picTxt: 'The Linea Voyage Proof of Humanity',
    desc: 'Complete an attestation with a KYCed account on Binance.',

    chainIds: ['Linea Goerli'],
    taskMap: {
      follow: {
        x: 0,
        discord: 0,
      },
      attestation: {
        1: 0,
      },
      onChain: {
        Linea: 0,
      },
    },
  },
  [SCROLLEVENTNAME]: {
    combineType: '1',
    icon: iconNetworkScroll,
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
  },
  [EARLYBIRDNFTEVENTNAME]: {
    combineType: '0',
    // icon: iconDataSourceBinance,
    title: 'PADO Early Bird NFT Rewards',
    longDesc:
      'For trying things out, make an asset certification, submit it to Linea, and share your referral code. This will grant you the eligibility to mint the PADO early bird NFT.',
    periodType: '1',
    // chainDesc: 'Early Bird NFT',
    // gift: '100 PADO points',
    points: [
      {
        pointIconFont: 'icon-iconBlockChain',
        pointDesc: 'PADO Early Birld NFT',
      },
      { pointIconFont: 'icon-iconGift', pointDesc: '100 PADO points' },
    ],
    nameInAttestation: 'Early Bird NFT', // TODO-newui ???
    picTxt: 'PADO Early Bird NFT Rewards',
    desc: 'Complete an attestation with any kind of Asset Certificate.',
    chainIds: [], // TODOnewui ???
    taskMap: {
      follow: {
        x: 0,
        discord: 0,
      },
      attestation: {
        'Assets Verification': 0,
      },
      onChain: {
        // TODOnewui ???
      },
    },
  },
  [ETHSIGNEVENTNAME]: {
    combineType: '1',
    icon: iconEventPartnerSign,
    title: 'SignX Program',
    longDesc:
      'Sign Protocol is an omni-chain attestation protocol, enabling users to freely attest and verify any information on-chain.',
    periodType: '1',

    chainDesc: 'Linea Voyage XP',
    gift: '100 PADO points',
    points: [{ pointIconFont: 'icon-iconGift', pointDesc: '100 PADO points' }],

    nameInAttestation: 'SignX Program',
    picTxt: 'SignX Program',
    desc: 'Building Trust in Trustless Systems',

    chainIds: ['opBNB'],
    taskMap: {
      follow: {
        x: 0,
        discord: 0,
      },
      attestation: {
        15: 0,
      },
      onChain: {
        opBNB: 0,
      },
    },
  },
};
