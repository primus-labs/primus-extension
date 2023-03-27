// import {
//   getSingleStorageSyncData,
//   getMutipleStorageSyncData,
// } from '@/utils/utils';
// import { SETKEYSTORE, SETUSERINFO, SETALLSTORAGE } from '../actions';
import { SETBALANCEDATA } from '../actions';

// initial state
const initState = {
  padoServicePort: chrome.runtime.connect({ name: 'padoService' }),
  networkreqPort: chrome.runtime.connect({ name: 'networkreq' }),
  binance: {
    totalBalance: null,
    tokenListMap: {}
  },
  // userInfo: {},
  // keyStore: '',
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
    case SETBALANCEDATA:
      return { ...state, ...action.payload };
    default:
      return state;
  }
};
export default reducer;

// action creator
