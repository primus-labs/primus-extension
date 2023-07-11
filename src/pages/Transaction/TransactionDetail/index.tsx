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
    console.log('credItem111', activeCred);
    // const activeCred = {
    //   address: '0xd7cf78d33ce4c8a70529dc379582b290e1bea1c1',
    //   authUseridHash:
    //     '0x5b86827803b0e75ac3c186270b1222c7f418a2f6afe8e56d8f7a1cd713845c77',
    //   balanceGreaterThanBaseValue: 'true',
    //   baseValue: '1000',
    //   data: '',
    //   elapsed: '12',
    //   encodedData:
    //     '0x00000000000000000000000000000000000000000000000000000000000000e000000000000000000000000000000000000000000000000000000000000000005b86827803b0e75ac3c186270b1222c7f418a2f6afe8e56d8f7a1cd713845c77000000000000000000000000d7cf78d33ce4c8a70529dc379582b290e1bea1c10000000000000000000000000000000000000000000000000000018929d643eb00000000000000000000000000000000000000000000000000000000000003e80000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000762696e616e636500000000000000000000000000000000000000000000000000',
    //   getDataTime: '1688624055275',
    //   requestid: '1688624043614',
    //   signature:
    //     '0x2897e1e910914d76ba26eebb665c9f93365caaf4675808b0344d46340ac1ee7d54588495eaf2cbed4c7ccceae69c31319a18cb530f61eb131ec1cd10d62f4c0b1c',
    //   source: 'binance',
    //   sourceUseridHash: '',
    //   version: '1.0.0',
    //   type: 'ASSETS_PROOF',
    //   label: 'bn',
    //   baseName: 'api.binance.com',
    //   baseUrl: '18.65.175.124:443',
    //   padoUrl: '18.179.8.186:8889',
    //   proxyUrl: '18.179.8.186:9001',
    //   cipher: '',
    //   getdatatime: '1688624043614',
    //   exchange: {
    //     apikey: 'xxx',
    //     apisecret: 'xxx',
    //     apipassword: 'xxx',
    //   },
    //   sigFormat: 'EAS-Ethereum',
    //   schemaType: 'Assets Proof',
    //   schema: [
    //     {
    //       name: 'source',
    //       type: 'string',
    //     },
    //     {
    //       name: 'sourceUseridHash',
    //       type: 'string',
    //     },
    //     {
    //       name: 'authUseridHash',
    //       type: 'string',
    //     },
    //     {
    //       name: 'receipt',
    //       type: 'string',
    //     },
    //     {
    //       name: 'getDataTime',
    //       type: 'string',
    //     },
    //     {
    //       name: 'baseValue',
    //       type: 'string',
    //     },
    //     {
    //       name: 'balanceGreaterThanBaseValue',
    //       type: 'string',
    //     },
    //   ],
    //   user: {
    //     userid: '1658657962270392320',
    //     address: '0xd7cf78d33ce4c8a70529dc379582b290e1bea1c1',
    //     token:
    //       'eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJwYWRvbGFicy5vcmciLCJzdWIiOiJlaGlzcGVyIiwiZXhwIjo0ODQyMjIzMDQ5LCJ1c2VyLWlkIjoxNjU4NjU3OTYyMjcwMzkyMzIwLCJzY29wZSI6ImF1dGgifQ.Ta16zCodmnTygtIynTiWubvNcoA8Q0xXOY0yDgmYHWK0Sz5uLxNcFKoEXUwl1cTgQP1wRlHDzhjHJMdioNXgDacp_0STQWxfULO87HSJCIRlo-2nqnYwTx_qqoUCtVRJcmAHUkxHcmYCUiVo6epmu3puUIoVdsMAYSh3oXg_zxPEmHrVRJByT3M_R8Y8OhmUT2jadPTymeGRPcr__RYSj2Jdj7z9WN4a_kfykdZnKIhP-Qp6j6ENXfT8qQ1xTQL8Mgqt3vDSkXRLFb0thhrxtACAK1bciydM-o0kDnkoDEpZKtNNLbz7FtHh7PXbSjHUMYPuGV1Q9fI3FVPqWMCaNQ',
    //   },
    //   ext: {
    //     calculationType: 'KEY_VALUES_SUM_X_A',
    //     extRequests: {
    //       orders: ['asset-balances'],
    //       'asset-balances': {
    //         url: 'https://api.binance.com/sapi/v3/asset/getUserAsset',
    //         method: 'POST',
    //         body: 'timestamp=1688624043613&recvWindow=60000&signature=366c4115b16c790c328de584c4c8601e0a6970e3aa70b9d23d7a8bc0c5b3c925',
    //         headers: {
    //           'X-MBX-APIKEY':
    //             'tPekpYpExdV5pzzc9ZyLApIXQkYMiLWiygjKBAQzUCiy3G2fVtNGxGTJ4NtfZq31',
    //           'Content-Type': 'application/x-www-form-urlencoded',
    //         },
    //         parseSchema:
    //           'MAP_A_PURE_NUMBER_REGEX:KVVVV:"asset":"(.*?)"[\\s\\S]*?"free":"(.*?)"[\\s\\S]*?"locked":"(.*?)"[\\s\\S]*?"freeze":"(.*?)"[\\s\\S]*?"withdrawing":"(.*?)"',
    //         decryptFlag: 'false',
    //       },
    //     },
    //   },
    //   provided: [
    //     {
    //       icon: '/static/imgs/b90494f5.svg',
    //       title: 'Sepolia',
    //       rpcUrl:
    //         'https://sepolia.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
    //       easContact: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e',
    //       easProxyContrac: '0x2884e43b48c2cc623a19c0c3d260dd8f398fd5f3',
    //       schemas: {
    //         EAS: {
    //           schemaUid:
    //             '0x45316fbaa4070445d3ed1b041c6161c844e80e89c368094664ed756c649413a9',
    //           schemaUidTokenHoldings:
    //             '0xe4c12be3c85cada725c600c1f2cde81d7cc15f957537e5756742acc3f5859084',
    //         },
    //         PolygonID: {
    //           schemaUid:
    //             '0x518b6ddf38db93ae2bab1164038c6fa0606ce4b5080406749ea65f9415bb0503',
    //           schemaUidTokenHoldings:
    //             '0x112d140be471e0fac2dc2ee596c55d5f0c679b8fa9a71c15ec5516b87d6d1278',
    //         },
    //       },
    //       chainId: '0xaa36a7',
    //       chainName: 'Sepolia',
    //       rpcUrls: [
    //         'https://sepolia.infura.io/v3/b6bf7d3508c941499b10025c0776eaf8',
    //       ],
    //       blockExploreUrls: ['https://sepolia.etherscan.io'],
    //       attestationUID:
    //         '0xa4a9447e6b1fcb0282b899a8968bd288bcb99e7bf0a4b3e7a5b539136aff83c7',
    //     },
    //   ],
    // };
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
