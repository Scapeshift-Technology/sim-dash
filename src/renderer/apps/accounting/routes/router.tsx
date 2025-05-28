import ComingSoonView from "@/accounting/pages/ComingSoonView";
import { Route, Routes } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import AccountingSidebar from "@/accounting/components/AccountingSidebar";
import ProfilePage from '@/layouts/pages/ProfilePage';
import SettingsPage from '@/layouts/pages/SettingsPage';
import { CounterpartiesListPage } from "@/accounting/pages/CounterpartiesListPage";
import { CounterpartyFormPage } from "@/accounting/pages/CounterpartyFormPage";
import { CounterpartyDetailPage } from "@/accounting/pages/CounterpartyDetailPage";

const AccountingRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/profile" element={<MainLayout Sidebar={AccountingSidebar} children={<ProfilePage />} />} />
      <Route path="/settings" element={<MainLayout Sidebar={AccountingSidebar} children={<SettingsPage />} />} />
      
      {/* Counterparties routes */}
      <Route path="/counterparties" element={<MainLayout Sidebar={AccountingSidebar} children={<CounterpartiesListPage />} />} />
      <Route path="/counterparties/new" element={<MainLayout Sidebar={AccountingSidebar} children={<CounterpartyFormPage />} />} />
      <Route path="/counterparties/:id" element={<MainLayout Sidebar={AccountingSidebar} children={<CounterpartyDetailPage />} />} />
      
      <Route path="/" element={<MainLayout Sidebar={AccountingSidebar} children={<ComingSoonView />} />} />
      <Route path="*" element={<MainLayout Sidebar={AccountingSidebar} children={<ComingSoonView />} />} />
    </Routes>
  );
};

export default AccountingRouter;