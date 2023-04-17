import React, {useState, useEffect, useCallback, useMemo, useRef} from 'react'
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
type queryObjType = {
  [propName: string]: any;
}
const useUpdateAssetSources = (flag=false) => {
  const dispatch: Dispatch<any> = useDispatch()
  const padoServicePort = useSelector((state:UserState) => state.padoServicePort)
  const [queryObj, setQueryObj] = useState<queryObjType>({})
  const loading = useMemo(() => {
    const len = Object.keys(queryObj).length
    if(len > 0) {
      const flag = Object.values(queryObj).every(i => i)
      console.log(23333666,queryObj, 'loading:',!flag)
      return !flag
    } else {
      return false
    }
  },[queryObj] )
  
  const fetchExDatas = useCallback(async () => {
    setQueryObj({})
    const sourceNameList = Object.keys(DATASOURCEMAP).filter(i => DATASOURCEMAP[i].type === 'Assets')
    sourceNameList.forEach(async item => {
      const exInfoKey = `${item}cipher`
      let res: ExKeysStorages = await getMutipleStorageSyncData([exInfoKey]);
      if (res[exInfoKey]) {
        setQueryObj(obj => ({...obj,[item]: undefined}))
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
    // console.log('$$$$addListerner')
      const padoServicePortListener = async function (message: any) {
        const { resType, res } = message
        const lowerCaseSourceName:string = resType?.split('-')[1]
        if (resType?.startsWith(`getKey-` ) && res) {
          console.log(`page_get:${resType}:`, res);
          if(!queryObj[lowerCaseSourceName]) {
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
          }
        }else if (resType?.startsWith(`setData-`)) {
          console.log(`page_get:${resType}:`, res);
          setQueryObj(obj => ({...obj,[lowerCaseSourceName]: true}))
          if (res) {
            // console.log('setData successfully')
          }
        }
      }
      padoServicePort.onMessage.addListener(padoServicePortListener)
  },[ dispatch, padoServicePort])
  return [loading,fetchExDatas]
}

export default useUpdateAssetSources