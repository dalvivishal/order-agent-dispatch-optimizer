
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Users, Package, Clock, DollarSign, Truck } from 'lucide-react';
import { AllocationEngine } from '@/components/AllocationEngine';
import { WarehouseOverview } from '@/components/WarehouseOverview';
import { AgentMetrics } from '@/components/AgentMetrics';
import { OrdersTable } from '@/components/OrdersTable';
import { mockData } from '@/utils/mockData';

const Index = () => {
  const [allocations, setAllocations] = useState(null);
  const [isAllocating, setIsAllocating] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(1);

  const handleRunAllocation = async () => {
    setIsAllocating(true);
    // Simulate allocation processing
    setTimeout(() => {
      const result = AllocationEngine.allocateOrders(mockData);
      setAllocations(result);
      setIsAllocating(false);
    }, 2000);
  };

  const totalOrders = mockData.orders.length;
  const totalAgents = mockData.agents.length;
  const totalWarehouses = mockData.warehouses.length;
  const allocatedOrders = allocations ? allocations.allocatedOrders.length : 0;
  const postponedOrders = allocations ? allocations.postponedOrders.length : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Delivery Management System</h1>
            <p className="text-gray-600 mt-1">Order allocation and route optimization platform</p>
          </div>
          <Button 
            onClick={handleRunAllocation}
            disabled={isAllocating}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isAllocating ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Allocating...
              </>
            ) : (
              <>
                <Truck className="w-4 h-4 mr-2" />
                Run Daily Allocation
              </>
            )}
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold">{totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Active Agents</p>
                  <p className="text-2xl font-bold">{totalAgents}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Warehouses</p>
                  <p className="text-2xl font-bold">{totalWarehouses}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Allocated</p>
                  <p className="text-2xl font-bold text-green-600">{allocatedOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Postponed</p>
                  <p className="text-2xl font-bold text-red-600">{postponedOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-gray-600">Est. Cost</p>
                  <p className="text-2xl font-bold">
                    ₹{allocations ? allocations.totalCost.toLocaleString() : '0'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="agents">Agent Metrics</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="warehouses">Warehouses</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Allocation Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {allocations ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Allocation Efficiency</span>
                        <Badge variant="secondary">
                          {((allocatedOrders / totalOrders) * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Agents Utilized</span>
                        <Badge variant="secondary">
                          {allocations.agentAllocations.length}/{totalAgents}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Average Orders/Agent</span>
                        <Badge variant="secondary">
                          {(allocatedOrders / Math.max(allocations.agentAllocations.length, 1)).toFixed(1)}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Cost</span>
                        <Badge variant="outline">₹{allocations.totalCost.toLocaleString()}</Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Run allocation to see summary</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Compliance Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Max Working Hours</span>
                      <Badge variant="outline">10 hrs</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Max Distance/Day</span>
                      <Badge variant="outline">100 km</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Travel Speed</span>
                      <Badge variant="outline">12 km/h</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Compliance Rate</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        100%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="agents">
            <AgentMetrics agents={mockData.agents} allocations={allocations} />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersTable orders={mockData.orders} allocations={allocations} />
          </TabsContent>

          <TabsContent value="warehouses">
            <WarehouseOverview warehouses={mockData.warehouses} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
