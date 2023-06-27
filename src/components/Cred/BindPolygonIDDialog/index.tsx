import React, { memo, useEffect, useCallback, useState, useMemo } from 'react';

import PMask from '@/components/PMask';
import QRCodeMain from '@/components/Cred/QRCodeMain';
import AddressInfoHeader from '@/components/Cred/AddressInfoHeader';
import './index.sass';

import {
  getConnectPolygonIdQrcode,
  getConnectPolygonIdResult,
  attestForPolygonId,
} from '@/services/api/cred';
import useUuid from '@/hooks/useUuid';
import useInterval from '@/hooks/useInterval';

import type { CredTypeItemType } from '@/components/Cred/CredItem';

interface BindPolygonIDDialogProps {
  onClose: () => void;
  onSubmit: () => void;
  activeCred?: CredTypeItemType;
}
type requestConfigParamsType = {
  extraHeader?: {
    'user-id': string;
    Authorization: string;
  };
};
const POLLINGTIME = 3000;
const BindPolygonIDDialog: React.FC<BindPolygonIDDialogProps> = memo(
  ({ onClose, onSubmit, activeCred }) => {
    const [did, setDid] = useState<string>()
    const [qrcodeVal, setQrcodeVal] = useState<string>('');
    const [connectFlag, setConnectFlag] = useState<boolean>(false);
    const [requestConfigParams, setRequestConfigParams] =
      useState<requestConfigParamsType>();
    const switchFlag = useMemo(() => {
      if (connectFlag) {
        return false;
      } else {
        return !!qrcodeVal;
      }
    }, [qrcodeVal, connectFlag]);

    const [uuid, setUuid] = useUuid();

    

    // console.log('ppid');
    const getUserInfo = useCallback(async () => {
      const { userInfo } = await chrome.storage.local.get(['userInfo']);
      const { id, token } = JSON.parse(userInfo);
      setRequestConfigParams({
        extraHeader: {
          'user-id': id,
          Authorization: `Bearer ${token}`,
        },
      });
    }, []);
    const handleClickNext = () => {
      onSubmit();
    };
    const fetchConnectQrcodeValue = useCallback(async () => {
      const params = {
        sessionId: uuid as string,
      };
      try {
        const res = await getConnectPolygonIdQrcode(
          params,
          requestConfigParams
        );
        const jsonStr = JSON.stringify(res);
        setQrcodeVal(jsonStr);
      } catch {
        alert('getConnectPolygonIdQrcode network error');
      }
    }, [uuid, requestConfigParams]);
    const fetchConnectResult = useCallback(async () => {
      const params = {
        sessionId: uuid as string,
        type: 'connection',
      };
      try {
        const res = await getConnectPolygonIdResult(
          params,
          requestConfigParams
        );
        if (res.rc === 0) {
          // res.result
          setDid(res.result.walletDid);
          // await chrome.storage.local.set({
          //   polygonIdConnectResult: JSON.stringify(res.result),
          // });
          setConnectFlag(true);
        }
      } catch {
        // alert('getConnectPolygonIdResult network error');
      }
    }, [requestConfigParams, uuid]);
    useInterval(fetchConnectResult, POLLINGTIME, switchFlag, false);
    const fetchAttestForPolygonId = useCallback(async () => {
      const params = {
        sessionId: uuid as string,
        id: did,
        birthday: 19960424,
        documentType: 2,
      };
      try {
        const res = await attestForPolygonId(params, requestConfigParams);
        if (res?.getDataTime) {
          const newRequestId = res.getDataTime;
          const fullAttestation = {
            ...activeCred,
            did,
            ...res,
            requestid: newRequestId,
          };

          const { credentials: credentialsStr } =
            await chrome.storage.local.get(['credentials']);
          const credentialsObj = credentialsStr
            ? JSON.parse(credentialsStr)
            : {};
          credentialsObj[newRequestId] = fullAttestation;
          await chrome.storage.local.set({
            credentials: JSON.stringify(credentialsObj),
          });
          onSubmit();
        }
      } catch {
        alert('attestForPolygonId network error');
      }
    }, [uuid, requestConfigParams, did,onSubmit]);

    useEffect(() => {
      requestConfigParams?.extraHeader && uuid && fetchConnectQrcodeValue();
    }, [requestConfigParams, uuid, fetchConnectQrcodeValue]);
    useEffect(() => {
      if (connectFlag) {
        fetchAttestForPolygonId();
      }
    }, [connectFlag, fetchAttestForPolygonId]);
    useEffect(() => {
      getUserInfo();
      (setUuid as () => void)();
    }, []);

    return (
      <PMask onClose={onClose}>
        <div className="padoDialog qrcodeDialog bindPolygonidDialog">
          <main>
            <AddressInfoHeader />
            <QRCodeMain
              title="Bind your Polygon DID"
              desc="Use your Polygon ID wallet to scan this QR code and bind your Polygon DID with this credential."
              qrcodeValue={qrcodeVal}
            />
          </main>
          <button className="nextBtn" onClick={handleClickNext}>
            <span>OK</span>
          </button>
        </div>
      </PMask>
    );
  }
);

export default BindPolygonIDDialog;
