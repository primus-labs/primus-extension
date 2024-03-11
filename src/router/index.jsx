import React from 'react';
import Guide from '@/pages/Home/Home.jsx';
// import DataSourceOverview from '@/pages/DataSourceOverview/index.tsx';
import DataSourceOverview from '@/newPages/DataSourceOverview/index.tsx';
import DataSourceItem from '@/newPages/DataSourceItem/index.tsx';
import FirstHome from '@/newPages/FirstHome/index.tsx';
import DataSourceDetail from '@/pages/DataSourceDetail/index.tsx';
import Lock from '@/pages/Lock/index.jsx';
// import Layout from '@/components/Layout/Layout/index.tsx';
import Layout from '@/newComponents/Layout/index.tsx';
import ErrorBoundary from '@/components/ErrorBoundary';
import Cred from '@/pages/Cred/index.tsx';
// import Events from '@/pages/Events';
import TransactionDetail from '@/pages/Transaction/TransactionDetail';
import Achievement from "@/newPages/Achievement";
import ZkAttestation from '@/newPages/ZkAttestation';
import Events from '@/newPages/Events';
import Rewards from '@/newPages/Rewards';
import EventDetail from '@/newPages/EventDetail';
import Setting from '@/newPages/Setting';
import ComingSoon from '@/newPages/ComingSoon';
import Home from '@/newPages/Home';
const router = [
  {
    path: '/',
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <Guide />,
        // element: <FirstHome />,
      },
    ],
  },
  {
    path: '/',
    element: <Layout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        path: 'home',
        name: 'Home',
        element: <Home />,
        // element: <FirstHome />,
      },
      {
        path: 'datas',
        name: 'Data Source',
        children: [
          {
            index: true,
            element: <DataSourceOverview />,
          },
          {
            path: 'data',
            element: <DataSourceItem />,
          },
        ],
      },
      {
        path: 'zkAttestation',
        name: 'zkAttestation',
        element: <ZkAttestation />,
      },
      {
        path: 'events',
        name: 'events',
        children: [
          {
            index: true,
            element: <Events />,
          },
          {
            path: 'rewards',
            element: <Rewards />,
          },
          {
            path: 'detail',
            element: <EventDetail />,
          },
        ],
      },
      {
        path: 'dataDashboard',
        element: <ComingSoon />,
      },
      {
        path: 'developer',
        element: <ComingSoon />,
      },
      // {
      //   path: 'dataDetail',
      //   element: <DataSourceDetail />,
      // },
      // {
      //   path: 'lock',
      //   element: <Lock />,
      // },
      // {
      //   path: 'cred',
      //   element: <Cred />,
      // },
      // {
      //   path: 'events',
      //   element: <Events />,
      // },
      {
        path: 'achievements',
        element: <Achievement />,
      },
      {
        path: 'settings',
        element: <Setting />,
      },
    ],
  },
  {
    path: '/transactionDetail',
    element: <TransactionDetail />,
  },
];

export default router;
