// import {
//   getSingleStorageSyncData,
//   getMutipleStorageSyncData,
// } from '@/utils/utils';
// import { SETKEYSTORE, SETUSERINFO, SETALLSTORAGE } from '../actions';
import { SETEXCHAGEDATA, SETSYSCONFIG, SETSOCIALDATA } from '../actions';
import type  {AssetsMap} from '@/components/DataSourceItem'

type ExInfo = {
  date: string;
  apiKey: string;
  totalBalance: string;
  tokenListMap: AssetsMap;
}
type SysConfigInfo = {
  [propName: string]: any
}
type ExDatas = {
  [propName: string]: ExInfo
}
type SocialDatas = {
  [propName: string]: any
}
export type UserState = {
  padoServicePort: chrome.runtime.Port;
  binance: ExInfo;
  okx: ExInfo;
  kucoin: ExInfo;
  coinbase: ExInfo;
  twitter: any;
  sysConfig: SysConfigInfo;
  count: number,
  exDatas: ExDatas,
  socialDatas: SocialDatas
}
// initial state
const initState = {
  padoServicePort: chrome.runtime.connect({ name: 'fullscreen' }),
  binance: null,
  okx: null,
  kucoin: null,
  coinbase: null,
  twitter: null,
  // userInfo: {},
  // keyStore: '',
  sysConfig: {

  },
  exDatas: {},
  socialDatas: {}
};

// reducer
const reducer:any = function (state = initState, action: any) {
  switch (action.type) {
    // case SETKEYSTORE:
    //   return { ...state, keyStore: action.payload };
    // case SETUSERINFO:
    //   return { ...state, userInfo: action.payload };
    // case SETALLSTORAGE:
    //   return { ...state, ...action.payload };
    
    case SETEXCHAGEDATA:
      return { ...state, exDatas: {...state.exDatas, ...action.payload}, ...action.payload};
    case SETSOCIALDATA:
      return { ...state, socialDatas: {...state.socialDatas, ...action.payload}};
    case SETSYSCONFIG:
      return { ...state, sysConfig:action.payload };
    
    default:
      return state;
  }
};
export default reducer;

// action creator
