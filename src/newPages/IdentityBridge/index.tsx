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

interface TikTokFollower {
  userId: string;
  uniqueId: string;
  nickname: string;
  avatar: string;
  followerCount: number;
  followingCount: number;
  signature: string;
}

interface TikTokFollowersData {
  users: TikTokFollower[];
  hasMore: boolean;
  total: number;
  cursor: number;
  timestamp?: number;
}

function exportToCSV(data: TikTokFollower[], filename: string) {
  // Define CSV headers
  const headers = ['Username', 'Nickname', 'Followers', 'Following', 'Bio'];
  
  // Convert data to CSV format
  const csvContent = [
    headers.join(','),
    ...data.map(user => [
      `@${user.uniqueId}`,
      `"${user.nickname.replace(/"/g, '""')}"`, // Escape quotes in nicknames
      user.followerCount,
      user.followingCount,
      `"${user.signature.replace(/"/g, '""')}"` // Escape quotes in bios
    ].join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

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
  const [followers, setFollowers] = useState<TikTokFollower[]>([]);
  const [hasMoreFollowers, setHasMoreFollowers] = useState(false);
  const [followersCursor, setFollowersCursor] = useState(0);
  const [totalFollowers, setTotalFollowers] = useState(0);
  const [following, setFollowing] = useState<TikTokFollower[]>([]);
  const [hasMoreFollowing, setHasMoreFollowing] = useState(false);
  const [followingCursor, setFollowingCursor] = useState(0);
  const [totalFollowing, setTotalFollowing] = useState(0);

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
      console.log('Creating new port connection');
      const port = chrome.runtime.connect({ name: `identityBridge-${Date.now()}` });
      portRef.current = port;
      isActiveRef.current = true;

      port.onMessage.addListener((message: any) => {
        console.log('Port message received in IdentityBridge:', message);
        
        if (message.type === 'tiktok_followers_data') {
          console.log('Processing followers data in IdentityBridge:', message.data);
          const data = message.data;
          
          // Update followers with deduplication
          setFollowers(prevFollowers => {
            const existingIds = new Set(prevFollowers.map(f => f.userId));
            const newFollowers = data.users.filter(f => !existingIds.has(f.userId));
            const updatedFollowers = [...prevFollowers, ...newFollowers];
            console.log('Updated followers list:', updatedFollowers);
            return updatedFollowers;
          });
          
          setHasMoreFollowers(data.hasMore);
          setFollowersCursor(data.cursor);
          setTotalFollowers(data.total);
        }
        
        if (message.type === 'tiktok_following_data') {
          console.log('Processing following data in IdentityBridge:', message.data);
          const data = message.data;
          
          // Update following with deduplication
          setFollowing(prevFollowing => {
            const existingIds = new Set(prevFollowing.map(f => f.userId));
            const newFollowing = data.users.filter(f => !existingIds.has(f.userId));
            const updatedFollowing = [...prevFollowing, ...newFollowing];
            console.log('Updated following list:', updatedFollowing);
            return updatedFollowing;
          });
          
          setHasMoreFollowing(data.hasMore);
          setFollowingCursor(data.cursor);
          setTotalFollowing(data.total);
        }
        
        if (message.resType === 'set-tiktok') {
          if (message.res === true) {
            console.log('TikTok connection successful');
            if (isActiveRef.current) {
              dispatch(setActiveConnectDataSource({ 
                loading: 0,
                dataSourceId: 'tiktok'
              }));
              
              dispatch(setSocialSourcesAsync());
              
              const msgId = addMsg({
                type: 'success',
                title: 'TikTok Connected',
                desc: 'Your TikTok account has been successfully connected.',
                showTime: 5000,
              });
              setTimeout(() => deleteMsg(msgId), 5000);
            }
          } else {
            console.error('TikTok connection failed:', message.error);
            const msgId = addMsg({
              type: 'error',
              title: 'Connection Failed',
              desc: message.error || 'Failed to connect TikTok account. Please try again.',
              showTime: 5000,
            });
            setTimeout(() => deleteMsg(msgId), 5000);
          }
        }
      });

      port.onDisconnect.addListener(() => {
        console.log('Port disconnected in IdentityBridge');
        isActiveRef.current = false;
        portRef.current = null;
      });
    }

    // Clean up function
    return () => {
      console.log('Cleaning up port connection in IdentityBridge');
      isActiveRef.current = false;
      if (portRef.current) {
        portRef.current.disconnect();
        portRef.current = null;
      }
    };
  }, [dispatch, addMsg, deleteMsg]);

  // Update theme initialization
  useEffect(() => {
    if (!localStorage.getItem('colorTheme')) {
      localStorage.setItem('colorTheme', 'dark');
    }
    dispatch(initSetThemeAction());
  }, [dispatch]);

  const handleDelete = useCallback(async () => {
    await deleteDataSourceFn('tiktok');
    
    // Clear follower and following data from storage
    await chrome.storage.local.remove(['tiktok-followers-data', 'tiktok-following-data']);
    
    // Clear state
    setFollowers([]);
    setFollowing([]);
    setHasMoreFollowers(false);
    setHasMoreFollowing(false);
    setFollowersCursor(0);
    setFollowingCursor(0);
    setTotalFollowers(0);
    setTotalFollowing(0);
    
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

  // Add listener for follower data via runtime messages
  useEffect(() => {
    const handleMessage = (message: any) => {
      console.log('Runtime message received in IdentityBridge:', message);
      if (message.type === 'tiktok_followers_data') {
        console.log('Processing followers data from runtime message:', message.data);
        const data: TikTokFollowersData = message.data;
        
        // Store followers data in chrome.storage.local
        chrome.storage.local.set({
          'tiktok-followers-data': JSON.stringify(data)
        });
        
        setFollowers(prevFollowers => {
          const existingIds = new Set(prevFollowers.map(f => f.userId));
          const newFollowers = data.users.filter(f => !existingIds.has(f.userId));
          const updatedFollowers = [...prevFollowers, ...newFollowers];
          console.log('Updated followers list from runtime message:', updatedFollowers);
          return updatedFollowers;
        });
        setHasMoreFollowers(data.hasMore);
        setFollowersCursor(data.cursor);
        setTotalFollowers(data.total);
      }
      
      if (message.type === 'tiktok_following_data') {
        console.log('Processing following data from runtime message:', message.data);
        const data: TikTokFollowersData = message.data;
        
        // Store following data in chrome.storage.local
        chrome.storage.local.set({
          'tiktok-following-data': JSON.stringify(data)
        });
        
        setFollowing(prevFollowing => {
          const existingIds = new Set(prevFollowing.map(f => f.userId));
          const newFollowing = data.users.filter(f => !existingIds.has(f.userId));
          const updatedFollowing = [...prevFollowing, ...newFollowing];
          console.log('Updated following list from runtime message:', updatedFollowing);
          return updatedFollowing;
        });
        setHasMoreFollowing(data.hasMore);
        setFollowingCursor(data.cursor);
        setTotalFollowing(data.total);
      }
    };

    console.log('Setting up runtime message listener in IdentityBridge');
    chrome.runtime.onMessage.addListener(handleMessage);
    
    // Try to get any stored data on mount
    chrome.storage.local.get(['tiktok-followers-data', 'tiktok-following-data'], (result) => {
      if (result['tiktok-followers-data']) {
        try {
          const data = JSON.parse(result['tiktok-followers-data']);
          console.log('Found stored followers data:', data);
          setFollowers(data.users);
          setHasMoreFollowers(data.hasMore);
          setFollowersCursor(data.cursor);
          setTotalFollowers(data.total);
        } catch (error) {
          console.error('Error parsing stored followers data:', error);
        }
      }
      
      if (result['tiktok-following-data']) {
        try {
          const data = JSON.parse(result['tiktok-following-data']);
          console.log('Found stored following data:', data);
          setFollowing(data.users);
          setHasMoreFollowing(data.hasMore);
          setFollowingCursor(data.cursor);
          setTotalFollowing(data.total);
        } catch (error) {
          console.error('Error parsing stored following data:', error);
        }
      }
    });

    return () => {
      console.log('Removing runtime message listener in IdentityBridge');
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  // Function to load more followers
  const loadMoreFollowers = useCallback(() => {
    if (hasMoreFollowers) {
      console.log('Loading more followers with cursor:', followersCursor);
      chrome.runtime.sendMessage({
        type: 'fetch_more_followers',
        data: { cursor: followersCursor }
      });
    }
  }, [hasMoreFollowers, followersCursor]);

  // Add function to load more following
  const loadMoreFollowing = useCallback(() => {
    if (hasMoreFollowing) {
      console.log('Loading more following with cursor:', followingCursor);
      chrome.runtime.sendMessage({
        type: 'fetch_more_following',
        data: { cursor: followingCursor }
      });
    }
  }, [hasMoreFollowing, followingCursor]);

  const handleExportFollowers = useCallback(() => {
    if (followers.length > 0) {
      exportToCSV(followers, `tiktok_followers_${activeDataSouceUserInfo?.userName}_${new Date().toISOString().split('T')[0]}`);
    }
  }, [followers, activeDataSouceUserInfo?.userName]);

  const handleExportFollowing = useCallback(() => {
    if (following.length > 0) {
      exportToCSV(following, `tiktok_following_${activeDataSouceUserInfo?.userName}_${new Date().toISOString().split('T')[0]}`);
    }
  }, [following, activeDataSouceUserInfo?.userName]);

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
                      {hasConnected ? (
                        <div>@{activeDataSouceUserInfo.userName}</div>
                      ) : (
                        'Not Connected'
                      )}
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
                      disabled={activeConnectDataSource.loading === 1 && activeConnectDataSource.dataSourceId === 'tiktok'}
                    >
                      {activeConnectDataSource.loading === 1 && activeConnectDataSource.dataSourceId === 'tiktok' ? (
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

        {hasConnected && followers?.length > 0 && (
          <div className="followers-section">
            <div className="followers-header">
              <h3>TikTok Followers ({totalFollowers})</h3>
              <button 
                onClick={handleExportFollowers}
                className={`PButton secondary ${theme}`}
                title="Export followers to CSV"
              >
                Export CSV
              </button>
            </div>
            <div className="followers-table-container">
              <table className="followers-table">
                <thead>
                  <tr>
                    <th>Avatar</th>
                    <th>Username</th>
                    <th>Nickname</th>
                    <th>Followers</th>
                    <th>Following</th>
                    <th>Bio</th>
                  </tr>
                </thead>
                <tbody>
                  {followers.map(follower => (
                    <tr key={follower.userId}>
                      <td>
                        <img 
                          src={follower.avatar} 
                          alt={follower.uniqueId} 
                          className="follower-avatar"
                        />
                      </td>
                      <td>@{follower.uniqueId}</td>
                      <td>{follower.nickname}</td>
                      <td>{follower.followerCount.toLocaleString()}</td>
                      <td>{follower.followingCount.toLocaleString()}</td>
                      <td className="bio-cell">{follower.signature}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {hasMoreFollowers && (
                <div className="load-more-container">
                  <button 
                    onClick={loadMoreFollowers}
                    className={`PButton secondary ${theme}`}
                  >
                    Load More
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {hasConnected && following?.length > 0 && (
          <div className="followers-section">
            <div className="followers-header">
              <h3>TikTok Following ({totalFollowing})</h3>
              <button 
                onClick={handleExportFollowing}
                className={`PButton secondary ${theme}`}
                title="Export following to CSV"
              >
                Export CSV
              </button>
            </div>
            <div className="followers-table-container">
              <table className="followers-table">
                <thead>
                  <tr>
                    <th>Avatar</th>
                    <th>Username</th>
                    <th>Nickname</th>
                    <th>Followers</th>
                    <th>Following</th>
                    <th>Bio</th>
                  </tr>
                </thead>
                <tbody>
                  {following.map(user => (
                    <tr key={user.userId}>
                      <td>
                        <img 
                          src={user.avatar} 
                          alt={user.uniqueId} 
                          className="follower-avatar"
                        />
                      </td>
                      <td>@{user.uniqueId}</td>
                      <td>{user.nickname}</td>
                      <td>{user.followerCount.toLocaleString()}</td>
                      <td>{user.followingCount.toLocaleString()}</td>
                      <td className="bio-cell">{user.signature}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {hasMoreFollowing && (
                <div className="load-more-container">
                  <button 
                    onClick={loadMoreFollowing}
                    className={`PButton secondary ${theme}`}
                  >
                    Load More
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {visibleAssetDialog && (
          <CreateZkAttestation
            presets={attestationPresets}
            type={visibleAssetDialog}
            onClose={handleCloseAssetDialog}
            onSubmit={handleSubmitAssetDialog}
          />
        )}
      </div>
    </div>
  );
};

export default IdentityBridge;