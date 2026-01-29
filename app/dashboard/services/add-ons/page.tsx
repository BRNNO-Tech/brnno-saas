import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getBusinessId } from '@/lib/actions/utils';
import { getBusiness } from '@/lib/actions/business';
import { Button } from '@/components/ui/button';
import { Plus, Package, ArrowLeft, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { GlowBG } from '@/components/ui/glow-bg';
import { CardShell } from '@/components/ui/card-shell';
import AddonsList from '@/components/services/addons-list';
import { DashboardPageError } from '@/components/dashboard/page-error';

export default async function AddonsPage() {
  let supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>;
  let businessId: string;

  try {
    supabase = await createClient();
    businessId = await getBusinessId();
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'An error occurred.';
    try {
      const b = await getBusiness();
      if (b && b.subscription_status !== 'active' && b.subscription_status !== 'trialing') {
        return <DashboardPageError isTrialEnded />;
      }
    } catch { /* ignore */ }
    if (msg.includes('Not authenticated') || msg.includes('Authentication error')) {
      redirect('/login');
    }
    const isNoBusiness = msg.includes('No business found');
    return (
      <DashboardPageError
        message={msg}
        isNoBusiness={isNoBusiness}
        title={isNoBusiness ? 'Business Setup Required' : 'Unable to load add-ons'}
      />
    );
  }

  // Get all add-ons with their associated services
  const { data: addons } = await supabase
    .from('service_addons')
    .select(`
      *,
      service:services(id, name)
    `)
    .eq('business_id', businessId)
    .order('name');

  // Get all services for the dropdown
  const { data: services } = await supabase
    .from('services')
    .select('id, name')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('name');

  // Calculate stats
  const totalAddons = addons?.length || 0;
  const activeAddons = addons?.filter(a => a.is_active).length || 0;
  const avgPrice = addons?.length
    ? Math.round(addons.reduce((sum, a) => sum + Number(a.price || 0), 0) / addons.length)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-100 dark:from-[#07070A] dark:via-[#07070A] dark:to-[#0a0a0d] text-zinc-900 dark:text-white -m-4 sm:-m-6">
      <div className="relative">
        <div className="hidden dark:block">
          <GlowBG />
        </div>

        <div className="relative mx-auto max-w-[1280px] px-6 py-8">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link href="/dashboard/services">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">Add-ons</h1>
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-white/55 ml-12">
                Manage optional extras that customers can add to services for additional pricing
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <div className="relative overflow-hidden rounded-3xl border border-blue-500/20 dark:border-blue-500/30 bg-gradient-to-br from-blue-500/18 dark:from-blue-500/18 to-blue-500/5 dark:to-blue-500/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-blue-500/20 dark:ring-blue-500/20">
              <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-blue-100/50 dark:bg-blue-500/5 blur-2xl" />
              <div className="mb-2 flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <p className="text-sm font-medium text-zinc-700 dark:text-white/65">
                  Total Add-ons
                </p>
              </div>
              <p className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">{totalAddons}</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-white/45">
                All add-ons
              </p>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 dark:border-amber-500/30 bg-gradient-to-br from-amber-500/18 dark:from-amber-500/18 to-amber-500/5 dark:to-amber-500/5 backdrop-blur-sm p-5 shadow-lg dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-1 ring-amber-500/20 dark:ring-amber-500/20">
              <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-amber-100/50 dark:bg-amber-500/5 blur-2xl" />
              <div className="mb-2 flex items-center gap-2">
                <Package className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <p className="text-sm font-medium text-zinc-700 dark:text-white/65">
                  Active Add-ons
                </p>
              </div>
              <p className="text-3xl font-semibold text-zinc-900 dark:text-white tracking-tight">{activeAddons}</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-white/45">
                Currently available
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
                Average add-on price
              </p>
            </div>
          </div>

          {/* Add-ons List */}
          <CardShell title="Add-ons Management" subtitle="Create and manage optional extras for your services">
            <AddonsList 
              initialAddons={addons || []} 
              services={services || []}
            />
          </CardShell>
        </div>
      </div>
    </div>
  );
}
