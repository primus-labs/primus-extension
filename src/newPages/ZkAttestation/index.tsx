import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveOnChain } from '@/store/actions';
import useCheckIsConnectedWallet from '@/hooks/useCheckIsConnectedWallet';
import type { UserState } from '@/types/store';
import type { Dispatch } from 'react';
import Slider from '@/newComponents/Events/Slider';
import AttestationTypeList from '@/newComponents/ZkAttestation/AttestationTypeList';
import CreateZkAttestation from '@/newComponents/ZkAttestation/CreateZkAttestation';
import AttestationCards from '@/newComponents/ZkAttestation/AttestationCards';
import SubmitOnChain from '@/newComponents/ZkAttestation/SubmitOnChain';
import Search from '@/newComponents/ZkAttestation/Search';
import { postMsg } from '@/utils/utils';
import empty from '@/assets/newImg/zkAttestation/empty.svg';

import './index.scss';
import useMsgs from '@/hooks/useMsgs';

const ZkAttestation = memo(() => {
  const { addMsg } = useMsgs();
  const [checkIsConnectFlag, setCheckIsConnectFlag] = useState<boolean>(true);
  useCheckIsConnectedWallet(checkIsConnectFlag);
  const connectWalletDialogVisible = useSelector(
    (state: UserState) => state.connectWalletDialogVisible
  );
  useEffect(() => {
    if (connectWalletDialogVisible === 0) {
      setCheckIsConnectFlag(false);
    }
  }, [connectWalletDialogVisible]);
  const dispatch: Dispatch<any> = useDispatch();
  const [visibleAssetDialog, setVisibleAssetDialog] = useState<string>('');

  const credentialsFromStore = useSelector(
    (state: UserState) => state.credentials
  );
  console.log('222credentialsFromStore', credentialsFromStore);
  const attestLoading = useSelector((state: UserState) => state.attestLoading);
  const activeOnChain = useSelector((state: UserState) => state.activeOnChain);
  const hasConnected = useMemo(() => {
    return Object.keys(credentialsFromStore).length > 0;
  }, [credentialsFromStore]);

  const handleCreate = useCallback(
    (typeItem) => {
      if (attestLoading === 1) {
        addMsg({
          type: 'info',
          title: 'Cannot process now',
          desc: 'Another attestation task is running. Please try again later.',
        });
        return;
      } else {
        setVisibleAssetDialog(typeItem.id);
      }
    },
    [attestLoading]
  );
  const handleCloseAssetDialog = useCallback(() => {
    setVisibleAssetDialog('');
  }, []);
  const handleSubmitAssetDialog = useCallback(() => {}, []);
  const handleCloseOnChainDialog = useCallback(() => {
    // setVisibleOnChainDialog(false);
    dispatch(setActiveOnChain({ loading: 0 }));
  }, [dispatch]);
  const handleSubmitOnChainDialog = useCallback(() => {
    // setVisibleOnChainDialog(false);
    dispatch(setActiveOnChain({ loading: 0 }));
  }, [dispatch]);
  useEffect(() => {
    if (attestLoading === 2) {
      setVisibleAssetDialog('');
    }
  }, [attestLoading]);
  return (
    <div className="pageZkAttestation">
      <div className="pageContent">
        {/* <Banner /> */}
        <Slider />
        <AttestationTypeList onClick={handleCreate} />

        {hasConnected ? (
          <div className="contentW">
            <Search />
            <AttestationCards />
          </div>
        ) : (
          <div className="hasNoContent">
            <img src={empty} alt="" />
            <div className="introTxt">
              <div className="title">No zkAttestation </div>
            </div>
          </div>
        )}
        {visibleAssetDialog && (
          <CreateZkAttestation
            type={visibleAssetDialog}
            onClose={handleCloseAssetDialog}
            onSubmit={handleSubmitAssetDialog}
          />
        )}
        {activeOnChain.loading === 1 && (
          <SubmitOnChain
            onClose={handleCloseOnChainDialog}
            onSubmit={handleSubmitOnChainDialog}
          />
        )}
      </div>
    </div>
  );
});
export default ZkAttestation;
