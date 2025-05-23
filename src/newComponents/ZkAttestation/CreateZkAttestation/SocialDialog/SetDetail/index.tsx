import React, { useState, useMemo, memo, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveAttestation, setAttestLoading } from '@/store/actions';
import useMsgs from '@/hooks/useMsgs';
import {
  HUMANITYVERIFICATIONCONTENTTYPELIST,
  HUMANITYVERIFICATIONCONTENTTYPEMAP,
  HUMANITYVERIFICATIONVALUETYPELIST,
  ALLVERIFICATIONCONTENTTYPEEMAP,
  SOCIALVERIFICATIONVALUETYPELIST,
} from '@/config/attestation';
import { DATASOURCEMAP } from '@/config/dataSource';
import useDataSource from '@/hooks/useDataSource';
import { getAccount } from '@/utils/utils';
import type { UserState } from '@/types/store';
import type { Dispatch } from 'react';
import PSelect from '@/newComponents/PSelect';
import PButton from '@/newComponents/PButton';
import PTooltip from '@/newComponents/PTooltip';

import './index.scss';
type PswFormType = {
  verificationContent: '';
  verificationValue: '';
  account?: string;
};
interface SetPwdDialogProps {
  onSubmit: (form: PswFormType) => void;
  // dataSourceId: string;
  presets: any;
}
const SetPwdDialog: React.FC<SetPwdDialogProps> = memo(
  ({ onSubmit, presets }) => {
    const { deleteErrorMsgs } = useMsgs();
    const { dataSourceId } = presets;
    // const { userInfo: activeDataSouceUserInfo } = useDataSource(dataSourceId);
    // console.log('222activeDataSouceUserInfo', activeDataSouceUserInfo); //delete
    const dispatch: Dispatch<any> = useDispatch();
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

      if (['google', 'discord'].includes(dataSourceId)) {
        supportedContentIdArr = ['Account ownership'];
      } else {
        supportedContentIdArr = Object.keys(
          HUMANITYVERIFICATIONCONTENTTYPEMAP
        ).filter((i) => {
          const contentObj = HUMANITYVERIFICATIONCONTENTTYPEMAP[i];
          const activeWebProofTemplate = webProofTypes.find(
            (i) =>
              i.dataSource === dataSourceId &&
              (i.name === contentObj.label ||
                i.name === contentObj.templateName)
          );
          return !!activeWebProofTemplate;
        });
      }
      let list = supportedContentIdArr.map(
        (i) => HUMANITYVERIFICATIONCONTENTTYPEMAP[i]
      );

      return list;
    }, [webProofTypes, dataSourceId]);
    const valueList = useMemo(() => {
      let list: any[] = [];
      // @ts-ignore
      if (pswForm.verificationContent === 'X Followers') {
        list = [...SOCIALVERIFICATIONVALUETYPELIST];
      }
      return list;
    }, [pswForm.verificationContent]);
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
        return `${dataSourceId === 'x' ? '@' : ''}${acc}`;
      } else {
        return '';
      }
    }, [activeDataSouceUserInfo]);
    const formatBtnTxt = useMemo(() => {
      return attestLoading === 3
        ? activeAttestation?.msgObj?.btnTxt
          ? activeAttestation?.msgObj?.btnTxt
          : 'OK'
        : 'To Verify';
    }, [attestLoading, activeAttestation]);
    const handleClickNext = useCallback(async () => {
      if (!formLegal) {
        return;
      }
      if (loading) {
        return;
      }
      // @ts-ignore
      if (pswForm?.verificationContent === 'X Followers') {
        sessionStorage.setItem('xFollowerCount', pswForm.verificationValue);
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
    useEffect(() => {
      handleChangePswForm(
        activeDataSouceUserInfo?.userInfo?.userName,
        'account'
      );
    }, [activeDataSouceUserInfo]);

    useEffect(() => {
      if (!presets.verificationContent) {
        if (pswForm.verificationContent) {
          let newValue = '';

          if (pswForm.verificationContent === 'KYC Status') {
            newValue = 'Basic Verification';
          } else if (pswForm.verificationContent === 'Account ownership') {
            newValue = 'Account owner';
          }
          handleChangePswForm(newValue, 'verificationValue');
        }
      }
    }, [pswForm.verificationContent, handleChangePswForm, presets]);
    useEffect(() => {
      setPswForm(presets);
    }, [presets]);
    const initActiveDataSouceUserInfo = useCallback(async () => {
      const res = await chrome.storage.local.get([dataSourceId]);
      if (res[dataSourceId]) {
        const newObj = JSON.parse(res[dataSourceId]);
        setActiveDataSouceUserInfo(newObj);
      }
    }, []);
    useEffect(() => {
      initActiveDataSouceUserInfo();
    }, []);
    const initAttestLoadingFn = useCallback(() => {
      if (attestLoading > 1) {
        dispatch(setAttestLoading(0));
      }
    }, [attestLoading, dispatch]);
    useEffect(() => {
      initAttestLoadingFn();
    }, [pswForm]);

    return (
      <div className="pFormWrapper detailForm3 detailForm4">
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
          <PSelect
            className={verificationValueCN}
            label="Verification Condition"
            align="horizontal"
            placeholder="Select value"
            list={valueList}
            onChange={(p) => {
              handleChangePswForm(p, 'verificationValue');
            }}
            value={pswForm.verificationValue}
            disabled={presets?.verificationValue}
          />
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
            </div>
          </div>
        )}
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
