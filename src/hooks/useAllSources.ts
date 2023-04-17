import React, {useCallback} from 'react'
import useExSources from '@/hooks/useExSources'
import useSocialSources from '@/hooks/useSocialSources'

const useAllSources = () => {
  const [exS, exRefreshF] = useExSources()
  const [socialS,socialRefreshF] = useSocialSources()
  const refreshF = useCallback(() => {
    (exRefreshF as () => void)();
    (socialRefreshF as () => void)()
  }, [exRefreshF, socialRefreshF])
  const allS = {...exS,...socialS}
  return [allS, refreshF]
}

export default useAllSources