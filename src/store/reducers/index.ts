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

// initial state
const initState = {
  padoServicePort:chrome.runtime.connect({ name: 'fullscreen'}),
  sysConfig: {

  },
  exDatas: {},
  socialDatas: {}
};

// reducer
const reducer:any = function (state = initState, action: any) {
  switch (action.type) {
    case 'setPort':
      return { ...state, padoServicePort: chrome.runtime.connect({ name: 'fullscreen' }) };
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
