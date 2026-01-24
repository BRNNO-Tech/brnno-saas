// Master features configuration for auto detailing services
// These are base service features included in the package, NOT add-ons

export interface FeatureOption {
  id: string;
  label: string;
  icon: string;
}

export interface FeatureCategory {
  category_id: string;
  category_label: string;
  options: FeatureOption[];
}

export const MASTER_FEATURES: FeatureCategory[] = [
  {
    category_id: "ext",
    category_label: "Exterior Care",
    options: [
      { id: "ext_wash", label: "Hand Wash", icon: "droplets" },
      { id: "ext_wax", label: "Wax Application", icon: "sparkles" },
      { id: "ext_polish", label: "Paint Polish", icon: "sparkles" },
      { id: "ext_wheel", label: "Wheel Cleaning", icon: "disc" },
      { id: "ext_dry", label: "Hand Dry", icon: "wind" },
      { id: "ext_trim", label: "Trim Dressing", icon: "sparkles" },
    ]
  },
  {
    category_id: "int",
    category_label: "Interior Care",
    options: [
      { id: "int_vac", label: "Deep Vacuum", icon: "wind" },
      { id: "int_trash", label: "Trash Removal", icon: "trash" },
      { id: "int_dash", label: "Dashboard Clean", icon: "sparkles" },
      { id: "int_steam", label: "Steam Clean", icon: "droplets" },
      { id: "int_glass", label: "Interior Glass", icon: "sparkles" },
      { id: "int_console", label: "Console Clean", icon: "sparkles" },
      { id: "int_door", label: "Door Panels", icon: "sparkles" },
    ]
  }
];
