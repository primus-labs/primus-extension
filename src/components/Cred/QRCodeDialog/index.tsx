import React, { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import PMask from '@/components/PMask';
import PButton from '@/components/PButton';
import AddressInfoHeader from '@/components/Cred/AddressInfoHeader';
import QRCodeMain from '@/components/Cred/QRCodeDialog/QRCodeMain';
// import iconExport from '@/assets/img/iconExport.svg';
import iconPolygonID from '@/assets/img/iconPolygonID.svg';
import './index.scss';

import { exportJson } from '@/utils/exportFile';
import { PADOADDRESS } from '@/config/envConstants';
import { getPolygonIdAttestation } from '@/services/api/cred';

import type { CredTypeItemType } from '@/types/cred';
import type { UserState } from '@/types/store';

interface QRCodeDialogProps {
  onClose: () => void;
  onSubmit: () => void;
  activeCred?: CredTypeItemType;
}

const QRCodeDialog: React.FC<QRCodeDialogProps> = memo(
  ({ onClose, onSubmit, activeCred }) => {
    const [jsonStr, setJsonStr] = useState<string>('');
    const [qrCodeVal, setQrCodeVal] = useState<string>('');
    const userInfo = useSelector((state: UserState) => state.userInfo);

    const isPolygonId = useMemo(() => {
      if (activeCred?.did) {
        return true;
      }
      return false;
    }, [activeCred]);
    const handleClickNext = () => {
      onSubmit();
    };
    const handleExport = () => {
      exportJson(jsonStr, 'Proof');
    };
    const getPolygonIdExportContent = useCallback(async () => {
      try {
        const { id, token } = userInfo;
        const requestConfigParams = {
          extraHeader: {
            'user-id': id,
            Authorization: `Bearer ${token}`,
          },
        };
        const params = {
          claimId: activeCred?.claimId as string,
        };
        const res = await getPolygonIdAttestation(params, requestConfigParams);

        if (res) {
          const str = JSON.stringify(res, null, '\t');
          setJsonStr(str);
        }
      } catch {
        alert('getPolygonIdAttestation network error');
      }
    }, [activeCred?.claimId]);
    useEffect(() => {
      if (activeCred) {
        let jsonStr: any;
        if (isPolygonId) {
          jsonStr = JSON.stringify(activeCred?.claimQrCode, null, '\t');
          getPolygonIdExportContent();
        } else {
          const {
            source,
            authUseridHash,
            address,
            getDataTime,
            baseValue,
            balanceGreaterThanBaseValue,
            signature,
          } = activeCred;
          jsonStr = JSON.stringify(
            {
              attester: PADOADDRESS,
              schemaData: {
                source,
                // useridhash,
                // sourceUseridHash: '',
                authUseridHash,
                receipt: address,
                getDataTime,
                baseValue,
                balanceGreaterThanBaseValue,
              },
              signature,
            },
            null,
            '\t'
          );
          setJsonStr(jsonStr);
        }
        setQrCodeVal(jsonStr);
      }
    }, [activeCred, isPolygonId, getPolygonIdExportContent]);

    return (
      <PMask onClose={onClose}>
        <div
          className={
            isPolygonId
              ? 'padoDialog qrcodeDialog scanDialog polygonIdScanDialog'
              : 'padoDialog qrcodeDialog scanDialog'
          }
        >
          <main>
            {isPolygonId ? (
              <AddressInfoHeader
                address={activeCred?.did as string}
                icon={iconPolygonID}
              />
            ) : (
              <AddressInfoHeader address={activeCred?.address as string} />
            )}
            <QRCodeMain
              title="Present Your Proof"
              desc={
                isPolygonId
                  ? 'Use your Polygon ID wallet to scan and import to your wallet.'
                  : 'Scan this QR code to use or download your proof.'
              }
              qrcodeValue={qrCodeVal}
            />
            <div className="exportWrapper" onClick={handleExport}>
              <i className="iconfont icon-iconExport"></i>
              <p>Export your proof</p>
            </div>
          </main>
          <PButton text="OK" onClick={handleClickNext} />
        </div>
      </PMask>
    );
  }
);

export default QRCodeDialog;
