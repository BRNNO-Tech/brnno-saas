import { getService } from '@/lib/actions/services';
import { ServiceForm } from '@/components/services/service-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { notFound } from 'next/navigation';

interface EditServicePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditServicePage({ params }: EditServicePageProps) {
  const { id } = await params;
  let service;
  
  try {
    service = await getService(id);
  } catch (error) {
    console.error('Error loading service:', error);
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/services">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Service</h1>
          <p className="text-muted-foreground mt-1">
            Update service details and pricing
          </p>
        </div>
      </div>

      <ServiceForm mode="edit" service={service} />
    </div>
  );
}
