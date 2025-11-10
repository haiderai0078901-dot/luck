
import { RouteObject } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import Dashboard from '../pages/dashboard/page';
import Worklist from '../pages/worklist/page';
import Patients from '../pages/patients/page';
import Reports from '../pages/reports/page';
import Alerts from '../pages/alerts/page';
import DataPreview from '../pages/data-preview/page';
import PendingCases from '../pages/pending-cases/page';
import Login from '../pages/login/page';
import NotFound from '../pages/NotFound';
import WeeklyReportPage from '../pages/weekly-report/page';
import AssignmentsPage from '../pages/assignments/page';

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Layout><Dashboard /></Layout>,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/worklist',
    element: <Layout><Worklist /></Layout>,
  },
  {
    path: '/patients',
    element: <Layout><Patients /></Layout>,
  },
  {
    path: '/reports',
    element: <Layout><Reports /></Layout>,
  },
  {
    path: '/alerts',
    element: <Layout><Alerts /></Layout>,
  },
  {
    path: '/data-preview',
    element: <Layout><DataPreview /></Layout>,
  },
  {
    path: '/pending-cases',
    element: <Layout><PendingCases /></Layout>,
  },
  {
    path: '/assignments',
    element: <Layout><AssignmentsPage /></Layout>,
  },
  {
    path: '/weekly-report',
    element: <WeeklyReportPage />
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

export default routes;
