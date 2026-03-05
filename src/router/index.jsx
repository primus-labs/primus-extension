import React from 'react';
import Guide from '@/pages/Home/Home.jsx';
import Layout from '@/newComponents/Layout/index.tsx';
import ErrorBoundary from '@/components/ErrorBoundary';
import TransactionDetail from '@/pages/Transaction/TransactionDetail';
import ZkAttestation from '@/newPages/ZkAttestation';
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
        path: 'developer',
        element: <ComingSoon />,
      },
    ],
  },
  {
    path: '/transactionDetail',
    element: <TransactionDetail />,
  },
];

export default router;
