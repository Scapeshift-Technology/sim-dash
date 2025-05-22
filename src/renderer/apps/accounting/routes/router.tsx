import ComingSoonView from "@/accounting/pages/ComingSoonView";
import { Route, Routes } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import AccountingSidebar from "@/accounting/components/AccountingSidebar";

const AccountingRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout Sidebar={AccountingSidebar} children={<ComingSoonView />} />} />
    </Routes>
  );
};

export default AccountingRouter;