// ─── UniPath API Client ───────────────────────────────────────────────────────
// All requests go to Next.js API routes which query Supabase directly.
// ─────────────────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error')
    throw new Error(`API ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

// ─── Database Types (matching real schema) ────────────────────────────────────

export interface Province {
  province_id: number
  province_name: string
}

export interface Location {
  location_id: number
  city_name: string
  province_id: number
}

export interface Department {
  dept_id: number
  dept_name: string
  category: string
}

export interface UniversityDepartment {
  dept_id: number
  is_famous: boolean
  rating: number | null
  total_seats: number | null
  fee_per_semester: number | null
  allows_non_math_students: boolean
  requires_bridge_course: boolean
  bridge_course_info: string | null
  departments: { dept_name: string; category: string }
}

export interface University {
  uni_id: number
  uni_name: string
  uni_type: string
  sector: string
  website: string | null
  contact_email: string | null
  logo_url: string | null
  description: string | null
  established_year: number | null
  is_active: boolean
  locations: {
    location_id: number
    city_name: string
    provinces: { province_id: number; province_name: string }
  }
  university_departments: UniversityDepartment[]
}

export interface ScholarshipAvailability {
  avail_id: number
  uni_id: number
  quota_seats: number | null
  uni_specific_note: string | null
  university: {
    uni_id: number
    uni_name: string
    logo_url: string | null
    locations: { city_name: string }
  }
}

export interface Scholarship {
  scholarship_id: number
  title: string
  scholarship_type: string
  eligible_criteria: string | null
  required_docs: string | null
  how_to_apply: string | null
  apply_link: string | null
  amount_pkr: number | null
  deadline: string | null
  is_open: boolean
  provinces: { province_id: number; province_name: string } | null
  scholarship_availability: ScholarshipAvailability[]
}

export interface Admission {
  admission_id: number
  uni_id: number
  dept_id: number
  title: string
  eligible_criteria: string | null
  required_docs: string | null
  how_to_apply: string | null
  apply_link: string | null
  apply_start_date: string | null
  deadline: string | null
  is_open: boolean
  university?: { uni_name: string; logo_url: string | null; locations?: { city_name: string } }
  departments?: { dept_name: string; category: string }
}

export interface MeritList {
  list_id: number
  uni_id: number
  dept_id: number
  merit_closing_score: number | null
  merit_year: number
  seat_type: string
  university?: { uni_id: number; uni_name: string; logo_url: string | null; locations?: { city_name: string; provinces?: { province_name: string } } }
  departments?: { dept_id: number; dept_name: string; category: string }
}

export interface MeritListFilters {
  search?: string
  uni_id?: string
  dept_id?: string
  merit_year?: string
  seat_type?: string
  province_id?: string
  page?: number
  limit?: number
}

export const getMeritLists = (filters: MeritListFilters = {}) => {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== null) params.set(k, String(v))
  })
  const qs = params.toString()
  return apiFetch<PaginatedResponse<MeritList>>(`/api/merit-list${qs ? `?${qs}` : ''}`)
}

export interface FilterOptions {
  provinces: Province[]
  locations: Location[]
  departments: Department[]
  uni_types: string[]
  sectors: string[]
  scholarship_types: string[]
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface CurrentUser {
  user_id: number
  full_name: string
  username: string
  email: string
  role: string
  province_id: number | null
  location_id: number | null
  profile_picture_url: string | null
}

// ─── Universities ─────────────────────────────────────────────────────────────

export interface UniversityFilters {
  search?: string
  province_id?: string
  location_id?: string
  uni_type?: string
  sector?: string
  dept_id?: string
  page?: number
  limit?: number
}

export const getUniversities = (filters: UniversityFilters = {}) => {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== null) params.set(k, String(v))
  })
  const qs = params.toString()
  return apiFetch<PaginatedResponse<University>>(`/api/universities${qs ? `?${qs}` : ''}`)
}

// ─── Scholarships ─────────────────────────────────────────────────────────────

export interface ScholarshipFilters {
  search?: string
  province_id?: string
  scholarship_type?: string
  uni_id?: string
  is_open?: boolean
  page?: number
  limit?: number
}

export const getScholarships = (filters: ScholarshipFilters = {}) => {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== null) params.set(k, String(v))
  })
  const qs = params.toString()
  return apiFetch<PaginatedResponse<Scholarship>>(`/api/scholarships${qs ? `?${qs}` : ''}`)
}

// ─── Admissions ───────────────────────────────────────────────────────────────

export interface AdmissionFilters {
  search?: string
  uni_id?: string
  dept_id?: string
  is_open?: boolean
  page?: number
  limit?: number
}

export const getAdmissions = (filters: AdmissionFilters = {}) => {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== null) params.set(k, String(v))
  })
  const qs = params.toString()
  return apiFetch<PaginatedResponse<Admission>>(`/api/admissions${qs ? `?${qs}` : ''}`)
}

// ─── Filter Options ──────────────────────────────────────────────────────────

export const getFilterOptions = () =>
  apiFetch<FilterOptions>('/api/filter-options')

// ─── Auth ─────────────────────────────────────────────────────────────────────

export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  try {
    const data = await apiFetch<{ user: CurrentUser }>('/api/auth/me')
    return data.user ?? null
  } catch {
    return null
  }
}

export async function logout() {
  await apiFetch('/api/auth/logout', { method: 'POST' })
}
