export type ExchangeMeta = {
  name: string;
  type: 'Social' | 'Assets' | 'Identity';
  icon: any;
  requirePassphase?: boolean;
  constructorF?: any;
  baseName?: string;
  baseUrl?: string;
  accountBalanceUrl?: string; // TODO
  userId?: string;
  label?: string;
  desc?: string;
};

type SysConfigInfo = {
  [propName: string]: any;
};

export type WALLETITEMTYPE = {
  icon: any;
  name: string;
  disabled?: boolean;
};

export type ActiveRequestType = {
  type: string;
  title: string;
  desc: any;
};
