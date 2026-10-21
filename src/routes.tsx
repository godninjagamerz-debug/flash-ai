import { lazy, type ReactNode } from 'react';

const Chat = lazy(() => import('./pages/Chat'));
const Plans = lazy(() => import('./pages/Plans'));
const Login = lazy(() => import('./pages/Login'));
const Admin = lazy(() => import('./pages/Admin'));
const Settings = lazy(() => import('./pages/Settings'));
const Payment = lazy(() => import('./pages/Payment'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const ApiKeys = lazy(() => import('./pages/ApiKeys'));
const ImageGen = lazy(() => import('./pages/ImageGen'));
const MediaHub = lazy(() => import('./pages/MediaHub'));
const Beta = lazy(() => import('./pages/Beta'));
const CustomAppPreview = lazy(() => import('./pages/CustomAppPreview'));

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  { name: 'Chat',           path: '/',               element: <Chat /> },
  { name: 'Plans',          path: '/plans',           element: <Plans /> },
  { name: 'Settings',       path: '/settings',        element: <Settings /> },
  { name: 'Media Hub',      path: '/media-hub',       element: <MediaHub /> },
  { name: 'App Preview',    path: '/app/:slug',       element: <CustomAppPreview />, visible: false },
  { name: 'Image Gen',      path: '/image-gen',       element: <ImageGen />,      visible: false },
  { name: 'Beta',           path: '/beta',            element: <Beta />,          visible: false },
  { name: 'API Keys',       path: '/api-keys',        element: <ApiKeys />,       visible: false },
  { name: 'Payment',        path: '/payment',         element: <Payment />,       visible: false },
  { name: 'PaymentSuccess', path: '/payment-success', element: <PaymentSuccess />,visible: false },
  { name: 'Login',          path: '/login',           element: <Login />,         visible: false },
  { name: 'Admin',          path: '/admin',           element: <Admin />,         visible: false },
];

export default routes;