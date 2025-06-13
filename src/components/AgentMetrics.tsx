
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { User, MapPin, Clock, DollarSign } from 'lucide-react';
import { ApiAgent, ApiAllocationResult } from '@/services/api';

interface AgentMetricsProps {
  agents: ApiAgent[];
  allocations: ApiAllocationResult | null;
}

export const AgentMetrics = ({ agents, allocations }: AgentMetricsProps) => {
  const getAgentAllocation = (agentId: number) => {
    return allocations?.agent_allocations.find(a => a.agent_id === agentId);
  };

  const getWarehouseName = (warehouseId: number) => {
    return `Warehouse ${warehouseId}`;
  };

  const activeAgents = agents.filter(a => a.checked_in && a.is_active);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Agent Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent</TableHead>
                <TableHead>Warehouse</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Orders Assigned</TableHead>
                <TableHead>Distance (km)</TableHead>
                <TableHead>Working Time</TableHead>
                <TableHead>Estimated Pay</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map(agent => {
                const allocation = getAgentAllocation(agent.id);
                const workingHours = allocation ? (allocation.total_time / 60).toFixed(1) : '0';
                
                return (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        {agent.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {getWarehouseName(agent.warehouse_id)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={agent.checked_in && agent.is_active ? "default" : "secondary"}
                        className={agent.checked_in && agent.is_active ? "bg-green-100 text-green-800" : ""}
                      >
                        {agent.checked_in && agent.is_active ? "Available" : "Not Available"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <span className="text-lg font-semibold">
                          {allocation ? allocation.orders.length : 0}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span>{allocation ? allocation.total_distance.toFixed(1) : '0.0'}</span>
                        <span className="text-sm text-gray-500">km</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{workingHours}h</span>
                        {allocation && parseFloat(workingHours) > 8 && (
                          <Badge variant="outline" className="ml-2 text-orange-600">
                            High Load
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">
                          ₹{allocation ? allocation.estimated_pay : 500}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Agent Efficiency Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">Active Agents</h3>
              <p className="text-3xl font-bold text-blue-600">
                {activeAgents.length}
              </p>
              <p className="text-sm text-gray-500">
                out of {agents.length} total
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">Avg Orders/Agent</h3>
              <p className="text-3xl font-bold text-green-600">
                {allocations ? (
                  (allocations.allocated_orders.length / Math.max(allocations.agent_allocations.length, 1)).toFixed(1)
                ) : '0'}
              </p>
              <p className="text-sm text-gray-500">orders per active agent</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">Total Cost</h3>
              <p className="text-3xl font-bold text-purple-600">
                ₹{allocations ? allocations.total_cost.toLocaleString() : '0'}
              </p>
              <p className="text-sm text-gray-500">estimated daily cost</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
