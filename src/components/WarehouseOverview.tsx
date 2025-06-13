
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Package, Users, Building } from 'lucide-react';
import { Warehouse } from '@/components/AllocationEngine';

interface WarehouseOverviewProps {
  warehouses: Warehouse[];
}

export const WarehouseOverview = ({ warehouses }: WarehouseOverviewProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {warehouses.map(warehouse => (
          <Card key={warehouse.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building className="w-5 h-5 text-blue-600" />
                {warehouse.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Location</span>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-mono">
                    {warehouse.location.lat.toFixed(4)}, {warehouse.location.lng.toFixed(4)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Capacity</span>
                <Badge variant="outline">
                  {warehouse.capacity} orders/day
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Active Agents</span>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold">20</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Today's Orders</span>
                <div className="flex items-center gap-1">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span className="font-semibold">~60</span>
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <Badge className="bg-green-100 text-green-800">
                    Operational
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Warehouse Network Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{warehouses.length}</p>
              <p className="text-sm text-gray-600">Total Warehouses</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">200</p>
              <p className="text-sm text-gray-600">Total Agents</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">600</p>
              <p className="text-sm text-gray-600">Daily Capacity</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">95%</p>
              <p className="text-sm text-gray-600">Avg Utilization</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
