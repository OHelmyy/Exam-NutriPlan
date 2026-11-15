/**
 * ApiService
 * A simple helper class to fetch data from the API
 */

export class ApiService {
  /**
   * The constructor runs when we create a new ApiService:
   * const api = new ApiService('https://nutriplan-api.vercel.app/api');
   */
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  /**
   * get(endpoint) fetches data from a given endpoint
   * Example: api.get('/meals/categories')
   */
  async get(endpoint) {
    try {
      // 1. Send request to the full URL (baseUrl + endpoint)
      const response = await fetch(`${this.baseUrl}${endpoint}`);

      // 2. Check if the server responded successfully (status code 200-299)
      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      // 3. Convert the response from JSON text into a JavaScript object
      const data = await response.json();
      return data;
    } catch (error) {
      // 4. Log the error and pass it along
      console.error('API Request failed:', error.message);
      throw error;
    }
  }
}
