import React, { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { utils } from 'ethers';
import { setAttestLoading, setActiveAttestation } from '@/store/actions';
import { ONCHAINVERIFICATIONCONTENTTYPELIST } from '@/config/attestation';
import useDataSource from '@/hooks/useDataSource';
import {
  gt,
  getTotalBalFromNumObjAPriceObj,
  getTotalBalFromAssetsMap,
  formatAddress,
} from '@/utils/utils';

import type { UserState } from '@/types/store';
import type { Dispatch } from 'react';
import PSelect from '@/newComponents/PSelect';
import PButton from '@/newComponents/PButton';

import './index.scss';
import iconWalletMetamask from '@/assets/img/iconWalletMetamask.svg';
import iconProviderBrevis from '@/assets/newImg/zkAttestation/iconProviderBrevis.svg';
type PswFormType = {
  verificationContent: '';
  verificationValue: '';
  account: string;
};
interface SetPwdDialogProps {
  onSubmit: (form: PswFormType) => void;
  // dataSourceId: string;
  presets: any;
}
const SetPwdDialog: React.FC<SetPwdDialogProps> = memo(
  ({ onSubmit, presets }) => {
    const dispatch = useDispatch();
    const { dataSourceId } = presets;
    const [activeDataSouceUserInfo, setActiveDataSouceUserInfo] =
      useState<any>();
    const [pswForm, setPswForm] = useState<PswFormType>({
      verificationContent: '',
      verificationValue: '',
      account: '',
    });
    const attestLoading = useSelector(
      (state: UserState) => state.attestLoading
    );
    const activeAttestation = useSelector(
      (state: UserState) => state.activeAttestation
    );
    const webProofTypes = useSelector(
      (state: UserState) => state.webProofTypes
    );
    const onChainAssetsSources = useSelector(
      (state: UserState) => state.onChainAssetsSources
    );
    const verificationContentCN = useMemo(() => {
      let cN = 'verificationContent';
      const v = pswForm.verificationContent;
      if (v) {
        cN += ' hasValue';
      }
      return cN;
    }, [pswForm.verificationContent]);
    const accountCN = useMemo(() => {
      let cN = 'account';
      const v = pswForm.account;
      if (v) {
        cN += ' hasValue';
      }
      return cN;
    }, [pswForm.account]);
    // different
    const accountList = useMemo(() => {
      let list = Object.values(onChainAssetsSources).map((i: any) => ({
        label: formatAddress(utils.getAddress(i.address), 7, 5),
        value: i.address,
        icon: iconWalletMetamask, //TODO-newui
      }));
      return list;
    }, [onChainAssetsSources]);
    //different
    const formLegal = useMemo(() => {
      return !!(pswForm.verificationContent && pswForm.account);
    }, [pswForm]);

    const loading = useMemo(() => {
      return formLegal && attestLoading === 1;
    }, [formLegal, attestLoading]);
    const formatBtnTxt = useMemo(() => {
      return attestLoading === 3
        ? activeAttestation?.btnTxt
          ? activeAttestation?.btnTxt
          : 'OK'
        : 'Next';
    }, [attestLoading, activeAttestation]);
    const handleClickNext = useCallback(async () => {
      if (!formLegal) {
        return;
      }
      if (loading) {
        return;
      }
      if (formatBtnTxt === 'OK') {
        dispatch(setAttestLoading(2));
        dispatch(setActiveAttestation(undefined));
      } else {
        //different
        onSubmit(pswForm);
      }

      return;
    }, [formLegal, pswForm, loading, formatBtnTxt, dispatch]);

    const handleChangePswForm = useCallback((v, formKey) => {
      setPswForm((f) => ({ ...f, [formKey]: v }));
    }, []);
    //different
    // useEffect(() => {
    //   handleChangePswForm(activeDataSouceUserInfo.userInfo.userName, 'account');
    // }, [activeDataSouceUserInfo]);
    const optionSuffixEl = () => {
      return (
        <div className="optionSuffixProvider">
          <span>By</span>
          <img src={iconProviderBrevis} alt="" />
          <span>Brevis</span>
        </div>
      );
    };

    return (
      <div className="pFormWrapper detailForm2">
        <div className="formItem">
          <PSelect
            className={verificationContentCN}
            label="Verification Content"
            align="horizontal"
            placeholder="Select content"
            list={ONCHAINVERIFICATIONCONTENTTYPELIST}
            onChange={(p) => {
              handleChangePswForm(p, 'verificationContent');
            }}
            value={pswForm.verificationContent}
            optionSuffix={optionSuffixEl()}
          />
        </div>
        {/* different */}
        <div className="formItem">
          <PSelect
            className={accountCN}
            label="Data Account"
            align="horizontal"
            placeholder="Select account"
            list={accountList}
            onChange={(p) => {
              handleChangePswForm(p, 'account');
            }}
            value={pswForm.account}
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
          text={formatBtnTxt}
          className="fullWidth confirmBtn"
          disabled={!formLegal}
          loading={loading}
          onClick={handleClickNext}
        ></PButton>
      </div>
    );
  }
);

export default SetPwdDialog;
