import { Link, useLocation } from 'react-router-dom';
import {
  MdDashboard,
  MdEmojiNature,
  MdPark,
  MdAutoAwesome,
  MdEmojiEvents,
  MdTimeline,
  MdScore
} from 'react-icons/md';

const sidebarLinks = [
  { path: '/', label: 'Overview', icon: MdDashboard },
  { path: '/calculator', label: 'Carbon Calculator', icon: MdEmojiNature },
  { path: '/ai-coach', label: 'AI Sustainability Coach', icon: MdAutoAwesome },
  { path: '/simulator', label: 'Reduction Simulator', icon: MdPark },
  { path: '/challenges', label: 'Eco Challenges', icon: MdEmojiEvents },
  { path: '/dashboard', label: 'Progress Tracking', icon: MdTimeline },
  { path: '/sustainability-score', label: 'Sustainability Score', icon: MdScore },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex w-[260px] shrink-0 flex-col border-r border-[#1f2937] bg-[#0b1519] relative overflow-hidden h-screen sticky top-0">

      {/* Brand Logo */}
      <div className="px-5 pt-6 pb-6 flex flex-col">
        <div className="flex items-center gap-3 text-white">
          <div className="flex items-center justify-center text-[#12b76a] flex-shrink-0">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10C22 6.477 17.523 2 12 2zM9.5 16.5l-4-4 1.414-1.414L9.5 13.672l6.086-6.086L17 9l-7.5 7.5z" clipRule="evenodd"></path>
            </svg>
          </div>
          <div className="flex flex-col justify-center">
            <h2 className="text-[18px] font-bold tracking-[-0.5px] leading-tight text-white">Eco Sense AI</h2>
            <p className="text-[11px] text-[#98a2b3] font-medium mt-0.5 leading-[1.3] flex flex-col">
              <span>FOR A GREENER</span>
              <span>TOMORROW</span>
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex-1 space-y-1 px-4 pb-6 overflow-y-auto overflow-x-hidden">
        {sidebarLinks.map((link) => {
          let isActive = false;
          if (link.path === '/') {
            isActive = location.pathname === '/';
          } else if (link.path === '/dashboard') {
            isActive = location.pathname === '/dashboard';
          } else {
            isActive = location.pathname.startsWith(link.path);
          }
          const Icon = link.icon;

          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-3 rounded-lg px-3.5 py-3 text-[14px] font-medium transition-colors relative group ${isActive
                ? 'text-white bg-[#12b76a]'
                : 'text-[#98a2b3] hover:bg-white/5 hover:text-white'
                }`}
            >
              <div className="w-5 flex justify-center items-center flex-shrink-0">
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-[#98a2b3] group-hover:text-white'}`} />
              </div>
              <span className="leading-[1.25]">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
