
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Users, Package, Clock, DollarSign, Truck, AlertCircle } from 'lucide-react';
import { WarehouseOverview } from '@/components/WarehouseOverview';
import { AgentMetrics } from '@/components/AgentMetrics';
import { OrdersTable } from '@/components/OrdersTable';
import { apiService, ApiAgent, ApiOrder, ApiWarehouse, ApiAllocationResult } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [agents, setAgents] = useState<ApiAgent[]>([]);
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [warehouses, setWarehouses] = useState<ApiWarehouse[]>([]);
  const [allocations, setAllocations] = useState<ApiAllocationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAllocating, setIsAllocating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [agentsData, ordersData, warehousesData, allocationsData] = await Promise.all([
        apiService.getAgents(),
        apiService.getOrders(),
        apiService.getWarehouses(),
        apiService.getAllAllocations(),
      ]);

      setAgents(agentsData);
      setOrders(ordersData);
      setWarehouses(warehousesData);
      setAllocations(allocationsData);

      toast({
        title: "Data loaded successfully",
        description: "All system data has been refreshed",
      });
    } catch (error) {
      console.error('Failed to load initial data:', error);
      toast({
        title: "Error loading data",
        description: "Failed to connect to the backend. Please check if the server is running.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunAllocation = async () => {
    try {
      setIsAllocating(true);
      const result = await apiService.runAllocation();
      setAllocations(result);

      // Refresh orders to get updated statuses
      const updatedOrders = await apiService.getOrders();
      setOrders(updatedOrders);

      toast({
        title: "Allocation completed",
        description: `${result.allocated_orders.length} orders allocated to ${result.agent_allocations.length} agents`,
      });
    } catch (error) {
      console.error('Allocation failed:', error);
      toast({
        title: "Allocation failed",
        description: "Failed to run allocation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAllocating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading system data...</p>
        </div>
      </div>
    );
  }

  const totalOrders = orders.length;
  const totalAgents = agents.length;
  const totalWarehouses = warehouses.length;
  const activeAgents = agents.filter(a => a.checked_in && a.is_active).length;
  const groupedTodaysOrders: Record<number, ApiOrder[]> = {};
  const now = new Date();
  orders.forEach(order => {
    const createdAt = new Date(order.created_at);
    const isToday =
      createdAt.getFullYear() === now.getFullYear() &&
      createdAt.getMonth() === now.getMonth() &&
      createdAt.getDate() === now.getDate();

    if (isToday) {
      const warehouseId = order.warehouse_id;
      if (!groupedTodaysOrders[warehouseId]) {
        groupedTodaysOrders[warehouseId] = [];
      }
      groupedTodaysOrders[warehouseId].push(order);
    }
  });

  console.log("groupedTodaysOrders", groupedTodaysOrders);
  // const allocatedOrders = allocations ? allocations.allocated_orders.length : 0;
  const allocatedOrders = orders.filter(o => o.status === "allocated").length;
  // const postponedOrders = allocations ? allocations.postponed_orders.length : 0;
  const postponedOrders = orders.filter(o => o.status === "postponed").length;
  const estCost = allocations ? allocations.total_cost : 0;


  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Delivery Management System</h1>
            <p className="text-gray-600 mt-1">Order allocation and route optimization platform</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={loadInitialData}
              variant="outline"
              disabled={isLoading}
            >
              <Package className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
            <Button
              onClick={handleRunAllocation}
              disabled={isAllocating || activeAgents === 0}
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
        </div>

        {/* Connection Status */}
        {activeAgents === 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <span className="text-orange-800">
                  No agents are checked in. Allocation cannot be performed.
                </span>
              </div>
            </CardContent>
          </Card>
        )}

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
                  <p className="text-2xl font-bold">{activeAgents}/{totalAgents}</p>
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
                    ₹{estCost ? estCost.toLocaleString() : '0'}
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
                          {allocatedOrders && totalOrders ? ((allocatedOrders / totalOrders) * 100).toFixed(1) : 0}%
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Agents Utilized</span>
                        <Badge variant="secondary">
                          {allocations?.agent_allocations?.length}/{activeAgents}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Average Orders/Agent</span>
                        <Badge variant="secondary">
                          {(allocatedOrders / Math.max(allocations?.agent_allocations?.length, 1)).toFixed(1)}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Total Cost</span>
                        <Badge variant="outline">₹{allocations?.total_cost.toLocaleString()}</Badge>
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
            <AgentMetrics agents={agents} allocations={allocations} />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersTable orders={orders} allocations={allocations} />
          </TabsContent>

          <TabsContent value="warehouses">
            <WarehouseOverview warehouses={warehouses} extraData={{ totalAgents: totalAgents, groupedTodaysOrders: groupedTodaysOrders, activeAgents: activeAgents }} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
