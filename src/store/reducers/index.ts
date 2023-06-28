import { SETSYSCONFIG } from '../actions';
import type { AssetsMap } from '@/components/DataSourceOverview/DataSourceItem';
import type { ExchangeMeta } from '@/config/constants';
import type { CredTypeItemType } from '@/components/Cred/CredItem';
import type { ExDatas } from '@/types/store';
import { DEFAULTDATASOURCEPOLLINGTIMENUM, DEFAULTCREDTYPELIST } from '@/config/constants';
import type { PROOFTYPEITEM } from '@/types/cred';
import type {UserInfoType} from '@/types/user'

export type ExInfo = {
  date: string;
  apiKey: string;
  totalBalance: string;
  tokenListMap: AssetsMap;
  exUserId?: string;
  label?: string;
  tradingAccountTokenAmountObj: object;
  spotAccountTokenMap: AssetsMap;
  tokenPriceMap: object;
};
type SysConfigInfo = {
  [propName: string]: any;
};

type SocialDatas = {
  [propName: string]: any;
};



type CREDENTIALS = {
  [propName: string]: CredTypeItemType;
};
export type UserState = {
  padoServicePort: chrome.runtime.Port;
  sysConfig: SysConfigInfo;
  userPassword: string;
  activeSourceType: string;
  filterWord: string;
  exSources: ExDatas;
  socialSources: SocialDatas;
  sourceUpdateFrequency: string;
  proofTypes: PROOFTYPEITEM[];
  credentials: CREDENTIALS;
  userInfo: UserInfoType;
};

// initial state
const initState = {
  padoServicePort: chrome.runtime.connect({ name: 'fullscreen' + new Date() }),
  sysConfig: {},
  userPassword: undefined,
  activeSourceType: 'All',
  filterWord: undefined,
  exSources: {},
  socialSources: {},
  sourceUpdateFrequency: DEFAULTDATASOURCEPOLLINGTIMENUM,
  proofTypes: DEFAULTCREDTYPELIST,
  credentials: {},
  userInfo: {}
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
    case 'setProofTypes':
      return { ...state, proofTypes: action.payload };
    case 'setCredentials':
      return { ...state, credentials: action.payload };
    case 'setSourceUpdateFrequency':
      return { ...state, sourceUpdateFrequency: action.payload };
    case 'setUserInfo':
      return { ...state, userInfo: action.payload};
    case SETSYSCONFIG:
      return { ...state, sysConfig: action.payload };
    default:
      return state;
  }
};

export default reducer;

// action creator
