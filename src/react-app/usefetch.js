export const Fetch = async (endPoint, config, headerKey) => {
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return "http://127.0.0.1:8000";
      }
      return `${window.location.protocol}//${hostname}${window.location.port ? ':' + window.location.port : ''}`;
    }
    return "https://exams.dashoapp.com";
  };

  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endPoint.startsWith("/") ? endPoint : `/${endPoint}`}`

  const headers = new Headers(config.headers || {})

  // Ensure Content-Type is set only if not already present
  if (!(config.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.append("Content-Type", "application/json")
  }

  if (headerKey) {
    headers.append("x-ext-link-key", headerKey)
  }

  // Optionally include the Authorization header if a token exists
  const authToken = localStorage.getItem("access_token")
  console.log('Fetch - Auth token from localStorage:', authToken ? 'Token found' : 'No token found')

  if (authToken && !headers.has("Authorization")) {
    headers.append("Authorization", `Bearer ${authToken}`)
    console.log('Fetch - Authorization header added')
  } else if (!authToken) {
    console.warn('Fetch - No access_token found in localStorage')
  }

  const modifiedConfig = { ...config, headers }

  console.log('Fetch - Final URL:', url)
  console.log('Fetch - Final headers:', Object.fromEntries(headers.entries()))

  try {
    const response = await fetch(url, modifiedConfig)

    if (response.status === 404) throw new Error("Not Found")
    if (response.status === 401) throw new Error("Unauthorized")

    return response
  } catch (error) {
    console.error("Fetch Error: ", error.message || error)
    throw error
  }
}
