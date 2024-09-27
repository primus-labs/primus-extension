import React, { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { utils } from 'ethers';
import { setAttestLoading, setActiveAttestation } from '@/store/actions';
import useMsgs from '@/hooks/useMsgs';
import {
  ONCHAINVERIFICATIONCONTENTTYPELIST,
  ALLVERIFICATIONCONTENTTYPEEMAP,
} from '@/config/attestation';
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
    const { deleteErrorMsgs } = useMsgs();
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
    const verificationValueCN = useMemo(() => {
      let cN = 'verificationValue';
      const v = pswForm.verificationValue;
      // console.log('555-v', v)
      if (v) {
        cN += ' hasValue';
      }
      return cN;
    }, [pswForm.verificationValue]);
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
        // icon: iconWalletMetamask,
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
        ? activeAttestation?.msgObj?.btnTxt
          ? activeAttestation?.msgObj?.btnTxt
          : 'OK'
        : 'Next';
    }, [attestLoading, activeAttestation]);
    const valueList = useMemo(() => {
      let list: any[] = [];
      return list;
    }, [pswForm.verificationContent]);
    const handleClickNext = useCallback(async () => {
      if (!formLegal) {
        return;
      }
      if (loading) {
        return;
      }
      deleteErrorMsgs();
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
    useEffect(() => {
      if (!presets.verificationContent) {
        if (pswForm.verificationContent) {
          let newValue = '';
          if (pswForm.verificationContent === '3') {
            newValue = 'since 2024 July';
          }
          handleChangePswForm(newValue, 'verificationValue');
        }
      }
    }, [pswForm.verificationContent, handleChangePswForm, presets]);
    useEffect(() => {
      setPswForm(presets);
    }, [presets]);
    useEffect(() => {
      if (accountList.length === 1) {
        handleChangePswForm(accountList[0].value, 'account');
      }
    }, [accountList]);
    // const initActiveDataSouceUserInfo = useCallback(async () => {
    //   const res = await chrome.storage.local.get([dataSourceId]);
    //   if (res[dataSourceId]) {
    //     const newObj = JSON.parse(res[dataSourceId]);
    //     setActiveDataSouceUserInfo(newObj);
    //   }
    // }, []);
    // useEffect(() => {
    //   initActiveDataSouceUserInfo();
    // }, []);
    const initAttestLoadingFn = useCallback(() => {
      if (attestLoading > 1) {
        dispatch(setAttestLoading(0));
      }
    }, [attestLoading, dispatch]);
    useEffect(() => {
      initAttestLoadingFn();
    }, [pswForm]);

    return (
      <div className="pFormWrapper detailForm4">
        <div
          className={`formItem ${presets.verificationContent ? 'preset' : ''}`}
        >
          {presets.verificationContent ? (
            <>
              <div className="label">Verification Content</div>
              <div className="value">
                {
                  ALLVERIFICATIONCONTENTTYPEEMAP[presets.verificationContent]
                    .label
                }
              </div>
            </>
          ) : (
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
              disabled={presets?.verificationContent}
              // optionSuffix={optionSuffixEl()}
            />
          )}
        </div>
        <div
          className={`formItem ${presets.verificationValue ? 'preset' : ''} ${
            !presets.verificationContent && pswForm.verificationContent
              ? 'hasDefaultValue'
              : ''
          }`}
        >
          {pswForm.verificationContent ? (
            <>
              <div className="label">Verification Value</div>
              <div className="value">
                {presets.verificationValue || pswForm.verificationValue}
              </div>
            </>
          ) : (
            <PSelect
              className={verificationValueCN}
              label="Verification Value"
              align="horizontal"
              placeholder="Select value"
              list={valueList}
              onChange={(p) => {
                handleChangePswForm(p, 'verificationValue');
              }}
              value={pswForm.verificationValue}
              disabled={presets?.verificationValue}
            />
          )}
        </div>
        {/* different */}
        <div
          className={`formItem ${accountList.length === 1 ? 'staticItem' : ''}`}
        >
          {accountList.length > 1 ? (
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
          ) : (
            <>
              <div className="label">Verification Content</div>
              <div className="value">{accountList[0].label}</div>
            </>
          )}
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
