
// Core allocation algorithm following the business requirements
export interface Agent {
  id: number;
  name: string;
  warehouseId: number;
  checkedIn: boolean;
  location: { lat: number; lng: number };
}

export interface Order {
  id: number;
  warehouseId: number;
  address: string;
  location: { lat: number; lng: number };
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number; // minutes
}

export interface Warehouse {
  id: number;
  name: string;
  location: { lat: number; lng: number };
  capacity: number;
}

export interface AllocationResult {
  agentAllocations: Array<{
    agentId: number;
    orders: number[];
    totalDistance: number;
    totalTime: number;
    estimatedPay: number;
  }>;
  allocatedOrders: number[];
  postponedOrders: number[];
  totalCost: number;
}

export class AllocationEngine {
  private static readonly MAX_WORKING_HOURS = 10;
  private static readonly MAX_DISTANCE_KM = 100;
  private static readonly SPEED_KMH = 12; // 5 min per km = 12 km/h
  private static readonly MIN_GUARANTEE = 500;
  private static readonly PAY_RATE_25_PLUS = 35;
  private static readonly PAY_RATE_50_PLUS = 42;

  static allocateOrders(data: { agents: Agent[]; orders: Order[]; warehouses: Warehouse[] }): AllocationResult {
    const result: AllocationResult = {
      agentAllocations: [],
      allocatedOrders: [],
      postponedOrders: [],
      totalCost: 0
    };

    // Group agents by warehouse
    const agentsByWarehouse = this.groupAgentsByWarehouse(data.agents);
    
    // Group orders by warehouse
    const ordersByWarehouse = this.groupOrdersByWarehouse(data.orders);

    // Process each warehouse
    Object.keys(agentsByWarehouse).forEach(warehouseId => {
      const warehouseAgents = agentsByWarehouse[warehouseId].filter(a => a.checkedIn);
      const warehouseOrders = ordersByWarehouse[warehouseId] || [];
      
      if (warehouseOrders.length === 0 || warehouseAgents.length === 0) return;

      const warehouseResult = this.allocateWarehouseOrders(warehouseAgents, warehouseOrders);
      
      result.agentAllocations.push(...warehouseResult.agentAllocations);
      result.allocatedOrders.push(...warehouseResult.allocatedOrders);
      result.postponedOrders.push(...warehouseResult.postponedOrders);
      result.totalCost += warehouseResult.totalCost;
    });

    return result;
  }

  private static groupAgentsByWarehouse(agents: Agent[]): Record<string, Agent[]> {
    return agents.reduce((acc, agent) => {
      const key = agent.warehouseId.toString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(agent);
      return acc;
    }, {} as Record<string, Agent[]>);
  }

  private static groupOrdersByWarehouse(orders: Order[]): Record<string, Order[]> {
    return orders.reduce((acc, order) => {
      const key = order.warehouseId.toString();
      if (!acc[key]) acc[key] = [];
      acc[key].push(order);
      return acc;
    }, {} as Record<string, Order[]>);
  }

  private static allocateWarehouseOrders(agents: Agent[], orders: Order[]) {
    const result = {
      agentAllocations: [] as any[],
      allocatedOrders: [] as number[],
      postponedOrders: [] as number[],
      totalCost: 0
    };

    // Sort orders by priority (high first)
    const sortedOrders = [...orders].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Initialize agent allocations
    const agentAllocations = agents.map(agent => ({
      agentId: agent.id,
      orders: [] as number[],
      totalDistance: 0,
      totalTime: 0,
      estimatedPay: this.MIN_GUARANTEE
    }));

    // Allocate orders using greedy approach
    sortedOrders.forEach(order => {
      const bestAgent = this.findBestAgent(agentAllocations, order, agents);
      
      if (bestAgent) {
        const distance = this.calculateDistance(bestAgent.agent.location, order.location);
        const travelTime = (distance / this.SPEED_KMH) * 60; // convert to minutes
        const totalTime = bestAgent.allocation.totalTime + travelTime + order.estimatedTime;
        const totalDistance = bestAgent.allocation.totalDistance + distance;

        // Check constraints
        if (totalTime <= this.MAX_WORKING_HOURS * 60 && totalDistance <= this.MAX_DISTANCE_KM) {
          bestAgent.allocation.orders.push(order.id);
          bestAgent.allocation.totalTime = totalTime;
          bestAgent.allocation.totalDistance = totalDistance;
          bestAgent.allocation.estimatedPay = this.calculatePay(bestAgent.allocation.orders.length);
          
          result.allocatedOrders.push(order.id);
        } else {
          result.postponedOrders.push(order.id);
        }
      } else {
        result.postponedOrders.push(order.id);
      }
    });

    // Calculate total cost
    result.totalCost = agentAllocations.reduce((sum, allocation) => sum + allocation.estimatedPay, 0);
    result.agentAllocations = agentAllocations.filter(a => a.orders.length > 0);

    return result;
  }

  private static findBestAgent(allocations: any[], order: Order, agents: Agent[]) {
    let bestAgent = null;
    let minCostIncrease = Infinity;

    allocations.forEach(allocation => {
      const agent = agents.find(a => a.id === allocation.agentId);
      if (!agent) return;

      const distance = this.calculateDistance(agent.location, order.location);
      const travelTime = (distance / this.SPEED_KMH) * 60;
      const newTotalTime = allocation.totalTime + travelTime + order.estimatedTime;
      const newTotalDistance = allocation.totalDistance + distance;

      // Check if constraints would be violated
      if (newTotalTime > this.MAX_WORKING_HOURS * 60 || newTotalDistance > this.MAX_DISTANCE_KM) {
        return;
      }

      const currentPay = this.calculatePay(allocation.orders.length);
      const newPay = this.calculatePay(allocation.orders.length + 1);
      const costIncrease = newPay - currentPay;

      if (costIncrease < minCostIncrease) {
        minCostIncrease = costIncrease;
        bestAgent = { allocation, agent };
      }
    });

    return bestAgent;
  }

  private static calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    // Simplified distance calculation (Haversine formula)
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLon = this.toRad(point2.lng - point1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.lat)) * Math.cos(this.toRad(point2.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private static calculatePay(orderCount: number): number {
    if (orderCount >= 50) {
      return orderCount * this.PAY_RATE_50_PLUS;
    } else if (orderCount >= 25) {
      return orderCount * this.PAY_RATE_25_PLUS;
    } else {
      return this.MIN_GUARANTEE;
    }
  }
}
