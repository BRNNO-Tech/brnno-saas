'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Pencil,
  Trash2,
  Plus,
  Package,
  DollarSign,
  Clock,
  Link as LinkIcon,
  X,
  Check,
  Save,
} from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { deleteAddon, updateAddon, createAddon } from '@/lib/actions/services';
import { toast } from 'sonner';
import { COMMON_ADDONS } from '@/lib/addons/addon-presets';

interface Addon {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  duration_minutes?: number | null;
  is_active: boolean;
  service_id?: string | null;
  service?: {
    id: string;
    name: string;
  } | null;
}

interface Service {
  id: string;
  name: string;
}

interface AddonsListProps {
  initialAddons: Addon[];
  services: Service[];
}

export default function AddonsList({ initialAddons, services }: AddonsListProps) {
  const [addons, setAddons] = useState(initialAddons);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await deleteAddon(deleteId);
      setAddons(addons.filter(a => a.id !== deleteId));
      toast.success('Add-on deleted successfully');
      setDeleteId(null);
    } catch (error) {
      toast.error('Failed to delete add-on');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (addon: Addon) => {
    setEditingAddon({ ...addon });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingAddon({
      id: '',
      name: '',
      description: '',
      price: 0,
      duration_minutes: 0,
      is_active: true,
      service_id: null,
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingAddon) return;

    if (!editingAddon.name.trim() || editingAddon.price <= 0) {
      toast.error('Add-on must have a name and valid price');
      return;
    }

    try {
      if (editingAddon.id) {
        // Update existing
        const updated = await updateAddon(editingAddon.id, {
          name: editingAddon.name,
          description: editingAddon.description || undefined,
          price: editingAddon.price,
          duration_minutes: editingAddon.duration_minutes || 0,
          is_active: editingAddon.is_active,
          service_id: editingAddon.service_id || null,
        });
        setAddons(addons.map(a => a.id === editingAddon.id ? updated : a));
        toast.success('Add-on updated successfully');
      } else {
        // Create new
        const created = await createAddon({
          name: editingAddon.name,
          description: editingAddon.description || undefined,
          price: editingAddon.price,
          duration_minutes: editingAddon.duration_minutes || 0,
          is_active: editingAddon.is_active,
          service_id: editingAddon.service_id || null,
        });
        setAddons([...addons, created]);
        toast.success('Add-on created successfully');
      }
      setIsDialogOpen(false);
      setEditingAddon(null);
    } catch (error) {
      toast.error(editingAddon.id ? 'Failed to update add-on' : 'Failed to create add-on');
    }
  };

  const handlePresetSelect = (preset: typeof COMMON_ADDONS[0]) => {
    setEditingAddon({
      id: '',
      name: preset.name,
      description: preset.description || '',
      price: preset.price,
      duration_minutes: preset.duration_minutes || 0,
      is_active: true,
      service_id: null,
    });
    setShowPresets(false);
    setIsDialogOpen(true);
  };

  if (addons.length === 0) {
    return (
      <div className="text-center py-12 bg-card rounded-lg border">
        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No add-ons yet</h3>
        <p className="text-muted-foreground mt-2">
          Create add-ons that customers can select when booking services
        </p>
        <div className="flex gap-2 justify-center mt-4">
          <Button onClick={() => setShowPresets(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add from Popular
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Custom
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <div className="flex gap-2">
          <Button onClick={() => setShowPresets(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add from Popular
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Create Add-on
          </Button>
        </div>
      </div>

      {/* Popular Presets Dialog */}
      {showPresets && (
        <Dialog open={showPresets} onOpenChange={setShowPresets}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Popular Add-ons</DialogTitle>
              <DialogDescription>
                Select a popular add-on to get started
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 max-h-[400px] overflow-y-auto">
              {COMMON_ADDONS.map((preset, index) => (
                <button
                  key={index}
                  onClick={() => handlePresetSelect(preset)}
                  className="p-3 bg-card rounded-lg border text-left hover:border-primary transition-colors"
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
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add/Edit Dialog */}
      {editingAddon && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingAddon.id ? 'Edit Add-on' : 'Create Add-on'}</DialogTitle>
              <DialogDescription>
                {editingAddon.id 
                  ? 'Update the add-on details below'
                  : 'Create a new add-on that customers can add to services'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={editingAddon.name}
                    onChange={(e) => setEditingAddon({ ...editingAddon, name: e.target.value })}
                    placeholder="e.g., Ceramic Coating"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingAddon.price || ''}
                      onChange={(e) => setEditingAddon({ ...editingAddon, price: parseFloat(e.target.value) || 0 })}
                      className="pl-9"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingAddon.description || ''}
                  onChange={(e) => setEditingAddon({ ...editingAddon, description: e.target.value })}
                  placeholder="Optional description for customers"
                  rows={3}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="duration">Additional Duration (minutes)</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="duration"
                      type="number"
                      step="1"
                      min="0"
                      value={editingAddon.duration_minutes || ''}
                      onChange={(e) => setEditingAddon({ ...editingAddon, duration_minutes: parseInt(e.target.value) || 0 })}
                      className="pl-9"
                      placeholder="0"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Additional time this add-on adds to the service
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service">Service (Optional)</Label>
                  <select
                    id="service"
                    value={editingAddon.service_id || 'all'}
                    onChange={(e) => setEditingAddon({ ...editingAddon, service_id: e.target.value === 'all' ? null : e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="all">All Services (Business-wide)</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Leave as "All Services" to make this add-on available for all services
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editingAddon.is_active}
                  onCheckedChange={(checked) => setEditingAddon({ ...editingAddon, is_active: checked })}
                />
                <Label>Active (visible to customers)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                {editingAddon.id ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Add-ons Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {addons.map((addon) => (
          <div
            key={addon.id}
            className="bg-card rounded-lg border p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{addon.name}</h3>
                  <Badge variant={addon.is_active ? "default" : "secondary"}>
                    {addon.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {addon.description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {addon.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-green-600 font-semibold">
                    <DollarSign className="h-4 w-4" />
                    {Number(addon.price).toFixed(2)}
                  </div>
                  {addon.duration_minutes && addon.duration_minutes > 0 && (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      +{addon.duration_minutes} min
                    </div>
                  )}
                </div>
                {addon.service ? (
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <LinkIcon className="h-3 w-3" />
                    {addon.service.name}
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Available for all services
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(addon)}
                className="flex-1"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteId(addon.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Add-on</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this add-on? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
