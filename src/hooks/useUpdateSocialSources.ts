import React, {useEffect,useState, useCallback, useMemo} from 'react'
import type { Dispatch } from 'react';
import {useSelector, useDispatch} from 'react-redux'
import { DATASOURCEMAP } from '@/utils/constants'
import { getMutipleStorageSyncData } from '@/utils/utils'
import type { UserState } from '@/store/reducers'
import { setSocialDataAction } from '@/store/actions'
import useAuthorization from '@/hooks/useAuthorization'

type ExKeysStorages = {
  [propName: string]: any;
}

const useUpdateSocialSources = () => {
  const authorize = useAuthorization()
  const dispatch: Dispatch<any> = useDispatch()
  const padoServicePort = useSelector((state:UserState) => state.padoServicePort)
  const [queryNum, setQueryNum] = useState(0)
  const [queriedNum, setQueriedNum] = useState(0)
  const loading = useMemo(() => {
      return queryNum !== queriedNum
  },[queryNum, queriedNum] )
  const fetchSocialDatas = useCallback(async () => {
      const sourceNameList = Object.keys(DATASOURCEMAP).filter(i => DATASOURCEMAP[i].type === 'Social')
      sourceNameList.forEach(async item => {
        let res: ExKeysStorages = await getMutipleStorageSyncData([item]);
        if (res[item]) {
          setQueryNum(num => num+1)
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
          const padoServicePortListener = async function (message: any) {
            console.log(`page_get:${message.resMethodName}:`, res);
            setQueriedNum(num => num+1)
            if (message.res) {
              await dispatch(
                setSocialDataAction(res.params)
              );
            } else {
              if (message.params?.mc === 'UNAUTHORIZED_401') {
                authorize(message.params?.source)//Reauthorize TODO
              }
            }
          }
          padoServicePort.onMessage.addListener(padoServicePortListener)
        }
      })
    }, [dispatch, padoServicePort, authorize])
    
  return [loading,fetchSocialDatas]
}

export default useUpdateSocialSources