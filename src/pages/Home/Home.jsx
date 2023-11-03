import React, { useState, useEffect, memo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useSelector, useDispatch } from 'react-redux';

import AsideAnimation from '@/components/Layout/AsideAnimation';
import PButton from '@/components/PButton'
import { postMsg } from '@/utils/utils';
import { requestSignTypedData } from '@/services/wallets/utils';
import { getUserIdentity } from '@/services/api/user';
import { initWalletAddressActionAsync } from '@/store/actions';
import './home.scss';

const Home = memo(() => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const padoServicePort = useSelector((state) => state.padoServicePort);

  const handleClickStart = useCallback(() => {
    const padoServicePortListener = async function (message) {
      if (message.resMethodName === 'create') {
        console.log('page_get:create:', message.res);
        if (message.res) {
          const { privateKey } = await chrome.storage.local.get(['privateKey']);
          const privateKeyStr = privateKey?.substr(2);
          // const address = message.res.toLowerCase();
          const address = message.res;
          const timestamp = +new Date() + '';
          await chrome.storage.local.set({ padoCreatedWalletAddress: address });
          await dispatch(initWalletAddressActionAsync());

          try {
            const signature = await requestSignTypedData(
              privateKeyStr,
              address,
              timestamp
            );
            const res = await getUserIdentity({
              signature,
              timestamp,
              address,
            });
            const { rc, result } = res;
            if (rc === 0) {
              const { bearerToken, identifier } = result;
              await chrome.storage.local.set({
                userInfo: JSON.stringify({
                  id: identifier,
                  token: bearerToken,
                }),
              });
              navigate('/events');
            }
          } catch (e) {
            console.log('handleClickStart error', e);
          }
        }
      }
    };
    padoServicePort.onMessage.addListener(padoServicePortListener);

    const msg = {
      fullScreenType: 'wallet',
      reqMethodName: 'create',
      params: {},
    };
    postMsg(padoServicePort, msg);
  }, [padoServicePort]);

  const checkActiveStep = useCallback(async () => {
    let { userInfo } = await chrome.storage.local.get(['userInfo']);
    if (userInfo) {
      navigate('/lock');
      return true;
    }
    return false;
  }, [navigate]);

  useEffect(() => {
    checkActiveStep();
  }, [checkActiveStep]);

  return (
    <div className="pageIndex pageHome">
      <main className="appContent">
        <AsideAnimation />
        <article>
          <section className="descWrapper">
            <h1>Welcome to PADO Attestation Service</h1>
            <p>Bringing all internet data into smart contracts.</p>
          </section>
          <PButton
            text="Click here to start"
            suffix={<i className="iconfont icon-rightArrow"></i>}
            onClick={handleClickStart}
          />
        </article>
      </main>
    </div>
  );
});
export default Home;
