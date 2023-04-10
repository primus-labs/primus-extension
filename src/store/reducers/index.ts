// import {
//   getSingleStorageSyncData,
//   getMutipleStorageSyncData,
// } from '@/utils/utils';
// import { SETKEYSTORE, SETUSERINFO, SETALLSTORAGE } from '../actions';
import { SETEXCHAGEDATA, SETSYSCONFIG } from '../actions';
import type  {AssetsMap} from '@/components/DataSourceItem'

type ExInfo = {
  totalBalance: string;
  tokenListMap: AssetsMap
}
type SysConfigInfo = {
  [propName: string]: any
}
export type UserState = {
  padoServicePort: chrome.runtime.Port;
  binance: ExInfo;
  okx: ExInfo;
  kucoin: ExInfo;
  coinbase: ExInfo;
  sysConfig: SysConfigInfo
}
// initial state
const initState = {
  padoServicePort: chrome.runtime.connect({ name: 'fullscreen' }),
  binance: {
    totalBalance: null,
    tokenListMap: {}
  },
  okx: {
    totalBalance: null,
    tokenListMap: {}
  },
  kucoin: {
    totalBalance: null,
    tokenListMap: {}
  },
  // userInfo: {},
  // keyStore: '',
  sysConfig: {

  }
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
      return { ...state, ...action.payload };
    case SETSYSCONFIG:
      return { ...state, sysConfig:action.payload };
    default:
      return state;
  }
};
export default reducer;

// action creator
