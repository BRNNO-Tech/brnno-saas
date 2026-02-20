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
    hourly_rate: 25.00,
    commission_rate: 0.10,
    user_id: null,
    total_jobs_completed: 45,
    average_rating: 4.8,
    total_earnings: 11250.00,
    created_at: getDate(90),
    updated_at: getDate(90),
  },
  {
    id: 'demo-team-2',
    name: 'Alex Martinez',
    role: 'technician',
    email: 'alex@eliteautodetailing.com',
    phone: '(555) 200-3000',
    skills: ['Quick Wash', 'Exterior Wash', 'Interior Clean'],
    status: 'active',
    hourly_rate: 22.00,
    commission_rate: 0.08,
    user_id: null,
    total_jobs_completed: 32,
    average_rating: 4.6,
    total_earnings: 7040.00,
    created_at: getDate(60),
    updated_at: getDate(60),
  },
]

// Mock Quotes
export const MOCK_QUOTES = [
  {
    id: 'demo-quote-1',
    client_id: MOCK_CLIENTS[0].id,
    quote_code: 'QT001',
    total_price: 299.99,
    total: 299.99,
    vehicle_type: 'sedan',
    vehicle_condition: 'normal',
    customer_name: MOCK_CLIENTS[0].name,
    customer_phone: MOCK_CLIENTS[0].phone,
    customer_email: MOCK_CLIENTS[0].email,
    status: 'sent',
    created_at: getDate(5),
    viewed_at: getDate(4),
    booked: false,
    expires_at: getFutureDate(25),
  },
  {
    id: 'demo-quote-2',
    client_id: MOCK_CLIENTS[2].id,
    quote_code: 'QT002',
    total_price: 149.99,
    total: 149.99,
    vehicle_type: 'suv',
    vehicle_condition: 'dirty',
    customer_name: MOCK_CLIENTS[2].name,
    customer_phone: MOCK_CLIENTS[2].phone,
    customer_email: MOCK_CLIENTS[2].email,
    status: 'accepted',
    created_at: getDate(3),
    viewed_at: getDate(2),
    booked: true,
    expires_at: getFutureDate(27),
  },
  {
    id: 'demo-quote-3',
    client_id: MOCK_CLIENTS[5].id,
    quote_code: 'QT003',
    total_price: 899.99,
    total: 899.99,
    vehicle_type: 'truck',
    vehicle_condition: 'very_dirty',
    customer_name: MOCK_CLIENTS[5].name,
    customer_phone: MOCK_CLIENTS[5].phone,
    customer_email: MOCK_CLIENTS[5].email,
    status: 'pending',
    created_at: getDate(1),
    viewed_at: null,
    booked: false,
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

// Mock Sequences (for sequence detail page in demo)
const MOCK_SEQUENCE_STEPS = [
  {
    id: 'demo-step-1',
    sequence_id: 'demo-sequence-1',
    step_order: 1,
    step_type: 'send_sms' as const,
    delay_value: 1,
    delay_unit: 'hours' as const,
    channel: 'sms' as const,
    message_template: 'Hi {{name}}, we noticed you started a booking. Need help finishing? Reply here or call us.',
    created_at: getDate(30),
  },
  {
    id: 'demo-step-2',
    sequence_id: 'demo-sequence-1',
    step_order: 2,
    step_type: 'wait' as const,
    delay_value: 24,
    delay_unit: 'hours' as const,
    message_template: '',
    created_at: getDate(30),
  },
  {
    id: 'demo-step-3',
    sequence_id: 'demo-sequence-1',
    step_order: 3,
    step_type: 'send_sms' as const,
    delay_value: 0,
    delay_unit: null,
    channel: 'sms' as const,
    message_template: 'Last chance this week for 10% off your detail. Book now!',
    created_at: getDate(30),
  },
]

const MOCK_SEQUENCES = [
  {
    id: 'demo-sequence-1',
    business_id: MOCK_BUSINESS.id,
    name: 'Booking Abandoned Follow-Up',
    description: 'Re-engage leads who started but did not complete a booking',
    trigger_type: 'booking_abandoned' as const,
    trigger_config: {},
    enabled: true,
    stop_on_reply: true,
    stop_on_booking: true,
    respect_business_hours: true,
    created_at: getDate(45),
    updated_at: getDate(5),
    steps: MOCK_SEQUENCE_STEPS,
  },
]

export function getMockSequence(id: string) {
  const seq = MOCK_SEQUENCES.find((s) => s.id === id)
  if (!seq) return null
  return { ...seq, steps: seq.steps || [] }
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

// Mock Inventory Categories
export const MOCK_INVENTORY_CATEGORIES = [
  {
    id: 'demo-category-1',
    business_id: MOCK_BUSINESS.id,
    name: 'Cleaning Supplies',
    description: 'Soaps, waxes, and cleaning products',
    created_at: getDate(60),
  },
  {
    id: 'demo-category-2',
    business_id: MOCK_BUSINESS.id,
    name: 'Tools & Equipment',
    description: 'Brushes, buffers, and detailing tools',
    created_at: getDate(55),
  },
  {
    id: 'demo-category-3',
    business_id: MOCK_BUSINESS.id,
    name: 'Protective Products',
    description: 'Ceramic coatings and sealants',
    created_at: getDate(50),
  },
]

// Mock Inventory Items
export const MOCK_INVENTORY_ITEMS = [
  {
    id: 'demo-item-1',
    business_id: MOCK_BUSINESS.id,
    category_id: MOCK_INVENTORY_CATEGORIES[0].id,
    name: 'Premium Car Wash Soap',
    sku: 'CWS-001',
    unit_of_measure: 'bottle',
    cost_per_unit: 12.99,
    vendor: 'Auto Supply Co',
    current_quantity: 8,
    low_stock_threshold: 5,
    notes: 'High-quality pH-neutral soap',
    created_at: getDate(45),
    updated_at: getDate(10),
    category: {
      id: MOCK_INVENTORY_CATEGORIES[0].id,
      name: MOCK_INVENTORY_CATEGORIES[0].name,
    },
  },
  {
    id: 'demo-item-2',
    business_id: MOCK_BUSINESS.id,
    category_id: MOCK_INVENTORY_CATEGORIES[0].id,
    name: 'Microfiber Towels (Pack of 12)',
    sku: 'MFT-012',
    unit_of_measure: 'pack',
    cost_per_unit: 24.99,
    vendor: 'Detailing Supplies Inc',
    current_quantity: 3,
    low_stock_threshold: 4,
    notes: 'Premium quality, reusable',
    created_at: getDate(40),
    updated_at: getDate(5),
    category: {
      id: MOCK_INVENTORY_CATEGORIES[0].id,
      name: MOCK_INVENTORY_CATEGORIES[0].name,
    },
  },
  {
    id: 'demo-item-3',
    business_id: MOCK_BUSINESS.id,
    category_id: MOCK_INVENTORY_CATEGORIES[0].id,
    name: 'Wheel Cleaner',
    sku: 'WC-500',
    unit_of_measure: 'bottle',
    cost_per_unit: 18.50,
    vendor: 'Auto Supply Co',
    current_quantity: 0,
    low_stock_threshold: 3,
    notes: 'Heavy-duty formula for brake dust',
    created_at: getDate(35),
    updated_at: getDate(2),
    category: {
      id: MOCK_INVENTORY_CATEGORIES[0].id,
      name: MOCK_INVENTORY_CATEGORIES[0].name,
    },
  },
  {
    id: 'demo-item-4',
    business_id: MOCK_BUSINESS.id,
    category_id: MOCK_INVENTORY_CATEGORIES[1].id,
    name: 'Dual Action Polisher',
    sku: 'DAP-2000',
    unit_of_measure: 'unit',
    cost_per_unit: 299.99,
    vendor: 'Professional Tools',
    current_quantity: 2,
    low_stock_threshold: 1,
    notes: 'Variable speed, includes pads',
    created_at: getDate(30),
    updated_at: getDate(15),
    category: {
      id: MOCK_INVENTORY_CATEGORIES[1].id,
      name: MOCK_INVENTORY_CATEGORIES[1].name,
    },
  },
  {
    id: 'demo-item-5',
    business_id: MOCK_BUSINESS.id,
    category_id: MOCK_INVENTORY_CATEGORIES[2].id,
    name: 'Ceramic Coating Kit',
    sku: 'CCK-PRO',
    unit_of_measure: 'kit',
    cost_per_unit: 149.99,
    vendor: 'Premium Products',
    current_quantity: 5,
    low_stock_threshold: 2,
    notes: '9H hardness, 5-year protection',
    created_at: getDate(25),
    updated_at: getDate(8),
    category: {
      id: MOCK_INVENTORY_CATEGORIES[2].id,
      name: MOCK_INVENTORY_CATEGORIES[2].name,
    },
  },
  {
    id: 'demo-item-6',
    business_id: MOCK_BUSINESS.id,
    category_id: MOCK_INVENTORY_CATEGORIES[0].id,
    name: 'Interior Cleaner',
    sku: 'IC-300',
    unit_of_measure: 'bottle',
    cost_per_unit: 15.99,
    vendor: 'Auto Supply Co',
    current_quantity: 12,
    low_stock_threshold: 6,
    notes: 'Safe for all interior surfaces',
    created_at: getDate(20),
    updated_at: getDate(3),
    category: {
      id: MOCK_INVENTORY_CATEGORIES[0].id,
      name: MOCK_INVENTORY_CATEGORIES[0].name,
    },
  },
]

// Mock Inventory Adjustments
export const MOCK_INVENTORY_ADJUSTMENTS = [
  {
    id: 'demo-adj-1',
    item_id: MOCK_INVENTORY_ITEMS[0].id,
    location_id: null,
    adjusted_by: null,
    adjustment_type: 'add',
    quantity_change: 10,
    quantity_after: 10,
    reason: 'restock',
    cost: 129.90,
    vendor: 'Auto Supply Co',
    notes: 'Initial stock',
    created_at: getDate(45),
    item: {
      id: MOCK_INVENTORY_ITEMS[0].id,
      name: MOCK_INVENTORY_ITEMS[0].name,
      business_id: MOCK_BUSINESS.id,
    },
    adjusted_by_member: null,
  },
  {
    id: 'demo-adj-2',
    item_id: MOCK_INVENTORY_ITEMS[0].id,
    location_id: null,
    adjusted_by: null,
    adjustment_type: 'remove',
    quantity_change: -2,
    quantity_after: 8,
    reason: 'usage',
    cost: null,
    vendor: null,
    notes: 'Used for jobs',
    created_at: getDate(10),
    item: {
      id: MOCK_INVENTORY_ITEMS[0].id,
      name: MOCK_INVENTORY_ITEMS[0].name,
      business_id: MOCK_BUSINESS.id,
    },
    adjusted_by_member: null,
  },
  {
    id: 'demo-adj-3',
    item_id: MOCK_INVENTORY_ITEMS[2].id,
    location_id: null,
    adjusted_by: null,
    adjustment_type: 'remove',
    quantity_change: -5,
    quantity_after: 0,
    reason: 'usage',
    cost: null,
    vendor: null,
    notes: 'Used for multiple jobs',
    created_at: getDate(2),
    item: {
      id: MOCK_INVENTORY_ITEMS[2].id,
      name: MOCK_INVENTORY_ITEMS[2].name,
      business_id: MOCK_BUSINESS.id,
    },
    adjusted_by_member: null,
  },
]

// Mock Inventory Usage Logs
export const MOCK_INVENTORY_USAGE_LOGS = [
  {
    id: 'demo-usage-1',
    item_id: MOCK_INVENTORY_ITEMS[0].id,
    job_id: MOCK_JOBS[0].id,
    team_member_id: MOCK_TEAM_MEMBERS[0].id,
    quantity_used: 1,
    date_used: getDate(5),
    notes: 'Used for Tesla detail',
    created_at: getDate(5),
    item: {
      name: MOCK_INVENTORY_ITEMS[0].name,
    },
    job: {
      id: MOCK_JOBS[0].id,
      title: MOCK_JOBS[0].title,
    },
    team_member: {
      name: MOCK_TEAM_MEMBERS[0].name,
    },
  },
  {
    id: 'demo-usage-2',
    item_id: MOCK_INVENTORY_ITEMS[1].id,
    job_id: MOCK_JOBS[1].id,
    team_member_id: MOCK_TEAM_MEMBERS[0].id,
    quantity_used: 2,
    date_used: getDate(3),
    notes: 'Used for BMW wash',
    created_at: getDate(3),
    item: {
      name: MOCK_INVENTORY_ITEMS[1].name,
    },
    job: {
      id: MOCK_JOBS[1].id,
      title: MOCK_JOBS[1].title,
    },
    team_member: {
      name: MOCK_TEAM_MEMBERS[0].name,
    },
  },
  {
    id: 'demo-usage-3',
    item_id: MOCK_INVENTORY_ITEMS[4].id,
    job_id: MOCK_JOBS[4].id,
    team_member_id: MOCK_TEAM_MEMBERS[0].id,
    quantity_used: 1,
    date_used: getDate(-1),
    notes: 'Ceramic coating application',
    created_at: getDate(-1),
    item: {
      name: MOCK_INVENTORY_ITEMS[4].name,
    },
    job: {
      id: MOCK_JOBS[4].id,
      title: MOCK_JOBS[4].title,
    },
    team_member: {
      name: MOCK_TEAM_MEMBERS[0].name,
    },
  },
]

// Mock Inventory Locations
export const MOCK_INVENTORY_LOCATIONS = [
  {
    id: 'demo-location-1',
    business_id: MOCK_BUSINESS.id,
    name: 'Main Warehouse',
    address: '123 Main Street',
    is_default: true,
    created_at: getDate(60),
  },
  {
    id: 'demo-location-2',
    business_id: MOCK_BUSINESS.id,
    name: 'Service Bay Storage',
    address: '123 Main Street, Bay 1',
    is_default: false,
    created_at: getDate(50),
  },
]

// Mock Mileage Summary
// Helper to calculate deduction (IRS rate is 0.67 per mile for 2024)
function calculateMileageDeduction(miles: number): number {
  return Math.round(miles * 0.67 * 100) / 100
}

export function getMockMileageSummary() {
  // Realistic mileage data for a detailing business
  const todayMiles = 12.5
  const weekMiles = 87.3
  const monthMiles = 342.8
  const yearMiles = 2847.5

  return {
    today: {
      miles: todayMiles,
      deduction: calculateMileageDeduction(todayMiles),
    },
    thisWeek: {
      miles: weekMiles,
      deduction: calculateMileageDeduction(weekMiles),
    },
    thisMonth: {
      miles: monthMiles,
      deduction: calculateMileageDeduction(monthMiles),
    },
    thisYear: {
      miles: yearMiles,
      deduction: calculateMileageDeduction(yearMiles),
    },
  }
}

// Mock Photos for Dashboard
// Using placeholder image URLs that will work in demo mode
const PLACEHOLDER_PHOTO_URL = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=300&fit=crop'
const PLACEHOLDER_PHOTO_URL_2 = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&h=300&fit=crop'
const PLACEHOLDER_PHOTO_URL_3 = 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&h=300&fit=crop'
const PLACEHOLDER_PHOTO_URL_4 = 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400&h=300&fit=crop'
const PLACEHOLDER_PHOTO_URL_5 = 'https://images.unsplash.com/photo-1606664515524-ed2f786a0ad6?w=400&h=300&fit=crop'

export function getMockRecentPhotos(limit: number = 20) {
  const customerPhotos = [
    {
      id: 'demo-customer-photo-1',
      storage_url: PLACEHOLDER_PHOTO_URL,
      uploaded_at: getDate(0, 14),
      source: 'customer' as const,
      job_id: MOCK_JOBS[0].id,
      job_title: MOCK_JOBS[0].title,
      photo_type: 'before',
      ai_processed: true,
      ai_analysis: {
        condition: 'normal',
        detected_issues: ['Minor scratches on front bumper'],
        suggested_addons: ['Paint Correction'],
      },
    },
    {
      id: 'demo-customer-photo-2',
      storage_url: PLACEHOLDER_PHOTO_URL_2,
      uploaded_at: getDate(1, 10),
      source: 'customer' as const,
      job_id: MOCK_JOBS[1].id,
      job_title: MOCK_JOBS[1].title,
      photo_type: 'before',
      ai_processed: true,
      ai_analysis: {
        condition: 'dirty',
        detected_issues: ['Heavy dirt buildup', 'Water spots'],
        suggested_addons: ['Clay Bar Treatment'],
      },
    },
    {
      id: 'demo-customer-photo-3',
      storage_url: PLACEHOLDER_PHOTO_URL_3,
      uploaded_at: getDate(2, 9),
      source: 'customer' as const,
      job_id: MOCK_JOBS[2].id,
      job_title: MOCK_JOBS[2].title,
      photo_type: 'before',
      ai_processed: false,
    },
    {
      id: 'demo-customer-photo-4',
      storage_url: PLACEHOLDER_PHOTO_URL_4,
      uploaded_at: getDate(3, 11),
      source: 'customer' as const,
      job_id: MOCK_JOBS[3].id,
      job_title: MOCK_JOBS[3].title,
      photo_type: 'before',
      ai_processed: true,
      ai_analysis: {
        condition: 'very_dirty',
        detected_issues: ['Mud buildup', 'Scratches on side panels'],
        suggested_addons: ['Deep Clean', 'Paint Correction'],
      },
    },
  ]

  const workerPhotos = [
    {
      id: 'demo-worker-photo-1',
      storage_url: PLACEHOLDER_PHOTO_URL_5,
      uploaded_at: getDate(-1, 15),
      source: 'worker' as const,
      job_id: MOCK_JOBS[4].id,
      job_title: MOCK_JOBS[4].title,
      photo_type: 'after',
      ai_processed: false,
    },
    {
      id: 'demo-worker-photo-2',
      storage_url: PLACEHOLDER_PHOTO_URL,
      uploaded_at: getDate(-2, 12),
      source: 'worker' as const,
      job_id: MOCK_JOBS[5].id,
      job_title: MOCK_JOBS[5].title,
      photo_type: 'after',
      ai_processed: false,
    },
    {
      id: 'demo-worker-photo-3',
      storage_url: PLACEHOLDER_PHOTO_URL_2,
      uploaded_at: getDate(-3, 16),
      source: 'worker' as const,
      job_id: MOCK_JOBS[6].id,
      job_title: MOCK_JOBS[6].title,
      photo_type: 'after',
      ai_processed: false,
    },
    {
      id: 'demo-worker-photo-4',
      storage_url: PLACEHOLDER_PHOTO_URL_3,
      uploaded_at: getDate(-5, 13),
      source: 'worker' as const,
      job_id: MOCK_JOBS[7].id,
      job_title: MOCK_JOBS[7].title,
      photo_type: 'after',
      ai_processed: false,
    },
  ]

  // Sort by uploaded_at (most recent first)
  const allPhotos = [...customerPhotos, ...workerPhotos].sort(
    (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
  )

  return {
    customerPhotos: customerPhotos.slice(0, limit),
    workerPhotos: workerPhotos.slice(0, limit),
    totalCount: allPhotos.length,
  }
}

// Mock Photos for Individual Jobs (for job detail pages)
export function getMockJobPhotos(jobId: string) {
  // Map job IDs to their photos
  const jobPhotoMap: Record<string, { booking: any[]; job: any[] }> = {
    'demo-job-1': {
      booking: [
        {
          id: 'demo-booking-photo-1-1',
          lead_id: 'demo-lead-1',
          business_id: MOCK_BUSINESS.id,
          job_id: 'demo-job-1',
          photo_type: 'exterior',
          storage_path: 'booking-photos/demo-1-1.jpg',
          storage_url: PLACEHOLDER_PHOTO_URL,
          ai_processed: true,
          ai_analysis: {
            condition: 'normal',
            detected_issues: ['Minor scratches on front bumper'],
            suggested_addons: ['Paint Correction'],
          },
          uploaded_at: getDate(5, 10),
          created_at: getDate(5, 10),
        },
        {
          id: 'demo-booking-photo-1-2',
          lead_id: 'demo-lead-1',
          business_id: MOCK_BUSINESS.id,
          job_id: 'demo-job-1',
          photo_type: 'interior',
          storage_path: 'booking-photos/demo-1-2.jpg',
          storage_url: PLACEHOLDER_PHOTO_URL_2,
          ai_processed: true,
          ai_analysis: {
            condition: 'normal',
            detected_issues: [],
            suggested_addons: [],
          },
          uploaded_at: getDate(5, 10),
          created_at: getDate(5, 10),
        },
        {
          id: 'demo-booking-photo-1-3',
          lead_id: 'demo-lead-1',
          business_id: MOCK_BUSINESS.id,
          job_id: 'demo-job-1',
          photo_type: 'problem_area',
          storage_path: 'booking-photos/demo-1-3.jpg',
          storage_url: PLACEHOLDER_PHOTO_URL_3,
          ai_processed: false,
          uploaded_at: getDate(5, 10),
          created_at: getDate(5, 10),
        },
      ],
      job: [],
    },
    'demo-job-2': {
      booking: [
        {
          id: 'demo-booking-photo-2-1',
          lead_id: 'demo-lead-2',
          business_id: MOCK_BUSINESS.id,
          job_id: 'demo-job-2',
          photo_type: 'exterior',
          storage_path: 'booking-photos/demo-2-1.jpg',
          storage_url: PLACEHOLDER_PHOTO_URL_4,
          ai_processed: true,
          ai_analysis: {
            condition: 'dirty',
            detected_issues: ['Heavy dirt buildup', 'Water spots'],
            suggested_addons: ['Clay Bar Treatment'],
          },
          uploaded_at: getDate(3, 9),
          created_at: getDate(3, 9),
        },
        {
          id: 'demo-booking-photo-2-2',
          lead_id: 'demo-lead-2',
          business_id: MOCK_BUSINESS.id,
          job_id: 'demo-job-2',
          photo_type: 'exterior',
          storage_path: 'booking-photos/demo-2-2.jpg',
          storage_url: PLACEHOLDER_PHOTO_URL_5,
          ai_processed: false,
          uploaded_at: getDate(3, 9),
          created_at: getDate(3, 9),
        },
      ],
      job: [],
    },
    'demo-job-3': {
      booking: [
        {
          id: 'demo-booking-photo-3-1',
          lead_id: 'demo-lead-3',
          business_id: MOCK_BUSINESS.id,
          job_id: 'demo-job-3',
          photo_type: 'exterior',
          storage_path: 'booking-photos/demo-3-1.jpg',
          storage_url: PLACEHOLDER_PHOTO_URL,
          ai_processed: false,
          uploaded_at: getDate(2, 8),
          created_at: getDate(2, 8),
        },
      ],
      job: [],
    },
    'demo-job-4': {
      booking: [
        {
          id: 'demo-booking-photo-4-1',
          lead_id: 'demo-lead-4',
          business_id: MOCK_BUSINESS.id,
          job_id: 'demo-job-4',
          photo_type: 'exterior',
          storage_path: 'booking-photos/demo-4-1.jpg',
          storage_url: PLACEHOLDER_PHOTO_URL_2,
          ai_processed: true,
          ai_analysis: {
            condition: 'very_dirty',
            detected_issues: ['Mud buildup', 'Scratches on side panels'],
            suggested_addons: ['Deep Clean', 'Paint Correction'],
          },
          uploaded_at: getDate(1, 11),
          created_at: getDate(1, 11),
        },
        {
          id: 'demo-booking-photo-4-2',
          lead_id: 'demo-lead-4',
          business_id: MOCK_BUSINESS.id,
          job_id: 'demo-job-4',
          photo_type: 'interior',
          storage_path: 'booking-photos/demo-4-2.jpg',
          storage_url: PLACEHOLDER_PHOTO_URL_3,
          ai_processed: false,
          uploaded_at: getDate(1, 11),
          created_at: getDate(1, 11),
        },
      ],
      job: [
        {
          id: 'demo-job-photo-4-1',
          job_id: 'demo-job-4',
          assignment_id: 'demo-assignment-1',
          photo_type: 'after',
          storage_path: 'job-photos/demo-4-1.jpg',
          storage_url: PLACEHOLDER_PHOTO_URL_4,
          uploaded_by: MOCK_TEAM_MEMBERS[0].id,
          description: 'After exterior detail',
          is_featured: true,
          sort_order: 0,
          uploaded_at: getDate(0, 13),
        },
        {
          id: 'demo-job-photo-4-2',
          job_id: 'demo-job-4',
          assignment_id: 'demo-assignment-1',
          photo_type: 'after',
          storage_path: 'job-photos/demo-4-2.jpg',
          storage_url: PLACEHOLDER_PHOTO_URL_5,
          uploaded_by: MOCK_TEAM_MEMBERS[0].id,
          description: 'After interior detail',
          is_featured: false,
          sort_order: 1,
          uploaded_at: getDate(0, 14),
        },
      ],
    },
    'demo-job-5': {
      booking: [
        {
          id: 'demo-booking-photo-5-1',
          lead_id: 'demo-lead-5',
          business_id: MOCK_BUSINESS.id,
          job_id: 'demo-job-5',
          photo_type: 'exterior',
          storage_path: 'booking-photos/demo-5-1.jpg',
          storage_url: PLACEHOLDER_PHOTO_URL,
          ai_processed: true,
          ai_analysis: {
            condition: 'normal',
            detected_issues: [],
            suggested_addons: [],
          },
          uploaded_at: getDate(7, 9),
          created_at: getDate(7, 9),
        },
        {
          id: 'demo-booking-photo-5-2',
          lead_id: 'demo-lead-5',
          business_id: MOCK_BUSINESS.id,
          job_id: 'demo-job-5',
          photo_type: 'exterior',
          storage_path: 'booking-photos/demo-5-2.jpg',
          storage_url: PLACEHOLDER_PHOTO_URL_2,
          ai_processed: false,
          uploaded_at: getDate(7, 9),
          created_at: getDate(7, 9),
        },
        {
          id: 'demo-booking-photo-5-3',
          lead_id: 'demo-lead-5',
          business_id: MOCK_BUSINESS.id,
          job_id: 'demo-job-5',
          photo_type: 'interior',
          storage_path: 'booking-photos/demo-5-3.jpg',
          storage_url: PLACEHOLDER_PHOTO_URL_3,
          ai_processed: false,
          uploaded_at: getDate(7, 9),
          created_at: getDate(7, 9),
        },
      ],
      job: [
        {
          id: 'demo-job-photo-5-1',
          job_id: 'demo-job-5',
          assignment_id: null,
          photo_type: 'after',
          storage_path: 'job-photos/demo-5-1.jpg',
          storage_url: PLACEHOLDER_PHOTO_URL_4,
          uploaded_by: null,
          description: 'Ceramic coating complete',
          is_featured: true,
          sort_order: 0,
          uploaded_at: getDate(-1, 15),
        },
        {
          id: 'demo-job-photo-5-2',
          job_id: 'demo-job-5',
          assignment_id: null,
          photo_type: 'after',
          storage_path: 'job-photos/demo-5-2.jpg',
          storage_url: PLACEHOLDER_PHOTO_URL_5,
          uploaded_by: null,
          description: 'Final result',
          is_featured: false,
          sort_order: 1,
          uploaded_at: getDate(-1, 15),
        },
      ],
    },
    'demo-job-6': {
      booking: [
        {
          id: 'demo-booking-photo-6-1',
          lead_id: null,
          business_id: MOCK_BUSINESS.id,
          job_id: 'demo-job-6',
          photo_type: 'exterior',
          storage_path: 'booking-photos/demo-6-1.jpg',
          storage_url: PLACEHOLDER_PHOTO_URL,
          ai_processed: false,
          uploaded_at: getDate(5, 10),
          created_at: getDate(5, 10),
        },
        {
          id: 'demo-booking-photo-6-2',
          lead_id: null,
          business_id: MOCK_BUSINESS.id,
          job_id: 'demo-job-6',
          photo_type: 'exterior',
          storage_path: 'booking-photos/demo-6-2.jpg',
          storage_url: PLACEHOLDER_PHOTO_URL_2,
          ai_processed: false,
          uploaded_at: getDate(5, 10),
          created_at: getDate(5, 10),
        },
      ],
      job: [],
    },
    'demo-job-7': {
      booking: [
        {
          id: 'demo-booking-photo-7-1',
          lead_id: null,
          business_id: MOCK_BUSINESS.id,
          job_id: 'demo-job-7',
          photo_type: 'exterior',
          storage_path: 'booking-photos/demo-7-1.jpg',
          storage_url: PLACEHOLDER_PHOTO_URL_3,
          ai_processed: false,
          uploaded_at: getDate(4, 14),
          created_at: getDate(4, 14),
        },
      ],
      job: [
        {
          id: 'demo-job-photo-7-1',
          job_id: 'demo-job-7',
          assignment_id: null,
          photo_type: 'after',
          storage_path: 'job-photos/demo-7-1.jpg',
          storage_url: PLACEHOLDER_PHOTO_URL_4,
          uploaded_by: null,
          description: 'After wash and wax',
          is_featured: true,
          sort_order: 0,
          uploaded_at: getDate(-3, 15),
        },
        {
          id: 'demo-job-photo-7-2',
          job_id: 'demo-job-7',
          assignment_id: null,
          photo_type: 'after',
          storage_path: 'job-photos/demo-7-2.jpg',
          storage_url: PLACEHOLDER_PHOTO_URL_5,
          uploaded_by: null,
          description: 'Tire shine applied',
          is_featured: false,
          sort_order: 1,
          uploaded_at: getDate(-3, 15),
        },
      ],
    },
    'demo-job-8': {
      booking: [
        {
          id: 'demo-booking-photo-8-1',
          lead_id: null,
          business_id: MOCK_BUSINESS.id,
          job_id: 'demo-job-8',
          photo_type: 'exterior',
          storage_path: 'booking-photos/demo-8-1.jpg',
          storage_url: PLACEHOLDER_PHOTO_URL,
          ai_processed: false,
          uploaded_at: getDate(10, 9),
          created_at: getDate(10, 9),
        },
        {
          id: 'demo-booking-photo-8-2',
          lead_id: null,
          business_id: MOCK_BUSINESS.id,
          job_id: 'demo-job-8',
          photo_type: 'interior',
          storage_path: 'booking-photos/demo-8-2.jpg',
          storage_url: PLACEHOLDER_PHOTO_URL_2,
          ai_processed: false,
          uploaded_at: getDate(10, 9),
          created_at: getDate(10, 9),
        },
      ],
      job: [
        {
          id: 'demo-job-photo-8-1',
          job_id: 'demo-job-8',
          assignment_id: null,
          photo_type: 'after',
          storage_path: 'job-photos/demo-8-1.jpg',
          storage_url: PLACEHOLDER_PHOTO_URL_3,
          uploaded_by: null,
          description: 'Complete detail finished',
          is_featured: true,
          sort_order: 0,
          uploaded_at: getDate(-5, 12),
        },
        {
          id: 'demo-job-photo-8-2',
          job_id: 'demo-job-8',
          assignment_id: null,
          photo_type: 'after',
          storage_path: 'job-photos/demo-8-2.jpg',
          storage_url: PLACEHOLDER_PHOTO_URL_4,
          uploaded_by: null,
          description: 'Interior detail complete',
          is_featured: false,
          sort_order: 1,
          uploaded_at: getDate(-5, 12),
        },
      ],
    },
  }

  const photos = jobPhotoMap[jobId] || { booking: [], job: [] }
  const allPhotos = [...photos.booking, ...photos.job]

  // Create timeline
  const timeline = [
    ...photos.booking.map(photo => ({
      phase: 'booking' as const,
      photo: photo as any,
      timestamp: photo.uploaded_at,
    })),
    ...photos.job.map(photo => ({
      phase: 'job' as const,
      photo: photo as any,
      timestamp: photo.uploaded_at,
    })),
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  // Count photos by type
  const beforeCount = photos.booking.length + photos.job.filter((p: any) => p.photo_type === 'before').length
  const afterCount = photos.job.filter((p: any) => p.photo_type === 'after').length

  return {
    booking_photos: photos.booking as any[],
    job_photos: photos.job as any[],
    all_photos: allPhotos as any[],
    total_count: allPhotos.length,
    before_count: beforeCount,
    after_count: afterCount,
    timeline: timeline as any[],
  }
}
