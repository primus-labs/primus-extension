import React, { useState, useMemo, memo, useCallback,useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useDataSource from '@/hooks/useDataSource';
import { setConnectByAPILoading } from '@/store/actions';
import PInput from '@/newComponents/PInput';
import PButton from '@/newComponents/PButton';

import { postMsg } from '@/utils/utils';
import { initWalletAddressActionAsync } from '@/store/actions';

import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';

import './index.scss';
interface SetPwdDialogProps {
  sourceName: string;
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
    //       // TODO
    //       setActiveSource(item);
    //       setStep(0);
    //       setKYCDialogVisible(true);
    //     }
    //   },
    //   [authorize, dispatch, connectedWallet?.address]
    // );
    const fetchBindUserAddress = useCallback(() => {
      const form = {
        name: sourceName,
        ...pswForm,
        // label,
      };
      dispatch(setConnectByAPILoading(true));
      const reqType = `set-${sourceName}`;
      const msg: any = {
        fullScreenType: 'networkreq',
        type: reqType,
        params: {
          ...form,
        },
      };
      debugger;
      postMsg(padoServicePort, msg);
      console.log(`page_send:${reqType} request`);
      // const sourceType = activeDataSouceMetaInfo.type
      // if (sourceType === 'Assets') {
      //   if (activeDataSouceMetaInfo.name === 'Web3 Wallet') {
      //   } else {
      //   }
      // }
      // onSubmit(form);
    }, [dispatch, padoServicePort, pswForm]);
    const handleClickNext = useCallback(async () => {
      if (!formLegal) {
        return;
      }
      fetchBindUserAddress();
    }, [formLegal, fetchBindUserAddress]);
    const handleChangePswForm = useCallback((v, formKey) => {
      setPswForm((f) => ({ ...f, [formKey]: v }));
    }, []);
    useEffect(() => {
      if (!connectByAPILoading && pswForm.apiKey) {
        onSubmit();
      }
    }, [connectByAPILoading, pswForm, onSubmit]);
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
          loading={connectByAPILoading}
          onClick={handleClickNext}
        ></PButton>
      </div>
    );
  }
);

export default SetPwdDialog;
