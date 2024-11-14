import React, { memo, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setAttestLoading, setActiveAttestation } from '@/store/actions';
import useCheckIsConnectedWallet from '@/hooks/useCheckIsConnectedWallet';
import type { UserState } from '@/types/store';
import type { Dispatch } from 'react';
import AssetDialog from './AssetDialog';
import HumanityDialog from './HumanityDialog';
import OnChainDialog from './OnChainDialog';
import SocialDialog from './SocialDialog';
import ChatGPTImgDialog from './ChatGPTImgDialog';
import useMsgs from '@/hooks/useMsgs';

interface PBackProps {
  type: string;
  onClose: () => void;
  onSubmit: () => void;
  presets?: any;
}
const PClose: React.FC<PBackProps> = memo(
  ({ type, onClose, onSubmit, presets }) => {
    const { deleteErrorMsgs } = useMsgs();
    const dispatch: Dispatch<any> = useDispatch();
    const attestLoading = useSelector(
      (state: UserState) => state.attestLoading
    );
    // const [checkIsConnectFlag, setCheckIsConnectFlag] = useState<boolean>(false);
    const { connected } = useCheckIsConnectedWallet(true);
    const handleClose = useCallback(() => {
      // dispatch(setAttestLoading(0));
      // dispatch(setActiveAttestation({ loading: 0 }));
      deleteErrorMsgs();
      onClose();
    }, [onClose]);
    useEffect(() => {
      if (attestLoading === 2) {
        onSubmit();
        dispatch(setAttestLoading(0));
        dispatch(setActiveAttestation({ loading: 0 }));
      }
    }, [attestLoading, dispatch]);
    return (
      <div className="createZkAttestation">
        {connected ? (
          <>
            {type === 'Assets Verification' && (
              <AssetDialog
                presets={presets}
                type={type}
                onClose={handleClose}
                onSubmit={onSubmit}
              />
            )}
            {type === 'Humanity Verification' && (
              <HumanityDialog
                presets={presets}
                type={type}
                onClose={handleClose}
                onSubmit={onSubmit}
              />
            )}

            {type === 'Social Connections' && (
              <SocialDialog
                presets={presets}
                type={type}
                onClose={handleClose}
                onSubmit={onSubmit}
              />
            )}
            {/* {type === 'On-chain Transactions' && (
              <OnChainDialog
                presets={presets}
                type={type}
                onClose={handleClose}
                onSubmit={onSubmit}
              />
            )} */}
            {type === 'On-chain Transactions' && (
              <ChatGPTImgDialog
                presets={{
                  dataSourceId: 'chatgpt',
                  verificationContent: 'ChatGPT image proof',
                  verificationValue: 'Image creation',
                }}
                type="Humanity Verification"
                onClose={handleClose}
                onSubmit={onSubmit}
              />
            )}
          </>
        ) : (
          <></>
        )}
      </div>
    );
  }
);

export default PClose;
