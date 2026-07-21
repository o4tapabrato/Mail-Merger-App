// components/Sidebar.js
"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  
  const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'Compose', path: '/compose' },
    { name: 'Campaigns', path: '/campaigns' },
    { name: 'Agents', path: '/agents' },
    { name: 'Scheduler', path: '/scheduler' },
    { name: 'Settings', path: '/settings' }
  ];

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 p-6 flex flex-col h-screen fixed left-0">
      <div className="flex items-center gap-2 mb-10">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">M</div>
        <h2 className="text-xl font-bold text-white">MailMaster Pro</h2>
      </div>
      <nav className="space-y-3 flex-grow">
        {navItems.map((item) => (
          <Link 
            key={item.name} 
            href={item.path}
            className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === item.path ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            {item.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}