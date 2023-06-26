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

const POLLINGTIME = 3000;
const BindPolygonIDDialog: React.FC<BindPolygonIDDialogProps> = memo(
  ({ onClose, onSubmit, activeCred }) => {
    const [qrcodeVal, setQrcodeVal] = useState<string>('');
    const [connectFlag, setConnectFlag] = useState<boolean>(false);
    const swtichFlag = useMemo(() => {
      if (connectFlag) {
        return false;
      } else {
        return !!qrcodeVal;
      }
    }, [qrcodeVal, connectFlag]);
    const puuid = useUuid();

    const fetchConnectResult = useCallback(async () => {
      const { userInfo } = await chrome.storage.local.get(['userInfo']);
      const { id, token } = JSON.parse(userInfo);
      const params = {
        sessionId: puuid, // TODO
        type: 'connection',
      };
      const configParams = {
        // TODO
        extraHeader: {
          'user-id': id,
          Authorization: `Bearer ${token}`,
        },
      };
      try {
        const res = await getConnectPolygonIdQrcode(params, configParams);

        // if (suc) {
        //   setConnectFlag(true)
        // }
      } catch {
        // alert('getConnectPolygonIdResult network error');
      }
    }, []);
    // useInterval(fetchConnectResult, POLLINGTIME, switchFlag, false);

    console.log('ppid');
    const handleClickNext = () => {
      onSubmit();
    };
    const fetchConnectQrcodeValue = useCallback(async () => {
      const { userInfo } = await chrome.storage.local.get(['userInfo']);
      const { id, token } = JSON.parse(userInfo);
      const params = {
        sessionId: puuid,
      };
      debugger;
      const configParams = {
        // TODO
        extraHeader: {
          'user-id': id,
          Authorization: `Bearer ${token}`,
        },
      };
      try {
        const res = await getConnectPolygonIdQrcode(params, configParams);
        // setQrcodeVal()
      } catch {
        alert('getConnectPolygonIdQrcode network error');
      }
    }, []);
    const fetchAttestForPolygonId = useCallback(async () => {
      const { userInfo } = await chrome.storage.local.get(['userInfo']);
      const { id, token } = JSON.parse(userInfo);
      const params = {
        sessionId: puuid, // TODO
      };
      const configParams = {
        // TODO
        extraHeader: {
          'user-id': id,
          Authorization: `Bearer ${token}`,
        },
      };
      try {
        const res = await attestForPolygonId(params, configParams);

        // if (suc) {
        //   onSubmit()
        // }
      } catch {
        alert('attestForPolygonId network error');
      }
    }, []);

    useEffect(() => {
      fetchConnectQrcodeValue();
    }, []);
    useEffect(() => {
      if (connectFlag) {
        //
      }
    }, [connectFlag]);

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
