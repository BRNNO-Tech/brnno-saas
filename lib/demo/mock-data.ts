/**
 * Comprehensive mock data for demo mode
 * All data is realistic and representative of a real business
 */

// Mock Business
export const MOCK_BUSINESS = {
  id: 'demo-business-id',
  name: 'Elite Auto Detailing',
  email: 'info@eliteautodetailing.com',
  phone: '(555) 123-4567',
  address: '123 Main Street',
  city: 'Salt Lake City',
  state: 'UT',
  zip: '84101',
  website: 'https://eliteautodetailing.com',
  description: 'Premium auto detailing services for luxury vehicles',
  subdomain: 'elite-auto',
  subscription_plan: 'pro',
  subscription_status: 'active',
  industry: 'detailing',
  stripe_account_id: null,
  created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date().toISOString(),
}

// Mock Clients
export const MOCK_CLIENTS = [
  {
    id: 'demo-client-1',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '(555) 234-5678',
    address: '456 Oak Avenue',
    city: 'Salt Lake City',
    state: 'UT',
    zip: '84102',
    notes: 'Prefers morning appointments. Very satisfied customer.',
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-client-2',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '(555) 345-6789',
    address: '789 Pine Street',
    city: 'Salt Lake City',
    state: 'UT',
    zip: '84103',
    notes: 'Regular customer. Books monthly detail.',
    created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-client-3',
    name: 'Michael Chen',
    email: 'mchen@email.com',
    phone: '(555) 456-7890',
    address: '321 Elm Drive',
    city: 'Salt Lake City',
    state: 'UT',
    zip: '84104',
    notes: null,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-client-4',
    name: 'Emily Rodriguez',
    email: 'emily.r@email.com',
    phone: '(555) 567-8901',
    address: '654 Maple Court',
    city: 'Salt Lake City',
    state: 'UT',
    zip: '84105',
    notes: 'VIP customer. Always tips well.',
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-client-5',
    name: 'David Williams',
    email: 'dwilliams@email.com',
    phone: '(555) 678-9012',
    address: '987 Cedar Lane',
    city: 'Salt Lake City',
    state: 'UT',
    zip: '84106',
    notes: null,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-client-6',
    name: 'Lisa Anderson',
    email: 'lisa.a@email.com',
    phone: '(555) 789-0123',
    address: '147 Birch Way',
    city: 'Salt Lake City',
    state: 'UT',
    zip: '84107',
    notes: 'First-time customer. Very happy with service.',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-client-7',
    name: 'Robert Taylor',
    email: 'rtaylor@email.com',
    phone: '(555) 890-1234',
    address: '258 Spruce Street',
    city: 'Salt Lake City',
    state: 'UT',
    zip: '84108',
    notes: null,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-client-8',
    name: 'Jennifer Martinez',
    email: 'j.martinez@email.com',
    phone: '(555) 901-2345',
    address: '369 Willow Avenue',
    city: 'Salt Lake City',
    state: 'UT',
    zip: '84109',
    notes: 'Corporate account. Multiple vehicles.',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// Mock Services
export const MOCK_SERVICES = [
  {
    id: 'demo-service-1',
    name: 'Full Detail Package',
    description: 'Complete interior and exterior detailing',
    price: 299.99,
    duration_minutes: 180,
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-service-2',
    name: 'Exterior Wash & Wax',
    description: 'Hand wash, wax, and tire shine',
    price: 89.99,
    duration_minutes: 60,
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-service-3',
    name: 'Interior Deep Clean',
    description: 'Vacuum, shampoo, and leather conditioning',
    price: 149.99,
    duration_minutes: 120,
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-service-4',
    name: 'Ceramic Coating',
    description: 'Premium ceramic coating application',
    price: 899.99,
    duration_minutes: 360,
    created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'demo-service-5',
    name: 'Quick Wash',
    description: 'Express exterior wash',
    price: 39.99,
    duration_minutes: 30,
    created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

// Helper to generate dates
function getDate(daysAgo: number, hours: number = 10): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  date.setHours(hours, 0, 0, 0)
  return date.toISOString()
}

function getFutureDate(daysAhead: number, hours: number = 10): string {
  const date = new Date()
  date.setDate(date.getDate() + daysAhead)
  date.setHours(hours, 0, 0, 0)
  return date.toISOString()
}

// Mock Jobs
export const MOCK_JOBS = [
  {
    id: 'demo-job-1',
    title: 'Full Detail Package',
    description: 'Complete detail for 2023 Tesla Model 3',
    service_type: 'Full Detail Package',
    scheduled_date: getFutureDate(1, 9),
    estimated_cost: 299.99,
    estimated_duration: 180,
    status: 'scheduled',
    priority: 'medium',
    client_id: MOCK_CLIENTS[0].id,
    address: MOCK_CLIENTS[0].address,
    city: MOCK_CLIENTS[0].city,
    state: MOCK_CLIENTS[0].state,
    zip: MOCK_CLIENTS[0].zip,
    asset_details: {
      make: 'Tesla',
      model: 'Model 3',
      year: '2023',
      color: 'Pearl White',
      licensePlate: 'TESLA-123',
    },
    created_at: getDate(5),
  },
  {
    id: 'demo-job-2',
    title: 'Exterior Wash & Wax',
    description: 'Hand wash and wax for BMW',
    service_type: 'Exterior Wash & Wax',
    scheduled_date: getFutureDate(2, 14),
    estimated_cost: 89.99,
    estimated_duration: 60,
    status: 'scheduled',
    priority: 'low',
    client_id: MOCK_CLIENTS[1].id,
    address: MOCK_CLIENTS[1].address,
    city: MOCK_CLIENTS[1].city,
    state: MOCK_CLIENTS[1].state,
    zip: MOCK_CLIENTS[1].zip,
    asset_details: {
      make: 'BMW',
      model: 'X5',
      year: '2022',
      color: 'Black Sapphire',
      licensePlate: 'BMW-456',
    },
    created_at: getDate(3),
  },
  {
    id: 'demo-job-3',
    title: 'Interior Deep Clean',
    description: 'Deep clean for Mercedes',
    service_type: 'Interior Deep Clean',
    scheduled_date: getFutureDate(3, 11),
    estimated_cost: 149.99,
    estimated_duration: 120,
    status: 'scheduled',
    priority: 'medium',
    client_id: MOCK_CLIENTS[2].id,
    address: MOCK_CLIENTS[2].address,
    city: MOCK_CLIENTS[2].city,
    state: MOCK_CLIENTS[2].state,
    zip: MOCK_CLIENTS[2].zip,
    asset_details: {
      make: 'Mercedes-Benz',
      model: 'C-Class',
      year: '2021',
      color: 'Silver',
      licensePlate: 'MB-789',
    },
    created_at: getDate(2),
  },
  {
    id: 'demo-job-4',
    title: 'Full Detail Package',
    description: 'Complete detail for Range Rover',
    service_type: 'Full Detail Package',
    scheduled_date: getDate(0, 13),
    estimated_cost: 299.99,
    estimated_duration: 180,
    status: 'in_progress',
    priority: 'high',
    client_id: MOCK_CLIENTS[3].id,
    address: MOCK_CLIENTS[3].address,
    city: MOCK_CLIENTS[3].city,
    state: MOCK_CLIENTS[3].state,
    zip: MOCK_CLIENTS[3].zip,
    asset_details: {
      make: 'Range Rover',
      model: 'Sport',
      year: '2023',
      color: 'British Racing Green',
      licensePlate: 'RR-101',
    },
    created_at: getDate(1),
  },
  {
    id: 'demo-job-5',
    title: 'Ceramic Coating',
    description: 'Premium ceramic coating for Porsche',
    service_type: 'Ceramic Coating',
    scheduled_date: getDate(-1, 9),
    estimated_cost: 899.99,
    estimated_duration: 360,
    status: 'completed',
    priority: 'high',
    client_id: MOCK_CLIENTS[4].id,
    address: MOCK_CLIENTS[4].address,
    city: MOCK_CLIENTS[4].city,
    state: MOCK_CLIENTS[4].state,
    zip: MOCK_CLIENTS[4].zip,
    asset_details: {
      make: 'Porsche',
      model: '911',
      year: '2024',
      color: 'Guards Red',
      licensePlate: 'P911',
    },
    completed_at: getDate(-1, 15),
    created_at: getDate(7),
  },
  {
    id: 'demo-job-6',
    title: 'Quick Wash',
    description: 'Express wash for Honda',
    service_type: 'Quick Wash',
    scheduled_date: getDate(-2, 10),
    estimated_cost: 39.99,
    estimated_duration: 30,
    status: 'completed',
    priority: 'low',
    client_id: MOCK_CLIENTS[5].id,
    address: MOCK_CLIENTS[5].address,
    city: MOCK_CLIENTS[5].city,
    state: MOCK_CLIENTS[5].state,
    zip: MOCK_CLIENTS[5].zip,
    asset_details: {
      make: 'Honda',
      model: 'Civic',
      year: '2020',
      color: 'Blue',
      licensePlate: 'HON-202',
    },
    completed_at: getDate(-2, 10),
    created_at: getDate(5),
  },
  {
    id: 'demo-job-7',
    title: 'Exterior Wash & Wax',
    description: 'Wash and wax for Ford F-150',
    service_type: 'Exterior Wash & Wax',
    scheduled_date: getDate(-3, 14),
    estimated_cost: 89.99,
    estimated_duration: 60,
    status: 'completed',
    priority: 'medium',
    client_id: MOCK_CLIENTS[6].id,
    address: MOCK_CLIENTS[6].address,
    city: MOCK_CLIENTS[6].city,
    state: MOCK_CLIENTS[6].state,
    zip: MOCK_CLIENTS[6].zip,
    asset_details: {
      make: 'Ford',
      model: 'F-150',
      year: '2022',
      color: 'Black',
      licensePlate: 'F150-X',
    },
    completed_at: getDate(-3, 15),
    created_at: getDate(4),
  },
  {
    id: 'demo-job-8',
    title: 'Full Detail Package',
    description: 'Complete detail for Audi Q7',
    service_type: 'Full Detail Package',
    scheduled_date: getDate(-5, 9),
    estimated_cost: 299.99,
    estimated_duration: 180,
    status: 'completed',
    priority: 'medium',
    client_id: MOCK_CLIENTS[7].id,
    address: MOCK_CLIENTS[7].address,
    city: MOCK_CLIENTS[7].city,
    state: MOCK_CLIENTS[7].state,
    zip: MOCK_CLIENTS[7].zip,
    asset_details: {
      make: 'Audi',
      model: 'Q7',
      year: '2023',
      color: 'Nardo Gray',
      licensePlate: 'AUDI-Q7',
    },
    completed_at: getDate(-5, 12),
    created_at: getDate(10),
  },
]

// Mock Invoices
export const MOCK_INVOICES = [
  {
    id: 'demo-invoice-1',
    client_id: MOCK_CLIENTS[4].id,
    total: 899.99,
    status: 'paid',
    created_at: getDate(7),
    due_date: getDate(7),
    paid_at: getDate(6),
  },
  {
    id: 'demo-invoice-2',
    client_id: MOCK_CLIENTS[5].id,
    total: 39.99,
    status: 'paid',
    created_at: getDate(5),
    due_date: getDate(5),
    paid_at: getDate(4),
  },
  {
    id: 'demo-invoice-3',
    client_id: MOCK_CLIENTS[6].id,
    total: 89.99,
    status: 'paid',
    created_at: getDate(4),
    due_date: getDate(4),
    paid_at: getDate(3),
  },
  {
    id: 'demo-invoice-4',
    client_id: MOCK_CLIENTS[0].id,
    total: 299.99,
    status: 'unpaid',
    created_at: getDate(5),
    due_date: getFutureDate(1),
  },
  {
    id: 'demo-invoice-5',
    client_id: MOCK_CLIENTS[1].id,
    total: 89.99,
    status: 'unpaid',
    created_at: getDate(3),
    due_date: getFutureDate(2),
  },
  {
    id: 'demo-invoice-6',
    client_id: MOCK_CLIENTS[7].id,
    total: 299.99,
    status: 'paid',
    created_at: getDate(10),
    due_date: getDate(10),
    paid_at: getDate(9),
  },
]

// Mock Leads
export const MOCK_LEADS = [
  {
    id: 'demo-lead-1',
    name: 'Tom Wilson',
    email: 'tom.wilson@email.com',
    phone: '(555) 111-2222',
    source: 'online_booking',
    interested_in_service_name: 'Full Detail Package',
    estimated_value: 299.99,
    status: 'hot',
    score: 'hot',
    booking_progress: 3,
    follow_up_count: 0,
    created_at: getDate(1),
  },
  {
    id: 'demo-lead-2',
    name: 'Amanda Brown',
    email: 'amanda.b@email.com',
    phone: '(555) 222-3333',
    source: 'referral',
    interested_in_service_name: 'Ceramic Coating',
    estimated_value: 899.99,
    status: 'warm',
    score: 'warm',
    booking_progress: 2,
    follow_up_count: 1,
    created_at: getDate(3),
  },
  {
    id: 'demo-lead-3',
    name: 'Chris Davis',
    email: 'chris.d@email.com',
    phone: null,
    source: 'website',
    interested_in_service_name: 'Exterior Wash & Wax',
    estimated_value: 89.99,
    status: 'cold',
    score: 'cold',
    booking_progress: 1,
    follow_up_count: 2,
    created_at: getDate(7),
  },
  {
    id: 'demo-lead-4',
    name: 'Jessica Lee',
    email: 'jessica.lee@email.com',
    phone: '(555) 333-4444',
    source: 'online_booking',
    interested_in_service_name: 'Interior Deep Clean',
    estimated_value: 149.99,
    status: 'hot',
    score: 'hot',
    booking_progress: 4,
    follow_up_count: 0,
    created_at: getDate(0),
  },
  {
    id: 'demo-lead-5',
    name: 'Mark Thompson',
    email: 'mark.t@email.com',
    phone: '(555) 444-5555',
    source: 'social_media',
    interested_in_service_name: 'Full Detail Package',
    estimated_value: 299.99,
    status: 'warm',
    score: 'warm',
    booking_progress: 2,
    follow_up_count: 1,
    created_at: getDate(5),
  },
]

// Mock Team Members
export const MOCK_TEAM_MEMBERS = [
  {
    id: 'demo-team-1',
    name: 'Mike Johnson',
    role: 'technician',
    email: 'mike@eliteautodetailing.com',
    phone: '(555) 100-2000',
    skills: ['Full Detail', 'Ceramic Coating', 'Paint Correction'],
    status: 'active',
    total_jobs_completed: 45,
    created_at: getDate(90),
  },
  {
    id: 'demo-team-2',
    name: 'Alex Martinez',
    role: 'technician',
    email: 'alex@eliteautodetailing.com',
    phone: '(555) 200-3000',
    skills: ['Quick Wash', 'Exterior Wash', 'Interior Clean'],
    status: 'active',
    total_jobs_completed: 32,
    created_at: getDate(60),
  },
]

// Mock Quotes
export const MOCK_QUOTES = [
  {
    id: 'demo-quote-1',
    client_id: MOCK_CLIENTS[0].id,
    total: 299.99,
    status: 'sent',
    created_at: getDate(5),
    expires_at: getFutureDate(25),
  },
  {
    id: 'demo-quote-2',
    client_id: MOCK_CLIENTS[2].id,
    total: 149.99,
    status: 'accepted',
    created_at: getDate(3),
    expires_at: getFutureDate(27),
  },
  {
    id: 'demo-quote-3',
    client_id: MOCK_CLIENTS[5].id,
    total: 899.99,
    status: 'pending',
    created_at: getDate(1),
    expires_at: getFutureDate(29),
  },
]

// Helper functions to get mock data with relationships
export function getMockJobs() {
  return MOCK_JOBS.map(job => ({
    ...job,
    client: MOCK_CLIENTS.find(c => c.id === job.client_id) || MOCK_CLIENTS[0],
    assignments: job.status === 'in_progress' ? [{
      id: 'demo-assignment-1',
      team_member: MOCK_TEAM_MEMBERS[0],
    }] : [],
  }))
}

export function getMockClients() {
  return MOCK_CLIENTS.map(client => ({
    ...client,
    jobs: MOCK_JOBS.filter(j => j.client_id === client.id),
    invoices: MOCK_INVOICES.filter(i => i.client_id === client.id),
  }))
}

export function getMockInvoices() {
  return MOCK_INVOICES.map(invoice => ({
    ...invoice,
    client: MOCK_CLIENTS.find(c => c.id === invoice.client_id) || MOCK_CLIENTS[0],
  }))
}

export function getMockLeads() {
  return MOCK_LEADS
}

export function getMockTeamMembers() {
  return MOCK_TEAM_MEMBERS
}

export function getMockServices() {
  return MOCK_SERVICES
}

export function getMockQuotes() {
  return MOCK_QUOTES.map(quote => ({
    ...quote,
    client: MOCK_CLIENTS.find(c => c.id === quote.client_id) || MOCK_CLIENTS[0],
  }))
}

// Mock Dashboard Stats
export function getMockDashboardStats() {
  const completedJobs = MOCK_JOBS.filter(j => j.status === 'completed')
  const paidInvoices = MOCK_INVOICES.filter(i => i.status === 'paid')
  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0)
  const pendingInvoices = MOCK_INVOICES.filter(i => i.status === 'unpaid')

  // Create recent activity from mock data
  const recentJobs = completedJobs.slice(0, 5).map(j => ({
    type: 'job' as const,
    id: j.id,
    title: j.title,
    updated_at: j.completed_at || j.created_at,
    status: j.status,
    date: j.completed_at || j.created_at,
  }))

  const recentInvoices = paidInvoices.slice(0, 5).map(i => ({
    type: 'invoice' as const,
    id: i.id,
    total: i.total,
    updated_at: i.paid_at || i.created_at,
    status: i.status,
    client: MOCK_CLIENTS.find(c => c.id === i.client_id) || null,
    date: i.paid_at || i.created_at,
  }))

  const recentClients = MOCK_CLIENTS.slice(0, 5).map(c => ({
    type: 'client' as const,
    id: c.id,
    name: c.name,
    created_at: c.created_at,
    date: c.created_at,
  }))

  // Combine and sort recent activity
  const recentActivity = [
    ...recentJobs,
    ...recentInvoices,
    ...recentClients,
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)

  return {
    totalClients: MOCK_CLIENTS.length,
    activeJobs: MOCK_JOBS.filter(j => j.status === 'scheduled' || j.status === 'in_progress').length,
    pendingInvoices: pendingInvoices.length,
    revenueMTD: totalRevenue,
    recentActivity,
  }
}

// Mock Reports Data
export function getMockReportsData() {
  const paidInvoices = MOCK_INVOICES.filter(i => i.status === 'paid')
  const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0)
  const completedJobs = MOCK_JOBS.filter(j => j.status === 'completed')
  const totalJobs = MOCK_JOBS.length
  const collectionRate = totalJobs > 0 ? (paidInvoices.length / totalJobs) * 100 : 0

  return {
    totalRevenue,
    totalJobs,
    completedJobs: completedJobs.length,
    averageJobValue: completedJobs.length > 0 
      ? completedJobs.reduce((sum, j) => sum + (j.estimated_cost || 0), 0) / completedJobs.length
      : 0,
    collectionRate,
    topServices: [
      { name: 'Full Detail Package', count: 3, revenue: 899.97 },
      { name: 'Exterior Wash & Wax', count: 2, revenue: 179.98 },
      { name: 'Ceramic Coating', count: 1, revenue: 899.99 },
    ],
  }
}
