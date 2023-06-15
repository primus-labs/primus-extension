import { SETSYSCONFIG } from '../actions';
import type { AssetsMap } from '@/components/DataSourceOverview/DataSourceItem';
import type { ExchangeMeta } from '@/config/constants';
import type { CredTypeItemType } from '@/components/Cred/CredItem';
import type { ExDatas } from '@/types/store';
import { DEFAULTDATASOURCEPOLLINGTIMENUM } from '@/config/constants';
import type { PROOFTYPEITEM } from '@/types/cred';

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
  exDatas: ExDatas;
  socialDatas: SocialDatas;
  userPassword: string;
  activeSourceType: string;
  filterWord: string;
  exSources: ExDatas;
  socialSources: SocialDatas;
  sourceUpdateFrequency: string;
  proofTypes: PROOFTYPEITEM[];
  credentials: CREDENTIALS;
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
  sourceUpdateFrequency: DEFAULTDATASOURCEPOLLINGTIMENUM,
  proofTypes: [
    {
      id: '1',
      credIdentifier: 'ASSETS_PROOF',
      credTitle: 'Assets Proof',
      credIntroduce: 'Proof of deposits, investment portfolios, etc.',
      credLogoUrl:
        'https://xuda-note.oss-cn-shanghai.aliyuncs.com/others/iconAssetsProof.svg',
      credDetails:
        'Proving you have a certain amount of assets, which may come from bank deposits or from a crypto exchange balance. PADO uses TLS-MPC to verify the authenticity of your data.',
      credProofContent: 'Balance of assets',
      credProofConditions: '["1000"]',
      display: 0,
      enabled: 0,
      simplifiedName: 'Asset',
    },
    {
      id: '2',
      credIdentifier: 'TOKEN_HOLDINGS',
      credTitle: 'Token Holdings',
      credIntroduce: 'Proof ownership of a specific amount of a kind of Token.',
      credLogoUrl:
        'https://xuda-note.oss-cn-shanghai.aliyuncs.com/others/iconTokenHoldings.svg',
      credDetails:
        'Proof that you hold a certain kind of TOKEN. PADO uses TLS-MPC to validate your data authenticity.',
      credProofContent: 'Hold this kind of Token',
      credProofConditions: '["USDT","LAT"]',
      display: 0,
      enabled: 0,
      simplifiedName: 'Token',
    },
    {
      id: '3',
      credIdentifier: 'QUALIFICATIONS',
      credTitle: 'Qualifications',
      credIntroduce: 'Proof user level or verification status.',
      credLogoUrl:
        'https://xuda-note.oss-cn-shanghai.aliyuncs.com/others/iconQualifications.svg',
      credDetails: 'xxx',
      credProofContent: 'xxx',
      credProofConditions: 'xxx',
      display: 0,
      enabled: 1,
      simplifiedName: 'Qualification',
    },
  ],
  credentials: {},
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
      console.log('setSourceUpdateFrequency', action.payload);
      return { ...state, sourceUpdateFrequency: action.payload };
    case SETSYSCONFIG:
      return { ...state, sysConfig: action.payload };
    default:
      return state;
  }
};

export default reducer;

// action creator
