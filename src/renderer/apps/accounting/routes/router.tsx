import ComingSoonView from "@/accounting/pages/ComingSoonView";
import { Route, Routes } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import AccountingSidebar from "@/accounting/components/AccountingSidebar";
import ProfilePage from '@/layouts/pages/ProfilePage';
import SettingsPage from '@/layouts/pages/SettingsPage';
import { CounterpartiesListPage } from "@/accounting/pages/CounterpartiesListPage";
import { CounterpartyFormPage } from "@/accounting/pages/CounterpartyFormPage";
import { CounterpartyDetailPage } from "@/accounting/pages/CounterpartyDetailPage";
import CounterpartiesMainPage from "@/accounting/pages/CounterpartiesMainPage";
import { LedgerMainPage } from "@/accounting/pages/ledger/LedgerMainPage";
import { LedgerTypePage } from "@/accounting/pages/ledger/LedgerTypePage";
import { LedgerListPage } from "@/accounting/pages/ledger/LedgerListPage";
import { LedgerFormPage } from "@/accounting/pages/ledger/LedgerFormPage";

const AccountingRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/profile" element={<MainLayout Sidebar={AccountingSidebar} children={<ProfilePage />} />} />
      <Route path="/settings" element={<MainLayout Sidebar={AccountingSidebar} children={<SettingsPage />} />} />
      
      {/* Coming soon pages for specific features */}
      <Route path="/accounts/coming-soon" element={<MainLayout Sidebar={AccountingSidebar} children={<ComingSoonView featureName="Accounts" />} />} />
      <Route path="/quick-grader/coming-soon" element={<MainLayout Sidebar={AccountingSidebar} children={<ComingSoonView featureName="Quick Grader" />} />} />
      
      {/* Counterparties routes */}
      <Route path="/counterparties-main" element={<MainLayout Sidebar={AccountingSidebar} children={<CounterpartiesMainPage />} />} />
      <Route path="/counterparties" element={<MainLayout Sidebar={AccountingSidebar} children={<CounterpartiesListPage />} />} />
      <Route path="/counterparties/new" element={<MainLayout Sidebar={AccountingSidebar} children={<CounterpartyFormPage />} />} />
      <Route path="/counterparties/:id" element={<MainLayout Sidebar={AccountingSidebar} children={<CounterpartyDetailPage />} />} />
      
      {/* Ledger routes */}
      <Route path="/ledgers" element={<MainLayout Sidebar={AccountingSidebar} children={<LedgerMainPage />} />} />
      <Route path="/ledgers/:type" element={<MainLayout Sidebar={AccountingSidebar} children={<LedgerTypePage />} />} />
      <Route path="/ledgers/:type/:subtype" element={<MainLayout Sidebar={AccountingSidebar} children={<LedgerListPage />} />} />
      <Route path="/ledgers/:type/:subtype/new" element={<MainLayout Sidebar={AccountingSidebar} children={<LedgerFormPage />} />} />
      {/* TODO: Add detail page route when implemented */}
      {/* <Route path="/ledgers/:type/:subtype/:id" element={<MainLayout Sidebar={AccountingSidebar} children={<LedgerDetailPage />} />} /> */}
      
      <Route path="/" element={<MainLayout Sidebar={AccountingSidebar} children={<LedgerMainPage />} />} />
      <Route path="*" element={<MainLayout Sidebar={AccountingSidebar} children={<ComingSoonView />} />} />
    </Routes>
  );
};

export default AccountingRouter;