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
