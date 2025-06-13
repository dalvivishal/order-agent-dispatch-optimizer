
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, MapPin, Clock, User } from 'lucide-react';
import { Order, AllocationResult } from '@/components/AllocationEngine';

interface OrdersTableProps {
  orders: Order[];
  allocations: AllocationResult | null;
}

export const OrdersTable = ({ orders, allocations }: OrdersTableProps) => {
  const getOrderStatus = (orderId: number) => {
    if (!allocations) return 'pending';
    if (allocations.allocatedOrders.includes(orderId)) return 'allocated';
    if (allocations.postponedOrders.includes(orderId)) return 'postponed';
    return 'pending';
  };

  const getAssignedAgent = (orderId: number) => {
    if (!allocations) return null;
    const agentAllocation = allocations.agentAllocations.find(
      a => a.orders.includes(orderId)
    );
    return agentAllocation ? agentAllocation.agentId : null;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'allocated': return 'bg-green-100 text-green-800';
      case 'postponed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Orders Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Delivery Address</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Est. Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned Agent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map(order => {
              const status = getOrderStatus(order.id);
              const assignedAgent = getAssignedAgent(order.id);
              
              return (
                <TableRow key={order.id}>
                  <TableCell className="font-mono">
                    #{order.id.toString().padStart(4, '0')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      Warehouse {order.warehouseId}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {order.address}
                  </TableCell>
                  <TableCell>
                    <Badge className={getPriorityColor(order.priority)}>
                      {order.priority.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {order.estimatedTime} min
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(status)}>
                      {status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {assignedAgent ? (
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4 text-gray-400" />
                        Agent #{assignedAgent}
                      </div>
                    ) : (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
