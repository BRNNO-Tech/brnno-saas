export const VEHICLE_MAKES = [
  'Acura',
  'Audi',
  'BMW',
  'Buick',
  'Cadillac',
  'Chevrolet',
  'Chrysler',
  'Dodge',
  'Ford',
  'GMC',
  'Honda',
  'Hyundai',
  'Infiniti',
  'Jeep',
  'Kia',
  'Lexus',
  'Lincoln',
  'Mazda',
  'Mercedes-Benz',
  'Nissan',
  'Ram',
  'Subaru',
  'Toyota',
  'Volkswagen',
  'Volvo',
  'Other'
]

export const VEHICLE_MODELS: Record<string, string[]> = {
  'Ford': [
    'F-150',
    'F-250',
    'F-350',
    'Mustang',
    'Explorer',
    'Escape',
    'Edge',
    'Expedition',
    'Bronco',
    'Ranger',
    'Fusion',
    'Focus',
    'Transit'
  ],
  'Toyota': [
    'Camry',
    'Corolla',
    'RAV4',
    'Highlander',
    'Tacoma',
    'Tundra',
    'Prius',
    '4Runner',
    'Sequoia',
    'Sienna',
    'Avalon',
    'Venza'
  ],
  'Honda': [
    'Civic',
    'Accord',
    'CR-V',
    'Pilot',
    'Odyssey',
    'Ridgeline',
    'HR-V',
    'Passport',
    'Fit',
    'Insight'
  ],
  'Chevrolet': [
    'Silverado',
    'Equinox',
    'Tahoe',
    'Suburban',
    'Malibu',
    'Traverse',
    'Trailblazer',
    'Blazer',
    'Colorado',
    'Camaro',
    'Corvette'
  ],
  'Nissan': [
    'Altima',
    'Sentra',
    'Rogue',
    'Pathfinder',
    'Armada',
    'Frontier',
    'Titan',
    'Maxima',
    'Murano'
  ],
  'Dodge': [
    'Ram 1500',
    'Ram 2500',
    'Ram 3500',
    'Challenger',
    'Charger',
    'Durango',
    'Journey',
    'Grand Caravan'
  ],
  'Jeep': [
    'Wrangler',
    'Grand Cherokee',
    'Cherokee',
    'Compass',
    'Renegade',
    'Gladiator',
    'Wagoneer'
  ],
  'GMC': [
    'Sierra',
    'Yukon',
    'Acadia',
    'Terrain',
    'Canyon',
    'Sierra HD'
  ],
  'BMW': [
    '3 Series',
    '5 Series',
    'X3',
    'X5',
    'X7',
    '7 Series',
    '4 Series'
  ],
  'Mercedes-Benz': [
    'C-Class',
    'E-Class',
    'S-Class',
    'GLC',
    'GLE',
    'GLS',
    'A-Class'
  ],
  'Audi': [
    'A4',
    'A6',
    'Q5',
    'Q7',
    'Q3',
    'A3',
    'e-tron'
  ],
  'Lexus': [
    'RX',
    'NX',
    'ES',
    'GX',
    'LX',
    'IS',
    'UX'
  ],
  'Hyundai': [
    'Elantra',
    'Sonata',
    'Tucson',
    'Santa Fe',
    'Palisade',
    'Kona',
    'Venue'
  ],
  'Kia': [
    'Forte',
    'Optima',
    'Sorento',
    'Telluride',
    'Sportage',
    'Soul',
    'Rio'
  ],
  'Subaru': [
    'Outback',
    'Forester',
    'Crosstrek',
    'Ascent',
    'Legacy',
    'Impreza',
    'WRX'
  ],
  'Volkswagen': [
    'Jetta',
    'Passat',
    'Atlas',
    'Tiguan',
    'Golf',
    'ID.4'
  ],
  'Ram': [
    '1500',
    '2500',
    '3500',
    'ProMaster',
    'ProMaster City'
  ],
  'Other': []
}

export const VEHICLE_YEARS = Array.from({ length: 30 }, (_, i) => 
  new Date().getFullYear() - i
).reverse()

