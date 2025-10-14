import React from 'react';
import Guide from '@/pages/Home/Home.jsx';
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
