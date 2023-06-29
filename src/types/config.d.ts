export type ExchangeMeta = {
  name: string;
  type: 'Social' | 'Assets';
  icon: any;
  requirePassphase?: boolean;
  constructorF?: any;
  baseName?: string;
  baseUrl?: string;
  accountBalanceUrl?: string; // TODO
  userId?: string;
  label?: string;
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
  desc: string;
};