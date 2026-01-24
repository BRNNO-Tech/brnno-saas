import { createClient } from '@/lib/supabase/server';
import { getBusinessId } from '@/lib/actions/utils';
import { Button } from '@/components/ui/button';
import { Plus, Package, TrendingUp, DollarSign } from 'lucide-react';
import Link from 'next/link';
import ServiceList from '@/components/services/service-list';
import { GlowBG } from '@/components/ui/glow-bg';
import { CardShell } from '@/components/ui/card-shell';

export default async function ServicesPage() {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('name');

  // Calculate stats
  const totalServices = services?.length || 0;
  const popularServices = services?.filter(s => s.is_popular).length || 0;
  const avgPrice = services?.length
    ? Math.round(services.reduce((sum, s) => sum + (s.base_price || 0), 0) / services.length)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
      <div className="relative">
        <div className="hidden dark:block">
          <GlowBG />
        </div>

        <div className="relative mx-auto max-w-[1280px] px-6 py-8">
          {/* Header */}
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">Services</h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-white/55">
                Manage your service packages, pricing, and add-ons
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard/services/add-ons">
                  <Package className="mr-2 h-4 w-4" />
                  Manage Add-ons
                </Link>
              </Button>
              <Button asChild>
                <Link href="/dashboard/services/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Service
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 dark:border-blue-500/30 bg-gradient-to-br from-blue-500/18 dark:from-blue-500/18 to-blue-500/5 dark:to-blue-500/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-blue-500/20 dark:ring-blue-500/20">
              <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-blue-100/50 dark:bg-blue-500/5 blur-2xl" />
              <div className="mb-2 flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-medium text-zinc-700 dark:text-white/65">
                  Total Services
                </p>
              </div>
              <p className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">{totalServices}</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-white/45">
                Active services
              </p>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 dark:border-amber-500/30 bg-gradient-to-br from-amber-500/18 dark:from-amber-500/18 to-amber-500/5 dark:to-amber-500/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-amber-500/20 dark:ring-amber-500/20">
              <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-amber-100/50 dark:bg-amber-500/5 blur-2xl" />
              <div className="mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <p className="text-sm font-medium text-zinc-700 dark:text-white/65">
                  Popular Services
                </p>
              </div>
              <p className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">{popularServices}</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-white/45">
                Featured services
              </p>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-500/18 dark:from-emerald-500/18 to-emerald-500/5 dark:to-emerald-500/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-emerald-500/20 dark:ring-emerald-500/20">
              <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-emerald-100/50 dark:bg-emerald-500/5 blur-2xl" />
              <div className="mb-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm font-medium text-zinc-700 dark:text-white/65">
                  Avg. Price
                </p>
              </div>
              <p className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">${avgPrice}</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-white/45">
                Average service price
              </p>
            </div>
          </div>

          {/* Services List */}
          <CardShell title="Service Management" subtitle="Manage your service packages, pricing, and add-ons">
            <ServiceList services={services || []} />
          </CardShell>
        </div>
      </div>
    </div>
  );
}