import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { UserState } from '@/types/store';
import Banner from '@/newComponents/Home/Banner';
import AttestationTypeList from '@/newComponents/ZkAttestation/AttestationTypeList';
import CreateZkAttestation from '@/newComponents/ZkAttestation/CreateZkAttestation';
import AttestationCards from '@/newComponents/ZkAttestation/AttestationCards';
import { postMsg } from '@/utils/utils';
import empty from '@/assets/newImg/zkAttestation/empty.svg';

import './index.scss';

const Home = memo(() => {
  const [visibleAssetDialog, setVisibleAssetDialog] = useState<string>('');
  const credentialsFromStore = useSelector(
    (state: UserState) => state.credentials
  );
  const attestLoading = useSelector((state: UserState) => state.attestLoading);
  const hasConnected = useMemo(() => {
    return Object.keys(credentialsFromStore).length > 0;
  }, [credentialsFromStore]);
  const handleCreate = useCallback((typeItem) => {
    setVisibleAssetDialog(typeItem.id);
  }, []);
  const handleCloseAssetDialog = useCallback(() => {
    setVisibleAssetDialog('');
  }, []);
  const handleSubmitAssetDialog = useCallback(() => {}, []);
  useEffect(() => {
    if (attestLoading === 2) {
      setVisibleAssetDialog('');
    }
  }, [attestLoading]);
  return (
    <div className="pageZkAttestation">
      <div className="pageContent">
        <Banner />
        <AttestationTypeList onClick={handleCreate} />
        {hasConnected ? (
          <AttestationCards />
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
      </div>
    </div>
  );
});
export default Home;
