import React, { memo, useEffect, useCallback, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';

import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';
import BindPolygonIDDialog from '@/components/Cred/BindPolygonIDDialog';

import './index.sass';

import { attestForPolygonId } from '@/services/api/cred';

import type { CredTypeItemType } from '@/components/Cred/CredItem';
import type { UserState } from '@/types/store';
interface BindPolygonIDProps {
  visible: boolean;
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
const BindPolygonID: React.FC<BindPolygonIDProps> = memo(
  ({ visible, onClose, onSubmit, activeCred }) => {
    const [did, setDid] = useState<string>();
    const connectFlag = useMemo(() => {
      return !!did;
    }, [did]);
    const userInfo = useSelector((state: UserState) => state.userInfo);
    const handleSubmitBindPolygonid = useCallback(
      async (uuid: string, didp: string) => {
        setDid(didp);
        const params = {
          sessionId: uuid,
          id: didp,
          birthday: 19960424, // TODO
          documentType: 2,
        };
        try {
          const { id, token } = userInfo;
          const requestConfigParams = {
            extraHeader: {
              'user-id': id,
              Authorization: `Bearer ${token}`,
            },
          };
          const res = await attestForPolygonId(params, requestConfigParams);
          if (res?.getDataTime) {
            const newRequestId = res.getDataTime;
            const fullAttestation = {
              ...activeCred,
              did: didp,
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
          } else {
            alert('attestForPolygonId network error');
          }
        } catch {
          alert('attestForPolygonId network error');
        }
      },
      [activeCred, onSubmit, userInfo]
    );
    useEffect(() => {
      if (visible) {
        setDid(undefined);
      }
    }, [visible]);

    return (
      <div className={visible ? 'bindPolygonId' : 'bindPolygonId hidden'}>
        {visible && !connectFlag && (
          <BindPolygonIDDialog
            activeCred={activeCred}
            onClose={onClose}
            onSubmit={handleSubmitBindPolygonid}
          />
        )}
        {visible && connectFlag && (
          <AddSourceSucDialog
            onClose={onClose}
            onSubmit={onSubmit}
            type="warn"
            title="A new attestation is processing"
            desc="It may take a few seconds."
            headerType="polygonIdAttestation"
            address={did as string}
          />
        )}
      </div>
    );
  }
);

export default BindPolygonID;
