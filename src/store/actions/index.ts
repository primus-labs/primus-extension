// import { getSingleStorageSyncData, getMutipleStorageSyncData } from '@/utils/utils'
import Binance from '@/services/exchange/binance';
// export const SETKEYSTORE = 'SETKEYSTORE';
// export const SETUSERINFO = 'SETUSERINFO';
// export const SETALLSTORAGE = 'SETALLSTORAGE';
export const SETBALANCEDATA = 'SETBALANCEDATA';

const networkreq = {
  'exchange-binance': Binance,
};
// export const  getKeyStore = (data: string) => ({
//   type: SETKEYSTORE,
//   payload: data
// })
// export const  getUserInfo = (data: object) => ({
//   type: SETUSERINFO,
//   payload: data
// })
// export const  getAllStorage = (values: object) => {
//   return ({
//     type: SETALLSTORAGE,
//     payload: values
//   })
// }

// export const  getkeyStoreAsync = () => {
//   return async (dispatch) => {
//     const keyStore = await getSingleStorageSyncData('keyStore');
//     dispatch(getKeyStore(keyStore))
//   }
// }
// export const  getUserInfoAsync = () => {
//   return async (dispatch) => {
//     let userInfo = await getSingleStorageSyncData('userInfo');
//     if(userInfo) {
//       userInfo = JSON.parse(userInfo)
//     }
//     dispatch(getUserInfo(userInfo))
//   }
// }
// export const  getAllStorageAsync = () => {
//   return async (dispatch) => {
//     let {userInfo, keyStore} = await getMutipleStorageSyncData(['userInfo','keyStore']);
//     if(userInfo) {
//       userInfo = JSON.parse(userInfo)
//     }
//     dispatch(getAllStorage({userInfo, keyStore}))
//   }
// }
export const  getBinanceData = (values: object) => {
  return ({
    type: 'SETBALANCEDATA',
    payload: values
  })
}
type ExchangeNetworkReq = {
  type: string;
  params: any
}
export const getBinanceDataAsync = (message: ExchangeNetworkReq) => {
  return async (dispatch: any) => {
    const {
      type,
      params: { apiKey, secretKey },
    } = message;
    const ex = new networkreq[type as keyof typeof networkreq]({ apiKey, secretKey });
    await ex.getInfo();
    console.log('binance account info', ex);
    dispatch(getBinanceData({
      binance: {
        totalBalance: ex.totalAccountBalance, 
        tokenListMap: ex.totalAccountTokenMap
      }
    }))
  }
}