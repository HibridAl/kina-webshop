import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { VehicleOilSelector } from '@/components/vehicle-oil-selector';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Oil & Fluid Selector - AutoHub',
  description:
    'Select your Chinese vehicle (MG, BYD, Omoda, Geely, Haval) to see recommended engine oils and fluids based on manufacturer data.',
};

export default function OilSelectorPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-12 md:py-16">
        <VehicleOilSelector />
      </main>
      <Footer />
    </div>
  );
}


