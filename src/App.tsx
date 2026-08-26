/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CoupleProvider } from './contexts/CoupleContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import { Toaster } from 'react-hot-toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RequireCoupleRoute } from './components/RequireCoupleRoute';
import { Layout } from './components/Layout';

const Dashboard = React.lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const PlansList = React.lazy(() => import('./pages/PlansList').then(module => ({ default: module.PlansList })));
const PlanDetails = React.lazy(() => import('./pages/PlanDetails').then(module => ({ default: module.PlanDetails })));
const Profile = React.lazy(() => import('./pages/Profile').then(module => ({ default: module.Profile })));
const Randomizer = React.lazy(() => import('./pages/Randomizer').then(module => ({ default: module.Randomizer })));
const History = React.lazy(() => import('./pages/History').then(module => ({ default: module.History })));
const Gifts = React.lazy(() => import('./pages/Gifts').then(module => ({ default: module.Gifts })));
const Auth = React.lazy(() => import('./pages/Auth').then(module => ({ default: module.Auth })));
const SetupSpace = React.lazy(() => import('./pages/SetupSpace').then(module => ({ default: module.SetupSpace })));

const PageLoader = () => (
  <div className="flex min-h-screen w-full items-center justify-center bg-stone-50/50">
    <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin"></div>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <CoupleProvider>
        <NotificationsProvider>
          <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            
            {/* Rotas Protegidas (Exige Login) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/setup" element={<SetupSpace />} />
              
              {/* Rotas que exigem Login E Espaço do Casal */}
              <Route element={<RequireCoupleRoute />}>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="plans" element={<PlansList />} />
                  <Route path="plans/:id" element={<PlanDetails />} />
                  <Route path="random" element={<Randomizer />} />
                  <Route path="history" element={<History />} />
                  <Route path="gifts" element={<Gifts />} />
                  <Route path="profile" element={<Profile />} />
                </Route>
              </Route>
            </Route>
          </Routes>
          </Suspense>
        </BrowserRouter>
          <Toaster position="top-center" />
        </NotificationsProvider>
      </CoupleProvider>
    </AuthProvider>
  );
}
