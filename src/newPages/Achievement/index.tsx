import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';

import AchievementTopCard from '@/newComponents/Ahievements/TopCard';
import AchievementTaskItem from '@/newComponents/Ahievements/AchievementTaskItem';

import {
  getAchievementTaskList,
  getUserInfo,
} from '@/services/api/achievements';
import './index.scss';
import AchievementRewardHistory from '@/newComponents/Ahievements/AchievementRewardHistory';
import { Pagination } from 'antd';
import ReferralCodeInput from '@/newComponents/Ahievements/ReferralCodeInput';
import ShareComponent from '@/newComponents/Ahievements/ShareComponent';
import { setConnectWalletDialogVisibleAction } from '@/store/actions';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import useCheckIsConnectedWallet from '@/hooks/useCheckIsConnectedWallet';
import { UserState } from '@/types/store';

const AchievementHome = memo(() => {
  const [checkIsConnectFlag, setCheckIsConnectFlag] = useState<boolean>(true);
  useCheckIsConnectedWallet(checkIsConnectFlag);
  const connectWalletDialogVisible = useSelector(
    (state:UserState) => state.connectWalletDialogVisible
  );
  useEffect(() => {
    if (connectWalletDialogVisible === 0) {
      setCheckIsConnectFlag(false);
    }
  }, [connectWalletDialogVisible]);
  const [visibleAssetDialog, setVisibleAssetDialog] = useState<boolean>(false);
  const [visibleReferralCodeDialog, setVisibleReferralCodeDialog] =
    useState<boolean>(false);
  const [visibleShareDiag, setVisibleShareDiag] = useState<boolean>(false);
  const [referralCodeTaskFinished, setReferralCodeTaskFinished] =
    useState<boolean>(false);
  const [size, setSize] = useState(7);
  const [pageCount, setPageCount] = useState(1);
  const [totolCount, setTotalCount] = useState(1);
  const [current, setCurrent] = useState(1);
  let [achievementTaskList, setAchievementTaskList] = useState<any>([]);
  const [referralCode, setRefferralCode] = useState('');
  const [totalScore, setTotalScore] = useState(0);
  const [referrals, setReferrals] = useState(0);
  const [countedReferrals, setCountedReferrals] = useState(0);
  const [shareType, setShareType] = useState('');
  //task need to be finished when go this page first time
  const [taskToFinished, setTaskToFinished] = useState('');
  const location = useLocation();

  const dispatch = useDispatch();
  const [connected, setConnected] = useState<boolean>(false);
  const connectedWallet = useSelector((state:UserState) => state.connectedWallet);
  const activeConnectWallet = useSelector(
    (state: UserState) => state.activeConnectWallet
  );

  useEffect(() => {
    setConnected(!!connectedWallet?.address && !activeConnectWallet?.network);
  }, [connectedWallet?.address, activeConnectWallet?.network]);

  function queryParams() {
    const searchParams = new URLSearchParams(location.search);
    const taskName = searchParams.get('finishTask');
    if (taskName) {
      setTaskToFinished(taskName);
    }
  }

  useEffect(() => {
    queryParams();
  }, []);

  const onConnectWallet = async () => {
    if (!connected) {
      await dispatch(setConnectWalletDialogVisibleAction(connected ? 0 : 1));
      await getAchievementTaskListFn(current);
    }
  };

  useEffect(() => {
    getAchievementTaskListFn(current);
    getUserInfoFn();
  }, [connected]);

  console.log('connected in achievement:', connected);
  console.log('connectedWallet:', connectedWallet);
  console.log('activeConnectWallet:', activeConnectWallet);

  const getUserInfoFn = async () => {
    const res = await getUserInfo();
    const { rc, result } = res;
    if (rc === 0) {
      setRefferralCode(result.referralCode);
      setTotalScore(result.totalScore);
      setReferrals(result.referrals);
      setCountedReferrals(result.countedReferrals);
    }
  };

  useEffect(() => {
    getUserInfoFn();
  }, []);

  const getAchievementTaskListFn = useCallback(async (page) => {
    const res = await getAchievementTaskList(size, page);
    const { rc, result } = res;
    if (rc === 0) {
      setAchievementTaskList(result.items);
      setTotalCount(result.totalCount);
      setPageCount(result.pageCount);
    }
  }, []);
  useEffect(() => {
    getAchievementTaskListFn(current);
  }, []);

  const AchievementTaskItemList = () => {
    return achievementTaskList.map((item, index) => {
      let isFinished = item.finished;
      if (item.taskIdentifier === 'SIGN_IN_USING_AN_REFERRAL_CODE') {
        isFinished = isFinished || referralCodeTaskFinished;
      }
      const taskItemWithClick = {
        taskItem: item,
        isFinished: isFinished,
        showCodeDiag: setVisibleReferralCodeDialog,
        refreshTotalScore: refreshTotalScoreFn,
        referralCode: referralCode,
        isConnect: connected,
        onConnectWallet: onConnectWallet,
        taskToFinished: taskToFinished,
      };
      return <AchievementTaskItem key={index} {...taskItemWithClick} />;
    });
  };

  useEffect(() => {
    getAchievementTaskListFn(current);
  }, [current]);

  const pageChangedFn = (page) => {
    if (page === 'pre') {
      page = current - 1;
    }
    if (page === 'next') {
      page = current + 1;
    }
    if (page < 1) {
      page = 1;
    }
    if (page > pageCount) {
      page = pageCount;
    }
    setCurrent(page);
  };

  const handleCreate = useCallback(() => {
    setVisibleAssetDialog(true);
  }, []);
  const handleCloseAssetDialog = useCallback(() => {
    setVisibleAssetDialog(false);
  }, []);

  //for top card
  const handleRewordHistory = () => {
    handleCreate();
  };

  const handleSharePoints = () => {
    setShareType('score');
    setVisibleShareDiag(true);
  };

  const handleShareReferralCode = () => {
    setShareType('referralCode');
    setVisibleShareDiag(true);
  };

  const refreshTotalScoreFn = async (scoreChanged, taskIdentifier) => {
    setTotalScore(totalScore + scoreChanged);
    // eslint-disable-next-line no-undef
    console.log('taskIdentifier:', taskIdentifier);
    await getAchievementTaskListFn(current);
    // const newList = achievementTaskList.map((item) => {
    //   if (item.taskIdentifier === taskIdentifier) {
    //     item.finished = true;
    //   }
    //   return item;
    // })
    // setAchievementTaskList(newList);
  };

  const handleReferralCodeClose = () => {
    setVisibleReferralCodeDialog(false);
  };

  const handleSharePageClose = () => {
    setVisibleShareDiag(false);
  };

  const handleReferralCodeTaskFinish = () => {
    // @ts-ignore
    setReferralCodeTaskFinished(true);
    for (let i = 0; i < achievementTaskList.length; i++) {
      if (
        achievementTaskList[i].taskIdentifier ===
        'SIGN_IN_USING_AN_REFERRAL_CODE'
      ) {
        setTotalScore(totalScore + achievementTaskList[i].taskXpScore);
      }
    }
    getAchievementTaskListFn(current);
  };

  return (
    <div className="pageAchievementTaskItem">
      <div className="pageContent">
        <AchievementTopCard
          referrals={referrals}
          countedReferrals={countedReferrals}
          totalScore={totalScore}
          referralCode={referralCode}
          handleRewardsHistory={handleRewordHistory}
          handleSharePoints={handleSharePoints}
          handleShareReferralCode={handleShareReferralCode}
        ></AchievementTopCard>
        <div className={'achievementTasks'}>
          <div className={'achievementTasksTitle'}>Task list</div>
          <div className="achievementTasksList">
            <AchievementTaskItemList />
          </div>

          <div className={'pageComponent'}>
            <Pagination
              total={totolCount}
              onChange={pageChangedFn}
              showSizeChanger={false}
              pageSize={size}
            />
          </div>
        </div>
        {visibleAssetDialog && (
          <AchievementRewardHistory onClose={handleCloseAssetDialog} />
        )}
        {visibleReferralCodeDialog && (
          <ReferralCodeInput
            onClose={handleReferralCodeClose}
            showMsg={true}
            setReferralTaskFinished={handleReferralCodeTaskFinish}
          />
        )}
        {visibleShareDiag && (
          <ShareComponent
            onClose={handleSharePageClose}
            shareType={shareType}
            scoreShareProps={{ score: totalScore, referralCode: referralCode }}
          />
        )}
      </div>
    </div>
  );
});

export default AchievementHome;
