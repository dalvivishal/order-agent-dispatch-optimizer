
import { Agent, Order, Warehouse } from '@/components/AllocationEngine';

// Generate mock data as per requirements: 10 warehouses, 20 agents per warehouse, 60 orders per day/agent
export const generateMockData = () => {
  const warehouses: Warehouse[] = [];
  const agents: Agent[] = [];
  const orders: Order[] = [];

  // Generate 10 warehouses across a test city (using Mumbai-like coordinates)
  const baseLatLng = { lat: 19.0760, lng: 72.8777 };
  
  for (let i = 1; i <= 10; i++) {
    warehouses.push({
      id: i,
      name: `Warehouse ${i}`,
      location: {
        lat: baseLatLng.lat + (Math.random() - 0.5) * 0.2,
        lng: baseLatLng.lng + (Math.random() - 0.5) * 0.2
      },
      capacity: 1200 // 20 agents * 60 orders each
    });
  }

  // Generate 20 agents per warehouse (200 total)
  let agentId = 1;
  warehouses.forEach(warehouse => {
    for (let i = 1; i <= 20; i++) {
      agents.push({
        id: agentId++,
        name: `Agent ${agentId - 1}`,
        warehouseId: warehouse.id,
        checkedIn: Math.random() > 0.1, // 90% check-in rate
        location: {
          lat: warehouse.location.lat + (Math.random() - 0.5) * 0.01,
          lng: warehouse.location.lng + (Math.random() - 0.5) * 0.01
        }
      });
    }
  });

  // Generate orders (about 60 per agent, distributed across warehouses)
  let orderId = 1;
  const priorities: Array<'high' | 'medium' | 'low'> = ['high', 'medium', 'low'];
  
  warehouses.forEach(warehouse => {
    // Generate 60-80 orders per warehouse for realistic testing
    const orderCount = 60 + Math.floor(Math.random() * 20);
    
    for (let i = 0; i < orderCount; i++) {
      orders.push({
        id: orderId++,
        warehouseId: warehouse.id,
        address: `${Math.floor(Math.random() * 999) + 1}, ${getRandomStreet()}, ${getRandomArea()}, Mumbai - ${Math.floor(Math.random() * 99999) + 400001}`,
        location: {
          lat: warehouse.location.lat + (Math.random() - 0.5) * 0.05,
          lng: warehouse.location.lng + (Math.random() - 0.5) * 0.05
        },
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        estimatedTime: 15 + Math.floor(Math.random() * 20) // 15-35 minutes per delivery
      });
    }
  });

  return { warehouses, agents, orders };
};

const getRandomStreet = () => {
  const streets = [
    'MG Road', 'Brigade Road', 'Commercial Street', 'Residency Road',
    'Cunningham Road', 'Richmond Road', 'Palace Road', 'Rajaji Nagar',
    'Malleshwaram', 'Indira Nagar', 'Koramangala', 'HSR Layout',
    'Electronic City', 'Whitefield', 'Marathalli', 'BTM Layout'
  ];
  return streets[Math.floor(Math.random() * streets.length)];
};

const getRandomArea = () => {
  const areas = [
    'Andheri', 'Bandra', 'Juhu', 'Powai', 'Goregaon', 'Malad',
    'Borivali', 'Kandivali', 'Dahisar', 'Thane', 'Kurla', 'Ghatkopar',
    'Mulund', 'Bhandup', 'Vikhroli', 'Kanjurmarg'
  ];
  return areas[Math.floor(Math.random() * areas.length)];
};

export const mockData = generateMockData();
