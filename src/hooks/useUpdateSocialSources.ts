import React, {useEffect,useState, useCallback, useMemo} from 'react'
import {useSelector} from 'react-redux'
import { DATASOURCEMAP } from '@/utils/constants'
import { getMutipleStorageSyncData } from '@/utils/utils'
import type { UserState } from '@/store/reducers'
import useAuthorization from '@/hooks/useAuthorization'

type ExKeysStorages = {
  [propName: string]: any;
}
type queryObjType = {
  [propName: string]: any;
};
const useUpdateSocialSources = () => {
  const authorize = useAuthorization()
  const padoServicePort = useSelector((state:UserState) => state.padoServicePort)
  const [queryObj, setQueryObj] = useState<queryObjType>();
  const loading = useMemo(() => {
    const len = (queryObj && Object.keys(queryObj).length) || 0;
    if (queryObj && len > 0) {
      const flag = Object.values(queryObj).every((i) => i);
      // console.log(23333555, queryObj, 'loading:', !flag);
      return !flag;
    } else {
      return false;
    }
  }, [queryObj]);
  const fetchSocialDatas = useCallback(async () => {
    const sourceNameList = Object.keys(DATASOURCEMAP).filter(
      (i) => DATASOURCEMAP[i].type === 'Social'
    );
    let res: ExKeysStorages = await getMutipleStorageSyncData(sourceNameList);
   
    let list:string[] = []
    Object.keys(res).forEach(i => {
      const {timestamp} = JSON.parse(res[i])
      const now = + new Date()
      // refresh data more than an hour since the last time it was obtained
      if(i === 'twitter' && (now - timestamp) > 1000*60*60) {
        setQueryObj((obj) => ({ ...obj, [i]: undefined }));
        list.push(i)
      }
    })
    list.forEach(async (item ) => {
      const uniqueId = JSON.parse(res[item]).uniqueId
      const msg: any = {
        fullScreenType: 'padoService',
        reqMethodName: `refreshAuthData`,
        params: {
          uniqueId,
          source: item.toUpperCase()
        }
      }
      padoServicePort.postMessage(msg)
      console.log(`page_send:refreshAuthData request`);
    })

    const padoServicePortListener = async function (message: any) {
      const {resMethodName, res, params} = message
      if (resMethodName === 'refreshAuthData') {
        console.log(`page_get:${resMethodName}:`, res);
        if (res) {
          const lowerCaseSourceName = params?.source.toLowerCase()
          setQueryObj(obj => ({...obj,[lowerCaseSourceName]: true}))
        }else {
          if (params?.mc === 'UNAUTHORIZED_401') {
            authorize(params?.source)
          }
        }
      }
      // padoServicePort.onMessage.removeListener(padoServicePortListener);
    };
    padoServicePort.onMessage.addListener(padoServicePortListener);
    }, [ padoServicePort, authorize])
     
  return [loading,fetchSocialDatas]
}

export default useUpdateSocialSources