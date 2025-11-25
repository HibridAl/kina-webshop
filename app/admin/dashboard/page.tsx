'use client';

import { useEffect, useState } from 'react';
import { getProducts, getSuppliers, getCategories, getBrands } from '@/lib/db';
import { Package, Folder, Truck, BarChart3 } from 'lucide-react';
import type { Product, Supplier, Category, Brand } from '@/lib/types';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    suppliers: 0,
    brands: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [products, categories, suppliers, brands] = await Promise.all([
          getProducts(1000, 0),
          getCategories(),
          getSuppliers(),
          getBrands(),
        ]);

        setStats({
          products: products.length,
          categories: categories.length,
          suppliers: suppliers.length,
          brands: brands.length,
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  const statCards = [
    { label: 'Total Products', value: stats.products, icon: Package, color: 'bg-blue-500' },
    { label: 'Categories', value: stats.categories, icon: Folder, color: 'bg-green-500' },
    { label: 'Suppliers', value: stats.suppliers, icon: Truck, color: 'bg-purple-500' },
    { label: 'Brands', value: stats.brands, icon: BarChart3, color: 'bg-orange-500' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold">{loading ? '-' : stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg text-white`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-card border border-border rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-6">Quick Start</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/admin/products/new"
            className="p-4 border border-border rounded-lg hover:border-accent hover:bg-muted transition-all cursor-pointer"
          >
            <h3 className="font-semibold mb-1">Add New Product</h3>
            <p className="text-sm text-muted-foreground">Create a new product listing</p>
          </a>
          <a
            href="/admin/categories"
            className="p-4 border border-border rounded-lg hover:border-accent hover:bg-muted transition-all cursor-pointer"
          >
            <h3 className="font-semibold mb-1">Manage Categories</h3>
            <p className="text-sm text-muted-foreground">Add or edit product categories</p>
          </a>
          <a
            href="/admin/suppliers"
            className="p-4 border border-border rounded-lg hover:border-accent hover:bg-muted transition-all cursor-pointer"
          >
            <h3 className="font-semibold mb-1">Manage Suppliers</h3>
            <p className="text-sm text-muted-foreground">Configure supplier integrations</p>
          </a>
          <a
            href="/admin/products"
            className="p-4 border border-border rounded-lg hover:border-accent hover:bg-muted transition-all cursor-pointer"
          >
            <h3 className="font-semibold mb-1">View All Products</h3>
            <p className="text-sm text-muted-foreground">Edit or delete existing products</p>
          </a>
        </div>
      </div>
    </div>
  );
}
