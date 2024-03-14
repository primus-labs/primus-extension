import React, { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ASSETSVERIFICATIONCONTENTTYPELIST,
  ASSETSVERIFICATIONVALUETYPELIST,
  ASSETSVERIFICATIONCONTENTTYPEEMAP,
} from '@/config/attestation';
import useDataSource from '@/hooks/useDataSource';
import {
  gt,
  getTotalBalFromNumObjAPriceObj,
  getTotalBalFromAssetsMap,
} from '@/utils/utils';

import type { UserState } from '@/types/store';
import type { Dispatch } from 'react';
import PSelect from '@/newComponents/PSelect';
import PButton from '@/newComponents/PButton';

import './index.scss';
type PswFormType = {
  dataSourceId: string;
  verificationContent: string;
  verificationValue: string;
  account: string;
};
interface SetPwdDialogProps {
  onSubmit: (form: PswFormType) => void;
  // dataSourceId: string;
  presets: any;
}
const SetPwdDialog: React.FC<SetPwdDialogProps> = memo(
  ({ onSubmit, presets }) => {
    const dataSourceId = presets.dataSourceId;
    const { userInfo: activeDataSouceUserInfo } = useDataSource(dataSourceId);
    console.log('222activeDataSouceUserInfo', activeDataSouceUserInfo); //delete
    const dispatch: Dispatch<any> = useDispatch();
    const [pswForm, setPswForm] = useState<PswFormType>({
      verificationContent: '',
      verificationValue: '',
      account: '',
      dataSourceId: '',
    });
    const attestLoading = useSelector(
      (state: UserState) => state.attestLoading
    );
    const sysConfig = useSelector((state: UserState) => state.sysConfig);
    const contentList = useMemo(() => {
      let supportedContentIdArr: any = [];

      if (dataSourceId === 'coinbase') {
        supportedContentIdArr = ['Token Holding'];
        let list = supportedContentIdArr.map(
          (i) => ASSETSVERIFICATIONCONTENTTYPEEMAP[i]
        );
        return list;
      } else {
        return ASSETSVERIFICATIONCONTENTTYPELIST;
      }
    }, [
      dataSourceId,
      ASSETSVERIFICATIONCONTENTTYPEEMAP,
      ASSETSVERIFICATIONCONTENTTYPELIST,
    ]);
    const valueList = useMemo(() => {
      let list = [];
      if (pswForm.verificationContent === 'Assets Proof') {
        list = [...ASSETSVERIFICATIONVALUETYPELIST];
      } else if (pswForm.verificationContent === 'Token Holding') {
        list = Object.keys(activeDataSouceUserInfo.tokenListMap).map((i) => ({
          label: i,
          value: i,
          icon: `${sysConfig.TOKEN_LOGO_PREFIX}icon${i}.png`,
        }));
      }
      return list;
    }, [pswForm.verificationContent]);
    const formLegal = useMemo(() => {
      return !!(pswForm.verificationContent && pswForm.verificationValue);
    }, [pswForm]);
    const totalBalanceForAttest = useMemo(() => {
      let totalBalance = '0';
      if (activeDataSouceUserInfo) {
        if (dataSourceId === 'okx') {
          totalBalance = getTotalBalFromNumObjAPriceObj(
            activeDataSouceUserInfo?.tradingAccountTokenAmountObj,
            activeDataSouceUserInfo?.tokenPriceMap
          );
        } else if (dataSourceId === 'binance') {
          totalBalance = getTotalBalFromAssetsMap(
            activeDataSouceUserInfo?.spotAccountTokenMap
          );
        }
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
        activeDataSouceUserInfo &&
        gt(Number(pswForm.verificationValue), Number(totalBalanceForAttest))
      ) {
        alert('Not met the requirements');
        return;
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
    }, [formLegal, pswForm, activeDataSouceUserInfo, totalBalanceForAttest]);

    const handleChangePswForm = useCallback((v, formKey) => {
      setPswForm((f) => {
        const newForm = { ...f, [formKey]: v };
        console.log('newForm', f, newForm);
        return newForm;
      });
    }, []);
    useEffect(() => {
      if (activeDataSouceUserInfo?.userInfo?.userName) {
        handleChangePswForm(
          activeDataSouceUserInfo?.userInfo?.userName,
          'account'
        );
      }
    }, [activeDataSouceUserInfo]);

    useEffect(() => {
      if (!presets) {
        if (pswForm.verificationContent) {
          handleChangePswForm('', 'verificationValue');
        }
      }
    }, [pswForm.verificationContent, handleChangePswForm, presets]);
    useEffect(() => {
      if (presets) {
        setPswForm((f) => ({ ...f, ...presets }));
      }
    }, [presets]);

    return (
      <div className="pFormWrapper detailForm">
        <div className="formItem">
          <PSelect
            className="verificationContent"
            label="Verification Content"
            align="horizontal"
            placeholder="Choose Data Source"
            list={contentList}
            onChange={(p) => {
              handleChangePswForm(p, 'verificationContent');
            }}
            value={pswForm.verificationContent}
            disabled={presets?.verificationContent}
            showSelf={false}
          />
        </div>
        <div className="formItem">
          <PSelect
            className="verificationValue"
            label="Verification Value"
            align="horizontal"
            placeholder="Select Value"
            list={valueList}
            onChange={(p) => {
              handleChangePswForm(p, 'verificationValue');
            }}
            value={pswForm.verificationValue}
            disabled={presets?.verificationValue}
            showSelf={false}
          />
        </div>
        {activeDataSouceUserInfo?.userInfo && (
          <div className="staticItem">
            <label>Account</label>

            <div className="value">
              <div className="account">
                {activeDataSouceUserInfo?.userInfo?.userName}
              </div>
              {pswForm.verificationContent === 'Assets Proof' && (
                <div className="balance">
                  ${Number(totalBalanceForAttest).toFixed(2)}
                </div>
              )}
            </div>
          </div>
        )}

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
