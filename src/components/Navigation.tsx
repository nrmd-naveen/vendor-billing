'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, Leaf, PlusCircle, Settings, Banknote, ShoppingCart, Store, Wheat, BarChart2 } from 'lucide-react';
import clsx from 'clsx';
import { useSettings } from '@/lib/useSettings';

type NavItem = { href: string; label: string; icon: React.ElementType; group: string };
type NewItem = { href: string; label: string; type: 'sales' | 'purchase' | 'farmer' };
type SidebarGroup = {
  label: string | null;
  subLabel?: string;
  color?: string;
  newItem?: NewItem;
  items: NavItem[];
};

// Mobile nav — most-used items, scrollable
const mobileNav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, group: 'general' },
  { href: '/reports', label: 'Reports', icon: BarChart2, group: 'general' },
  { href: '/customers', label: 'Customers', icon: Users, group: 'sales' },
  { href: '/bills/new', label: 'New Bill', icon: PlusCircle, highlight: true, group: 'sales' },
  { href: '/purchases/new', label: 'Buy', icon: ShoppingCart, purchaseHighlight: true, group: 'purchase' },
  { href: '/farmer-bills/new', label: 'Farmer', icon: Wheat, farmerHighlight: true, group: 'farmer' },
  { href: '/collections', label: 'Collections', icon: Banknote, group: 'sales' },
  { href: '/bills', label: 'Bills', icon: FileText, group: 'sales' },
  { href: '/shops', label: 'Shops', icon: Store, group: 'purchase' },
  { href: '/purchase-payments', label: 'Payments', icon: Banknote, group: 'purchase' },
  { href: '/farmers', label: 'Farmers', icon: Wheat, group: 'farmer' },
];

// Desktop sidebar — grouped with section headers
const sidebarGroups: SidebarGroup[] = [
  {
    label: null,
    items: [
      { href: '/', label: 'Dashboard', icon: LayoutDashboard, group: 'general' },
      { href: '/reports', label: 'Reports & Analysis', icon: BarChart2, group: 'general' },
    ],
  },
  {
    label: 'Sales',
    subLabel: 'விற்பனை',
    color: 'text-green-300',
    newItem: { href: '/bills/new', label: 'New Bill', type: 'sales' },
    items: [
      { href: '/customers', label: 'Customers', icon: Users, group: 'sales' },
      { href: '/bills', label: 'Bills', icon: FileText, group: 'sales' },
      { href: '/collections', label: 'Collections', icon: Banknote, group: 'sales' },
    ],
  },
  {
    label: 'Purchases',
    subLabel: 'கொள்முதல்',
    color: 'text-orange-300',
    newItem: { href: '/purchases/new', label: 'New Purchase', type: 'purchase' },
    items: [
      { href: '/shops', label: 'Shops', icon: Store, group: 'purchase' },
      { href: '/purchases', label: 'Purchases', icon: ShoppingCart, group: 'purchase' },
      { href: '/purchase-payments', label: 'Payments', icon: Banknote, group: 'purchase' },
    ],
  },
  {
    label: 'Farmers',
    subLabel: 'சம்சாரி',
    color: 'text-yellow-300',
    newItem: { href: '/farmer-bills/new', label: 'New Farmer Bill', type: 'farmer' },
    items: [
      { href: '/farmers', label: 'Farmers', icon: Wheat, group: 'farmer' },
      { href: '/farmer-bills', label: 'Farmer Bills', icon: FileText, group: 'farmer' },
    ],
  },
  {
    label: 'Catalog',
    color: 'text-green-400',
    items: [
      { href: '/vegetables', label: 'Vegetables', icon: Leaf, group: 'catalog' },
    ],
  },
];

const newItemStyle: Record<string, string> = {
  sales: 'text-green-300 hover:bg-green-700 hover:text-white',
  purchase: 'text-orange-300 hover:bg-orange-900 hover:text-orange-100',
  farmer: 'text-yellow-300 hover:bg-yellow-900 hover:text-yellow-100',
};

export default function Navigation() {
  const pathname = usePathname();
  const { settings } = useSettings();

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href));

  const getItemStyle = (item: NavItem, active: boolean) => {
    if (active) {
      if (item.group === 'purchase') return 'bg-orange-700/50 text-white';
      if (item.group === 'farmer') return 'bg-yellow-700/50 text-white';
      return 'bg-green-700 text-white';
    }
    return 'text-green-100 hover:bg-green-700/50';
  };

  const getMobileItemColor = (item: typeof mobileNav[0], active: boolean) => {
    if (item.highlight) return 'text-green-600';
    if (item.purchaseHighlight) return 'text-orange-600';
    if (item.farmerHighlight) return 'text-yellow-600';
    if (active) {
      if (item.group === 'purchase') return 'text-orange-700';
      if (item.group === 'farmer') return 'text-yellow-700';
      return 'text-green-700';
    }
    return 'text-gray-500';
  };

  const getMobileIconColor = (item: typeof mobileNav[0], active: boolean) => {
    if (item.highlight) return 'text-green-600';
    if (item.purchaseHighlight) return 'text-orange-600';
    if (item.farmerHighlight) return 'text-yellow-600';
    if (active) {
      if (item.group === 'purchase') return 'text-orange-600';
      if (item.group === 'farmer') return 'text-yellow-600';
      return 'text-green-600';
    }
    return 'text-gray-400';
  };

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

      {/* Mobile bottom nav — scrollable */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg pb-safe">
        <div className="flex overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {mobileNav.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={clsx(
                  'flex flex-col items-center py-2 px-1 text-[9px] font-medium transition-colors flex-none w-[52px] active:bg-gray-50',
                  getMobileItemColor(item, active)
                )}>
                <Icon className={clsx('w-5 h-5 mb-0.5', getMobileIconColor(item, active))} />
                <span className="truncate w-full text-center leading-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-green-800 text-white min-h-screen fixed left-0 top-0 z-40">
        {/* Branding */}
        <div className="px-5 py-5 border-b border-green-700">
          <div className="flex items-center gap-3">
            {settings.logoLeft ? (
              <img src={settings.logoLeft} alt="logo" className="w-10 h-10 object-contain rounded-lg bg-white/10 p-0.5 shrink-0" />
            ) : (
              <Leaf className="w-9 h-9 text-green-300 shrink-0" />
            )}
            <div className="min-w-0">
              <div className="font-bold text-lg leading-tight truncate">{settings.name}</div>
              {settings.subtitle && <div className="text-green-400 text-xs truncate">{settings.subtitle}</div>}
            </div>
          </div>
          {settings.address && <div className="mt-2 text-green-500 text-[11px] leading-tight">{settings.address}</div>}
        </div>

        {/* Nav links — grouped */}
        <nav className="flex-1 px-2 py-4 space-y-5 overflow-y-auto">
          {sidebarGroups.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <div className="flex items-center justify-between px-2 mb-1.5">
                  <div className="flex items-baseline gap-2">
                    <span className={clsx('text-[10px] font-bold uppercase tracking-widest', group.color)}>
                      {group.label}
                    </span>
                    {group.subLabel && (
                      <span className="text-[10px] text-green-200 font-bold">{group.subLabel}</span>
                    )}
                  </div>
                  {group.newItem && (
                    <Link
                      href={group.newItem.href}
                      title={group.newItem.label}
                      className={clsx(
                        'flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded transition-colors',
                        newItemStyle[group.newItem.type]
                      )}>
                      <PlusCircle className="w-3 h-3" />
                      New
                    </Link>
                  )}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link key={item.href} href={item.href}
                      className={clsx('flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all text-sm', getItemStyle(item, active))}>
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Settings footer */}
        <div className="px-2 pb-4 border-t border-green-700 pt-3">
          <Link href="/settings"
            className={clsx('flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all text-sm',
              isActive('/settings') ? 'bg-green-700 text-white' : 'text-green-400 hover:bg-green-700 hover:text-white')}>
            <Settings className="w-4 h-4 shrink-0" />
            <span>Settings</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
