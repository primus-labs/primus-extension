import React, { useState, useEffect, useCallback } from 'react';
import type { Dispatch } from 'react'
import { useSelector, useDispatch } from 'react-redux';

import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import PHeader from '@/components/PHeader';
import PageHeader from '@/components/PageHeader';
import BackgroundAnimation from '@/components/BackgroundAnimation'
import rem from '@/utils/rem.js';
import { setSysConfigAction } from '@/store/actions'
import useUpdateAllSources from '@/hooks/useUpdateAllSources'
import type { UserState } from '@/store/reducers'



import './index.sass'
type SysConfigItem = {
  configName: string;
  configValue: any
}
type GetSysConfigMsg = {
  resMethodName: string;
  res: SysConfigItem[]
}
type ObjectType = {
  [propName: string]: any
}
const Layout = () => {
  const dispatch: Dispatch<any> = useDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const refreshDataFlag = searchParams.get('refreshData')

  const padoServicePort = useSelector((state: UserState) => state.padoServicePort)
  const location = useLocation()
  const pathname = location.pathname
  const [updating, updateF] = useUpdateAllSources(true)

  // console.log('Layout', location.pathname)
  const getSysConfig = useCallback(async () => {
    const padoServicePortListener = async function (message: GetSysConfigMsg) {
      if (message.resMethodName === 'getSysConfig') {
        console.log("page_get:getSysConfig:", message.res);
        const configMap = message.res.reduce((prev: ObjectType, curr: SysConfigItem) => {
          const { configName, configValue } = curr
          prev[configName] = configValue
          return prev
        }, {})
        dispatch(setSysConfigAction(configMap))
      }
    }
    padoServicePort.onMessage.addListener(padoServicePortListener)
    padoServicePort.postMessage({
      fullScreenType: 'padoService',
      reqMethodName: 'getSysConfig',
    })
    console.log("page_send:getSysConfig request");
  }, [dispatch, padoServicePort])
  const initPage = async () => {
    const padoServicePortListener = async function (message: any) {
      if (message.resMethodName === 'queryUserPassword') {
        console.log("page_get:queryUserPassword:", message.res);
        if (!message.res) {
          navigate('/lock')
        } else {
          (updateF as () => void)();
        }
      }
      padoServicePort.onMessage.removeListener(padoServicePortListener)
    }
    padoServicePort.onMessage.addListener(padoServicePortListener)
    const msg = {
      fullScreenType: 'wallet',
      reqMethodName: 'queryUserPassword',
      params: {}
    }
    padoServicePort.postMessage(msg)
  }
  useEffect(() => {
    rem();
  }, []);

  useEffect(() => {
    getSysConfig()
  }, [getSysConfig]);
  useEffect(() => {
    if (pathname !== '/lock' || refreshDataFlag) {
      (updateF as () => void)();
    }
  }, [refreshDataFlag, updateF, pathname])
  // useEffect(() => {
  //   initPage()
  // }, []);
  return (
    <div className="pageApp">
      <BackgroundAnimation />
      <div className="pageLayer">
        {['/', '/lock'].includes(pathname) ?
          <header className="appHeader"><PHeader /></header> :
          <PageHeader />}
        <Outlet />
      </div>
    </div>
  );
};


export default Layout
