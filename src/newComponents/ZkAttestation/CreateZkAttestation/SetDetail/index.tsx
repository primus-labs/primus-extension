import React, { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ASSETSVERIFICATIONCONTENTTYPELIST,
  ASSETSVERIFICATIONVALUETYPELIST,
} from '@/config/attestation';
import type { UserState } from '@/types/store';
import type { Dispatch } from 'react';
import PSelect from '@/newComponents/PSelect';
import PButton from '@/newComponents/PButton';

import './index.scss';
type PswFormType = {
  verificationContent: '';
  verificationValue: '';
};
interface SetPwdDialogProps {
  onSubmit: (form: PswFormType) => void;
  dataSourceId?:string
}
const SetPwdDialog: React.FC<SetPwdDialogProps> = memo(
  ({ onSubmit, dataSourceId }) => {
    const dispatch: Dispatch<any> = useDispatch();
    const [pswForm, setPswForm] = useState<PswFormType>({
      verificationContent: '',
      verificationValue: '',
    });
    const attestLoading = useSelector(
      (state: UserState) => state.attestLoading
    );
    const formLegal = useMemo(() => {
      return !!(pswForm.verificationContent && pswForm.verificationValue);
    }, [pswForm]);
    // const verificationContentList = useMemo(() => {

    // })
    const handleClickNext = useCallback(async () => {
      if (!formLegal) {
        return;
      }
      onSubmit(pswForm);

      return;
    }, [formLegal, pswForm]);
    // const tList = useMemo(() => {
    //   const sourceNameArr = ['binance', 'okx', 'coinbase'];
    //   const newArr = sourceNameArr.map((i) => {
    //     const metaInfo = DATASOURCEMAP[i];
    //     const isDisabled = !sourceMap2[i];
    //     return {
    //       label: metaInfo.name,
    //       value: metaInfo.id,
    //       icon: metaInfo.icon,
    //       disabled: isDisabled,
    //       tooltip: 'Add Data Source first',
    //     };
    //   });
    //   return newArr;
    // }, [sourceMap2]);
    const handleChangePswForm = useCallback((v, formKey) => {
      setPswForm((f) => ({ ...f, [formKey]: v }));
    }, []);

    return (
      <div className="pFormWrapper detailForm">
        <div className="formItem">
          <PSelect
            className="verificationContent"
            label="Verification Content"
            align="horizontal"
            placeholder="Choose Data Source"
            list={ASSETSVERIFICATIONCONTENTTYPELIST}
            onChange={(p) => {
              handleChangePswForm(p, 'verificationContent');
            }}
            value={pswForm.verificationContent}
            showSelf={false}
          />
        </div>
        <div className="formItem">
          <PSelect
            className="verificationValue"
            label="Verification Value"
            align="horizontal"
            placeholder="Select Value"
            list={ASSETSVERIFICATIONVALUETYPELIST}
            onChange={(p) => {
              handleChangePswForm(p, 'verificationValue');
            }}
            value={pswForm.verificationValue}
            showSelf={false}
          />
        </div>
        <div className="staticItem">
          <label>Account</label>
          <div className="value">
            <div className="account">shenminwen@gmail.com</div>
            <div className="balance">$123</div>
          </div>
        </div>
        <PButton
          text="Next"
          className="fullWidth confirmBtn"
          disabled={!formLegal}
          loading={formLegal && attestLoading === 1}
          onClick={handleClickNext}
        ></PButton>
      </div>
    );
  }
);

export default SetPwdDialog;
