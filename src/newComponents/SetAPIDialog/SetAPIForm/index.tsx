import React, { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useDataSource from '@/hooks/useDataSource';
import { setConnectByAPILoading } from '@/store/actions';
import PInput from '@/newComponents/PInput';
import PButton from '@/newComponents/PButton';

import { postMsg } from '@/utils/utils';
import { guideMap } from '@/config/dataSource';
import { initWalletAddressActionAsync } from '@/store/actions';

import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';

import './index.scss';
interface SetPwdDialogProps {
  sourceName: string; // lowerCase
  onSubmit: () => void;
}
type PswFormType = {
  apiKey: string;
  secretKey: string;
  passphase?: string;
};

const SetPwdDialog: React.FC<SetPwdDialogProps> = memo(
  ({ onSubmit, sourceName }) => {
    const dispatch: Dispatch<any> = useDispatch();
    const [pswForm, setPswForm] = useState<PswFormType>({
      apiKey: '',
      secretKey: '',
      passphase: '',
    });
    const padoServicePort = useSelector(
      (state: UserState) => state.padoServicePort
    );
    const connectByAPILoading = useSelector(
      (state: UserState) => state.connectByAPILoading
    );
    const {
      metaInfo: activeDataSouceMetaInfo,
      // userInfo: activeDataSouceUserInfo,
      // deleteFn: deleteDataSourceFn,
    } = useDataSource(sourceName);

    const activeGuideUrl = useMemo(() => {
      if (sourceName) {
        return guideMap[sourceName as keyof typeof guideMap];
      } else {
        return '';
      }
    }, [sourceName]);
    const formLegalObj = useMemo(() => {
      const passwordHasValue =
        pswForm.apiKey !== '' && pswForm.apiKey !== undefined;
      const secretKeyHasValue =
        pswForm.secretKey !== '' && pswForm.secretKey !== undefined;
      activeDataSouceMetaInfo.requirePassphase;
      const passphaseHasValue =
        pswForm.passphase !== '' && pswForm.passphase !== undefined;
      return {
        apiKey: passwordHasValue ? 1 : 0,
        secretKey: secretKeyHasValue ? 1 : 0,
        passphaseLegal: activeDataSouceMetaInfo.requirePassphase
          ? passphaseHasValue
            ? 1
            : 0
          : 1,
      };
    }, [pswForm]);
    const formLegal = useMemo(() => {
      const Leagal = Object.values(formLegalObj).every((i) => i === 1);
      return Leagal;
    }, [formLegalObj]);
    // const onSubmitDataSourcesDialog = useCallback(
    //   async (item: ExchangeMeta) => {
    //     if (item.type === 'Assets') {
    //       if (item.name === 'On-chain') {
    //         setConnectWalletDataDialogVisible(true);
    //         setStep(0);
    //       } else {
    //         setActiveSource(item);
    //         setStep(2);
    //       }
    //     } else if (item.type === 'Social') {
    //       authorize(item.name.toUpperCase(), () => {
    //         setStep(0);
    //         dispatch(setSocialSourcesAsync());
    //       });
    //     } else if (item.type === 'Identity') {
    //       setActiveSource(item);
    //       setStep(0);
    //       setKYCDialogVisible(true);
    //     }
    //   },
    //   [authorize, dispatch, connectedWallet?.address]
    // );
    const handleClickNext = useCallback(async () => {
      if (!formLegal) {
        return;
      }
      dispatch(setConnectByAPILoading(1));
      const form = {
        name: sourceName,
        ...pswForm,
        // label,
      };
      const reqType = `set-${sourceName}`;
      const msg: any = {
        fullScreenType: 'networkreq',
        type: reqType,
        params: {
          ...form,
        },
      };
      postMsg(padoServicePort, msg);
      console.log(`page_send:${reqType} request`);
    }, [formLegal, dispatch, padoServicePort, pswForm]);
    const handleChangePswForm = useCallback((v, formKey) => {
      setPswForm((f) => ({ ...f, [formKey]: v }));
    }, []);
    useEffect(() => {
      if (connectByAPILoading === 2) {
        onSubmit();
        return () => {
          dispatch(setConnectByAPILoading(0));
        };
      }
    }, [connectByAPILoading, onSubmit]);

    return (
      <div className="pFormWrapper pswForm">
        <div className="formItem">
          <PInput
            label="API Key"
            placeholder="Please enter your API Key"
            onChange={(p) => {
              handleChangePswForm(p, 'apiKey');
            }}
            value={pswForm.apiKey}
            tooltip={{ link: activeGuideUrl }}
          />
        </div>
        <div className="formItem">
          <PInput
            label="Secret Key"
            placeholder="Please enter your Secret Key"
            type="password"
            onChange={(p) => {
              handleChangePswForm(p, 'secretKey');
            }}
            value={pswForm.secretKey}
          />
        </div>
        {activeDataSouceMetaInfo.requirePassphase && (
          <div className="formItem">
            <PInput
              label="Passphrase"
              placeholder="Please enter your Passphrase"
              type="password"
              onChange={(p) => {
                handleChangePswForm(p, 'passphase');
              }}
              value={pswForm.passphase}
            />
          </div>
        )}
        <PButton
          text="Confirm"
          className="fullWidth confirmBtn"
          disabled={!formLegal}
          loading={formLegal && connectByAPILoading === 1}
          onClick={handleClickNext}
        ></PButton>
      </div>
    );
  }
);

export default SetPwdDialog;
