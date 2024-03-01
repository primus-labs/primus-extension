import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type {UserState} from '@/types/store'
import Banner from '@/newComponents/Home/Banner';
import AttestationTypeList from '@/newComponents/ZkAttestation/AttestationTypeList';
import AssetDialog from '@/newComponents/ZkAttestation/CreateZkAttestation/AssetDialog'
import AttestationCards from '@/newComponents/ZkAttestation/AttestationCards';
import { postMsg } from '@/utils/utils';
import empty from '@/assets/newImg/zkAttestation/empty.svg';

import './index.scss';

const Home = memo(() => {
  const [visibleAssetDialog, setVisibleAssetDialog] = useState<boolean>(false);
  const credentialsFromStore = useSelector(
    (state: UserState) => state.credentials
  );
  const hasConnected = useMemo(() => {
    return Object.keys(credentialsFromStore).length >0;
  }, [credentialsFromStore]);
  const handleCreate = useCallback((typeItem) => {
    setVisibleAssetDialog(true);
  }, []);
  const handleCloseAssetDialog = useCallback(() => {
    setVisibleAssetDialog(false);
  }, []);
  const handleSubmitAssetDialog = useCallback(() => {}, []);
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
          <AssetDialog
            onClose={handleCloseAssetDialog}
            onSubmit={handleSubmitAssetDialog}
          />
        )}
      </div>
    </div>
  );
});
export default Home;
