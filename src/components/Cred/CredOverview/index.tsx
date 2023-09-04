import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import CredList from '@/components/Cred/CredList';
import QRCodeDialog from '@/components/Cred/QRCodeDialog';
import DataAddBar from '@/components/DataSourceOverview/DataAddBar';
import BindPolygonID from '@/components/Cred/BindPolygonID';
import CredSendToChainWrapper from '../CredSendToChainWrapper';
import { setCredentialsAsync } from '@/store/actions';

import {postMsg} from '@/utils/utils'
import type { Dispatch } from 'react';
import type { CredTypeItemType } from '@/types/cred';
import type { UserState } from '@/types/store';

import CredAddWrapper from '../CredAddWrapper';
import './index.sass';

const CredOverview = memo(() => {

  const [activeSourceName, setActiveSourceName] = useState<string>();
  const [addDialogVisible, setAddDialogVisible] = useState<boolean>(false);
  const [sendToChainDialogVisible, setSendToChainDialogVisible] =
    useState<boolean>(false);
  const [bindPolygonidVisible, setBindPolygonidVisible] =
    useState<boolean>(false);
  const [qrcodeVisible, setQrcodeVisible] = useState<boolean>(false);
  const [activeCred, setActiveCred] = useState<CredTypeItemType>();
  const [searchParams] = useSearchParams();
  const createFlag = searchParams.get('createFlag')?.toLowerCase();
  const proofType:any = searchParams.get('proofType');

  const activeSourceType = useSelector(
    (state: UserState) => state.activeSourceType
  );
  const filterWord = useSelector((state: UserState) => state.filterWord);
  const proofTypes = useSelector((state: UserState) => state.proofTypes);
  const credentialsFromStore = useSelector(
    (state: UserState) => state.credentials
  );
  const padoServicePort = useSelector(
    (state: UserState) => state.padoServicePort
  );

  const dispatch: Dispatch<any> = useDispatch();

  const credList: CredTypeItemType[] = useMemo(() => {
    let credArr = Object.values(credentialsFromStore);
    credArr = credArr.sort(
      (a, b) => Number(a.getDataTime) - Number(b.getDataTime)
    );
    return credArr;
  }, [credentialsFromStore]);
  const filteredCredList: CredTypeItemType[] = useMemo(() => {
    let activeList = credList;
    if (activeSourceType && activeSourceType !== 'All') {
      activeList = activeList.filter((i) => {
        const curProofTypeItem = proofTypes.find(
          (j) => j.credIdentifier === i.type
        );
        return curProofTypeItem?.simplifiedName === activeSourceType;
      });
    }
    if (filterWord) {
      activeList = activeList.filter((i) =>
        i.source.toLowerCase().startsWith(filterWord)
      );
    }
    return activeList;
  }, [credList, activeSourceType, filterWord, proofTypes]);

  const initCredList = useCallback(async () => {
    await dispatch(setCredentialsAsync());
  }, [dispatch]);

  const handleUpChain = useCallback((item: CredTypeItemType) => {
    setActiveCred(item);
    setSendToChainDialogVisible(true);
  }, []);
  const handleViewQrcode = useCallback((item: CredTypeItemType) => {
    setActiveCred(item);
    setQrcodeVisible(true);
  }, []);
  const handleBindPolygonID = useCallback((item: CredTypeItemType) => {
    setActiveCred(item);
    setBindPolygonidVisible(true);
  }, []);
  const handleCloseQrcode = useCallback(() => {
    setQrcodeVisible(false);
  }, []);
  const handleCloseBindPolygonid = useCallback(() => {
    setBindPolygonidVisible(false);
  }, []);
  const handleDeleteCred = useCallback(
    async (item: CredTypeItemType) => {
      const curRequestid = item.requestid;
      const cObj = { ...credentialsFromStore };
      delete cObj[curRequestid];
      chrome.storage.local.set({
        credentials: JSON.stringify(cObj),
      });
      await initCredList();
    },
    [initCredList, credentialsFromStore]
  );
  const handleUpdateCred = useCallback((item: CredTypeItemType) => {
    setActiveCred(item);
    setAddDialogVisible(true);
  }, []);

  const handleAdd = useCallback(() => {
    setActiveCred(undefined);
    setAddDialogVisible(true);
  }, []);

  const handleSubmitBindPolygonid = useCallback(async () => {
    await initCredList();
    setBindPolygonidVisible(false);
  }, [initCredList]);

  useEffect(() => {
    initCredList();
  }, []);
  useEffect(() => {
    dispatch({
      type: 'setActiveSourceType',
      payload: 'All',
    });
    return () => {
      dispatch({
        type: 'setActiveSourceType',
        payload: 'All',
      });
    };
  }, [dispatch]);

  const handleCloseAddDialog = useCallback(() => {
    setActiveSourceName(undefined);
    setAddDialogVisible(false);
  }, []);
  const handleCloseSendToChainDialog = useCallback(() => {
    setSendToChainDialogVisible(false);
  }, []);

  useEffect(() => {
    if (createFlag || proofType) {
      setActiveSourceName(createFlag);
      setAddDialogVisible(true);
    } else {
      setActiveSourceName(undefined);
      setAddDialogVisible(false);
    }
  }, [createFlag, proofType]);

  useEffect(() => {
    return () => {
      const msg = {
        fullScreenType: 'algorithm',
        reqMethodName: 'stop',
        // params: {},
        params: {
          noRestart: true,
        },
      };
      console.log('before leave page credit port:', padoServicePort);
      postMsg(padoServicePort, msg);
    };
  }, [padoServicePort]);
  return (
    <div className="credOverview">
      <CredList
        list={filteredCredList}
        onUpChain={handleUpChain}
        onViewQrcode={handleViewQrcode}
        onBindPolygonID={handleBindPolygonID}
        onDelete={handleDeleteCred}
        onUpdate={handleUpdateCred}
        onAdd={handleAdd}
      />
      <CredAddWrapper
        visible={addDialogVisible}
        activeCred={activeCred}
        activeSource={activeSourceName}
        onClose={handleCloseAddDialog}
        onSubmit={handleCloseAddDialog}
        type={proofType}
      />
      <CredSendToChainWrapper
        visible={sendToChainDialogVisible}
        activeCred={activeCred}
        onClose={handleCloseSendToChainDialog}
        onSubmit={handleCloseSendToChainDialog}
      />
      {qrcodeVisible && (
        <QRCodeDialog
          activeCred={activeCred}
          onClose={handleCloseQrcode}
          onSubmit={() => {
            setQrcodeVisible(false);
          }}
        />
      )}
      <BindPolygonID
        visible={bindPolygonidVisible}
        activeCred={activeCred}
        onClose={handleCloseBindPolygonid}
        onSubmit={handleSubmitBindPolygonid}
      />
      {credList.length > 0 && (
        <DataAddBar
          onClick={() => {
            handleAdd();
          }}
        />
      )}
    </div>
  );
});

export default CredOverview;
