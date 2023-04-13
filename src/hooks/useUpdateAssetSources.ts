import React, {useState, useEffect, useCallback, useMemo} from 'react'
import type { Dispatch } from 'react';
import {useSelector, useDispatch} from 'react-redux'
import { DATASOURCEMAP } from '@/utils/constants'
import { getMutipleStorageSyncData } from '@/utils/utils'
import type { UserState } from '@/store/reducers'
import { setExDataAsync } from '@/store/actions'
import store from '@/store/index';

type ExKeysStorages = {
  [propName: string]: any;
}

const useUpdateAssetSources = () => {

  const dispatch: Dispatch<any> = useDispatch()
  const padoServicePort = useSelector((state:UserState) => state.padoServicePort)
  const [queryNum, setQueryNum] = useState(0)
  const [queriedNum, setQueriedNum] = useState(0)
  const loading = useMemo(() => {
    console.log(23333,queryNum, queriedNum)
      return queryNum !== queriedNum
  },[queryNum, queriedNum] )
  useEffect(() => {
      if((queryNum > 0 && queryNum === queriedNum) || queriedNum > queryNum) {
        setQueryNum(0)
        setQueriedNum(0)
      }
  },[queryNum, queriedNum] )
  const fetchExDatas = useCallback(async () => {
    const sourceNameList = Object.keys(DATASOURCEMAP).filter(i => DATASOURCEMAP[i].type === 'Assets')
    sourceNameList.forEach(async item => {
      const exInfoKey = `${item}cipher`
      let res: ExKeysStorages = await getMutipleStorageSyncData([exInfoKey]);
      if (res[exInfoKey]) {
        setQueryNum(num => num+1)
        const msg: any = {
          fullScreenType: 'networkreq',
          type: `getKey-${item}`,
          params: {}
        }
        padoServicePort.postMessage(msg)
        console.log(`page_send:getKey-${item} request`);
      }
    })
  }, [padoServicePort])
  useEffect(() => {
    const padoServicePortListener = async function (message: any) {
      const { resType, res } = message
      const lowerCaseSourceName = resType?.split('-')[1]
      if (resType?.startsWith(`getKey-` ) && res) {
        console.log(`page_get:${resType}:`, res);
        await dispatch(setExDataAsync(res))
        const msg2: any = {
          fullScreenType: 'networkreq',
          type: `setData-${lowerCaseSourceName}`,
          params: {
            ...res,
            exData: ((store.getState()) as UserState).exDatas[lowerCaseSourceName]
            // exData: exDatas[item] // TODO
          }
        }
        padoServicePort.postMessage(msg2)
      }else if (resType?.startsWith(`setData-`)) {
        console.log(`page_get:${resType}:`, res);
        setQueriedNum(num => num+1)
        if (res) {
          // console.log('setData successfully')
        }
      }
    }
    padoServicePort.onMessage.addListener(padoServicePortListener)
    return () => {
      padoServicePort.onMessage.removeListener(padoServicePortListener)
    }
  }, [dispatch, padoServicePort])
  
  return [loading,fetchExDatas]
}

export default useUpdateAssetSources