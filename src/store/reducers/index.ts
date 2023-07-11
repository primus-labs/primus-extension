import { SETSYSCONFIG } from '../actions';
import {
  DEFAULTDATASOURCEPOLLINGTIMENUM,
  DEFAULTCREDTYPELIST,
} from '@/config/constants';

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
  credentials: {},
  userInfo: {},
  walletAddress: '',
  rewards: {}
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
    case SETSYSCONFIG:
      return { ...state, sysConfig: action.payload };
    default:
      return state;
  }
};

export default reducer;

// action creator
