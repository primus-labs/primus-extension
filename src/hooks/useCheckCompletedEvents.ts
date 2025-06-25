import { useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { UserState } from '@/types/store';
import {
  BASEVENTNAME,
  LINEAEVENTNAME,
  ETHSIGNEVENTNAME,
} from '@/config/events';
import { checkIfJoinedEvents } from '@/services/api/event';
import { getUserInfo } from '@/services/api/achievements';
const useCheckCompletedEvents = () => {
  const connectedWallet = useSelector(
    (state: UserState) => state.connectedWallet
  );
  const checkFn = useCallback(async () => {
    try {
      let mainWallet = '';
      const res = await getUserInfo();
      const { rc, result } = res;
      if (rc === 0) {
        mainWallet = result.mainWallet;
        if (
          connectedWallet.address.toLowerCase() === mainWallet.toLowerCase()
        ) {
          const eventNameArr = [LINEAEVENTNAME, BASEVENTNAME, ETHSIGNEVENTNAME];
          for (const eventName of eventNameArr) {
            const { rc, result } = await checkIfJoinedEvents({
              event: eventName,
            });
            if (rc === 0 && result) {
              const lastStorage = await chrome.storage.local.get([eventName]);
              const lastEventJoinInfo = lastStorage[eventName]
                ? JSON.parse(lastStorage[eventName])
                : {};
              const lastMainWalletJoinInfo = lastEventJoinInfo[mainWallet];
              if (!lastMainWalletJoinInfo?.taskMap?.onChain?.onChain) {
                let mainWalletJoinInfo = {};
                if (eventName === LINEAEVENTNAME) {
                  mainWalletJoinInfo = {
                    address: mainWallet,
                    taskMap: {
                      follow: {
                        x: 1,
                        discord: 1,
                      },
                      attestation: {
                        '1': '1',
                      },
                      onChain: {
                        onChain: '1',
                      },
                    },
                  };
                } else if (eventName === BASEVENTNAME) {
                  mainWalletJoinInfo = {
                    address: mainWallet,
                    taskMap: {
                      follow: {
                        x: 1,
                        discord: 1,
                      },
                      attestation: {
                        '2': '1',
                        '3': '1',
                        '6': '1',
                        '100': '1',
                      },
                      onChain: {
                        onChain: '1',
                      },
                      check: {
                        check: 0,
                      },
                    },
                  };
                } else if (eventName === ETHSIGNEVENTNAME) {
                  mainWalletJoinInfo = {
                    address: mainWallet,
                    taskMap: {
                      follow: {
                        x: 1,
                        discord: 1,
                      },
                      attestation: {
                        '15': '1',
                      },
                      onChain: {
                        onChain: '1',
                      },
                    },
                  };
                }
                lastEventJoinInfo[mainWallet] = mainWalletJoinInfo;
                await chrome.storage.local.set({
                  [eventName]: JSON.stringify(lastEventJoinInfo),
                });
              }
            }
          }
        }
      }
    } catch (e) {
      console.error(`request fail: ${e}`);
    }
  }, [connectedWallet]);
  useEffect(() => {
    if (connectedWallet) {
      checkFn();
    }
  }, [checkFn, connectedWallet]);
};
export default useCheckCompletedEvents;
