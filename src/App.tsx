import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Residents from './pages/Residents';
import Houses from './pages/Houses';
import HouseResidents from './pages/HouseResidents';
import PaymentBills from './pages/PaymentBills';
import Expenses from './pages/Expenses';
import { ExpenseForm } from './pages/ExpenseForm';
import { Login } from './pages/Login';
import { FeeTypes } from './pages/FeeTypes';
import RouteGuard from './components/Guard/RouteGuard';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public login route */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes wrapped in MainLayout */}
          <Route element={<MainLayout />}>
            
            {/* Dashboard Route */}
            <Route
              path="/"
              element={
                <RouteGuard permission="dashboard:view">
                  <Dashboard />
                </RouteGuard>
              }
            />

            {/* Resident Route */}
            <Route
              path="/residents"
              element={
                <RouteGuard permission="resident:manage">
                  <Residents />
                </RouteGuard>
              }
            />

            {/* House Route */}
            <Route
              path="/houses"
              element={
                <RouteGuard permission="house:manage">
                  <Houses />
                </RouteGuard>
              }
            />

            {/* House Resident Mappings Route */}
            <Route
              path="/house-residents"
              element={
                <RouteGuard permission="house-resident:manage">
                  <HouseResidents />
                </RouteGuard>
              }
            />

            {/* Payment Bill Route */}
            <Route
              path="/payment-bills"
              element={
                <RouteGuard permission="payment-bill:manage">
                  <PaymentBills />
                </RouteGuard>
              }
            />

            {/* Fee Types Route */}
            <Route
              path="/fee-types"
              element={
                <RouteGuard permission="fee-type:manage">
                  <FeeTypes />
                </RouteGuard>
              }
            />

            {/* Expense Routes */}
            <Route
              path="/expenses"
              element={
                <RouteGuard permission="expense:manage">
                  <Expenses />
                </RouteGuard>
              }
            />
            <Route
              path="/expenses/create"
              element={
                <RouteGuard permission="expense:manage">
                  <ExpenseForm />
                </RouteGuard>
              }
            />
            <Route
              path="/expenses/edit/:id"
              element={
                <RouteGuard permission="expense:manage">
                  <ExpenseForm />
                </RouteGuard>
              }
            />

          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
