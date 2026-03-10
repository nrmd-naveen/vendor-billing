'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, Leaf, PlusCircle } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/bills', label: 'Bills', icon: FileText },
  { href: '/bills/new', label: 'New Bill', icon: PlusCircle, highlight: true },
  { href: '/vegetables', label: 'Vegetables', icon: Leaf },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Top bar for mobile */}
      <header className="lg:hidden bg-green-700 text-white px-4 py-3 flex items-center gap-3 shadow-md sticky top-0 z-50">
        <Leaf className="w-6 h-6 text-green-200" />
        <span className="font-bold text-lg tracking-wide">Kaikari Kadai</span>
      </header>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg pb-safe">
        <div className="flex justify-around">
          {navItems.map(({ href, label, icon: Icon, highlight }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex flex-col items-center py-2.5 px-1 text-xs font-medium transition-colors min-w-0 flex-1 active:bg-gray-50',
                  highlight
                    ? active ? 'text-green-700' : 'text-green-600'
                    : active
                    ? 'text-green-700'
                    : 'text-gray-500'
                )}
              >
                <Icon className={clsx('w-5 h-5 mb-0.5', active || highlight ? 'text-green-600' : 'text-gray-400')} />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Sidebar for desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-green-800 text-white min-h-screen fixed left-0 top-0 z-40">
        <div className="px-6 py-6 flex items-center gap-3 border-b border-green-700">
          <Leaf className="w-8 h-8 text-green-300" />
          <div>
            <div className="font-bold text-xl">Kaikari Kadai</div>
            <div className="text-green-300 text-xs">Vegetable Billing</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon, highlight }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all',
                  highlight
                    ? 'bg-green-500 hover:bg-green-400 text-white shadow-md'
                    : active
                    ? 'bg-green-700 text-white'
                    : 'text-green-100 hover:bg-green-700'
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="px-6 py-4 border-t border-green-700 text-green-400 text-xs">
          Data saved on this device
        </div>
      </aside>
    </>
  );
}
