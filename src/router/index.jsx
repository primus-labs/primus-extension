import React from 'react';
import Guide from '@/pages/Home/Home.jsx';
import DataSourceOverview from '@/newPages/DataSourceOverview/index.tsx';
import DataSourceItem from '@/newPages/DataSourceItem/index.tsx';
import Layout from '@/newComponents/Layout/index.tsx';
import ErrorBoundary from '@/components/ErrorBoundary';
import TransactionDetail from '@/pages/Transaction/TransactionDetail';
import Achievement from "@/newPages/Achievement";
import ZkAttestation from '@/newPages/ZkAttestation';
import Events from '@/newPages/Events';
import Rewards from '@/newPages/Rewards';
import EventDetail from '@/newPages/EventDetail';
import Setting from '@/newPages/Setting';
import ComingSoon from '@/newPages/ComingSoon';
import Home from '@/newPages/Home';
import DataDashboard from '@/newPages/DataDashboard';
const router = [
  {
    path: '/',
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <Guide />,
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
        path: 'Attestation',
        name: 'Attestation',
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
        element: <DataDashboard />,
      },
      {
        path: 'developer',
        element: <ComingSoon />,
      },
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
