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
  authUseridHash: string;
  address: string;
  getDataTime: string;
  baseValue: string;
  balanceGreaterThanBaseValue: string; // or bool statusNormal
  signature: string; // includes v，r，s
  encodedData: string; // trueHash or falseHash

  exUserId: string;
  user: {
    userid: string;
    address: string;
    token: string;
  };
  did?: string;
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
