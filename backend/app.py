import falcon
import json
from falcon_cors import CORS
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
    Boolean,
    DateTime,
    Text,
    Enum,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
from datetime import datetime
import os
from dotenv import load_dotenv
import math

load_dotenv()

# Database setup
DATABASE_URL = os.getenv(
    "DATABASE_URL", "mysql+mysqlconnector://root:@localhost/delivery_management"
)
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Database Models
class Warehouse(Base):
    __tablename__ = "warehouses"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    capacity = Column(Integer, default=1200)
    created_at = Column(DateTime, default=datetime.utcnow)


class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    warehouse_id = Column(Integer, nullable=False)
    phone = Column(String(15))
    is_active = Column(Boolean, default=True)
    checked_in = Column(Boolean, default=False)
    latitude = Column(Float)
    longitude = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True)
    warehouse_id = Column(Integer, nullable=False)
    customer_address = Column(Text, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    priority = Column(Enum("high", "medium", "low"), default="medium")
    estimated_time = Column(Integer, default=20)
    status = Column(
        Enum("pending", "allocated", "dispatched", "delivered", "postponed"),
        default="pending",
    )
    created_at = Column(DateTime, default=datetime.utcnow)


class Allocation(Base):
    __tablename__ = "allocations"

    id = Column(Integer, primary_key=True)
    agent_id = Column(Integer, nullable=False)
    order_id = Column(Integer, nullable=False)
    allocated_at = Column(DateTime, default=datetime.utcnow)
    total_distance = Column(Float)
    total_time = Column(Integer)
    estimated_pay = Column(Float)


# Create tables
Base.metadata.create_all(bind=engine)


# Utility functions
def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points using Haversine formula"""
    R = 6371  # Earth's radius in km

    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def calculate_pay(order_count):
    """Calculate pay based on order count"""
    if order_count >= 50:
        return order_count * 42
    elif order_count >= 25:
        return order_count * 35
    else:
        return 500  # Minimum guarantee


# Allocation Engine
class AllocationEngine:
    MAX_WORKING_HOURS = 10
    MAX_DISTANCE_KM = 100
    SPEED_KMH = 12  # 5 min per km

    @classmethod
    def allocate_orders(cls, session):
        """Main allocation algorithm"""
        # Get all active agents and pending orders
        agents = (
            session.query(Agent)
            .filter(Agent.is_active == True, Agent.checked_in == True)
            .all()
        )
        orders = session.query(Order).filter(Order.status == "pending").all()

        # Group by warehouse
        agents_by_warehouse = {}
        orders_by_warehouse = {}

        for agent in agents:
            if agent.warehouse_id not in agents_by_warehouse:
                agents_by_warehouse[agent.warehouse_id] = []
            agents_by_warehouse[agent.warehouse_id].append(agent)

        for order in orders:
            if order.warehouse_id not in orders_by_warehouse:
                orders_by_warehouse[order.warehouse_id] = []
            orders_by_warehouse[order.warehouse_id].append(order)

        result = {
            "agent_allocations": [],
            "allocated_orders": [],
            "postponed_orders": [],
            "total_cost": 0,
        }

        # Process each warehouse
        for warehouse_id in agents_by_warehouse.keys():
            warehouse_agents = agents_by_warehouse.get(warehouse_id, [])
            warehouse_orders = orders_by_warehouse.get(warehouse_id, [])

            if not warehouse_orders or not warehouse_agents:
                continue

            warehouse_result = cls._allocate_warehouse_orders(
                warehouse_agents, warehouse_orders
            )

            for allocation in warehouse_result["agent_allocations"]:
                agent_id = allocation["agent_id"]
                agent_obj = session.query(Agent).filter_by(id=agent_id).first()
                allocation["agent"] = {
                    "id": agent_obj.id,
                    "name": agent_obj.name,
                    "warehouse_id": agent_obj.warehouse_id,
                    "checked_in": agent_obj.checked_in,
                    "is_active": agent_obj.is_active,
                    "latitude": agent_obj.latitude,
                    "longitude": agent_obj.longitude,
                }

            # Merge results
            result["agent_allocations"].extend(warehouse_result["agent_allocations"])
            result["allocated_orders"].extend(warehouse_result["allocated_orders"])
            result["postponed_orders"].extend(warehouse_result["postponed_orders"])
            result["total_cost"] += warehouse_result["total_cost"]

        # Save allocations to database
        cls._save_allocations(session, result)

        return result

    @classmethod
    def _allocate_warehouse_orders(cls, agents, orders):
        """Allocate orders within a single warehouse"""
        # Sort orders by priority
        priority_order = {"high": 3, "medium": 2, "low": 1}
        sorted_orders = sorted(
            orders, key=lambda x: priority_order[x.priority], reverse=True
        )

        # Initialize agent allocations
        agent_allocations = []
        for agent in agents:
            agent_allocations.append(
                {
                    "agent_id": agent.id,
                    "agent": agent,
                    "orders": [],
                    "total_distance": 0,
                    "total_time": 0,
                    "estimated_pay": 500,
                }
            )

        allocated_orders = []
        postponed_orders = []

        # Allocate orders using greedy approach
        for order in sorted_orders:
            best_agent = cls._find_best_agent(agent_allocations, order)

            if best_agent:
                distance = calculate_distance(
                    best_agent["agent"].latitude or 0,
                    best_agent["agent"].longitude or 0,
                    order.latitude,
                    order.longitude,
                )
                travel_time = (distance / cls.SPEED_KMH) * 60  # minutes
                total_time = (
                    best_agent["total_time"] + travel_time + order.estimated_time
                )
                total_distance = best_agent["total_distance"] + distance

                # Check constraints
                if (
                    total_time <= cls.MAX_WORKING_HOURS * 60
                    and total_distance <= cls.MAX_DISTANCE_KM
                ):

                    best_agent["orders"].append(order.id)
                    best_agent["total_time"] = total_time
                    best_agent["total_distance"] = total_distance
                    best_agent["estimated_pay"] = calculate_pay(
                        len(best_agent["orders"])
                    )

                    allocated_orders.append(order.id)
                else:
                    postponed_orders.append(order.id)
            else:
                postponed_orders.append(order.id)

        # Calculate total cost
        total_cost = sum(
            allocation["estimated_pay"]
            for allocation in agent_allocations
            if allocation["orders"]
        )

        return {
            "agent_allocations": [a for a in agent_allocations if a["orders"]],
            "allocated_orders": allocated_orders,
            "postponed_orders": postponed_orders,
            "total_cost": total_cost,
        }

    @classmethod
    def _find_best_agent(cls, allocations, order):
        """Find the best agent for an order based on cost increase"""
        best_agent = None
        min_cost_increase = float("inf")

        for allocation in allocations:
            current_pay = calculate_pay(len(allocation["orders"]))
            new_pay = calculate_pay(len(allocation["orders"]) + 1)
            cost_increase = new_pay - current_pay

            if cost_increase < min_cost_increase:
                min_cost_increase = cost_increase
                best_agent = allocation

        return best_agent

    @classmethod
    def _save_allocations(cls, session, result):
        """Save allocation results to database"""
        # Clear existing allocations for today
        session.query(Allocation).filter(
            func.date(Allocation.allocated_at) == datetime.today().date()
        ).delete()

        # Save new allocations
        for agent_allocation in result["agent_allocations"]:
            for order_id in agent_allocation["orders"]:
                allocation = Allocation(
                    agent_id=agent_allocation["agent_id"],
                    order_id=order_id,
                    total_distance=agent_allocation["total_distance"],
                    total_time=agent_allocation["total_time"],
                    estimated_pay=agent_allocation["estimated_pay"],
                )
                session.add(allocation)

        # Update order statuses
        for order_id in result["allocated_orders"]:
            session.query(Order).filter(Order.id == order_id).update(
                {"status": "allocated"}
            )

        for order_id in result["postponed_orders"]:
            session.query(Order).filter(Order.id == order_id).update(
                {"status": "postponed"}
            )

        session.commit()


# API Resources
class AllocationResource:
    def on_post(self, req, resp):
        session = SessionLocal()
        try:
            result = AllocationEngine.allocate_orders(session)
            resp.media = result
            resp.status = falcon.HTTP_200
        except Exception as e:
            resp.media = {"error": str(e)}
            resp.status = falcon.HTTP_500
        finally:
            session.close()


class AllAllocationsResource:
    def on_get(self, req, resp):
        session = SessionLocal()
        try:
            allocations = session.query(Allocation).all()

            agent_map = {}
            for alloc in allocations:
                aid = alloc.agent_id
                if aid not in agent_map:
                    agent_map[aid] = {
                        "agent_id": aid,
                        "orders": [],
                        "total_distance": 0,
                        "total_time": 0,
                        "estimated_pay": 0,
                    }
                agent = agent_map[aid]
                agent["orders"].append(alloc.order_id)
                agent["total_distance"] += alloc.total_distance or 0
                agent["total_time"] += alloc.total_time or 0
                agent["estimated_pay"] += alloc.estimated_pay or 0

            result = {
                "agent_allocations": list(agent_map.values()),
                "allocated_orders": [a.order_id for a in allocations],
                "postponed_orders": [
                    o.id
                    for o in session.query(Order)
                    .filter(Order.status == "postponed")
                    .all()
                ],
                "total_cost": sum(a.estimated_pay for a in allocations),
            }

            resp.media = result
            resp.status = falcon.HTTP_200
        except Exception as e:
            resp.media = {"error": str(e)}
            resp.status = falcon.HTTP_500
        finally:
            session.close()


class AgentsResource:
    def on_get(self, req, resp):
        session = SessionLocal()
        try:
            agents = session.query(Agent).all()
            resp.media = [
                {
                    "id": agent.id,
                    "name": agent.name,
                    "warehouse_id": agent.warehouse_id,
                    "checked_in": agent.checked_in,
                    "is_active": agent.is_active,
                    "latitude": agent.latitude,
                    "longitude": agent.longitude,
                }
                for agent in agents
            ]
            resp.status = falcon.HTTP_200
        except Exception as e:
            resp.media = {"error": str(e)}
            resp.status = falcon.HTTP_500
        finally:
            session.close()


class OrdersResource:
    def on_get(self, req, resp):
        session = SessionLocal()
        try:
            orders = session.query(Order).all()
            resp.media = [
                {
                    "id": order.id,
                    "warehouse_id": order.warehouse_id,
                    "address": order.customer_address,
                    "latitude": order.latitude,
                    "longitude": order.longitude,
                    "priority": order.priority,
                    "estimated_time": order.estimated_time,
                    "status": order.status,
                    "created_at": str(order.created_at),
                }
                for order in orders
            ]
            resp.status = falcon.HTTP_200
        except Exception as e:
            resp.media = {"error": str(e)}
            resp.status = falcon.HTTP_500
        finally:
            session.close()


class WarehousesResource:
    def on_get(self, req, resp):
        session = SessionLocal()
        try:
            warehouses = session.query(Warehouse).all()
            resp.media = [
                {
                    "id": warehouse.id,
                    "name": warehouse.name,
                    "latitude": warehouse.latitude,
                    "longitude": warehouse.longitude,
                    "capacity": warehouse.capacity,
                }
                for warehouse in warehouses
            ]
            resp.status = falcon.HTTP_200
        except Exception as e:
            resp.media = {"error": str(e)}
            resp.status = falcon.HTTP_500
        finally:
            session.close()


# Create Falcon app
cors = CORS(allow_all_origins=True, allow_all_headers=True, allow_all_methods=True)
app = falcon.App(middleware=[cors.middleware])

# Add routes
app.add_route("/api/allocations/run", AllocationResource())
app.add_route("/api/allocations/all", AllAllocationsResource())
app.add_route("/api/agents", AgentsResource())
app.add_route("/api/orders", OrdersResource())
app.add_route("/api/warehouses", WarehousesResource())

if __name__ == "__main__":
    from wsgiref import simple_server

    httpd = simple_server.make_server("127.0.0.1", 8000, app)
    print("Serving on http://127.0.0.1:8000")
    httpd.serve_forever()
