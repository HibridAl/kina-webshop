'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Folder, Truck, Settings, ShoppingCart, ShieldCheck } from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: Folder },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/suppliers', label: 'Suppliers', icon: Truck },
  { href: '/admin/compatibility', label: 'Compatibility', icon: ShieldCheck },
  { href: '/admin/setup', label: 'Setup', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-border bg-muted/30 min-h-screen sticky top-16">
      <nav className="space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
