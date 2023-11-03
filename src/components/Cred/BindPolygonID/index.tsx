import React, { memo, useEffect, useCallback, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';

import TransferToChainDialog from '@/components/DataSourceDetail/TransferToChainDialog'
import AddressInfoHeader from '@/components/Cred/AddressInfoHeader';
import AddSourceSucDialog from '@/components/DataSourceOverview/AddSourceSucDialog';
import BindPolygonIDDialog from './BindPolygonIDDialog';

import { attestForPolygonId } from '@/services/api/cred';
import { CredVersion, schemaTypeMap } from '@/config/constants';
import type { CredTypeItemType } from '@/types/cred';
import type { UserState } from '@/types/store';
import type { ActiveRequestType } from '@/types/config';

import iconPolygonID from '@/assets/img/iconPolygonID.svg';

import './index.scss';


interface BindPolygonIDProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  activeCred?: CredTypeItemType;
}
const sourceList = [
  //name value
  {
    title: 'Polyon ID',
    showName: 'Polyon ID',
    icon: iconPolygonID,
    name: 'Polyon ID',
    value: 'Polyon ID',
  },
];
const BindPolygonID: React.FC<BindPolygonIDProps> = memo(
  ({ visible, onClose, onSubmit, activeCred }) => {
    const [activeRequest, setActiveRequest] = useState<ActiveRequestType>({
      type: 'loading',
      title: 'A new attestation is processing',
      desc: 'It may take a few seconds.',
    });
    const [step, setStep] = useState<number>(0);
    const [did, setDid] = useState<string>();
    const connectFlag = useMemo(() => {
      return !!did;
    }, [did]);
    const userInfo = useSelector((state: UserState) => state.userInfo);
    const handleSubmitBindPolygonid = useCallback(
      async (uuid: string, didp: string) => {
        console.log('handleSubmitBindPolygonid');
        setDid(didp);
        setStep(3)
        try {
          const { id, token } = userInfo;
          const requestConfigParams = {
            extraHeader: {
              'user-id': id,
              Authorization: `Bearer ${token}`,
            },
          };
          const {
            type,
            signature,
            source,
            getDataTime,
            address,
            baseValue,
            balanceGreaterThanBaseValue,
            exUserId,
            holdingToken,
          } = activeCred as CredTypeItemType;
          const formatType = `${
            schemaTypeMap[type as keyof typeof schemaTypeMap]
          }_POLYGON`;
          const params: any = {
            sessionId: uuid,
            credType: formatType,
            signature,
            credentialSubject: {
              id: didp,
              source,
              sourceUserId: exUserId,
              authUserId: id,
              getDataTime,
              recipient: address,
              baseValue,
              balanceGreaterThanBaseValue,
            },
            update: 'false',
          };
          if (type === 'TOKEN_HOLDINGS') {
            params.credentialSubject.asset = holdingToken;
          }
          const res = await attestForPolygonId(params, requestConfigParams);
          if (res?.getDataTime) {
            const newRequestId = uuid;

            const fullAttestation = {
              ...activeCred,
              did: didp,
              ...res,
              requestid: newRequestId,
              issuer: res.claimQrCode.from,
              schemaName: 'PolygonID',
              provided: [],
              signature: res.claimSignatureInfo.signature,
              encodedData: res.claimSignatureInfo.encodedData,
              version: CredVersion,
              credVersion: CredVersion,
            };
            fullAttestation.schemaType = formatType;
            const { credentials: credentialsStr } =
              await chrome.storage.local.get(['credentials']);
            const credentialsObj = credentialsStr
              ? JSON.parse(credentialsStr)
              : {};
            credentialsObj[newRequestId] = fullAttestation;
            await chrome.storage.local.set({
              credentials: JSON.stringify(credentialsObj),
            });
            setActiveRequest({
              type: 'suc',
              title: 'Congratulations',
              desc: 'A new attestation with Polygon DID is successfully granted!',
            });
          } else {
            setActiveRequest({
              type: 'error',
              title: 'Failed',
              desc: 'Failed to grant new authentication to Polygon DID!',
            });
            alert('attestForPolygonId network error');
          }
        } catch {
          setActiveRequest({
            type: 'error',
            title: 'Failed',
            desc: 'Failed to grant new authentication to Polygon DID!',
          });
          alert('attestForPolygonId network error');
        }
      },
      [activeCred, userInfo]
    );
    const handleSubmitTransferToChain = useCallback((item:any) => {
      setStep(2)
    }, [])
    const onBackBindPolygonIDDialog = useCallback(() => {
      setStep(1)
    },[])
    useEffect(() => {
      if (visible) {
        setDid(undefined);
        setStep(1)
      }
    }, [visible]);

    return (
      <div className={visible ? 'bindPolygonId' : 'bindPolygonId hidden'}>
        {visible && step === 1 && (
          <TransferToChainDialog
            title="Bind to Your DID"
            desc="Bind your attestation to one of the following on-chain identity."
            list={sourceList}
            tip="Please select one on-chain identity"
            checked={false}
            backable={false}
            headerType={'attestation'}
            address={activeCred?.address}
            onClose={onClose}
            onSubmit={handleSubmitTransferToChain}
            onCancel={onClose}
          />
        )}
        {visible && step === 2 && (
          <BindPolygonIDDialog
            activeCred={activeCred}
            onClose={onClose}
            onSubmit={handleSubmitBindPolygonid}
            onBack={onBackBindPolygonIDDialog}
          />
        )}
        {visible && step === 3 && (
          <AddSourceSucDialog
            onClose={onClose}
            onSubmit={onSubmit}
            type={activeRequest.type}
            title={activeRequest.title}
            desc={activeRequest.desc}
            headerEl={
              <AddressInfoHeader address={did as string} icon={iconPolygonID} />
            }
          />
        )}
      </div>
    );
  }
);

export default BindPolygonID;
