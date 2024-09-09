import { SETSYSCONFIG } from '../actions';
import { DEFAULTDATASOURCEPOLLINGTIMENUM } from '@/config/constants';

const DEFAULTCREDTYPELIST = [
  {
    id: '1',
    credIdentifier: 'ASSETS_PROOF',
    credTitle: 'Assets Proof',
    credIntroduce: 'Assets balance in Binance, OKX',
    credLogoUrl:
      'https://storage.googleapis.com/primus-online/others/iconCredAsset.svg',
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
      'https://storage.googleapis.com/primus-online/others/iconCredToken.svg',
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
      'https://storage.googleapis.com/primus-online/others/iconCredCred.svg',
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
  sourceUpdateInfo: {
    lastUpdateFromNow: 5,
    lastUpdating: false,
    pollingFlag: false,
  },
  proofTypes: DEFAULTCREDTYPELIST,
  webProofTypes: [],
  credentials: {},
  userInfo: {},
  walletAddress: '', // created account when click start
  rewards: {},
  effective: true,
  onChainAssetsSources: {},
  connectWalletDialogVisible: 0,
  activeConnectWallet: {}, // connect wallet in process
  requireFetchAssets: false,
  connectedWallet: null, // user connected
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
  requireUpgrade: false,
  theme: 'light',
  connectByAPILoading: 0,
  lastLoginHasPwd: false,
  dataSourceQueryStr: '',
  dataSourceQueryType: '',
  activeConnectDataSource: {}, // connect data source in progress
  connectedWallets: {}, // had connected wallets and accounts
  attestLoading: 0,
  activeAttestation: {}, // attestation in progress
  attestationQueryStr: '',
  attestationQueryType: '',
  activeOnChain: {}, // attestation on chain in progress

  msgs: {
    // '0': {
    //   id: 0,
    //   type: 'suc',
    //   title: 'Data Connected',
    //   desc: 'See details in the Data Source page.',
    //   link: '/',
    // },
    // '1': {
    //   id: '1',
    //   type: 'error',
    //   title: 'Data Connected',
    //   desc: 'See details in the Data Source page.',
    // },
    // '2': {
    //   id: '2',
    //   type: 'warn',
    //   title: 'Data Connected',
    //   desc: 'See details in the Data Source page.',
    //   code: '2330'
    // },
    // '3': {
    //   id: '3',
    //   type: 'info',
    //   title: 'Data Connected',
    //   desc: 'See details in the Data Source page.',
    // },
  },
  nfts: {},
  earlyBirdNFTs: {},
  eventsLotteryResults: {},
  newRewards: {},
  notifications: {
   
  },
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
      return {
        ...state,
        sourceUpdateFrequency: action.payload,
      };
    case 'setSourceUpdateInfo':
      return {
        ...state,
        sourceUpdateInfo: { ...state.sourceUpdateInfo, ...action.payload },
      };
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
    case 'setActiveConnectWallet':
      return {
        ...state,
        activeConnectWallet: {
          ...state.activeConnectWallet,
          ...action.payload,
        },
      };
    case 'setRequireFetchAssets':
      return { ...state, requireFetchAssets: action.payload };
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
    case 'setThemeAction':
      return { ...state, theme: action.payload };
    case 'setConnectByAPILoading':
      return { ...state, connectByAPILoading: action.payload };
    case 'setIfHasPwd':
      return { ...state, lastLoginHasPwd: action.payload };
    case 'setDataSourceQueryStr':
      return { ...state, dataSourceQueryStr: action.payload };
    case 'setDataSourceQueryType':
      return { ...state, dataSourceQueryType: action.payload };
    case 'setConnectedWallets':
      return { ...state, connectedWallets: action.payload };
    case 'setAttestLoading':
      return { ...state, attestLoading: action.payload };
    case 'setActiveAttestation':
      return {
        ...state,
        activeAttestation: { ...state.activeAttestation, ...action.payload },
      };
    case 'setAttestationQueryStr':
      return { ...state, attestationQueryStr: action.payload };
    case 'setAttestationQueryType':
      return { ...state, attestationQueryType: action.payload };
    case 'setActiveOnChain':
      return {
        ...state,
        activeOnChain: { ...state.activeOnChain, ...action.payload },
      };
    case 'setMsgs':
      return { ...state, msgs: action.payload };
    case 'setActiveConnectDataSource':
      return {
        ...state,
        activeConnectDataSource: {
          ...state.activeConnectDataSource,
          ...action.payload,
        },
      };
    case 'setNfts':
      return {
        ...state,
        nfts: action.payload,
      };
    case 'setEarlyBirdNFTs':
      return {
        ...state,
        earlyBirdNFTs: action.payload,
      };
    case 'setEventsLotteryResults':
      return {
        ...state,
        eventsLotteryResults: action.payload,
      };
    case 'setNewRewards':
      return { ...state, newRewards: action.payload };
    case 'setNotifications':
      return { ...state, notifications: action.payload };
    default:
      return state;
  }
};

export default reducer;

// action creator
