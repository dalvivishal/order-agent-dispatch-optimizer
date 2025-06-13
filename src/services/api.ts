
const API_BASE_URL = 'http://localhost:8000/api';

export interface ApiAgent {
  id: number;
  name: string;
  warehouse_id: number;
  checked_in: boolean;
  is_active: boolean;
  latitude: number | null;
  longitude: number | null;
}

export interface ApiOrder {
  id: number;
  warehouse_id: number;
  address: string;
  latitude: number;
  longitude: number;
  priority: 'high' | 'medium' | 'low';
  estimated_time: number;
  status: 'pending' | 'allocated' | 'dispatched' | 'delivered' | 'postponed';
  created_at: string;
}

export interface ApiWarehouse {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  capacity: number;
}

export interface ApiAllocationResult {
  agent_allocations: Array<{
    agent_id: number;
    orders: number[];
    total_distance: number;
    total_time: number;
    estimated_pay: number;
  }>;
  allocated_orders: number[];
  postponed_orders: number[];
  total_cost: number;
}

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async getAgents(): Promise<ApiAgent[]> {
    return this.request<ApiAgent[]>('/agents');
  }

  async getOrders(): Promise<ApiOrder[]> {
    return this.request<ApiOrder[]>('/orders');
  }

  async getWarehouses(): Promise<ApiWarehouse[]> {
    return this.request<ApiWarehouse[]>('/warehouses');
  }

  async runAllocation(): Promise<ApiAllocationResult> {
    return this.request<ApiAllocationResult>('/allocations/run', {
      method: 'POST',
    });
  }

  async getAllAllocations(): Promise<ApiAllocationResult> {
    return this.request<ApiAllocationResult>('/allocations/all', {
      method: 'GET',
    });
  }
}

export const apiService = new ApiService();
