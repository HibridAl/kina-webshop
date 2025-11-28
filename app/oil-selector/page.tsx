import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { VehicleOilSelector } from '@/components/vehicle-oil-selector';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Olaj- és folyadékválasztó – AutoHub',
  description:
    'Válassza ki kínai gyártmányú járművét (MG, BYD, Omoda, Geely, Haval), és nézze meg a gyártói adatok alapján ajánlott motorolajokat és egyéb folyadékokat, kapacitásokkal és csereintervallumokkal.',
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


