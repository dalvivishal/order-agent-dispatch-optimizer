
import random
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app import Warehouse, Agent, Order, Base
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL', 'mysql://root:password@localhost:3306/delivery_management')
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed_data():
    session = SessionLocal()
    
    # Clear existing data
    session.query(Order).delete()
    session.query(Agent).delete()
    session.query(Warehouse).delete()
    session.commit()
    
    # Seed warehouses (10 total)
    base_lat, base_lng = 19.0760, 72.8777  # Mumbai coordinates
    warehouses = []
    
    for i in range(1, 11):
        warehouse = Warehouse(
            name=f"Warehouse {i}",
            latitude=base_lat + (random.random() - 0.5) * 0.2,
            longitude=base_lng + (random.random() - 0.5) * 0.2,
            capacity=1200
        )
        session.add(warehouse)
        warehouses.append(warehouse)
    
    session.commit()
    
    # Seed agents (20 per warehouse, 200 total)
    agent_id = 1
    for warehouse in warehouses:
        for i in range(20):
            agent = Agent(
                name=f"Agent {agent_id}",
                warehouse_id=warehouse.id,
                phone=f"+91{random.randint(7000000000, 9999999999)}",
                is_active=True,
                checked_in=random.random() > 0.1,  # 90% check-in rate
                latitude=warehouse.latitude + (random.random() - 0.5) * 0.01,
                longitude=warehouse.longitude + (random.random() - 0.5) * 0.01
            )
            session.add(agent)
            agent_id += 1
    
    session.commit()
    
    # Seed orders (60-80 per warehouse)
    order_id = 1
    priorities = ['high', 'medium', 'low']
    areas = ['Andheri', 'Bandra', 'Juhu', 'Powai', 'Goregaon', 'Malad']
    streets = ['MG Road', 'Brigade Road', 'Commercial Street', 'Residency Road']
    
    for warehouse in warehouses:
        order_count = random.randint(60, 80)
        for i in range(order_count):
            order = Order(
                warehouse_id=warehouse.id,
                customer_address=f"{random.randint(1, 999)}, {random.choice(streets)}, {random.choice(areas)}, Mumbai - {random.randint(400001, 499999)}",
                latitude=warehouse.latitude + (random.random() - 0.5) * 0.05,
                longitude=warehouse.longitude + (random.random() - 0.5) * 0.05,
                priority=random.choice(priorities),
                estimated_time=random.randint(15, 35),
                status='pending'
            )
            session.add(order)
            order_id += 1
    
    session.commit()
    
    print(f"Seeded {len(warehouses)} warehouses")
    print(f"Seeded {agent_id - 1} agents")
    print(f"Seeded {order_id - 1} orders")
    
    session.close()

if __name__ == "__main__":
    seed_data()
