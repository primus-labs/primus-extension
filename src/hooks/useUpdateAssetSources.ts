import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useSelector } from 'react-redux';
import { DATASOURCEMAP } from '@/utils/constants';
import type { UserState } from '@/store/reducers';
import {postMsg} from '@/utils/utils'
type ExKeysStorages = {
  [propName: string]: any;
};
type queryObjType = {
  [propName: string]: any;
};
const useUpdateAssetSources = (flag = false) => {
  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );
  const [queryObj, setQueryObj] = useState<queryObjType>();
  const loading = useMemo(() => {
    const len = (queryObj && Object.keys(queryObj).length) || 0;
    if (queryObj && len > 0) {
      const flag = Object.values(queryObj).every((i) => i);
      // console.log(23333666, queryObj, 'loading:', !flag);
      return !flag;
    } else {
      return false;
    }
  }, [queryObj]);
  const fetchExDatas = useCallback(async (name?:string) => {
    const sourceNameList = name? [name]: Object.keys(DATASOURCEMAP).filter(
      (i) => DATASOURCEMAP[i].type === 'Assets'
    );
    const exCipherKeys = sourceNameList.map(i => `${i}cipher`)
    let res: ExKeysStorages = await chrome.storage.local.get(exCipherKeys)
    const list = Object.keys(res).map(i => {
      const exName = i.split('cipher')[0]
      setQueryObj((obj) => ({ ...obj, [exName]: undefined }));
      return exName
    })
    list.forEach(async (item ) => {
      const reqType = `set-${item}`;
      const msg: any = {
        fullScreenType: 'networkreq',
        type: reqType,
        params: {},
      };
      postMsg(padoServicePort,msg)
      console.log(`page_send:${reqType} request`);
    })
 
    // const padoServicePortListener = async function (message: any) {
    //   const {resType, res} = message
    //   if (resType?.startsWith(`set-`)  && res) {
    //     console.log(`page_get:${resType}:`, message.res);
    //     const name = resType.split('-')[1]
    //     setQueryObj(obj => ({...obj,[name]: true}))
    //   }
    //   // padoServicePort.onMessage.removeListener(padoServicePortListener);
    // };
    // padoServicePort.onMessage.addListener(padoServicePortListener);
  }, [padoServicePort]);
  useEffect(() => {
    // if (flag) {
      const padoServicePortListener = async function (message: any) {
        const {resType, res} = message
        if (resType?.startsWith(`set-`)) {
          console.log(`page_get:${resType}:`, message.res);
          const name = resType.split('-')[1]
          setQueryObj(obj => ({...obj,[name]: true}))
        }
        // TODO request fail
        // padoServicePort.onMessage.removeListener(padoServicePortListener);
      };
      padoServicePort.onMessage.addListener(padoServicePortListener);
    // }
    
  }, [padoServicePort.onMessage]);

  return [loading, fetchExDatas];
};

export default useUpdateAssetSources;
