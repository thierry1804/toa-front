import { Outlet, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import Sidebar from './Sidebar';
import Header from './Header';
import ToastContainer from '@/components/ui/ToastContainer';

export default function MainLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { toasts, removeToast } = useToastStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
