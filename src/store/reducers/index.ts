
import { SETEXCHAGEDATA, SETSYSCONFIG, SETSOCIALDATA } from '../actions';
import type  {AssetsMap} from '@/components/DataSourceOverview/DataSourceItem'
import type {ExchangeMeta} from '@/utils/constants'
export type ExInfo = {
  date: string;
  apiKey: string;
  totalBalance: string;
  tokenListMap: AssetsMap;
  exUserId?: string;
  label?: string;
};
type SysConfigInfo = {
  [propName: string]: any
}
type ExDatas = {
  [propName: string]: ExInfo & ExchangeMeta
}
type SocialDatas = {
  [propName: string]: any
}
export type UserState = {
  padoServicePort: chrome.runtime.Port;
  sysConfig: SysConfigInfo;
  exDatas: ExDatas;
  socialDatas: SocialDatas;
  userPassword: string;
  activeSourceType: string;
  filterWord: string;
  exSources: ExDatas;
  socialSources: SocialDatas;
  baseValueArr: string[];
};

// initial state
const initState = {
  padoServicePort: chrome.runtime.connect({ name: 'fullscreen' + new Date() }),
  sysConfig: {},
  exDatas: {},
  socialDatas: {},
  userPassword: undefined,
  activeSourceType: 'All',
  filterWord: undefined,
  exSources: {},
  socialSources: {},
  baseValueArr: ['1000'],
};

// reducer
const reducer:any = function (state = initState, action: any) {
  switch (action.type) {
    case 'setPort':
      const newPort = chrome.runtime.connect({ name: 'fullscreen'+new Date() })
      return { ...state, padoServicePort: newPort };
    case 'setUserPassword':
      return { ...state, userPassword: action.payload };
    case 'setActiveSourceType':
      return { ...state, activeSourceType: action.payload };
    case 'setFilterWord':
      return { ...state, filterWord: action.payload };
    case 'setExSources':
      return { ...state, exSources: action.payload};
    case 'setSocialSources':
      return { ...state, socialSources: action.payload};
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
