import React, { useState, useEffect, memo, useMemo } from 'react';

import PMask from '@/components/PMask';
import AddressInfoHeader from '@/components/Cred/AddressInfoHeader';
import PolygonIdAddressInfoHeader from '@/components/Cred/PolygonIdAddressInfoHeader';
import QRCodeMain from '@/components/Cred/QRCodeMain';
import iconExport from '@/assets/img/iconExport.svg';
import './index.sass';

import { exportJson } from '@/utils/exportFile';
import { PADOADDRESS } from '@/config/envConstants';

import type { CredTypeItemType } from '@/components/Cred/CredItem';

interface QRCodeDialogProps {
  onClose: () => void;
  onSubmit: () => void;
  activeCred?: CredTypeItemType;
}

const QRCodeDialog: React.FC<QRCodeDialogProps> = memo(
  ({ onClose, onSubmit, activeCred }) => {
    const [jsonStr, setJsonStr] = useState<string>('');
    const isPolygonId = useMemo(() => {
      if (activeCred?.did) {
        return true;
      }
      return false;
    }, activeCred);
    const handleClickNext = () => {
      onSubmit();
    };
    const handleExport = () => {
      exportJson(jsonStr, 'credential');
    };
    useEffect(() => {
      // TODO
      if (activeCred) {
        const {
          source,
          authUseridHash,
          address,
          getDataTime,
          baseValue,
          balanceGreaterThanBaseValue,
          signature,
        } = activeCred;
        const jsonStr = JSON.stringify(
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
    }, [activeCred]);

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
            {/* <PolygonIdAddressInfoHeader address="did:polygonid:polygon:mumbai:2qGU9NsbhEkTki4yC7vmkpQsr9RvGQEVfnwkktJR6L" /> */}
            {isPolygonId ? (
              <PolygonIdAddressInfoHeader address="" />
            ) : (
              <AddressInfoHeader />
            )}
            <QRCodeMain
              title="Present Your Credential"
              desc={
                isPolygonId
                  ? 'Use your Polygon ID wallet to scan this QR code to import your credential. This process will verify your identity and authorize you to use the credential.'
                  : 'Scan this QR code to use or download your credential.'
              }
              qrcodeValue={jsonStr}
            />
            <div className="exportWrapper" onClick={handleExport}>
              <img className="exportIcon" src={iconExport} alt="" />
              <p>Export your credential</p>
            </div>
          </main>
          <button className="nextBtn" onClick={handleClickNext}>
            <span>OK</span>
          </button>
        </div>
      </PMask>
    );
  }
);

export default QRCodeDialog;
