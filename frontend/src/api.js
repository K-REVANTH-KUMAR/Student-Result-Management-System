const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'

export async function api(path, options = {}) {
  const token = localStorage.getItem('srms_token')
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('srms_token')
      localStorage.removeItem('srms_user')
      window.dispatchEvent(new Event('srms-logout'))
    }
    throw new Error(data.message || data.error || 'Something went wrong')
  }
  return data
}
