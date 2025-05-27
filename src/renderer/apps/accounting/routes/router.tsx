import ComingSoonView from "@/accounting/pages/ComingSoonView";
import { Route, Routes } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import AccountingSidebar from "@/accounting/components/AccountingSidebar";
import ProfilePage from '@/layouts/pages/ProfilePage';
import SettingsPage from '@/layouts/pages/SettingsPage';

const AccountingRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/profile" element={<MainLayout Sidebar={AccountingSidebar} children={<ProfilePage />} />} />
      <Route path="/settings" element={<MainLayout Sidebar={AccountingSidebar} children={<SettingsPage />} />} />
      <Route path="/" element={<MainLayout Sidebar={AccountingSidebar} children={<ComingSoonView />} />} />
      <Route path="*" element={<MainLayout Sidebar={AccountingSidebar} children={<ComingSoonView />} />} />
    </Routes>
  );
};

export default AccountingRouter;