'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Service } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Upload,
  X,
  Plus,
  Trash2,
  Star,
  Image as ImageIcon,
  Package,
  DollarSign,
  Edit2,
  Check,
  Clock
} from 'lucide-react';
import Image from 'next/image';
import {
  createService,
  updateService,
  uploadServiceImage,
  getServiceAddons,
  saveServiceAddons
} from '@/lib/actions/services';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ServiceAddon, COMMON_ADDONS } from '@/lib/addons/addon-presets';
import { Badge } from '@/components/ui/badge';
import FeatureSelector from '@/components/services/feature-selector';
import { MASTER_FEATURES } from '@/lib/features/master-features';
import PricingConfig, { type PricingData, type VehicleType } from '@/components/services/pricing-config';

interface ServiceFormProps {
  service?: Service;
  mode: 'create' | 'edit';
}

export function ServiceForm({ service, mode }: ServiceFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isLoadingAddons, setIsLoadingAddons] = useState(false);

  // Form state
  const [name, setName] = useState(service?.name || '');
  const [description, setDescription] = useState(service?.description || '');
  const [icon, setIcon] = useState(service?.icon || '✨');
  const [imageUrl, setImageUrl] = useState(service?.image_url || '');
  const [isPopular, setIsPopular] = useState(service?.is_popular || false);
  const [showPrice, setShowPrice] = useState((service as any)?.show_price !== false); // Default to true if not set
  const [whatsIncluded, setWhatsIncluded] = useState<string[]>(
    Array.isArray(service?.whats_included) ? service.whats_included : []
  );

  // Pricing state - handle both old and new format
  const initialPrice = service?.base_price ?? service?.price ?? 0;
  const initialDuration = service?.base_duration ?? service?.estimated_duration ?? 120;
  const initialPricingModel = (service as any)?.pricing_model || 'flat';
  const initialVariations = (service as any)?.variations || {};

  const [pricingData, setPricingData] = useState<PricingData>({
    pricing_model: initialPricingModel,
    base_price: initialPrice,
    base_duration: initialDuration,
    variations: initialVariations,
  });

  // Add-ons state
  const [addons, setAddons] = useState<ServiceAddon[]>([]);
  const [editingAddonIndex, setEditingAddonIndex] = useState<number | null>(null);
  const [showAddonsPresets, setShowAddonsPresets] = useState(false);

  // Load existing add-ons if editing
  useEffect(() => {
    if (mode === 'edit' && service?.id) {
      loadAddons();
    }
  }, [mode, service?.id]);

  const loadAddons = async () => {
    if (!service?.id) return;

    setIsLoadingAddons(true);
    try {
      const existingAddons = await getServiceAddons(service.id);
      setAddons(existingAddons);
    } catch (error) {
      console.error('Failed to load add-ons:', error);
    } finally {
      setIsLoadingAddons(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploadingImage(true);
    try {
      const url = await uploadServiceImage(file);
      setImageUrl(url);
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
      console.error(error);
    } finally {
      setIsUploadingImage(false);
    }
  };


  // Add-ons management
  const addPresetAddon = (preset: typeof COMMON_ADDONS[0]) => {
    const newAddon: ServiceAddon = {
      ...preset,
      is_active: true,
    };
    setAddons([...addons, newAddon]);
    toast.success(`Added ${preset.name}`);
  };

  const addCustomAddon = () => {
    const newAddon: ServiceAddon = {
      name: '',
      description: '',
      price: 0,
      is_active: true,
    };
    setAddons([...addons, newAddon]);
    setEditingAddonIndex(addons.length);
  };

  const updateAddon = (index: number, updates: Partial<ServiceAddon>) => {
    const updated = [...addons];
    updated[index] = { ...updated[index], ...updates };
    setAddons(updated);
  };

  const removeAddon = (index: number) => {
    setAddons(addons.filter((_, i) => i !== index));
    if (editingAddonIndex === index) {
      setEditingAddonIndex(null);
    }
  };

  const toggleAddonActive = (index: number) => {
    const updated = [...addons];
    updated[index].is_active = !updated[index].is_active;
    setAddons(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate name
    if (!name.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate pricing based on model
    if (pricingData.pricing_model === 'flat') {
      // For flat pricing, require base_price
      if (!pricingData.base_price || pricingData.base_price <= 0) {
        toast.error('Please enter a valid price');
        return;
      }
    } else if (pricingData.pricing_model === 'variable') {
      // For variable pricing, validate variations instead
      const hasValidVariation = Object.values(pricingData.variations || {}).some(
        (v) => v.enabled && v.price > 0 && v.duration > 0
      );
      if (!hasValidVariation) {
        toast.error('Please set at least one vehicle size with price and duration');
        return;
      }
    }

    // Validate add-ons
    for (const addon of addons) {
      if (!addon.name.trim() || addon.price <= 0) {
        toast.error('All add-ons must have a name and valid price');
        return;
      }
    }

    setIsLoading(true);
    try {
      // Ensure base_duration is valid (at least 1 minute, default to 60 if missing)
      const validBaseDuration = pricingData.base_duration && pricingData.base_duration > 0
        ? pricingData.base_duration
        : 60;

      const serviceData = {
        name: name.trim(),
        description: description.trim() || undefined,
        base_price: pricingData.base_price,
        base_duration: validBaseDuration,
        pricing_model: pricingData.pricing_model,
        variations: pricingData.pricing_model === 'variable' ? pricingData.variations : undefined,
        // Keep estimated_duration for backward compatibility (use base_duration)
        estimated_duration: validBaseDuration,
        icon,
        image_url: imageUrl || undefined,
        is_popular: isPopular,
        // Note: show_price column doesn't exist in database, so we don't include it
        // The UI code checks for (service as any)?.show_price !== false, which defaults to showing price
        whats_included: whatsIncluded,
      };

      let serviceId: string;
      if (mode === 'create') {
        const createdService = await createService(serviceData);
        serviceId = createdService.id;
        toast.success('Service created successfully');
      } else if (service?.id) {
        await updateService(service.id, serviceData);
        serviceId = service.id;
        toast.success('Service updated successfully');
      } else {
        throw new Error('Invalid service ID');
      }

      // Save add-ons
      if (addons.length > 0) {
        await saveServiceAddons(serviceId, addons);
      }

      router.push('/dashboard/services');
      router.refresh();
    } catch (error) {
      toast.error(`Failed to ${mode} service`);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Service name, description, and pricing details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Service Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Full Detail"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Icon (Emoji)</Label>
              <Input
                id="icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="✨"
                maxLength={2}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => {
                // Limit to 200 characters (about 2 sentences)
                const value = e.target.value;
                if (value.length <= 200) {
                  setDescription(value);
                }
              }}
              placeholder="Brief description (1-2 sentences)..."
              rows={2}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/200 characters
            </p>
          </div>

          {/* Pricing Configuration */}
          <PricingConfig data={pricingData} onChange={setPricingData} />

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="popular"
                checked={isPopular}
                onCheckedChange={setIsPopular}
              />
              <Label htmlFor="popular" className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                Mark as Popular Service
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="show-price"
                checked={showPrice}
                onCheckedChange={setShowPrice}
              />
              <Label htmlFor="show-price" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                Show Price on Service Card
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Image */}
      <Card>
        <CardHeader>
          <CardTitle>Service Image</CardTitle>
          <CardDescription>
            Upload a photo that represents this service (recommended: 800x600px)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {imageUrl ? (
              <div className="relative w-full aspect-video max-w-md rounded-lg overflow-hidden border">
                <Image
                  src={imageUrl}
                  alt={name}
                  fill
                  className="object-cover"
                  unoptimized={imageUrl.startsWith('http://127.0.0.1') || imageUrl.startsWith('http://localhost')}
                  onError={() => setImageUrl('')}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => setImageUrl('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video max-w-md border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
              >
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to upload image
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG up to 5MB
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {isUploadingImage && (
              <p className="text-sm text-muted-foreground">Uploading image...</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* What's Included */}
      <Card>
        <CardHeader>
          <CardTitle>What's Included</CardTitle>
          <CardDescription>
            Select the features and services included in this package
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FeatureSelector
            featuresConfig={MASTER_FEATURES}
            selectedIds={whatsIncluded}
            onChange={setWhatsIncluded}
          />
        </CardContent>
      </Card>

      {/* Add-ons Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Add-ons
          </CardTitle>
          <CardDescription>
            Optional extras customers can add to this service
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddonsPresets(!showAddonsPresets)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add from Popular
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={addCustomAddon}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Custom
            </Button>
          </div>

          {/* Popular Add-ons Presets */}
          {showAddonsPresets && (
            <div className="p-4 bg-muted rounded-lg space-y-3">
              <p className="text-sm font-semibold">Popular Add-ons</p>
              <div className="grid gap-2 md:grid-cols-2">
                {COMMON_ADDONS.map((preset, index) => {
                  const alreadyAdded = addons.some(a => a.name === preset.name);
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => !alreadyAdded && addPresetAddon(preset)}
                      disabled={alreadyAdded}
                      className="p-3 bg-card rounded-lg border text-left hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm">{preset.name}</span>
                        <span className="text-sm font-bold text-green-600">${preset.price}</span>
                      </div>
                      {preset.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {preset.description}
                        </p>
                      )}
                      {alreadyAdded && (
                        <Badge variant="secondary" className="mt-2">
                          <Check className="h-3 w-3 mr-1" />
                          Added
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add-ons List */}
          {addons.length > 0 ? (
            <div className="space-y-3">
              {addons.map((addon, index) => (
                <div
                  key={index}
                  className="p-4 bg-muted rounded-lg space-y-3"
                >
                  {editingAddonIndex === index ? (
                    // Edit Mode
                    <div className="space-y-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <Input
                          placeholder="Add-on name *"
                          value={addon.name}
                          onChange={(e) => updateAddon(index, { name: e.target.value })}
                        />
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Price *"
                            value={addon.price || ''}
                            onChange={(e) => updateAddon(index, { price: parseFloat(e.target.value) || 0 })}
                            className="pl-9"
                          />
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <Input
                          placeholder="Description (optional)"
                          value={addon.description || ''}
                          onChange={(e) => updateAddon(index, { description: e.target.value })}
                        />
                        <div className="relative">
                          <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            placeholder="Duration (minutes)"
                            value={addon.duration_minutes || ''}
                            onChange={(e) => updateAddon(index, { duration_minutes: parseInt(e.target.value) || 0 })}
                            className="pl-9"
                          />
                          <p className="text-xs text-muted-foreground mt-1 ml-1">
                            Additional time added to service
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setEditingAddonIndex(null)}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Done
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeAddon(index)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{addon.name}</span>
                          <Badge variant={addon.is_active ? "default" : "secondary"}>
                            {addon.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {addon.description && (
                          <p className="text-sm text-muted-foreground">{addon.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-sm font-bold text-green-600">+${addon.price}</p>
                          {(addon.duration_minutes || 0) > 0 && (
                            <p className="text-xs text-muted-foreground">
                              +{addon.duration_minutes} min
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={addon.is_active ?? true}
                            onCheckedChange={() => toggleAddonActive(index)}
                          />
                          <span className="text-xs text-muted-foreground">
                            {addon.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingAddonIndex(index)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAddon(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="mx-auto h-8 w-8 mb-2" />
              <p className="text-sm">No add-ons yet</p>
              <p className="text-xs">Add popular extras or create custom ones</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isLoading || isUploadingImage}
        >
          {isLoading ? 'Saving...' : mode === 'create' ? 'Create Service' : 'Update Service'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
