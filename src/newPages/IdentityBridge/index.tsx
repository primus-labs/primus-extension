import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { DATASOURCEMAP } from '@/config/dataSource';
import { setActiveConnectDataSource, setSocialSourcesAsync, setAttestLoading, setActiveAttestation, setThemeAction, initSetThemeAction } from '@/store/actions';
import CreateZkAttestation from '@/newComponents/ZkAttestation/CreateZkAttestation';
import useDataSource from '@/hooks/useDataSource';
import type { UserState } from '@/types/store';
import type { Dispatch } from 'react';
import { webDataSourceTemplate } from '@/config/webDataSourceTemplate';
import useMsgs from '@/hooks/useMsgs';
import { postMsg } from '@/utils/utils';
import { STARTOFFLINETIMEOUT } from '@/config/constants';
import { getZkPadoUrl, getProxyUrl } from '@/config/envConstants';
import { v4 as uuidv4 } from 'uuid';
import { eventReport } from '@/services/api/usertracker';
import WebTikTok from '@/services/webdata/websocial/webtiktok';
import empty from '@/assets/newImg/dataSource/empty.svg';
import PSwitch from '@/newComponents/PSwitch';
import WebXiaohongshu from '@/services/webdata/websocial/webxiaohongshu';
import iconDataSourceInstagram from '@/assets/img/iconDataSourceInstagram.svg';
import './index.scss';

const IdentityBridge = () => {
  const { addMsg, deleteMsg } = useMsgs();
  const [visibleAssetDialog, setVisibleAssetDialog] = useState<string>('');
  const [attestationPresets, setAttestationPresets] = useState<any>();
  const dispatch: Dispatch<any> = useDispatch();
  const webProofTypes = useSelector((state: UserState) => state.webProofTypes);
  const activeConnectDataSource = useSelector(
    (state: UserState) => state.activeConnectDataSource
  );
  const attestLoading = useSelector((state: UserState) => state.attestLoading);
  const padoServicePort = useSelector((state: UserState) => state.padoServicePort);
  const theme = useSelector((state: UserState) => state.theme);

  const {
    metaInfo: activeDataSouceMetaInfo,
    userInfo: activeDataSouceUserInfo,
    deleteFn: deleteDataSourceFn,
  } = useDataSource('tiktok');

  const {
    metaInfo: xiaohongshuMetaInfo,
    userInfo: xiaohongshuUserInfo,
    deleteFn: deleteXiaohongshuFn,
  } = useDataSource('xiaohongshu');

  const hasConnected = activeDataSouceUserInfo?.userName;
  const hasXiaohongshuConnected = xiaohongshuUserInfo?.userName;

  // Create a ref to store the port and track active state
  const portRef = useRef<any>(null);
  const isActiveRef = useRef<boolean>(true);

  useEffect(() => {
    dispatch(setSocialSourcesAsync());
  }, [dispatch]);

  // Listen for connection success and errors
  useEffect(() => {
    // Only create a new port if we don't have one
    if (!portRef.current) {
      const port = chrome.runtime.connect({ name: `fullscreen${new Date()}` });
      portRef.current = port;
      isActiveRef.current = true;

      port.onMessage.addListener((message: any) => {
        console.log('Port message received:', message);
        
        // Handle both TikTok and Xiaohongshu responses
        if ((message.resType === 'set-tiktok' || message.resType === 'set-xiaohongshu') && message.res === true) {
          console.log(`${message.resType} success message received`);
          
          if (isActiveRef.current) {
            // Reset loading state
            dispatch(setActiveConnectDataSource({ 
              loading: 0,
              dataSourceId: message.resType === 'set-tiktok' ? 'tiktok' : 'xiaohongshu'
            }));
            
            // Update social sources
            dispatch(setSocialSourcesAsync());
            
            const msgId = addMsg({
              type: 'success',
              title: `${message.resType === 'set-tiktok' ? 'TikTok' : 'Xiaohongshu'} Connected`,
              desc: `Your ${message.resType === 'set-tiktok' ? 'TikTok' : 'Xiaohongshu'} account has been successfully connected.`,
              showTime: 5000,
            });
            setTimeout(() => deleteMsg(msgId), 5000);
          }
        }
      });

      port.onDisconnect.addListener(() => {
        console.log('Port disconnected');
        isActiveRef.current = false;
        portRef.current = null;
      });
    }

    // Handle runtime messages
    const handleRuntimeMessage = (message: any) => {
      console.log('Runtime message received:', message);
      
      if (message.type === 'dataSourceWeb') {
        if (
          message.name === 'webRequestIsReady' && 
          message.params.isReady && 
          message.params.dataSource === 'tiktok'
        ) {
          console.log('Web request ready, sending start message');
          // Send start message when ready
          chrome.runtime.sendMessage({
            type: 'dataSourceWeb',
            name: 'start',
            operation: 'connect'
          });
        } else if (message.name === 'error' || message.name === 'stop') {
          console.log('Error or stop message received');
          if (isActiveRef.current) {
            dispatch(setActiveConnectDataSource({ 
              loading: 0,
              dataSourceId: 'tiktok'
            }));
            
            if (message.name === 'error') {
              const msgId = addMsg({
                type: 'error',
                title: 'Connection Failed',
                desc: message.params?.error || 'Failed to connect TikTok account. Please try again.',
                showTime: 5000,
              });
              setTimeout(() => deleteMsg(msgId), 5000);
            }
          }
        }
      }
    };

    chrome.runtime.onMessage.addListener(handleRuntimeMessage);

    // Only clean up when component is actually unmounting
    return () => {
      console.log('Component unmounting, cleaning up listeners');
      isActiveRef.current = false;
      chrome.runtime.onMessage.removeListener(handleRuntimeMessage);
      if (portRef.current) {
        portRef.current.disconnect();
        portRef.current = null;
      }
    };
  }, []); // Empty dependency array to prevent recreation

  // Update theme initialization
  useEffect(() => {
    if (!localStorage.getItem('colorTheme')) {
      localStorage.setItem('colorTheme', 'dark');
    }
    dispatch(initSetThemeAction());
  }, [dispatch]);

  const handleDelete = useCallback(async () => {
    await deleteDataSourceFn('tiktok');
    const msgId = addMsg({
      type: 'info',
      title: 'TikTok data deleted',
      showTime: 5000,
    });
    setTimeout(() => {
      deleteMsg(msgId);
    }, 5000);
    dispatch(setSocialSourcesAsync());
  }, [deleteDataSourceFn, addMsg, deleteMsg, dispatch]);

  const handleConnect = useCallback(async () => {
    console.log('Connect button clicked');
    if (activeConnectDataSource.loading === 1) {
      console.log('Already loading, returning');
      return;
    }

    console.log('Setting loading state');
    await dispatch(
      setActiveConnectDataSource({
        loading: 1,
        dataSourceId: 'tiktok'
      })
    );

    let currRequestObj = webProofTypes.find(
      (r: any) => r.dataSource === 'tiktok' && r.name === 'Account Ownership'
    );

    if (!currRequestObj) {
      currRequestObj = {
        dataSource: 'tiktok',
        jumpTo: 'https://www.tiktok.com',
        datasourceTemplate: {
          requests: [
            {
              name: 'first',
              url: 'https://www.tiktok.com/passport/web/account/info/',
              method: 'GET',
              headers: ['cookie'],
              cookies: ['sessionid']
            }
          ],
          responses: [
            {
              conditions: {
                status: 200
              }
            }
          ]
        }
      };
    }

    const msgId = addMsg({
      type: 'info',
      title: 'Connecting to TikTok',
      desc: 'Please log in to your TikTok account when prompted.',
      showTime: 10000,
    });
    setTimeout(() => deleteMsg(msgId), 10000);

    console.log('Sending init message');
    chrome.runtime.sendMessage({
      type: 'dataSourceWeb',
      name: 'init',
      operation: 'connect',
      params: {
        ...currRequestObj,
      },
    });
  }, [dispatch, activeConnectDataSource, webProofTypes, addMsg, deleteMsg]);

  const handleAttest = useCallback(async () => {
    if (attestLoading === 1) {
      addMsg({
        type: 'info',
        title: 'Cannot process now',
        desc: 'Another attestation task is running. Please try again later.',
      });
      return;
    }

    await chrome.storage.local.remove([
      'activeRequestAttestation',
      'padoZKAttestationJSSDKBeginAttest',
      'beginAttest',
      'getAttestationResultRes'
    ]);

    const requestid = uuidv4();
    let currRequestObj = webProofTypes.find(
      (r: any) => r.dataSource === 'tiktok' && r.name === 'Account Ownership'
    );

    if (!currRequestObj) {
      currRequestObj = {
        dataSource: 'tiktok',
        jumpTo: 'https://www.tiktok.com',
        datasourceTemplate: {
          requests: [
            {
              name: 'first',
              url: 'https://www.tiktok.com/passport/web/account/info/',
              method: 'GET',
              headers: ['cookie'],
              cookies: ['sessionid']
            }
          ]
        }
      };
    }

    dispatch(setAttestLoading(1));
    dispatch(setActiveAttestation({ 
      attestationType: 'Humanity Verification',
      dataSourceId: 'tiktok',
      verificationContent: 'Account ownership',
      verificationValue: 'Account owner',
      fetchType: 'Web',
      loading: 1 
    }));

    const eventInfo = {
      eventType: 'ATTESTATION_NEXT',
      rawData: {
        source: 'tiktok',
        order: '1',
        requestid
      }
    };
    eventReport(eventInfo);

    chrome.runtime.sendMessage({
      type: 'dataSourceWeb',
      name: 'init',
      operation: 'attest',
      params: {
        ...currRequestObj,
        requestid,
        attestationType: 'Humanity Verification',
        fetchType: 'Web',
        uiTemplate: {
          condition: 'Account owner',
          proofContent: 'Account ownership',
          successMsg: 'Account ownership verified',
          failedMsg: 'Account ownership verification failed'
        }
      }
    });

  }, [attestLoading, addMsg, webProofTypes, activeDataSouceUserInfo, dispatch]);

  const handleCloseAssetDialog = useCallback(() => {
    setVisibleAssetDialog('');
  }, []);

  const handleSubmitAssetDialog = useCallback(() => {
    setVisibleAssetDialog('');
  }, []);

  const isLoading = activeConnectDataSource.loading === 1 && activeConnectDataSource.dataSourceId === 'tiktok';

  const handleXiaohongshuConnect = useCallback(async () => {
    if (activeConnectDataSource.loading === 1) {
      return;
    }

    await dispatch(
      setActiveConnectDataSource({
        loading: 1,
        dataSourceId: 'xiaohongshu'
      })
    );

    let currRequestObj = webProofTypes.find(
      (r: any) => r.dataSource === 'xiaohongshu' && r.name === 'Account Ownership'
    );

    if (!currRequestObj) {
      currRequestObj = {
        dataSource: 'xiaohongshu',
        jumpTo: 'https://www.xiaohongshu.com',
        datasourceTemplate: {
          requests: [
            {
              name: 'first',
              url: 'https://edith.xiaohongshu.com/api/sns/web/v2/user/me',
              method: 'GET',
              headers: ['cookie'],
              cookies: ['web_session']
            }
          ],
          responses: [
            {
              conditions: {
                status: 200
              }
            }
          ]
        }
      };
    }

    const msgId = addMsg({
      type: 'info',
      title: 'Connecting to Xiaohongshu',
      desc: 'Please log in to your Xiaohongshu account when prompted.',
      showTime: 10000,
    });
    setTimeout(() => deleteMsg(msgId), 10000);

    chrome.runtime.sendMessage({
      type: 'dataSourceWeb',
      name: 'init',
      operation: 'connect',
      params: {
        ...currRequestObj,
        uiTemplate: {
          condition: 'Account owner',
          proofContent: 'Account ownership',
          successMsg: 'Account ownership verified',
          failedMsg: 'Account ownership verification failed'
        }
      },
    });
  }, [dispatch, activeConnectDataSource, webProofTypes, addMsg, deleteMsg]);

  const handleXiaohongshuDelete = useCallback(async () => {
    await deleteXiaohongshuFn('xiaohongshu');
    const msgId = addMsg({
      type: 'info',
      title: 'Xiaohongshu data deleted',
      showTime: 5000,
    });
    setTimeout(() => {
      deleteMsg(msgId);
    }, 5000);
    dispatch(setSocialSourcesAsync());
  }, [deleteXiaohongshuFn, addMsg, deleteMsg, dispatch]);

  return (
    <div className={`pageContent ${theme}`}>
      <div className="homeDataSources">
        <div className="titleSection">
          <div className="titleContent">
            <div className="title">Verify your usernames</div>
            <div className="description">
              Follow your TikTok accounts on Xiaohongshu. First verify your TikTok user handle.
            </div>
          </div>
          <div className="switchWrapper">
            <PSwitch />
          </div>
        </div>
        <ul className="dataSourceItems">
          <li className={`dataSourceItem ${theme}`}>
            <div className="mainInfo">
              <div className="left">
                <img src={DATASOURCEMAP.tiktok.icon} alt="" className="sourceIcon" />
                <div className="breif">
                  <div className="top">
                    <div className="name">TikTok</div>
                  </div>
                  <div className="bottom">
                    <div className="balance">
                      {hasConnected ? `@${activeDataSouceUserInfo.userName}` : 'Not Connected'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="right">
                <div className="tokensWrapper">
                  {hasConnected ? (
                    <button
                      onClick={handleDelete}
                      className={`deleteBtn ${theme}`}
                      title="Delete connection"
                    >
                      <i className="iconfont icon-iconDelete"></i>
                    </button>
                  ) : (
                    <button
                      onClick={handleConnect}
                      className={`PButton secondary connectBtn ${theme}`}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="loading-spinner"></div>
                      ) : (
                        'Connect TikTok'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </li>

          <li className={`dataSourceItem ${theme}`}>
            <div className="mainInfo">
              <div className="left">
                <img src={DATASOURCEMAP.xiaohongshu.icon} alt="" className="sourceIcon" />
                <div className="breif">
                  <div className="top">
                    <div className="name">Xiaohongshu</div>
                  </div>
                  <div className="bottom">
                    <div className="balance">
                      {hasXiaohongshuConnected ? `@${xiaohongshuUserInfo.userName}` : 'Not Connected'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="right">
                <div className="tokensWrapper">
                  {hasXiaohongshuConnected ? (
                    <button
                      onClick={handleXiaohongshuDelete}
                      className={`deleteBtn ${theme}`}
                      title="Delete connection"
                    >
                      <i className="iconfont icon-iconDelete"></i>
                    </button>
                  ) : (
                    <button
                      onClick={handleXiaohongshuConnect}
                      className={`PButton secondary connectBtn ${theme}`}
                      disabled={activeConnectDataSource.loading === 1 && activeConnectDataSource.dataSourceId === 'xiaohongshu'}
                    >
                      {activeConnectDataSource.loading === 1 && activeConnectDataSource.dataSourceId === 'xiaohongshu' ? (
                        <div className="loading-spinner"></div>
                      ) : (
                        'Connect Xiaohongshu'
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </li>

          <li className={`dataSourceItem ${theme}`}>
            <div className="mainInfo">
              <div className="left">
                <img src={DATASOURCEMAP.x.icon} alt="" className="sourceIcon" />
                <div className="breif">
                  <div className="top">
                    <div className="name">X (Twitter)</div>
                  </div>
                  <div className="bottom">
                    <div className="balance">Coming soon</div>
                  </div>
                </div>
              </div>
              <div className="right">
                <div className="tokensWrapper">
                </div>
              </div>
            </div>
          </li>

          <li className={`dataSourceItem ${theme}`}>
            <div className="mainInfo">
              <div className="left">
                <img src={DATASOURCEMAP.instagram.icon} alt="" className="sourceIcon" />
                <div className="breif">
                  <div className="top">
                    <div className="name">Instagram</div>
                  </div>
                  <div className="bottom">
                    <div className="balance">Coming soon</div>
                  </div>
                </div>
              </div>
              <div className="right">
                <div className="tokensWrapper">
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>

      {visibleAssetDialog && (
        <CreateZkAttestation
          presets={attestationPresets}
          type={visibleAssetDialog}
          onClose={handleCloseAssetDialog}
          onSubmit={handleSubmitAssetDialog}
        />
      )}
    </div>
  );
};

export default IdentityBridge; 