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

export type FilterOption = {
  label: string;
  disabled: boolean;
  defaultValue: boolean;
};
export type FilterOptionList = FilterOption[];
