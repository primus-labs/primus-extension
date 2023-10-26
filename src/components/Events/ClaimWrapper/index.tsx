import React, {
  FC,
  memo,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import ClaimDialogHeaderDialog from '@/components/Events/ClaimWrapper/ClaimDialogHeader';
import ConnectWalletDialog from '@/components/Cred/CredSendToChainWrapper/ConnectWalletDialog';
import ClaimDialog from './ClaimDialog';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';

import useAllSources from '@/hooks/useAllSources';
import {
  ONCHAINLIST,
  PADOADDRESS,
  EASInfo,
  CLAIMNFTNETWORKNAME,
} from '@/config/envConstants';
import { supportAttestDataSourceNameList } from '@/config/constants';
import { connectWallet } from '@/services/wallets/metamask';
import { mintWithSignature } from '@/services/chains/erc721';
import { getEventSignature, getNFTInfo } from '@/services/api/event';
import {
  initRewardsActionAsync,
  setConnectWalletActionAsync,
  setRewardsDialogVisibleAction,
  connectWalletAsync,
} from '@/store/actions';
import { getAuthUserIdHash } from '@/utils/utils';

import type { WALLETITEMTYPE } from '@/types/config';
import type { ActiveRequestType } from '@/types/config';
import type { UserState } from '@/types/store';
import type { CredTypeItemType } from '@/types/cred';
import type { Dispatch } from 'react';
import type { RewardList } from '@/types/event';
import type {
  ExDataList,
  KYCDataList,
  SourceDataList,
} from '@/types/dataSource';
import { eventReport } from '@/services/api/usertracker';

import './index.scss';

interface ClaimWrapperProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
}
const ClaimWrapper: FC<ClaimWrapperProps> = memo(
  ({ visible, onClose, onSubmit }) => {
    const [searchParams] = useSearchParams();
    const NFTsProcess = searchParams.get('NFTsProcess');
    const exSources = useSelector((state: UserState) => state.exSources);
    const kycSources = useSelector((state: UserState) => state.kycSources);
    const exList: ExDataList = useMemo(() => {
      return Object.values({ ...exSources });
    }, [exSources]);
    const kycList: KYCDataList = useMemo(() => {
      return Object.values({ ...kycSources });
    }, [kycSources]);
    const dataSourceList: SourceDataList = useMemo(() => {
      return [...exList, ...kycList];
    }, [exList, kycList]);
    const holdSupportAttestDataSource = useMemo(() => {
      return dataSourceList.some((i) =>
        supportAttestDataSourceNameList.includes(i.name)
      );
    }, [dataSourceList]);

    const [step, setStep] = useState<number>(0);
    const [activeRequest, setActiveRequest] = useState<ActiveRequestType>();

    const connectedWallet = useSelector(
      (state: UserState) => state.connectedWallet
    );
    const rewards = useSelector((state: UserState) => state.rewards);
    const userPassword = useSelector((state: UserState) => state.userPassword);
    const rewardList: RewardList = useMemo(() => {
      return Object.values(rewards);
    }, [rewards]);
    const credentialsFromStore = useSelector(
      (state: UserState) => state.credentials
    );
    const credList: CredTypeItemType[] = useMemo(() => {
      let credArr = Object.values(credentialsFromStore);
      credArr = credArr.sort(
        (a, b) => Number(a.getDataTime) - Number(b.getDataTime)
      );
      return credArr;
    }, [credentialsFromStore]);

    const [sourceList, sourceMap] = useAllSources();
    const hasSource = useMemo(() => {
      const exLen =
        (sourceMap.exSources && Object.keys(sourceMap.exSources).length) ?? 0;
      const kycLen =
        (sourceMap.kycSources && Object.keys(sourceMap.kycSources).length) ?? 0;
      const totalLen = exLen + kycLen;
      return totalLen > 0;
    }, [sourceMap]);
    const hasCred = useMemo(() => {
      return credList.length > 0;
    }, [credList]);
    const hadSendToChain = useMemo(() => {
      const hadFlag = credList.some((item) => {
        const p = item?.provided;
        if (item?.reqType !== 'web' && p?.length && p?.length > 0) {
          return p.some((i) => i.chainName.indexOf('Linea') > -1);
        }
        return false;
      });
      return hadFlag;
    }, [credList]);
    const errorDescEl = useMemo(
      () => (
        <>
          <p>Your wallet did not connect or refused to authorize.</p>
          <p>Please try again later.</p>
        </>
      ),
      []
    );

    const dispatch: Dispatch<any> = useDispatch();
    const navigate = useNavigate();

    const onSubmitActiveRequestDialog = useCallback(() => {
      onSubmit();
    }, [onSubmit]);

    const handleBackConnectWallet = useCallback(() => {
      setStep(1);
    }, []);
    const handleSubmitConnectWallet = useCallback(
      async (wallet?: WALLETITEMTYPE) => {
        // TODO!!!
        let eventSingnature = '';
        const activeNetworkName = CLAIMNFTNETWORKNAME;
        const targetNetwork =
          EASInfo[activeNetworkName as keyof typeof EASInfo];
        const startFn = async () => {
          setStep(2);
          setActiveRequest({
            type: 'loading',
            title: 'Processing',
            desc: 'Please complete the transaction in your wallet.',
          });

          const activeCred = credList[credList.length - 1];

          const requestParams: any = {
            rawParam: activeCred,
            greaterThanBaseValue: true,
            signature: activeCred.signature,
            metamaskAddress: connectedWallet?.address,
          };

          if (activeCred.type === 'IDENTIFICATION_PROOF') {
            const authUseridHash = await getAuthUserIdHash();
            const { source, type } = activeCred;
            requestParams.dataToBeSigned = {
              source: source,
              type: type,
              authUseridHash: authUseridHash,
              recipient: connectedWallet?.address,
              timestamp: +new Date() + '',
              result: true,
            };
          }
          const { rc, result } = await getEventSignature(requestParams);
          if (rc === 0) {
            eventSingnature = result.signature;
          }
        };
        // startFn()

        const errorFn = () => {
          setActiveRequest({
            type: 'error',
            title: 'Unable to proceed',
            desc: errorDescEl,
          });
        };
        const sucFn = async ({ name, address, provider }: any) => {
          const upChainParams = {
            networkName: activeNetworkName,
            metamaskprovider: provider,
            receipt: address,
            signature: '0x' + eventSingnature, // TODO
          };
          const mintRes = await mintWithSignature(upChainParams);
          const nftInfo = await getNFTInfo(mintRes[1]);
          const newRewards = { ...rewards };
          newRewards[mintRes[0]] = { ...nftInfo, tokenId: mintRes[0] };
          await chrome.storage.local.set({
            rewards: JSON.stringify(newRewards),
          });
          await dispatch(initRewardsActionAsync());
          // setActiveRequest({
          //   type: 'suc',
          //   title: 'Congratulations',
          //   desc: 'Successfully get your rewards.',
          // });
          const eventInfo = {
            eventType: 'EVENTS',
            rawData: { name: 'Get on-boarding reward', issuer: 'PADO' },
          };
          eventReport(eventInfo);
          dispatch(
            setRewardsDialogVisibleAction({
              visible: true,
              tab: 'NFTs',
            })
          );
          onSubmit();
        };
        dispatch(
          connectWalletAsync(undefined, startFn, errorFn, sucFn, targetNetwork)
        );
      },
      [
        credList,
        rewards,
        dispatch,
        errorDescEl,
        onSubmit,
        connectedWallet?.address,
      ]
    );
    const onSubmitClaimDialog = useCallback(() => {
      // 1.if participated (has nft reward)
      // 2.has on chain web proof
      // 2.has connect wallet;
      // 3.has web proof;
      // 4.web proof on chain add exchange data source
      // rewards;
      if (rewardList?.length > 0) {
        dispatch(
          setRewardsDialogVisibleAction({
            visible: true,
            tab: 'NFTs',
          })
        );
        onClose();
      } else {
        if (hadSendToChain) {
          handleSubmitConnectWallet();
        } else {
          if (userPassword) {
            if (holdSupportAttestDataSource) {
              navigate('/cred?fromEvents=NFTs');
            } else {
              navigate('/datas?fromEvents=NFTs');
            }
          } else {
            navigate('/datas?fromEvents=NFTs');
          }
        }
      }
      return;
    }, [
      hadSendToChain,
      dispatch,
      handleSubmitConnectWallet,
      navigate,
      onClose,
      userPassword,
      holdSupportAttestDataSource,
      rewardList?.length,
    ]);

    useEffect(() => {
      if (visible) {
        setStep(1);
        setActiveRequest(undefined);
        if (NFTsProcess === 'suc') {
          setStep(2);
          setActiveRequest({
            type: 'loading',
            title: 'Processing',
            desc: 'Please complete the transaction in your wallet.',
          });
          handleSubmitConnectWallet();
        } else if (NFTsProcess === 'error') {
          setStep(2);
          setActiveRequest({
            type: 'error',
            title: 'Unable to proceed',
            desc: errorDescEl,
          });
        }
      }
    }, [NFTsProcess, handleSubmitConnectWallet, errorDescEl, visible]);

    return (
      <div className="claimWrapper">
        {visible && step === 1 && (
          <ClaimDialog onClose={onClose} onSubmit={onSubmitClaimDialog} />
        )}
        {visible && step === 1.5 && (
          <ConnectWalletDialog
            onClose={onClose}
            onSubmit={handleSubmitConnectWallet}
            onBack={handleBackConnectWallet}
          />
        )}
        {visible && step === 2 && (
          <AddSourceSucDialog
            onClose={onClose}
            onSubmit={onSubmitActiveRequestDialog}
            type={activeRequest?.type}
            title={activeRequest?.title}
            desc={activeRequest?.desc}
            headerEl={
              <ClaimDialogHeaderDialog
                title="Early Bird NFT Reward"
                illustration={false}
              />
            }
          />
        )}
      </div>
    );
  }
);
export default ClaimWrapper;
