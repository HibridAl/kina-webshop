import { LayoutDashboard, Package, MapPin, Star, Settings, LogOut, Heart } from 'lucide-react';

export const ACCOUNT_NAV_ITEMS = [
  { label: { hu: 'Áttekintés', en: 'Overview' }, href: '/account', icon: LayoutDashboard },
  { label: { hu: 'Rendelések', en: 'Orders' }, href: '/account/orders', icon: Package },
  { label: { hu: 'Kívánságlista', en: 'Wishlist' }, href: '/account/wishlist', icon: Heart },
  { label: { hu: 'Címjegyzék', en: 'Addresses' }, href: '/account/addresses', icon: MapPin },
  { label: { hu: 'Mentett járművek', en: 'My Garage' }, href: '/account/garage', icon: Star },
  { label: { hu: 'Fiók adatok', en: 'Account Details' }, href: '/account/details', icon: Settings },
];
