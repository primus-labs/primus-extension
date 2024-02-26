export type NavItem = {
  iconName?: any;
  label?: any;
  value?: any;
  disabled?: boolean;
  link?: string;

  icon?: any;
  toBeActive?: boolean;
};
export const list: NavItem[] = [
  {
    label: 'Home',
    value: 'Home',
    iconName: 'icon-iconMenuHome',
    link: '/home',
  },
  {
    label: 'Data Source',
    value: 'Data Source',
    iconName: 'icon-iconMenuDataSource',
    link: '/datas',
  },
  {
    label: 'Data Overview',
    value: 'Data Overview',
    iconName: 'icon-iconMenuDataOverview',
    link: '/1',
  },
  {
    label: 'zkAttestation',
    value: 'zkAttestation',
    iconName: 'icon-iconMenuZkAttestation',
    link: '/2',
  },
  {
    label: 'Events',
    value: 'Events',
    iconName: 'icon-iconMenuEvents',
    link: '/3',
  },
  {
    label: 'Developer',
    value: 'Developer',
    iconName: 'icon-iconMenuDeveloper',
    link: '/4',
  },
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
    link: '/6',
  },
];
