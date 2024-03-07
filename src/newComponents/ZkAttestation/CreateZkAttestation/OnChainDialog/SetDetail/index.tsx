import React, { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ONCHAINVERIFICATIONCONTENTTYPELIST } from '@/config/attestation';
import useDataSource from '@/hooks/useDataSource';
import {
  gt,
  getTotalBalFromNumObjAPriceObj,
  getTotalBalFromAssetsMap,
  formatAddress
} from '@/utils/utils';

import type { UserState } from '@/types/store';
import type { Dispatch } from 'react';
import PSelect from '@/newComponents/PSelect';
import PButton from '@/newComponents/PButton';

import './index.scss';
import iconWalletMetamask from '@/assets/img/iconWalletMetamask.svg';
type PswFormType = {
  verificationContent: '';
  // verificationValue: ''; // different
  account: string;
};
interface SetPwdDialogProps {
  onSubmit: (form: PswFormType) => void;
  dataSourceId: string;
}
const SetPwdDialog: React.FC<SetPwdDialogProps> = memo(
  ({ onSubmit, dataSourceId }) => {
    const { userInfo: activeDataSouceUserInfo } = useDataSource(dataSourceId);
    const dispatch: Dispatch<any> = useDispatch();
    const [pswForm, setPswForm] = useState<PswFormType>({
      verificationContent: '',
      account: '',
    });
    const attestLoading = useSelector(
      (state: UserState) => state.attestLoading
    );
    const sysConfig = useSelector((state: UserState) => state.sysConfig);
    const onChainAssetsSources = useSelector(
      (state: UserState) => state.onChainAssetsSources
    );
    // different
    const accountList = useMemo(() => {
      let list = Object.values(onChainAssetsSources).map((i: any) => ({
        label: formatAddress(i.address,6,6),
        value: i.address,
        icon: iconWalletMetamask, //TODO-newui
      }));
      return list;
    }, [onChainAssetsSources]);
    //different
    const formLegal = useMemo(() => {
      return !!(pswForm.verificationContent && pswForm.account);
    }, [pswForm]);
    
    const handleClickNext = useCallback(async () => {
      if (!formLegal) {
        return;
      }
      //diffferent
      onSubmit(pswForm);
      return;
    }, [formLegal, pswForm,]);

    const handleChangePswForm = useCallback((v, formKey) => {
      setPswForm((f) => ({ ...f, [formKey]: v }));
    }, []);
    //different
    // useEffect(() => {
    //   handleChangePswForm(activeDataSouceUserInfo.userInfo.userName, 'account');
    // }, [activeDataSouceUserInfo]);

   

    return (
      <div className="pFormWrapper detailForm2">
        <div className="formItem">
          <PSelect
            className="verificationContent"
            label="Verification Content"
            align="horizontal"
            placeholder="Select Content"
            list={ONCHAINVERIFICATIONCONTENTTYPELIST}
            onChange={(p) => {
              handleChangePswForm(p, 'verificationContent');
            }}
            value={pswForm.verificationContent}
            showSelf={false}
          />
        </div>
        {/* different */}
        <div className="formItem">
          <PSelect
            className="account"
            label="Account"
            align="horizontal"
            placeholder="Select Account"
            list={accountList}
            onChange={(p) => {
              handleChangePswForm(p, 'account');
            }}
            value={pswForm.account}
            showSelf={false}
          />
        </div>
        {/* <div className="staticItem">
          <label>Account</label>
          <div className="value">
            <div className="account">
              {activeDataSouceUserInfo.userInfo.userName}
            </div>
            <div className="balance">${totalBalanceForAttest}</div>
          </div>
        </div> */}
        <PButton
          text={attestLoading === 3 ? 'Try Again' : 'Next'}
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
