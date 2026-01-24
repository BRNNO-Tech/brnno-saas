import { ServiceForm } from '@/components/services/service-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NewServicePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/services">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Service</h1>
          <p className="text-muted-foreground mt-1">
            Add a new service package to your offerings
          </p>
        </div>
      </div>

      <ServiceForm mode="create" />
    </div>
  );
}
