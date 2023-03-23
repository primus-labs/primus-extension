// import {
//   getSingleStorageSyncData,
//   getMutipleStorageSyncData,
// } from '@/utils/utils';
// import { SETKEYSTORE, SETUSERINFO, SETALLSTORAGE } from '../actions';
// initial state
const initState = {
  padoServicePort: chrome.runtime.connect({ name: 'padoService' }),
  // userInfo: {},
  // keyStore: '',
};

// reducer
const reducer:any = async function (state = initState, action: any) {
  // switch (action.type) {
    // case SETKEYSTORE:
    //   return { ...state, keyStore: action.payload };
    // case SETUSERINFO:
    //   return { ...state, userInfo: action.payload };
    // case SETALLSTORAGE:
    //   return { ...state, ...action.payload };
  //   default:
  //     return state;
  // }
  return state;
};
export default reducer;

// action creator
