export type NavItem = {
  iconName?: any;
  label?: any;
  value?: any;
  disabled?: boolean;
  link?: string;

  icon?: any;
  toBeActive?: boolean;
};

export const menuList: NavItem[] = [
  // {
  //   label: 'Data Source',
  //   value: 'Data Source',
  //   iconName: 'icon-iconMenuDataSource',
  //   link: '/datas',
  // },
  // {
  //   label: 'Data Dashboard',
  //   value: 'Data Dashboard',
  //   iconName: 'icon-iconMenuDataOverview',
  //   link: '/dataDashboard',
  // },
  {
    label: 'Attestation',
    value: 'Attestation',
    iconName: 'icon-iconMenuZkAttestation',
    link: '/Attestation',
  },
  // {
  //   label: 'Developer',
  //   value: 'Developer',
  //   iconName: 'icon-iconMenuDeveloper',
  //   link: '/developer',
  // },
];
