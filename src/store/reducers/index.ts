// import {
//   getSingleStorageSyncData,
//   getMutipleStorageSyncData,
// } from '@/utils/utils';
// import { SETKEYSTORE, SETUSERINFO, SETALLSTORAGE } from '../actions';
import { SETEXCHAGEDATA, SETSYSCONFIG, SETSOCIALDATA } from '../actions';
import type  {AssetsMap} from '@/components/DataSourceOverview/DataSourceItem'

export type ExInfo = {
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
  sysConfig: SysConfigInfo;
  exDatas: ExDatas,
  socialDatas: SocialDatas
}
let padoServicePort = chrome.runtime.connect({ name: 'fullscreen' })
const onDisconnectFullScreen = (port:chrome.runtime.Port) => {
  console.log('onDisconnectFullScreen store-port', port);
  padoServicePort = chrome.runtime.connect({ name: 'fullscreen' })
};
padoServicePort.onDisconnect.addListener(onDisconnectFullScreen);
// initial state
const initState = {
  padoServicePort,
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
      return { ...state, exDatas: {...state.exDatas, ...action.payload}};
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
