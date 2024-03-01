import React, { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ASSETSVERIFICATIONCONTENTTYPELIST,
  ASSETSVERIFICATIONVALUETYPELIST,
} from '@/config/attestation';
import useDataSource from '@/hooks/useDataSource';
import {
  gt,
  getTotalBalFromNumObjAPriceObj,
  getTotalBalFromAssetsMap,
} from '@/utils/utils';
import { setAttestLoading } from '@/store/actions';

import type { UserState } from '@/types/store';
import type { Dispatch } from 'react';
import PSelect from '@/newComponents/PSelect';
import PButton from '@/newComponents/PButton';

import './index.scss';
type PswFormType = {
  verificationContent: '';
  verificationValue: '';
  account: string;
};
interface SetPwdDialogProps {
  onSubmit: (form: PswFormType) => void;
  dataSourceId: string;
  
}
const SetPwdDialog: React.FC<SetPwdDialogProps> = memo(
  ({ onSubmit, dataSourceId }) => {
    const { userInfo: activeDataSouceUserInfo } = useDataSource(dataSourceId);
    // console.log('222activeDataSouceUserInfo', activeDataSouceUserInfo); //delete
    const dispatch: Dispatch<any> = useDispatch();
    const [pswForm, setPswForm] = useState<PswFormType>({
      verificationContent: '',
      verificationValue: '',
      account: '',
    });
    const attestLoading = useSelector(
      (state: UserState) => state.attestLoading
    );
    const formLegal = useMemo(() => {
      return !!(pswForm.verificationContent && pswForm.verificationValue);
    }, [pswForm]);
    const totalBalanceForAttest = useMemo(() => {
      let totalBalance = '0';
      if (dataSourceId === 'okx') {
        totalBalance = getTotalBalFromNumObjAPriceObj(
          activeDataSouceUserInfo.tradingAccountTokenAmountObj,
          activeDataSouceUserInfo.tokenPriceMap
        );
      } else if (dataSourceId === 'binance') {
        totalBalance = getTotalBalFromAssetsMap(
          activeDataSouceUserInfo.spotAccountTokenMap
        );
      }
      return totalBalance;
    }, [pswForm, dataSourceId, activeDataSouceUserInfo]);
    // const verificationContentList = useMemo(() => {

    // })
    const handleClickNext = useCallback(async () => {
      if (!formLegal) {
        return;
      }
      if (
        gt(Number(pswForm.verificationValue), Number(totalBalanceForAttest))
      ) {
        alert('Not met the requirements');
        // setActiveRequest({
        //   type: 'warn',
        //   title: 'Not met the requirements',
        //   desc: (
        //     <>
        //       <p>
        //         Insufficient assets in your{' '}
        //         {source === 'okx' ? 'Trading' : 'Spot'} Account.
        //       </p>
        //       <p>Please confirm and try again later.</p>
        //     </>
        //   ),
        // });
        // return;
      }
      onSubmit(pswForm);
      return;
    }, [formLegal, pswForm, , totalBalanceForAttest]);

    const handleChangePswForm = useCallback((v, formKey) => {
      setPswForm((f) => ({ ...f, [formKey]: v }));
    }, []);
    useEffect(() => {
      handleChangePswForm(activeDataSouceUserInfo.userInfo.userName, 'account');
    }, [activeDataSouceUserInfo]);
    
    useEffect(() => {
      if (attestLoading === 2) {
        dispatch(setAttestLoading(0));
      }
    }, [attestLoading, onSubmit]);

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
            <div className="account">
              {activeDataSouceUserInfo.userInfo.userName}
            </div>
            <div className="balance">${totalBalanceForAttest}</div>
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
