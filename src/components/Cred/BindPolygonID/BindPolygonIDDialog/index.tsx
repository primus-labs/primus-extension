import React, { memo, useEffect, useCallback, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import PMask from '@/components/PMask';
import QRCodeMain from '@/components/Cred/QRCodeDialog/QRCodeMain';
import AddressInfoHeader from '@/components/Cred/AddressInfoHeader';
import './index.sass';

import {
  getConnectPolygonIdQrcode,
  getConnectPolygonIdResult,
} from '@/services/api/cred';
import useUuid from '@/hooks/useUuid';
import useInterval from '@/hooks/useInterval';

import type { CredTypeItemType } from '@/types/cred';
import type { UserState } from '@/types/store';
interface BindPolygonIDDialogProps {
  onClose: () => void;
  onSubmit: (uuid: string, did: string) => void;
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
    const [qrcodeVal, setQrcodeVal] = useState<string>('');
    const [connectFlag, setConnectFlag] = useState<boolean>(false);
    const [requestConfigParams, setRequestConfigParams] =
      useState<requestConfigParamsType>();
    const userInfo = useSelector((state: UserState) => state.userInfo);

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
      const { id, token } = userInfo;
      setRequestConfigParams({
        extraHeader: {
          'user-id': id,
          Authorization: `Bearer ${token}`,
        },
      });
    }, [userInfo]);
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
          console.log('polygonID connected!');
          const pdid = res.result.walletDid;
          setConnectFlag(true);
          onSubmit(uuid as string, pdid as string);
        }
      } catch {
        // alert('getConnectPolygonIdResult network error');
      }
    }, [requestConfigParams, uuid, onSubmit]);
    useInterval(fetchConnectResult, POLLINGTIME, switchFlag, false);

    useEffect(() => {
      requestConfigParams?.extraHeader && uuid && fetchConnectQrcodeValue();
    }, [requestConfigParams, uuid, fetchConnectQrcodeValue]);
    // useEffect(() => {
    //   if (connectFlag) {
    //     fetchAttestForPolygonId();
    //   }
    // }, [connectFlag, fetchAttestForPolygonId]);
    useEffect(() => {
      getUserInfo();
      (setUuid as () => void)();
    }, []);

    return (
      <>
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
          </div>
        </PMask>
      </>
    );
  }
);

export default BindPolygonIDDialog;
