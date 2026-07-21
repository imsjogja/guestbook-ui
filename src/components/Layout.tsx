import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import TrialBanner from './TrialBanner';

const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

export default function Layout() {
  return (
    <div className="min-h-[100dvh] bg-[#f8fafc] dark:bg-[#0b0f19]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="lg:ml-64">
        {/* Topbar */}
        <Topbar />

        {/* Trial / subscription status banner */}
        <TrialBanner />

        {/* Page content */}
        <motion.main
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: easeOutExpo }}
          className="p-4 lg:p-6 xl:p-8"
        >
          <div className="max-w-[1440px] mx-auto">
            <Outlet />
          </div>
        </motion.main>
      </div>
    </div>
  );
}
