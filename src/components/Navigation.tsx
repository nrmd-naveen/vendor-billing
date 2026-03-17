'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, Leaf, PlusCircle, BarChart2, Settings } from 'lucide-react';
import clsx from 'clsx';
import { useSettings } from '@/lib/useSettings';

const mainNav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/bills', label: 'Bills', icon: FileText },
  { href: '/bills/new', label: 'New Bill', icon: PlusCircle, highlight: true },
  { href: '/vegetables', label: 'Vegetables', icon: Leaf },
  { href: '/reports', label: 'Reports', icon: BarChart2 },
];

export default function Navigation() {
  const pathname = usePathname();
  const { settings } = useSettings();

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden bg-green-700 text-white px-4 py-3 flex items-center justify-between shadow-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          {settings.logoLeft ? (
            <img src={settings.logoLeft} alt="" className="w-8 h-8 object-contain rounded" />
          ) : (
            <Leaf className="w-6 h-6 text-green-200" />
          )}
          <span className="font-bold text-lg tracking-wide">{settings.name}</span>
        </div>
        <Link href="/settings" className="p-1.5 rounded-lg hover:bg-green-600 transition-colors">
          <Settings className="w-5 h-5 text-green-200" />
        </Link>
      </header>

      {/* Mobile bottom nav — 6 items */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg pb-safe">
        <div className="flex justify-around">
          {mainNav.map(({ href, label, icon: Icon, highlight }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex flex-col items-center py-2 px-0.5 text-[10px] font-medium transition-colors min-w-0 flex-1 active:bg-gray-50',
                  highlight ? 'text-green-600' : active ? 'text-green-700' : 'text-gray-500'
                )}
              >
                <Icon className={clsx('w-5 h-5 mb-0.5', active || highlight ? 'text-green-600' : 'text-gray-400')} />
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-green-800 text-white min-h-screen fixed left-0 top-0 z-40">
        {/* Branding */}
        <div className="px-5 py-5 border-b border-green-700">
          <div className="flex items-center gap-3">
            {settings.logoLeft ? (
              <img src={settings.logoLeft} alt="logo" className="w-10 h-10 object-contain rounded-lg bg-white/10 p-0.5 shrink-0" />
            ) : (
              <Leaf className="w-9 h-9 text-green-300 shrink-0" />
            )}
            <div className="min-w-0">
              <div className="font-bold text-xl leading-tight truncate">{settings.name}</div>
              {settings.subtitle && (
                <div className="text-green-300 text-xs truncate">{settings.subtitle}</div>
              )}
            </div>
          </div>
          {settings.address && (
            <div className="mt-2 text-green-400 text-[11px] leading-tight">{settings.address}</div>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {mainNav.map(({ href, label, icon: Icon, highlight }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all',
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

        {/* Settings footer */}
        <div className="px-3 pb-4 border-t border-green-700 pt-3">
          <Link
            href="/settings"
            className={clsx(
              'flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium transition-all',
              isActive('/settings') ? 'bg-green-700 text-white' : 'text-green-300 hover:bg-green-700 hover:text-white'
            )}
          >
            <Settings className="w-5 h-5 shrink-0" />
            <span>Settings</span>
          </Link>
          <div className="px-4 pt-2 text-green-500 text-[10px]">Data saved on this device</div>
        </div>
      </aside>
    </>
  );
}
