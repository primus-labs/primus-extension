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
import iconSettings from '@/assets/newImg/layout/iconMore.svg';

import './index.scss';
import { saveHandleMapping, doesMappingExist, findXiaohongshuByTiktok } from '@/services/firestore';
import HandleSearch from '@/newComponents/HandleSearch';

interface TikTokFollower {
  userId: string;
  uniqueId: string;
  nickname: string;
  avatar: string;
  followerCount: number;
  followingCount: number;
  signature: string;
  xiaohongshuHandle?: string;  // Optional field for associated Xiaohongshu handle
  isFollowingOnXiaohongshu?: boolean;  // Optional field for following status on Xiaohongshu
  isLoadingXiaohongshu?: boolean;  // To track loading state per follower
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
  const [isHandleMappingSaved, setIsHandleMappingSaved] = useState<boolean>(false);
  const [saveMappingError, setSaveMappingError] = useState<string | null>(null);
  const [hasAutoSaved, setHasAutoSaved] = useState<boolean>(false);
  const [autoSaveError, setAutoSaveError] = useState<string | null>(null);
  const [mappingWasFound, setMappingWasFound] = useState<boolean>(false);
  const [showDebugging, setShowDebugging] = useState<boolean>(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

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

  // Create a more robust port connection
  useEffect(() => {
    // Only create a new port if we don't have one
    if (!portRef.current) {
      console.log('Creating new port connection');
      
      const portName = `identityBridge-${Date.now()}`;
      const port = chrome.runtime.connect({ name: portName });
      portRef.current = port;
      isActiveRef.current = true;

      // Helper function to reconnect if needed
      const reconnectIfNeeded = () => {
        if (!portRef.current && isActiveRef.current) {
          console.log('Attempting to reconnect port');
          const newPort = chrome.runtime.connect({ name: `identityBridge-${Date.now()}` });
          portRef.current = newPort;
          
          // Set up new disconnect listener
          newPort.onDisconnect.addListener(() => {
            console.log('Port disconnected in IdentityBridge');
            portRef.current = null;
            // Don't set isActiveRef to false here to allow reconnection
            setTimeout(reconnectIfNeeded, 1000); // Try to reconnect after 1 second
          });
        }
      };
      
      // Set up heartbeat to check connection
      const heartbeatInterval = setInterval(() => {
        if (portRef.current && isActiveRef.current) {
          try {
            portRef.current.postMessage({ type: 'ping' });
          } catch (e) {
            console.log('Heartbeat failed, port may be disconnected');
            portRef.current = null;
            reconnectIfNeeded();
          }
        }
      }, 5000);

      port.onMessage.addListener((message: any) => {
        console.log('Port message received in IdentityBridge:', message);
        
        if (message.type === 'pong') {
          // Heartbeat response, connection is alive
          return;
        }
        
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
          
          // Save to storage
          chrome.storage.local.set({
            'tiktok-followers-data': JSON.stringify({
              ...data,
              timestamp: Date.now()
            })
          });
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
          
          // Save to storage
          chrome.storage.local.set({
            'tiktok-following-data': JSON.stringify({
              ...data,
              timestamp: Date.now()
            })
          });
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

      // Add disconnect listener 
      port.onDisconnect.addListener(() => {
        console.log('Port disconnected in IdentityBridge');
        portRef.current = null;
        // We don't set isActiveRef to false here to allow reconnection
        setTimeout(reconnectIfNeeded, 1000);
      });
      
      // Clean up function
      return () => {
        console.log('Cleaning up port connection in IdentityBridge');
        isActiveRef.current = false;
        clearInterval(heartbeatInterval);
        
        if (portRef.current) {
          try {
            portRef.current.disconnect();
          } catch (e) {
            console.log('Error disconnecting port:', e);
          }
          portRef.current = null;
        }
      };
    }
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

  // Add listener for follower data via runtime messages
  useEffect(() => {
    const handleMessage = (message: any) => {
      console.log('Runtime message received in IdentityBridge:', message);
      if (message.type === 'tiktok_followers_data') {
        console.log('Processing followers data from runtime message:', message.data);
        const data: TikTokFollowersData = message.data;
        
        // Store followers data in chrome.storage.local
        chrome.storage.local.set({
          'tiktok-followers-data': JSON.stringify({
            ...data,
            timestamp: Date.now() // Add current timestamp
          })
        }, () => {
          console.log('Follower data saved to storage:', data);
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
          'tiktok-following-data': JSON.stringify({
            ...data,
            timestamp: Date.now() // Add current timestamp
          })
        }, () => {
          console.log('Following data saved to storage:', data);
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
          if (data.users && Array.isArray(data.users)) {
            setFollowers(data.users);
            setHasMoreFollowers(data.hasMore);
            setFollowersCursor(data.cursor);
            setTotalFollowers(data.total);
          }
        } catch (error) {
          console.error('Error parsing stored followers data:', error);
        }
      }
      
      if (result['tiktok-following-data']) {
        try {
          const data = JSON.parse(result['tiktok-following-data']);
          console.log('Found stored following data:', data);
          if (data.users && Array.isArray(data.users)) {
            setFollowing(data.users);
            setHasMoreFollowing(data.hasMore);
            setFollowingCursor(data.cursor);
            setTotalFollowing(data.total);
          }
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

  // Auto-save mapping when both handles are available
  useEffect(() => {
    const autoSaveHandleMapping = async () => {
      // Only proceed if both handles are connected and we haven't auto-saved yet
      if (hasConnected && hasXiaohongshuConnected && !hasAutoSaved) {
        try {
          // Get handles from state
          const tiktokHandle = activeDataSouceUserInfo?.userName;
          const xiaohongshuHandle = xiaohongshuUserInfo?.userName;
          
          if (!tiktokHandle || !xiaohongshuHandle) {
            setAutoSaveError('Unable to retrieve handle information. Please reconnect your accounts.');
            return;
          }

          // Check if this exact mapping already exists
          const alreadyExists = await doesMappingExist(tiktokHandle, xiaohongshuHandle);
          
          if (alreadyExists) {
            // Mapping already exists, so just update the UI state without saving again
            console.log('Mapping already exists, not saving duplicate');
            setHasAutoSaved(true);
            setMappingWasFound(true);
            setAutoSaveError(null);
            
            // Show an info message
            const msgId = addMsg({
              type: 'info',
              title: 'Handle Mapping Found',
              desc: `Mapping between TikTok @${tiktokHandle} and Xiaohongshu @${xiaohongshuHandle} already exists`,
              showTime: 5000,
            });
            setTimeout(() => deleteMsg(msgId), 5000);
            return;
          }

          // If not already exists, save mapping to Firestore
          await saveHandleMapping(tiktokHandle, xiaohongshuHandle);
          
          // Update UI state
          setHasAutoSaved(true);
          setMappingWasFound(false);
          setAutoSaveError(null);
          
          // Show success message
          const msgId = addMsg({
            type: 'success',
            title: 'Handle Mapping Saved',
            desc: `Successfully saved mapping from TikTok @${tiktokHandle} to Xiaohongshu @${xiaohongshuHandle}`,
            showTime: 5000,
          });
          setTimeout(() => deleteMsg(msgId), 5000);
        } catch (error) {
          console.error('Error auto-saving handle mapping:', error);
          setAutoSaveError('Failed to auto-save handle mapping. You can try again later.');
          
          // Show error message
          const msgId = addMsg({
            type: 'error',
            title: 'Error Saving Mapping',
            desc: 'There was a problem automatically saving your handle mapping.',
            showTime: 5000,
          });
          setTimeout(() => deleteMsg(msgId), 5000);
        }
      }
    };

    autoSaveHandleMapping();
  }, [hasConnected, hasXiaohongshuConnected, activeDataSouceUserInfo, xiaohongshuUserInfo, addMsg, deleteMsg, hasAutoSaved]);

  // Reset auto-save state when connections change
  useEffect(() => {
    if (!hasConnected || !hasXiaohongshuConnected) {
      setHasAutoSaved(false);
      setMappingWasFound(false);
    }
  }, [hasConnected, hasXiaohongshuConnected]);

  // Add a toggle handler function
  const toggleDebugging = useCallback(() => {
    setShowDebugging(prev => !prev);
  }, []);

  // Replace the lookupXiaohongshuHandles function with this improved version
  const lookupXiaohongshuHandles = useCallback(async (users: TikTokFollower[], setUsers: (users: TikTokFollower[]) => void) => {
    if (!users || users.length === 0) return;

    // Create a copy of the users array
    const updatedUsers = [...users];
    let hasChanges = false;

    // Find users that need to be processed (haven't been processed yet)
    const usersToProcess = updatedUsers
      .map((user, index) => ({ user, index }))
      .filter(({ user }) => user.xiaohongshuHandle === undefined && !user.isLoadingXiaohongshu);
    
    // If all users are already processed or being processed, exit early
    if (usersToProcess.length === 0) return;
    
    // Mark all users in the batch as loading first
    for (const { user, index } of usersToProcess) {
      updatedUsers[index] = { ...user, isLoadingXiaohongshu: true };
      hasChanges = true;
    }
    
    // Update the UI to show loading state
    if (hasChanges) {
      setUsers([...updatedUsers]);
    }
    
    // Process users in batches to avoid overwhelming Firestore
    const batchSize = 5;
    for (let i = 0; i < usersToProcess.length; i += batchSize) {
      const batch = usersToProcess.slice(i, i + batchSize);
      hasChanges = false;
      
      // Process each user in the batch concurrently
      await Promise.all(batch.map(async ({ user, index }) => {
        try {
          // Look up the Xiaohongshu handle for this TikTok handle
          const result = await findXiaohongshuByTiktok(user.uniqueId);
          
          // Update the user with the result
          updatedUsers[index] = { 
            ...updatedUsers[index], 
            xiaohongshuHandle: result?.xiaohongshuHandle || '', // Empty string for not found
            isLoadingXiaohongshu: false
          };
          
          hasChanges = true;
        } catch (error) {
          console.error(`Error looking up Xiaohongshu handle for @${user.uniqueId}:`, error);
          // Mark as failed but not loading
          updatedUsers[index] = { 
            ...updatedUsers[index], 
            xiaohongshuHandle: '', // Empty string for errors too
            isLoadingXiaohongshu: false
          };
          hasChanges = true;
        }
      }));
      
      // Update the state after each batch if needed
      if (hasChanges) {
        setUsers([...updatedUsers]);
      }
      
      // Small delay to avoid overloading Firestore
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }, []);

  // Fix the useEffect dependencies to avoid the infinite update loop
  useEffect(() => {
    const needsLookup = followers?.some(f => f.xiaohongshuHandle === undefined && !f.isLoadingXiaohongshu);
    
    if (followers && followers.length > 0 && needsLookup) {
      lookupXiaohongshuHandles(followers, setFollowers);
    }
  }, [followers?.length, lookupXiaohongshuHandles]); // Only re-run when length changes, not the array contents

  useEffect(() => {
    const needsLookup = following?.some(f => f.xiaohongshuHandle === undefined && !f.isLoadingXiaohongshu);
    
    if (following && following.length > 0 && needsLookup) {
      lookupXiaohongshuHandles(following, setFollowing);
    }
  }, [following?.length, lookupXiaohongshuHandles]); // Only re-run when length changes, not the array contents

  // Add a function to toggle expanded user details
  const toggleUserDetails = useCallback((userId: string) => {
    setExpandedUser(prevId => prevId === userId ? null : userId);
  }, []);

  return (
    <div className={`pageContent ${theme}`}>
      <div className="homeDataSources">
        <div className="titleSection">
          <div className="titleContent">
            <div className="title">Bridge your TikTok community to XiaoHongShu!</div>
            <div className="description">
              This app follows your TikTok followers and following on Xiaohongshu.
            </div>
          </div>
          <div className="switchWrapper">
            {showDebugging && (
              <div className="debug-label">Debug mode</div>
            )}
            <div 
              className={`debug-switch ${showDebugging ? 'active' : ''} ${theme}`}
              onClick={toggleDebugging}
              title={showDebugging ? "Hide debugging tools" : "Show debugging tools"}
            >
              <div className="knob-icon">
                <img src={iconSettings} alt="" style={{ width: '16px', height: '16px' }} />
              </div>
            </div>
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

        {/* New dataSourceItems list for Handle Mapping Status and Search */}
        {showDebugging && (
          <ul className="dataSourceItems debugging">
            {/* Handle Mapping Status */}
            {hasConnected && hasXiaohongshuConnected && (
              <li className={`dataSourceItem mapping-status ${theme}`}>
                <div className="mapping-status-container">
                  <div className="mapping-info">
                    <h3>Handle Mapping Status</h3>
                    
                    {autoSaveError ? (
                      <div className="mapping-error">
                        {autoSaveError}
                      </div>
                    ) : hasAutoSaved ? (
                      <div className="mapping-success">
                        <p>
                          {mappingWasFound ? 
                            `Existing mapping found in database, between TikTok handle (@${activeDataSouceUserInfo?.userName}) and 
                             Xiaohongshu handle (@${xiaohongshuUserInfo?.userName}).` :
                            `Your TikTok handle (@${activeDataSouceUserInfo?.userName}) and 
                             Xiaohongshu handle (@${xiaohongshuUserInfo?.userName}) have been 
                             successfully mapped and saved.`
                          }
                        </p>
                        <p className="timestamp">
                          {mappingWasFound ? 'Found' : 'Saved'} on {new Date().toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <div className="mapping-progress">
                        Checking and saving handle mapping...
                      </div>
                    )}
                  </div>
                </div>
              </li>
            )}

            {/* Find Xiaohongshu Handles */}
            <li className={`dataSourceItem ${theme}`}>
              <HandleSearch theme={theme} />
            </li>
          </ul>
        )}

        {/* Wrap both tables in a container */}
        <div className={`tables-container ${theme}`}>
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
                      <th>XiaoHongShu name</th>
                      <th>Following on Xiaohongshu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {followers.map(follower => (
                      <>
                        <tr key={follower.userId}>
                          <td>
                            <img 
                              src={follower.avatar} 
                              alt={follower.uniqueId} 
                              className="follower-avatar"
                              onClick={() => toggleUserDetails(follower.userId)}
                              style={{ cursor: 'pointer' }}
                              title="Click to show/hide details"
                            />
                          </td>
                          <td>@{follower.uniqueId}</td>
                          <td>{follower.nickname}</td>
                          <td>
                            {follower.isLoadingXiaohongshu ? (
                              <span className="loading-indicator">Searching...</span>
                            ) : follower.xiaohongshuHandle && follower.xiaohongshuHandle.length > 0 ? (
                              <span className="xiaohongshu-handle">@{follower.xiaohongshuHandle}</span>
                            ) : (
                              <span className="not-found">Not found</span>
                            )}
                          </td>
                          <td>
                            {follower.isFollowingOnXiaohongshu ? (
                              <span className="following-status yes">Yes</span>
                            ) : (
                              <span className="following-status no">No</span>
                            )}
                          </td>
                        </tr>
                        {expandedUser === follower.userId && (
                          <tr className="expanded-details">
                            <td colSpan={5}>
                              <div className="details-container">
                                <div className="details-row">
                                  <div className="details-label">Followers:</div>
                                  <div className="details-value">{follower.followerCount.toLocaleString()}</div>
                                </div>
                                <div className="details-row">
                                  <div className="details-label">Following:</div>
                                  <div className="details-value">{follower.followingCount.toLocaleString()}</div>
                                </div>
                                <div className="details-row">
                                  <div className="details-label">Bio:</div>
                                  <div className="details-value bio-text">{follower.signature || 'No bio'}</div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
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
                      <th>XiaoHongShu name</th>
                      <th>Following on Xiaohongshu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {following.map(user => (
                      <>
                        <tr key={user.userId}>
                          <td>
                            <img 
                              src={user.avatar} 
                              alt={user.uniqueId} 
                              className="follower-avatar"
                              onClick={() => toggleUserDetails(user.userId)}
                              style={{ cursor: 'pointer' }}
                              title="Click to show/hide details"
                            />
                          </td>
                          <td>@{user.uniqueId}</td>
                          <td>{user.nickname}</td>
                          <td>
                            {user.isLoadingXiaohongshu ? (
                              <span className="loading-indicator">Searching...</span>
                            ) : user.xiaohongshuHandle && user.xiaohongshuHandle.length > 0 ? (
                              <span className="xiaohongshu-handle">@{user.xiaohongshuHandle}</span>
                            ) : (
                              <span className="not-found">Not found</span>
                            )}
                          </td>
                          <td>
                            {user.isFollowingOnXiaohongshu ? (
                              <span className="following-status yes">Yes</span>
                            ) : (
                              <span className="following-status no">No</span>
                            )}
                          </td>
                        </tr>
                        {expandedUser === user.userId && (
                          <tr className="expanded-details">
                            <td colSpan={5}>
                              <div className="details-container">
                                <div className="details-row">
                                  <div className="details-label">Followers:</div>
                                  <div className="details-value">{user.followerCount.toLocaleString()}</div>
                                </div>
                                <div className="details-row">
                                  <div className="details-label">Following:</div>
                                  <div className="details-value">{user.followingCount.toLocaleString()}</div>
                                </div>
                                <div className="details-row">
                                  <div className="details-label">Bio:</div>
                                  <div className="details-value bio-text">{user.signature || 'No bio'}</div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
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

    </div>
  );
};

export default IdentityBridge;