'use client';

import { Service, ServiceAddon } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, Clock, DollarSign, Star } from 'lucide-react';
import { getStartingPrice, isVariablePricing, getServicePrice, getServiceDuration } from '@/lib/utils/service-pricing';
import { getFeatureLabel } from '@/lib/utils/feature-labels';
import type { VehicleType } from '@/components/services/pricing-config';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface BookingServicesProps {
  services: Service[];
  serviceAddons: { [serviceId: string]: ServiceAddon[] };
  selectedServiceId?: string;
  selectedAddonIds?: string[];
  onSelectService: (serviceId: string) => void;
  onToggleAddon?: (addonId: string) => void;
}

export function BookingServices({ 
  services, 
  serviceAddons,
  selectedServiceId,
  selectedAddonIds = [],
  onSelectService,
  onToggleAddon
}: BookingServicesProps) {
  // Filter out inactive services and deduplicate by ID
  const activeServices = services
    .filter((service) => service.is_active !== false) // Only show active services
    .filter((service, index, self) => 
      index === self.findIndex((s) => s.id === service.id) // Deduplicate by ID
    )

  // Sort services: popular first, then by price
  const sortedServices = [...activeServices].sort((a, b) => {
    if (a.is_popular && !b.is_popular) return -1;
    if (!a.is_popular && b.is_popular) return 1;
    return (a.base_price || 0) - (b.base_price || 0);
  });

  const selectedService = sortedServices.find(s => s.id === selectedServiceId);
  const activeAddons = selectedService 
    ? (serviceAddons[selectedService.id] || []).filter(a => a.is_active)
    : [];

  // Calculate total price
  const basePrice = selectedService?.base_price || 0;
  const addonsPrice = activeAddons
    .filter(addon => addon.id && selectedAddonIds.includes(addon.id))
    .reduce((sum, addon) => sum + addon.price, 0);
  const totalPrice = basePrice + addonsPrice;

  return (
    <div className="space-y-6">
      {/* Service Selection */}
      <div>
        <h2 className="text-2xl font-bold">Select a Service</h2>
        <p className="text-muted-foreground mt-1">
          Choose the detailing package that's right for your vehicle
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sortedServices.map((service) => {
          const isSelected = selectedServiceId === service.id;
          
          return (
            <button
              key={service.id}
              onClick={() => onSelectService(service.id)}
              className={cn(
                "text-left bg-card rounded-lg border-2 overflow-hidden transition-all hover:shadow-lg",
                isSelected 
                  ? "border-primary ring-2 ring-primary ring-offset-2" 
                  : "border-transparent hover:border-muted-foreground/20"
              )}
            >
              {/* Service Image */}
              {service.image_url && (
                <div className="relative h-40 bg-muted">
                  <Image
                    src={service.image_url}
                    alt={service.name}
                    fill
                    className="object-cover"
                  />
                  
                  {/* Popular Badge */}
                  {service.is_popular && (
                    <Badge className="absolute top-3 right-3 bg-amber-500 hover:bg-amber-600">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      Most Popular
                    </Badge>
                  )}

                  {/* Selected Indicator */}
                  {isSelected && (
                    <div className="absolute top-3 left-3 bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                </div>
              )}

              {/* Service Content */}
              <div className="p-5 space-y-3">
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
                {(() => {
                  const vehicleType = (selectedService as any)?.vehicleType as VehicleType | undefined
                  const price = vehicleType 
                    ? getServicePrice(service as any, vehicleType)
                    : getStartingPrice(service as any)
                  const durationMinutes = vehicleType
                    ? getServiceDuration(service as any, vehicleType)
                    : (service.estimated_duration || service.base_duration || 120)
                  const isVariable = isVariablePricing(service as any)
                  const showStartingAt = isVariable && !vehicleType
                  
                  // Convert minutes to hours for display
                  const durationHours = durationMinutes / 60
                  
                  return (
                    <div className="flex items-center gap-4 text-sm font-semibold">
                      {(service as any)?.show_price !== false && (
                        <div className="flex items-center gap-1.5 text-primary">
                          <DollarSign className="h-4 w-4" />
                          <span>
                            {showStartingAt ? 'Starting at ' : ''}${price.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {durationMinutes && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            {durationHours % 1 === 0 
                              ? durationHours.toFixed(0) 
                              : durationHours.toFixed(1)
                            } {durationHours === 1 ? 'hour' : 'hours'}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })()}

                {/* What's Included */}
                {service.whats_included && 
                 Array.isArray(service.whats_included) && 
                 service.whats_included.length > 0 && (
                  <div className="pt-3 border-t space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">
                      What's Included
                    </p>
                    <ul className="space-y-1.5">
                      {service.whats_included.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span>{getFeatureLabel(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Select Button */}
                <Button 
                  className="w-full mt-4"
                  variant={isSelected ? "default" : "outline"}
                >
                  {isSelected ? 'Selected' : 'Select Service'}
                </Button>
              </div>
            </button>
          );
        })}
      </div>

      {/* Add-ons Section */}
      {selectedService && activeAddons.length > 0 && (
        <div className="bg-card rounded-lg border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Add Optional Extras</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Enhance your {selectedService.name}
              </p>
            </div>
            {addonsPrice > 0 && (
              <Badge variant="secondary" className="text-base px-3 py-1">
                +${addonsPrice.toFixed(2)}
              </Badge>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {activeAddons.map((addon) => {
              const isSelected = addon.id ? selectedAddonIds.includes(addon.id) : false;
              
              return (
                <button
                  key={addon.id}
                  onClick={() => addon.id && onToggleAddon?.(addon.id)}
                  className={cn(
                    "p-4 rounded-lg border-2 text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-muted-foreground/30"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox checked={isSelected} className="mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold">{addon.name}</span>
                        <span className="text-sm font-bold text-green-600">
                          +${addon.price}
                        </span>
                      </div>
                      {addon.description && (
                        <p className="text-sm text-muted-foreground">
                          {addon.description}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Price Summary */}
      {selectedService && (
        <div className="bg-primary/5 rounded-lg border border-primary/20 p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>{selectedService.name}</span>
              <span>${basePrice.toFixed(2)}</span>
            </div>
            
            {selectedAddonIds.length > 0 && (
              <>
                {activeAddons
                  .filter(addon => addon.id && selectedAddonIds.includes(addon.id))
                  .map((addon) => (
                    <div key={addon.id} className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>+ {addon.name}</span>
                      <span>${addon.price.toFixed(2)}</span>
                    </div>
                  ))}
              </>
            )}
            
            <div className="pt-3 border-t border-primary/20 flex items-center justify-between text-xl font-bold">
              <span>Total</span>
              <span className="text-primary">${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
