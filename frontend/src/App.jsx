import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; 
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardSkeleton from './components/skeletons/DashboardSkeleton';
import FormSkeleton from './components/skeletons/FormSkeleton';
import TableSkeleton from './components/skeletons/TableSkeleton';
import { HelmetProvider } from 'react-helmet-async';

// LAZY IMPORTS 
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Inspection = lazy(() => import('./pages/Inspection'));
const History = lazy(() => import('./pages/History'));
const Settings = lazy(() => import('./pages/Settings'));
const FAQ = lazy(() => import('./pages/FAQ'));
const ContactSupport = lazy(() => import('./pages/ContactSupport'));
const NotFound = lazy(() => import('./pages/NotFound'));

const withSuspense = (Component, Skeleton) => (
  <Suspense fallback={<Skeleton />}>
    <Component />
  </Suspense>
);

// INITIALIZE REACT QUERY
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 60 * 1000, 
      refetchOnWindowFocus: false,
    },
  },
});

const router = createBrowserRouter([
  { path: "/login", element: <Suspense fallback={<FormSkeleton />}><Login /></Suspense> },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { path: "/", element: withSuspense(Dashboard, DashboardSkeleton) },
      { path: "inspection", element: withSuspense(Inspection, FormSkeleton) },
      { path: "settings", element: withSuspense(Settings, FormSkeleton) },
      { path: "contact-support", element: withSuspense(ContactSupport, FormSkeleton) },
      { path: "history", element: withSuspense(History, TableSkeleton) },
      { path: "faq", element: withSuspense(FAQ, TableSkeleton) },
    ],
  },
  { path: "*", element: <Suspense fallback={<DashboardSkeleton />}><NotFound /></Suspense> },
]);

const App = () => {
  return (
    <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </HelmetProvider>
  );
};

export default App;