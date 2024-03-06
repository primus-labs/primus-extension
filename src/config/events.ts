import iconNetworkScroll from '@/assets/img/credit/iconNetworkScroll.svg';

import iconDataSourceBinance from '@/assets/img/iconDataSourceBinance.svg';
import iconNetworkLinea from '@/assets/img/credit/iconNetworkLinea.svg';
export const BADGELOTTRYTIMESTR = '2023-10-29 12:00:00';
export const SCROLLEVENTNAME = 'SCROLL_LAUNCH_CAMPAIGN';
export const BASEVENTNAME = 'BAS_EVENT_PROOF_OF_HUMANITY';
export const LINEAEVENTNAME = 'LINEA_DEFI_VOYAGE';
export const LUCKYDRAWEVENTNAME = 'PRODUCT_DEBUT';
export const EARLYBIRDNFTEVENTNAME = 'Early_Bird_NFT';

export const eventMetaMap = {
  [BASEVENTNAME]: {
    combineType: '1',
    icon: iconDataSourceBinance,
    nameInAttestation: 'BAS event-specific',
  },
  [LINEAEVENTNAME]: {
    combineType: '1',
    icon: iconNetworkLinea,
    title: 'The Linea Voyage: Proof of Humanity',
    longDesc:
      "PADO's zkAttestation capability enables the secure and private application of off-chain data to the blockchain. Through this collaboration, we aim to familiarize users with zkAttestation and enhance the on-chain ecosystem of Linea.",
    periodType: '1',
    chainDesc: 'Linea Voyage XP',
    gift: '100 PADO points',
    nameInAttestation: 'Linea voyage specific',
    chainIds: ['Linea Goerli'],
    // picTxt: 'The Linea Voyage Proof of Humanity',
    // desc: 'Complete an attestation with a KYCed account on Binance.',
  },
  [SCROLLEVENTNAME]: {
    combineType: '1',
    icon: iconNetworkScroll,
  },
};
