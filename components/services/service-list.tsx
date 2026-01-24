'use client';

import { useState } from 'react';
import { Service } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Pencil,
  Trash2,
  Star,
  Check,
  DollarSign,
  Clock,
  Package,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteService } from '@/lib/actions/services';
import { getFeatureLabel } from '@/lib/utils/feature-labels';
import { toast } from 'sonner';

interface ServiceListProps {
  services: Service[];
}

export default function ServiceList({ services: initialServices }: ServiceListProps) {
  const [services, setServices] = useState(initialServices);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await deleteService(deleteId);
      setServices(services.filter(s => s.id !== deleteId));
      toast.success('Service deleted successfully');
      setDeleteId(null);
    } catch (error) {
      toast.error('Failed to delete service');
    } finally {
      setIsDeleting(false);
    }
  };

  if (services.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border">
        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No services yet</h3>
        <p className="text-muted-foreground mt-2">
          Get started by creating your first service package
        </p>
        <Button asChild className="mt-4">
          <Link href="/dashboard/services/new">Add Service</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => {
          // Use base_price if available, otherwise fall back to price
          const displayPrice = service.base_price ?? service.price ?? 0;
          // Use estimated_duration if available, otherwise calculate from duration_minutes
          // estimated_duration is in minutes, convert to hours (can be decimal like 1.5, 2.5, etc.)
          const displayDuration = service.estimated_duration 
            ? (service.estimated_duration / 60) // Convert minutes to hours (can be decimal)
            : (service.duration_minutes ? (service.duration_minutes / 60) : null);

          return (
            <div
              key={service.id}
              className="bg-card rounded-lg border overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Service Image */}
              <div className="relative h-48 bg-muted">
                {service.image_url ? (
                  <Image
                    src={service.image_url}
                    alt={service.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-6xl">{service.icon || '✨'}</div>
                  </div>
                )}

                {/* Popular Badge */}
                {service.is_popular && (
                  <Badge className="absolute top-3 right-3 bg-amber-500 hover:bg-amber-600">
                    <Star className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                )}
              </div>

              {/* Service Content */}
              <div className="p-6 space-y-4">
                {/* Header */}
                <div>
                  <h3 className="text-xl font-bold">{service.name}</h3>
                  {service.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {service.description}
                    </p>
                  )}
                </div>

                {/* Price & Duration */}
                <div className="flex items-center gap-4 text-sm">
                  {displayPrice > 0 && (service as any)?.show_price !== false && (
                    <div className="flex items-center gap-1.5 text-green-600 font-semibold">
                      <DollarSign className="h-4 w-4" />
                      <span>${displayPrice.toFixed(2)}</span>
                    </div>
                  )}
                  {displayDuration && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>
                        {displayDuration % 1 === 0 
                          ? displayDuration.toFixed(0) 
                          : displayDuration.toFixed(1)
                        } {displayDuration === 1 ? 'hour' : 'hours'}
                      </span>
                    </div>
                  )}
                </div>

                {/* What's Included */}
                {service.whats_included && Array.isArray(service.whats_included) && service.whats_included.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      What's Included
                    </p>
                    <ul className="space-y-1">
                      {service.whats_included.slice(0, 3).map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-1">{getFeatureLabel(item)}</span>
                        </li>
                      ))}
                      {service.whats_included.length > 3 && (
                        <li className="text-xs text-muted-foreground pl-6">
                          +{service.whats_included.length - 3} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="flex-1"
                  >
                    <Link href={`/dashboard/services/${service.id}`}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteId(service.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this service. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

