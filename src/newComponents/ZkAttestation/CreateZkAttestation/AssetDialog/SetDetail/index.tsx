import React, { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ASSETSVERIFICATIONCONTENTTYPELIST,
  ASSETSVERIFICATIONVALUETYPELIST,
  ASSETSVERIFICATIONCONTENTTYPEEMAP,
  ALLVERIFICATIONCONTENTTYPEEMAP,
} from '@/config/attestation';
import { DATASOURCEMAP } from '@/config/dataSource';
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
import PTooltip from '@/newComponents/PTooltip';
import PInput from '@/newComponents/PInput';

import './index.scss';
import useAllSources from '@/hooks/useAllSources';
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
    // const { userInfo: activeDataSouceUserInfo } = useDataSource(dataSourceId);
    // console.log('222activeDataSouceUserInfo', activeDataSouceUserInfo); //delete
    const [activeDataSouceUserInfo, setActiveDataSouceUserInfo] =
      useState<any>();
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
      if (activeDataSouceUserInfo) {
        if (pswForm.verificationContent === 'Assets Proof') {
          list = [...ASSETSVERIFICATIONVALUETYPELIST];
        } else if (pswForm.verificationContent === 'Token Holding') {
          list = Object.keys(activeDataSouceUserInfo.tokenListMap).map((i) => ({
            label: i,
            value: i,
            icon: `${sysConfig.TOKEN_LOGO_PREFIX}icon${i}.png`,
          }));
        }
      }

      return list;
    }, [pswForm.verificationContent, activeDataSouceUserInfo]);
    const formLegal = useMemo(() => {
      return !!(pswForm.verificationContent && pswForm.verificationValue);
    }, [pswForm]);
    const loading = useMemo(() => {
      return formLegal && attestLoading === 1;
    }, [formLegal, attestLoading]);
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
      if (loading) {
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
    }, [
      formLegal,
      pswForm,
      activeDataSouceUserInfo,
      totalBalanceForAttest,
      loading,
    ]);

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
      if (!presets.verificationContent) {
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
    const initActiveDataSouceUserInfo = useCallback(async () => {
      const res = await chrome.storage.local.get([dataSourceId]);
      if (res[dataSourceId]) {
        setActiveDataSouceUserInfo(JSON.parse(res[dataSourceId]));
      }
    }, []);
    useEffect(() => {
      initActiveDataSouceUserInfo();
    }, []);

    return (
      <div className="pFormWrapper detailForm">
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
          )}
        </div>
        <div className="formItem">
          {pswForm.verificationContent ? (
            activeDataSouceUserInfo ? (
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
            ) : (
              <PInput
                className="verificationValue"
                label="Verification Value"
                align="horizontal"
                placeholder="Input Value"
                onChange={(p) => {
                  handleChangePswForm(p, 'verificationValue');
                }}
                value={pswForm.verificationValue}
                disabled={!pswForm.verificationContent}
              />
            )
          ) : (
            <PInput
              className="verificationValue"
              label="Verification Value"
              align="horizontal"
              placeholder="Input Value"
              onChange={(p) => {
                handleChangePswForm(p, 'verificationValue');
              }}
              value={pswForm.verificationValue}
              disabled={!pswForm.verificationContent}
            />
          )}
        </div>
        {!!activeDataSouceUserInfo?.userInfo && (
          <div className="staticItem">
            <label className="label">
              <span>Data Account</span>
              <PTooltip
                title={`Your ${
                  DATASOURCEMAP[presets.dataSourceId].name
                } UserID`}
              >
                <PButton
                  type="icon"
                  icon={<i className="iconfont icon-iconInfo"></i>}
                  onClick={() => {}}
                  className="infoBtn"
                />
              </PTooltip>
            </label>
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
          loading={loading}
          onClick={handleClickNext}
        ></PButton>
      </div>
    );
  }
);

export default SetPwdDialog;
