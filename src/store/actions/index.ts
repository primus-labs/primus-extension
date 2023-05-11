
import { DATASOURCEMAP } from '@/utils/constants';
import type { ExchangeMeta } from '@/utils/constants';
import type {DataSourceStorages} from '@/pages/DataSourceOverview'
import { getCurrentDate } from '@/utils/utils';
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

export const setSysConfigAction = (data: object) => ({
    type: SETSYSCONFIG,
    payload: data
  })
export const setSocialDataAction = (values: object) => ({
  type: SETSOCIALDATA,
  payload: values
})


export const setExchangeData = (values: object) => ({
      type: 'SETEXCHAGEDATA',
      payload: values,
    })

export const initExDataAsync = () => {
  return async (dispatch: any) => {
    const sourceNameList = Object.keys(DATASOURCEMAP).filter(i => DATASOURCEMAP[i].type === 'Assets')
    const res: DataSourceStorages = await chrome.storage.local.get(sourceNameList);
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
      setExchangeData(exDataMap)
    );
  };
};
export const setExDataAsync = (message: ExchangeNetworkReq) => {
  return async (dispatch: any) => {
    const { name, apiKey, secretKey, passphase } = message;
    const exchangeInfo: ExchangeMeta =
      DATASOURCEMAP[name as keyof typeof DATASOURCEMAP];
    const constructorF = exchangeInfo.constructorF;
    const ex = new constructorF({ apiKey, secretKey, passphase });
    await ex.getInfo();
    // console.log('setExDataAsync',  name,ex);
      dispatch(
        setExchangeData({
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
    const res: DataSourceStorages = await chrome.storage.local.get(sourceNameList);
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
      setSocialDataAction(exDataMap)
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