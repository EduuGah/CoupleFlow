/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CoupleProvider } from './contexts/CoupleContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RequireCoupleRoute } from './components/RequireCoupleRoute';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { PlansList } from './pages/PlansList';
import { PlanDetails } from './pages/PlanDetails';
import { Profile } from './pages/Profile';
import { Randomizer } from './pages/Randomizer';
import { Auth } from './pages/Auth';
import { SetupSpace } from './pages/SetupSpace';

export default function App() {
  return (
    <AuthProvider>
      <CoupleProvider>
        <BrowserRouter>
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
                  <Route path="profile" element={<Profile />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </CoupleProvider>
    </AuthProvider>
  );
}
