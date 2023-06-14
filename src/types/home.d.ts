export type ObjectType = {
  [propName: string]: any;
};

export type SysConfigItem = {
  configName: string;
  configValue: any;
};
export type GetSysConfigMsg = {
  resMethodName: string;
  res: SysConfigItem[];
};
