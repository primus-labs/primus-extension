// import { getSysConfig } from './../../services/config';
// import { getSingleStorageSyncData, getMutipleStorageSyncData } from '@/utils/utils'
import { DATASOURCEMAP } from '@/utils/constants';
import type { ExchangeMeta } from '@/utils/constants';
// export const SETKEYSTORE = 'SETKEYSTORE';
// export const SETUSERINFO = 'SETUSERINFO';
// export const SETALLSTORAGE = 'SETALLSTORAGE';
export const SETEXCHAGEDATA = 'SETEXCHAGEDATA';
export const SETSYSCONFIG = 'SETSYSCONFIG'
export const SETSOCIALDATA = 'SETSOCIALDATA'

export const getSysConfigAction = (data: object) => ({
    type: SETSYSCONFIG,
    payload: data
  })
export const getSocialDataAction = (data: object) => ({
  type: SETSOCIALDATA,
  payload: data
})
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
export const getExchangeData = (values: object) => {
  return {
    type: 'SETEXCHAGEDATA',
    payload: values,
  };
};
type ExchangeNetworkReq = {
  name: string;
  apiKey: string;
  secretKey: string;
  passphase?: string;
};
export const getExchangeDataAsync = (message: ExchangeNetworkReq) => {
  return async (dispatch: any) => {
    const { name, apiKey, secretKey, passphase } = message;
    const exchangeInfo: ExchangeMeta =
      DATASOURCEMAP[name as keyof typeof DATASOURCEMAP];
    const constructorF = exchangeInfo.constructorF;
    const ex = new constructorF({ apiKey, secretKey, passphase });
    await ex.getInfo();
    console.log('exchange info', ex);
    dispatch(
      getExchangeData({
        [name]: {
          totalBalance: ex.totalAccountBalance,
          tokenListMap: ex.totalAccountTokenMap,
        },
      })
    );
  };
};

export const getSocialDataAsync = (message: ExchangeNetworkReq) => {
  return async (dispatch: any) => {
    // const { name, apiKey, secretKey, passphase } = message;
    // const exchangeInfo: ExchangeMeta =
    //   DATASOURCEMAP[name as keyof typeof DATASOURCEMAP];
    // const constructorF = exchangeInfo.constructorF;
    // const ex = new constructorF({ apiKey, secretKey, passphase });
    // await ex.getInfo();
    // console.log('exchange info', ex);
    // dispatch(
    //   getSocialData({
    //     [name]: {
    //       totalBalance: ex.totalAccountBalance,
    //       tokenListMap: ex.totalAccountTokenMap,
    //     },
    //   })
    // );
  };
};