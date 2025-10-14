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
  {
    label: 'Home',
    value: 'Home',
    iconName: 'icon-iconMenuHome',
    link: '/home',
  },
  // {
  //   label: 'Data Source',
  //   value: 'Data Source',
  //   iconName: 'icon-iconMenuDataSource',
  //   link: '/datas',
  // },
  {
    label: 'Data Dashboard',
    value: 'Data Dashboard',
    iconName: 'icon-iconMenuDataOverview',
    link: '/dataDashboard',
  },
  {
    label: 'Attestation',
    value: 'Attestation',
    iconName: 'icon-iconMenuZkAttestation',
    link: '/Attestation',
  },
  {
    label: 'Events',
    value: 'Events',
    iconName: 'icon-iconMenuEvents',
    link: '/events',
  },
  // {
  //   label: 'Developer',
  //   value: 'Developer',
  //   iconName: 'icon-iconMenuDeveloper',
  //   link: '/developer',
  // },
  {
    label: 'Achievements',
    value: 'Achievements',
    iconName: 'icon-iconMenuAchievements',
    link: '/achievements',
  },
  {
    label: 'Settings',
    value: 'Settings',
    iconName: 'icon-iconMenuSettings',
    link: '/settings',
  },
];
