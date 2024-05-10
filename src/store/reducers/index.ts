import { SETSYSCONFIG } from '../actions';
import { connectWallet } from '@/services/wallets/metamask';
import { BASEVENTNAME, DEFAULTDATASOURCEPOLLINGTIMENUM } from '@/config/constants';

const DEFAULTCREDTYPELIST = [
  {
    id: '1',
    credIdentifier: 'ASSETS_PROOF',
    credTitle: 'Assets Proof',
    credIntroduce: 'Assets balance in Binance, OKX',
    credLogoUrl:
      'https://pado-online.s3.ap-northeast-1.amazonaws.com/others/iconCredAsset.svg',
    credDetails:
      'Proving you have a certain amount of assets, which may come from bank deposits or from a crypto exchange balance. PADO uses TLS-MPC to verify the authenticity of your data.',
    credProofContent: 'Balance of assets',
    credProofConditions:
      process.env.NODE_ENV === 'development' ? '["1000"]' : '["10"]',
    simplifiedName: 'Asset',
    display: 0,
    enabled: 0,
  },
  {
    id: '2',
    credIdentifier: 'TOKEN_HOLDINGS',
    credTitle: 'Token Holdings Proof',
    credIntroduce: 'Ownership in Binance, Coinbase, OKX',
    credLogoUrl:
      'https://pado-online.s3.ap-northeast-1.amazonaws.com/others/iconCredToken.svg',
    credDetails:
      'Proving you hold a certain kind of TOKEN. PADO uses TLS-MPC to validate your data authenticity.',
    credProofContent: 'Hold this kind of Token',
    credProofConditions: '["USDT","LAT"]',
    simplifiedName: 'Token',
    display: 0,
    enabled: 0,
  },
  {
    id: '3',
    credIdentifier: 'IDENTIFICATION_PROOF',
    credTitle: 'Identity Proof',
    credIntroduce: 'eKYC, Nationality, Membership',
    credLogoUrl:
      'https://pado-online.s3.ap-northeast-1.amazonaws.com/others/iconCredCred.svg',
    credDetails:
      'Proving you have completed the identity verification process. PADO verifies the authenticity of the verification result.',
    credProofContent: 'Identity verification',
    credProofConditions: 'Verified',
    simplifiedName: 'Identity',
    display: 0,
    enabled: 0,
  },
  {
    id: '4',
    credIdentifier: 'UNISWAP_PROOF',
    credTitle: 'Uniswap Transaction Proof',
    credIntroduce: 'Largest transaction, Volum - powered by Brevis',
    credLogoUrl: '',
    credDetails: '',
    credProofContent: 'Largest ETH/USDC Swap Size',
    credProofConditions: '$100~$1,000',
    simplifiedName: 'Uniswap Transaction',
    display: 0,
    enabled: 0,
  },
];

// initial state
const initState = {
  padoServicePort: chrome.runtime.connect({ name: 'fullscreen' + new Date() }),
  sysConfig: {},
  userPassword: undefined,
  activeSourceType: 'All',
  filterWord: undefined,
  exSources: {},
  socialSources: {},
  kycSources: {},
  sourceUpdateFrequency: DEFAULTDATASOURCEPOLLINGTIMENUM,
  proofTypes: DEFAULTCREDTYPELIST,
  webProofTypes: [],
  credentials: {},
  userInfo: {},
  walletAddress: '',
  rewards: {},
  effective: true,
  onChainAssetsSources: {},
  connectWalletDialogVisible: false,
  connectedWallet: null,
  rewardsDialogVisible: {
    visible: false,
  },
  badgeEventPeriod: {
    startTime: '1698033600000',
    endTime: '1698552000000',
  },
  scrollEventPeriod: {
    startTime: '1699243200000',
    endTime: '1700971200000',
  },
  events: {},
  requireUpgrade: false
};

// reducer
const reducer: any = function (state = initState, action: any) {
  switch (action.type) {
    case 'setPort':
      const newPort = chrome.runtime.connect({
        name: 'fullscreen' + new Date(),
      });
      return { ...state, padoServicePort: newPort };
    case 'setUserPassword':
      return { ...state, userPassword: action.payload };
    case 'setActiveSourceType':
      return { ...state, activeSourceType: action.payload };
    case 'setFilterWord':
      return { ...state, filterWord: action.payload };
    case 'setExSources':
      return { ...state, exSources: action.payload };
    case 'setSocialSources':
      return { ...state, socialSources: action.payload };
    case 'setKYCs':
      return { ...state, kycSources: action.payload };
    case 'setProofTypes':
      return { ...state, proofTypes: action.payload };
    case 'setWebProofTypes':
      return { ...state, webProofTypes: action.payload };
    case 'setCredentials':
      return { ...state, credentials: action.payload };
    case 'setSourceUpdateFrequency':
      return { ...state, sourceUpdateFrequency: action.payload };
    case 'setUserInfo':
      return { ...state, userInfo: action.payload };
    case 'setWalletAddress':
      return { ...state, walletAddress: action.payload };
    case 'setRewards':
      return { ...state, rewards: action.payload };
    case 'setEffective':
      return { ...state, effective: action.payload };
    case 'setOnChainAssetsSources':
      return { ...state, onChainAssetsSources: action.payload };
    case SETSYSCONFIG:
      return { ...state, sysConfig: action.payload };
    case 'setConnectWalletDialogVisible':
      return { ...state, connectWalletDialogVisible: action.payload };
    case 'setConnectWallet':
      return { ...state, connectedWallet: action.payload };
    case 'setRewardsDialogVisibleAction':
      return { ...state, rewardsDialogVisible: action.payload };
    case 'setBadgeEventPeriodAction':
      return { ...state, badgeEventPeriod: action.payload };
    case 'setScrollEventPeriodAction':
      return { ...state, scrollEventPeriod: action.payload };
    case 'setEventsAction':
      return { ...state, events: action.payload };
    case 'setRequireUpgrade':
      return { ...state, requireUpgrade: action.payload };
    default:
      return state;
  }
};

export default reducer;

// action creator
