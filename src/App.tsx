/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Layout } from './components/Layout';
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute';

// Auth Pages
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';

// Core & Module Pages
import { Dashboard } from './pages/Dashboard';
import { TasksPage } from './pages/Tasks';
import { BorrowLendPage } from './pages/BorrowLend';
import { BudgetPage } from './pages/Budget';
import { ShoppingPage } from './pages/Shopping';
import { SecondBrainPage } from './pages/SecondBrain';
import { DocumentsPage } from './pages/Documents';
import { MedicinesPage } from './pages/Medicines';
import { LearningPage } from './pages/Learning';
import { StylePage } from './pages/Style';
import { HabitsPage } from './pages/Habits';
import { CareerPage } from './pages/Career';
import { CredentialsPage } from './pages/Credentials';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicOnlyRoute>
                  <Signup />
                </PublicOnlyRoute>
              }
            />

            {/* Protected App Shell Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/borrow-lend" element={<BorrowLendPage />} />
                <Route path="/budget" element={<BudgetPage />} />
                <Route path="/shopping" element={<ShoppingPage />} />
                <Route path="/brain" element={<SecondBrainPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/medicines" element={<MedicinesPage />} />
                <Route path="/learning" element={<LearningPage />} />
                <Route path="/style" element={<StylePage />} />
                <Route path="/habits" element={<HabitsPage />} />
                <Route path="/career" element={<CareerPage />} />
                <Route path="/credentials" element={<CredentialsPage />} />
              </Route>
            </Route>

            {/* Fallback to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
