import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import './index.scss';
import PSelect from '@/newComponents/PSelect';
import textCopyIcon from '@/assets/newImg/achievements/textCopyIcon.svg';
import mode from '@/assets/newImg/settings/mode.svg';
import { getUserInfo } from '@/services/api/achievements';
import copy from 'copy-to-clipboard';
import { Button, Divider } from 'antd';
import SettingsSetPwdDialog from '@/newComponents/Settings/SettingSetPwdDialog';
import WebComeBackDialog from '@/newComponents/Settings/WebComeBack';
import useMsgs from '@/hooks/useMsgs';
import PButton from '@/newComponents/PButton';
import { useNavigate } from 'react-router-dom';
import { DEFAULTDATASOURCEPOLLINGTIMENUM } from '@/config/constants';
import { useDispatch, useSelector } from 'react-redux';
import { v4 as uuidv4 } from 'uuid';
import { useSearchParams } from 'react-router-dom';
import {
  setActiveAttestation,
  setCredentialsAsync,
  setAttestLoading,
  setAutoTestSwitch,
  setAutoTestStatus,
} from '@/store/actions';
import { ALLVERIFICATIONCONTENTTYPEEMAP } from '@/config/attestation';
import { eventReport } from '@/services/api/usertracker';
import type { Dispatch } from 'react';
import type { UserState } from '@/types/store';
// eslint-disable-next-line react/display-name
const Setting = memo(() => {
  const [searchParams] = useSearchParams();
  const fromEvents = searchParams.get('id');
  const dispatch: Dispatch<any> = useDispatch();
  const webProofTypes = useSelector((state: UserState) => state.webProofTypes);
  const autoTestStatus = useSelector(
    (state: UserState) => state.autoTestStatus
  );
  const autoTestSwitch = useSelector(
    (state: UserState) => state.autoTestSwitch
  );
  const autoTestTimes = useSelector((state: UserState) => state.autoTestTimes);
  const autoTestSucTimes = useSelector(
    (state: UserState) => state.autoTestSucTimes
  );
  const autoTestItems = useSelector((state: UserState) => state.autoTestItems);
  const testFn = useCallback(
    async (activeAttestationParams) => {
      dispatch(setAutoTestStatus(0));
      dispatch(setActiveAttestation(activeAttestationParams));
      dispatch(setAttestLoading(1));
      dispatch(setActiveAttestation({ loading: 1 }));
      // 2.check web proof template
      // templateName
      const contentObj =
        ALLVERIFICATIONCONTENTTYPEEMAP[
          activeAttestationParams.verificationContent
        ];
      const activeWebProofTemplate = webProofTypes.find(
        (i) =>
          i.dataSource === activeAttestationParams.dataSourceId &&
          (i.name === contentObj.label || i.name === contentObj.templateName)
      );
      const currRequestTemplate = {
        ...activeWebProofTemplate,
        schemaType: activeWebProofTemplate.schemaType,
        event: fromEvents,
        ...activeAttestationParams,
      };

      const requestid = uuidv4();
      var eventInfo = {
        eventType: 'ATTESTATION_NEXT',
        rawData: {
          source: activeAttestationParams.dataSourceId,
          event: fromEvents,
          order: '1',
          requestid,
        },
      };
      eventReport(eventInfo);
      chrome.storage.local.remove(['beginAttest', 'getAttestationResultRes']);

      // 3.send msg to content
      const currentWindowTabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      await chrome.runtime.sendMessage({
        type: 'pageDecode',
        name: 'init',
        params: {
          ...currRequestTemplate,
          requestid,
        },
        extensionTabId: currentWindowTabs[0].id,
        operation: 'attest',
      });
    },
    [webProofTypes]
  );
  const onClickAutoTest = useCallback(async () => {
    dispatch(setAutoTestSwitch(true));
    const attObj = {
      'binance kyc': {
        dataSourceId: 'binance',
        verificationContent: 'KYC Status',
        verificationValue: 'Basic Verification',
        attestationType: 'Humanity Verification',
        fetchType: 'Web',
      },
      'binance account': {
        dataSourceId: 'binance',
        account: '782151446',
        verificationContent: 'Account ownership',
        verificationValue: 'Account owner',
        attestationType: 'Humanity Verification',
        fetchType: 'Web',
      },
      'okx kyc': {
        dataSourceId: 'okx',
        verificationContent: 'KYC Status',
        verificationValue: 'Basic Verification',
        attestationType: 'Humanity Verification',
        fetchType: 'Web',
      },
      'tiktok account': {
        dataSourceId: 'tiktok',
        verificationContent: 'Account ownership',
        verificationValue: 'Account owner',
        attestationType: 'Humanity Verification',
        fetchType: 'Web',
      },
      'x account': {
        dataSourceId: 'x',
        verificationContent: 'Account ownership',
        verificationValue: 'Account owner',
        attestationType: 'Humanity Verification',
        fetchType: 'Web',
      },
    };
    const attArr = Object.values(attObj);
    const attParams = attArr[Math.floor(Math.random() * attArr.length)];
    const result = await testFn(attParams);
  }, [testFn, autoTestSwitch]);
  const onClickStopTest = useCallback(async () => {
    dispatch(setAutoTestSwitch(!autoTestSwitch));
  }, [autoTestSwitch]);
  useEffect(() => {
    if ([1, 2].includes(autoTestStatus) && autoTestSwitch) {
      onClickAutoTest();
    }
  }, [autoTestStatus, onClickAutoTest, autoTestSwitch]);
  return (
    <div className={'outerDiv'}>
      <div className="pageContent">
        {process.env.NODE_ENV === 'development' && (
          <div className="autoTestWrapper">
            <span>switch: {autoTestSwitch ? 'Yes' : 'No'}</span>
            <span>
              {autoTestSucTimes}/{autoTestTimes}
            </span>
            <PButton text="Auto Test" onClick={onClickAutoTest} />
            <PButton
              text={autoTestSwitch ? 'Stop' : 'Start'}
              onClick={onClickStopTest}
            />
            <ul>
              {autoTestItems.map((item, index) => (
                <li>{item.status}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
});

export default Setting;
