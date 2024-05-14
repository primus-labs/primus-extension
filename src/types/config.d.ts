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
  btnTxt?: string;
  code?: string;
};

export type FilterOption = {
  label: string;
  disabled: boolean;
  defaultValue: boolean;
};
export type FilterOptionList = FilterOption[];

export type newWALLETITEMTYPE = {
  icon: any;
  name: string;
  id: string | number;
  value?: string | number;
  disabled?: boolean;
};
export type WALLETMAPTYPE = {
  [propName: string]: newWALLETITEMTYPE;
};