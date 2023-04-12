// import { getSysConfig } from './../../services/config';
// import { getSingleStorageSyncData, getMutipleStorageSyncData } from '@/utils/utils'
import { DATASOURCEMAP } from '@/utils/constants';
import type { ExchangeMeta } from '@/utils/constants';
import type {DataSourceStorages} from '@/pages/DataSourceOverview'
import { getCurrentDate,getMutipleStorageSyncData } from '@/utils/utils';
// export const SETKEYSTORE = 'SETKEYSTORE';
// export const SETUSERINFO = 'SETUSERINFO';
// export const SETALLSTORAGE = 'SETALLSTORAGE';
export const SETEXCHAGEDATA = 'SETEXCHAGEDATA';
export const SETSYSCONFIG = 'SETSYSCONFIG'
export const SETSOCIALDATA = 'SETSOCIALDATA'
type ExchangeNetworkReq = {
  name: string;
  apiKey: string;
  secretKey: string;
  passphase?: string;
};

export const getSysConfigAction = (data: object) => ({
    type: SETSYSCONFIG,
    payload: data
  })
export const getSocialDataAction = (values: object) => ({
  type: SETSOCIALDATA,
  payload: values
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
export const getExchangeData = (values: object) => ({
      type: 'SETEXCHAGEDATA',
      payload: values,
    })

export const initExDataAsync = () => {
  return async (dispatch: any) => {
    const sourceNameList = Object.keys(DATASOURCEMAP).filter(i => DATASOURCEMAP[i].type === 'Assets')
    const res: DataSourceStorages = await getMutipleStorageSyncData(sourceNameList);
    const existExNames = sourceNameList.filter(item => res[item as keyof typeof res])
    const reduceF = (prev: any, curr: string) => {
      const exData = JSON.parse(res[curr])
      return {
        ...prev,
        [curr]:exData
      }
    }
    const exDataMap = existExNames.reduce(reduceF, {})
    console.log('initExDataAsync', exDataMap);
    dispatch(
      getExchangeData(exDataMap)
    );
  };
};
export const getExDataAsync = (message: ExchangeNetworkReq) => {
  return async (dispatch: any) => {
    const { name, apiKey, secretKey, passphase } = message;
    const exchangeInfo: ExchangeMeta =
      DATASOURCEMAP[name as keyof typeof DATASOURCEMAP];
    const constructorF = exchangeInfo.constructorF;
    const ex = new constructorF({ apiKey, secretKey, passphase });
    await ex.getInfo();
    console.log('getExDataAsync',  name,ex);
      dispatch(
        getExchangeData({
          [name]: {
            totalBalance: ex.totalAccountBalance,
            tokenListMap: ex.totalAccountTokenMap,
            apiKey,
            date: getCurrentDate(),
          },
        })
      );
  };
};

// TODO
export const initSocialDataAsync = () => {
  return async (dispatch: any) => {
    const sourceNameList = Object.keys(DATASOURCEMAP).filter(i => DATASOURCEMAP[i].type === 'Social')
    const res: DataSourceStorages = await getMutipleStorageSyncData(sourceNameList);
    const existExNames = sourceNameList.filter(item => res[item as keyof typeof res])
    const reduceF = (prev: any, curr: string) => {
      const exData = JSON.parse(res[curr])
      return {
        ...prev,
        [curr]:exData
      }
    }
    const exDataMap = existExNames.reduce(reduceF, {})
    console.log('initSocialDataAsync', exDataMap);
    dispatch(
      getExchangeData(exDataMap)
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