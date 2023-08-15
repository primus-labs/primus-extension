import React, { useCallback, useMemo} from 'react'
import useUpdateExSources from '@/hooks/useUpdateExSources'
import useUpdateSocialSources from '@/hooks/useUpdateSocialSources'

type ReturnPromiseType = ()=>Promise<void>
const useUpdateAllSources = (flag = false) => {
  const [fetchExDatasLoading, fetchExDatas] = useUpdateExSources()
  const [fetchSocialDatasLoading, fetchSocialDatas] = useUpdateSocialSources()
  const updating = useMemo(() => {
    return fetchExDatasLoading || fetchSocialDatasLoading
  },[fetchExDatasLoading , fetchSocialDatasLoading])
  const updateF = useCallback(() => {
    Promise.all([(fetchExDatas as ReturnPromiseType)(), (fetchSocialDatas as ReturnPromiseType)()])
  }, [fetchExDatas, fetchSocialDatas])
  
  return [updating,updateF]
}

export default useUpdateAllSources