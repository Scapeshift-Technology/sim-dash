import { createHashRouter, Navigate, RouteObject, Outlet } from 'react-router-dom';
import LoginPage from '../pages/login/LoginPage';
import DashboardPage from '../pages/main/DashboardPage';

// We'll implement this later
const ErrorPage: React.FC = () => (
  <div>
    <h1>Oops! Something went wrong.</h1>
    <p>Please try again or contact support if the problem persists.</p>
  </div>
);

// We can use this layout component to add common elements around all auth routes
const AuthLayout: React.FC = () => {
  return (
    <div className="auth-layout">
      {/* We'll use Outlet from react-router-dom to render child routes */}
      <Outlet />
    </div>
  );
};

const routes: RouteObject[] = [
  {
    errorElement: <ErrorPage />,
    element: <AuthLayout />,
    children: [
      { path: '/', element: <Navigate to="/login" /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/home', element: <DashboardPage /> },
      { path: '*', element: <Navigate to="/login" /> }
    ]
  }
];

const router = createHashRouter(routes);

export default router; 