import React, { useState, useEffect, memo, useCallback } from 'react';
import Slider from '@/newComponents/Events/Slider';
import Overview from '@/newComponents/Home/Overview';
import Support from '@/newComponents/Home/Support';
import DataSources from '@/newComponents/Home/DataSources';
import WebComeBackDialog from '@/newComponents/Settings/WebComeBack';
// import DataSourcesModule from '@/newComponents/Home/DataSourcesModule';
import AttestationsModule from '@/newComponents/Home/AttestationsModule';
import './index.scss';
import { useSelector } from 'react-redux';
import { UserState } from '@/types/store';
import useCreateAccount from '@/hooks/useCreateAccount';
import useListener from '@/hooks/useListener';
import { postMsg } from '@/utils/utils';

const Home = memo(() => {
  const [showInputPasswordDialog, setShowInputPasswordDialog] =
    useState<boolean>(false);
  const userInfo = useSelector((state: UserState) => state.userInfo);

  const checkIfHadSetPwd = useCallback(async () => {
    let { keyStore } = await chrome.storage.local.get(['keyStore']);
    const hasInputPsw = sessionStorage.getItem('hasInputPsw');
    setShowInputPasswordDialog(!!keyStore && !hasInputPsw);
  }, []);

  useEffect(() => {
    checkIfHadSetPwd();
  }, [checkIfHadSetPwd]);

  const { createAccountFn } = useCreateAccount();
  useListener();
  const padoServicePort = useSelector((state: any) => state.padoServicePort);

  const initAccount = useCallback(async () => {
    const { keyStore, padoCreatedWalletAddress, privateKey, userInfo } =
      await chrome.storage.local.get([
        'keyStore',
        'padoCreatedWalletAddress',
        'privateKey',
        'userInfo',
      ]);
    if (!privateKey && !keyStore && !userInfo) {
      const msg = {
        fullScreenType: 'wallet',
        reqMethodName: 'create',
        params: {},
      };
      postMsg(padoServicePort, msg);
    }
    if (privateKey && !userInfo) {
      createAccountFn();
    }
  }, []);

  useEffect(() => {
    initAccount();
  }, [initAccount]);
  return (
    <div className="pageHome">
      <div className="pageContent">
        {!userInfo?.token && (
          <div className="noAccountTip">
            <div className="left">
              <i className="iconfont icon-iconInfoColorful"></i>
              <p>
                Waiting for the Primus serial number to be bound. The Primus
                extension will be available in a few seconds...
              </p>
            </div>
            {/* <div className="right">
              <PClose
                onClick={() => {
                  handleClose(i);
                }}
              />
            </div> */}
          </div>
        )}
        <Slider />
        <div className="pRow">
          <Overview />
          <Support />
        </div>
        <DataSources />
        <div className="pRow">
          {/* <DataSourcesModule /> */}
          <AttestationsModule />
        </div>
      </div>
      {showInputPasswordDialog && (
        <WebComeBackDialog
          onSubmit={() => {}}
          showDialog={setShowInputPasswordDialog}
        />
      )}
    </div>
  );
});
export default Home;
