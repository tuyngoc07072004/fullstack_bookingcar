import axios, { AxiosInstance } from 'axios';
import { getApiUrl } from '../../utils/dbUrl';
import {
  GetAllCustomersResponse,
  GetCustomerBookingsResponse,
  GetAllCustomersParams,
  GetCustomerBookingsParams
} from '../../types/StaffCustomer.types';

class StaffCustomerAPI {
  private api: AxiosInstance;

  constructor() {
    // Đảm bảo baseURL đúng với backend
    this.api = axios.create({
      baseURL: getApiUrl('/staffListCustomers'), // Sửa lại baseURL
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to add token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('staffToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get all customers with pagination and search
   */
  async getAllCustomers(params: GetAllCustomersParams = {}): Promise<GetAllCustomersResponse> {
    try {
      const { search, page = 1, limit = 20 } = params;
      
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());

      // Route: GET /staffListCustomers/customers
      const response = await this.api.get(`/customers?${queryParams.toString()}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, message: 'Lỗi kết nối server' };
    }
  }

  /**
   * Get bookings of a specific customer
   */
  async getCustomerBookings(
    customerId: string,
    params: GetCustomerBookingsParams = {}
  ): Promise<GetCustomerBookingsResponse> {
    try {
      const { page = 1, limit = 20, status } = params;
      
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());
      if (status && status !== 'all') queryParams.append('status', status);

      // Route: GET /staffListCustomers/customers/:customerId/bookings
      const response = await this.api.get(
        `/customers/${customerId}/bookings?${queryParams.toString()}`
      );
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, message: 'Lỗi kết nối server' };
    }
  }
}

export default new StaffCustomerAPI();