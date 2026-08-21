import React, { useState, useEffect, memo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getAttestInfoByEncodeDdata } from '@/services/chains/eas';
import iconBinance from '@/assets/img/iconBinance.png';
import type { UserState } from '@/types/store';

import './index.sass';
import BigNumber from 'bignumber.js';
type SchemaInfoItem = {
  name: string;
  signature: string;
  type: string;
  value: {
    name: string;
    value: any;
    type: string;
  };
};
type SchemaInfoArr = SchemaInfoItem[];
const TransactionDetail = memo(() => {
  const [searchParams] = useSearchParams();
  const requestid = searchParams.get('requestid');
  const [schemaInfo, setSchemaInfo] = useState<SchemaInfoArr>();
  const credentialsFromStore = useSelector(
    (state: UserState) => state.credentials
  );
  useEffect(() => {
    const activeCred =
      credentialsFromStore[requestid as keyof typeof credentialsFromStore];
    let schemaStr = '';
    if (activeCred.type === 'ASSETS_PROOF') {
      schemaStr =
        'string source,bytes32 sourceUseridHash,bytes32 authUseridHash,address receipt,uint64 getDataTime,uint64 baseValue,bool balanceGreaterThanBaseValue';
    } else if (activeCred.type === 'TOKEN_HOLDINGS') {
      schemaStr =
        'string source,bytes32 sourceUseridHash,bytes32 authUseridHash,address recipient,uint64 getDataTime,string asset,string baseAmount,bool balanceGreaterThanBaseAmount';
    } else if (activeCred.type === 'IDENTIFICATION_PROOF') {
      schemaStr =
        'string source,string credentialType,bytes32 authUseridHash,address recipient,uint64 timestamp,bool result';
    }
    const schemaArr = getAttestInfoByEncodeDdata(
      schemaStr,
      activeCred.encodedData
    );
    setSchemaInfo(schemaArr);
    console.log('schemaObj', schemaArr);
  }, [requestid, credentialsFromStore]);
  const schemaItemValue = useCallback((item: SchemaInfoItem) => {
    let name = item?.value?.name;
    let val = item?.value?.value;
    if (name === 'getDataTime') {
      return new BigNumber(val).valueOf();
    } else if (name === 'baseValue') {
      return new BigNumber(val).valueOf();
    } else {
      return val.toString();
    }
  }, []);

  return (
    <div className="pageTransactionDetail">
      <h1>
        Attestation Details <img src={iconBinance} alt="" />
      </h1>
      <p>
        <span>Created Time:</span>
        <span>May 23, 2023</span>
        <span>21:00:00</span>
      </p>
      <div className="card top">
        <div className="left">
          <div className="label">UID</div>
          <div className="value">000</div>
        </div>
        <div className="center"></div>
        <div className="right">
          <div className="descItem">
            <div className="label">From</div>
            <div className="value">000</div>
          </div>
          <div className="descItem">
            <div className="label">To</div>
            <div className="value">000</div>
          </div>
        </div>
      </div>
      <div className="card details">
        <header>Details</header>
        <ul>
          {schemaInfo &&
            schemaInfo.map((i: any) => {
              return (
                <li className="descItem" key={i?.name}>
                  <div className="label">{i?.value?.name}</div>
                  <div className="value">{schemaItemValue(i)}</div>
                </li>
              );
            })}
        </ul>
      </div>
      <div className="card transactions">
        <header>Transactions</header>
        <ul>
          <li className="descItem">
            <div className="label">Transaction ID</div>
            <div className="value">000</div>
          </li>
          <li className="descItem">
            <div className="label">Raw Data</div>
            <div className="value">000</div>
          </li>
        </ul>
      </div>
    </div>
  );
});

export default TransactionDetail;
