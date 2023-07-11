import React, {
  FC,
  memo,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { useSelector, useDispatch } from 'react-redux';

import ClaimDialog from './ClaimDialog';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';

import useAllSources from '@/hooks/useAllSources';

import type { ActiveRequestType } from '@/types/config';
import type { UserState } from '@/types/store';
import './index.sass';

interface ClaimWrapperProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
}
const ClaimWrapper: FC<ClaimWrapperProps> = memo(
  ({ visible, onClose, onSubmit }) => {
    const [step, setStep] = useState<number>(0);
    const [activeRequest, setActiveRequest] = useState<ActiveRequestType>();

    const [sourceList, sourceMap] = useAllSources();
    const credentialsFromStore = useSelector(
      (state: UserState) => state.credentials
    );
    const hasSource = useMemo(() => {
      return sourceList.length > 0;
    }, [sourceList]);
    const hasCred = useMemo(() => {
      return Object.values(credentialsFromStore).length > 0;
    }, [credentialsFromStore]);

    const onCloseClaimDialog = () => {};
    const onSubmitClaimDialog = useCallback(() => {
      if (!hasSource) {
        setActiveRequest({
          type: 'warn',
          title: 'No data source connected',
          desc: 'Please go to the Data page to add.',
        });
      }
      if (!hasCred) {
        setActiveRequest({
          type: 'warn',
          title: 'No proof is created',
          desc: 'Please go to the Credential page to generate.',
        });
      }
      // setActiveRequest({
      //   type: 'loading',
      //   title: 'Processing',
      //   desc: 'It may take a few seconds.',
      // });
      setActiveRequest({
        type: 'suc',
        title: 'Congratulations',
        desc: 'Successfully get your rewards.',
      });
      // setActiveRequest({
      //   type: 'error',
      //   title: 'Failed',
      //   desc: 'Your wallet did not connect or refused to authorize.Please try again later.',
      // });
      setStep(2);
    }, [hasSource, hasCred]);
    const onCloseSucDialog = () => {};
    const onSubmitActiveRequestDialog = useCallback(() => {
      onSubmit();
    }, [onSubmit]);
    useEffect(() => {
      if (visible) {
        setStep(1);
        setActiveRequest(undefined);
      }
    }, [visible]);
    return (
      <div className="claimWrapper">
        {visible && step === 1 && (
          <ClaimDialog onClose={onClose} onSubmit={onSubmitClaimDialog} />
        )}
        {visible && step === 2 && (
          <AddSourceSucDialog
            onClose={onClose}
            onSubmit={onSubmitActiveRequestDialog}
            type={activeRequest?.type}
            title={activeRequest?.title}
            desc={activeRequest?.desc}
            headerType="claim"
          />
        )}
      </div>
    );
  }
);
export default ClaimWrapper;
