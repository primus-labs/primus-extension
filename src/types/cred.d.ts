type ISACTIVE = 0 | 1;
export type CredTypeItemType = {
  type: string;
  // name: string;
  // id: string;
  label: string;
  // date: string;
  provided?: any[];
  expand?: boolean;
  holdingToken?: string;

  requestid: string;
  version: string;
  source: string;
  authUseridHash?: string;
  address: string;
  getDataTime: string;
  baseValue?: string;
  balanceGreaterThanBaseValue?: string; // or bool statusNormal
  signature: string; // includes v，r，s
  encodedData: string; // trueHash or falseHash

  exUserId?: string;
  user: {
    userid: string;
    address: string;
    token: string;
  };
  did?: string;
  claimId?: string;
  claimQrCode?: object;
  claimSignatureInfo?: object;
  issuer?: string;
  schemaName?: string;
  credIdentifier?: string;
  credential?: string;
  reqType?: string;
  uiTemplate?: any;
  host?: string;
  sourceUseridHash?: string;
  templateId?: string;
  schemaType?: string;
  event?: string;
  sigFormat?: string;
  rawParam?: any;
  dataToBeSigned?: any;
  proofContent?: any;
};
export type CREDENTIALS = {
  [propName: string]: CredTypeItemType;
};
export type PROOFTYPEITEM = {
  simplifiedName: string;
  id: string;
  credIdentifier: string;
  credTitle: string;
  credIntroduce: string;
  credLogoUrl: string;
  credDetails: string;
  credProofContent: string;
  credProofConditions: string;
  display: ISACTIVE;
  enabled: ISACTIVE;
};
export type AttestionForm = {
  token?: string;
  baseValue?: string;
  source: string;
  type: string;
  exUserId?: string;
  label?: string;
  requestid?: string;

  credential?: string;
  userIdentity?: string;
  verifyIdentity?: string;
  proofType?: string;
  proofClientType?: string;
  proofContent?: string;
  event?: string;
  sourceUseridHash?: string;
};

export type ATTESTATIONTYPEITEMTYPE = {
  id: string;
  name: string;
  icon: any;
  disabled?: boolean;
};
export type ASSETSVERIFICATIONCONTENTTYPEITEM = {
  value: string;
  label: string;
};
