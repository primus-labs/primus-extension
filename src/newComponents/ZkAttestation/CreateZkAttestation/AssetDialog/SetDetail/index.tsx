import React, { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import BigNumber from 'bignumber.js';
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
  getAccount,
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

    const [activeDataSouceUserInfo, setActiveDataSouceUserInfo] =
      useState<any>();
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
      if (v) {
        cN += ' hasValue';
      }
      return cN;
    }, [pswForm.verificationValue]);
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
        if (activeDataSouceUserInfo) {
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
    const activeAccount = useMemo(() => {
      if (activeDataSouceUserInfo) {
        const metaInfo = DATASOURCEMAP[dataSourceId];
        const acc = getAccount(metaInfo, activeDataSouceUserInfo);
        return acc;
      } else {
        return '';
      }
    }, [activeDataSouceUserInfo]);
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
    }, [dataSourceId, activeDataSouceUserInfo]);
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
              className={verificationContentCN}
              label="Verification Content"
              align="horizontal"
              placeholder="Select content"
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
                showSelf={false}
              />
            ) : pswForm.verificationContent === 'Token Holding' ? (
              <PInput
                className={verificationValueCN}
                label="Verification Value"
                align="horizontal"
                placeholder="USDT"
                onChange={(p) => {
                  handleChangePswForm(p, 'verificationValue');
                }}
                value={pswForm.verificationValue}
                disabled={!pswForm.verificationContent}
              />
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
                showSelf={false}
              />
            )
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
              showSelf={false}
            />
          )}
        </div>
        {activeAccount && (
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
              <div className="account">{activeAccount}</div>
              {pswForm.verificationContent === 'Assets Proof' && (
                <div className="balance">
                  ${new BigNumber(totalBalanceForAttest).toFixed(2)}
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
