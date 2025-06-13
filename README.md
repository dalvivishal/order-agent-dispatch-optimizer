
# Delivery Management System

A comprehensive order allocation and route optimization platform built with React, TypeScript, and Python Falcon backend.

## 🚀 Features

- **Smart Order Allocation**: Optimized algorithm that allocates orders to delivery agents while respecting business constraints
- **Compliance Management**: Ensures agents don't exceed 10-hour workday or 100km distance limits
- **Cost Optimization**: Implements tiered pay structure (₹500 minimum guarantee, ₹35 for 25+ orders, ₹42 for 50+ orders)
- **Real-time Dashboard**: Interactive interface showing allocation metrics, agent performance, and warehouse overview
- **Route Optimization**: Distance-based allocation to minimize travel time and costs

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **UI Library**: Shadcn/ui components with Tailwind CSS
- **State Management**: React hooks with context
- **Routing**: React Router v6
- **Charts**: Recharts for data visualization

### Backend (Python Falcon)
- **Framework**: Falcon (lightweight Python framework)
- **Database**: MySQL 8.0
- **ORM**: SQLAlchemy
- **API**: RESTful endpoints
- **Authentication**: JWT tokens

### Database Schema

```sql
-- Warehouses table
CREATE TABLE warehouses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    capacity INT DEFAULT 1200,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Agents table
CREATE TABLE agents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    warehouse_id INT NOT NULL,
    phone VARCHAR(15),
    is_active BOOLEAN DEFAULT TRUE,
    checked_in BOOLEAN DEFAULT FALSE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

-- Orders table
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    warehouse_id INT NOT NULL,
    customer_address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    priority ENUM('high', 'medium', 'low') DEFAULT 'medium',
    estimated_time INT DEFAULT 20,
    status ENUM('pending', 'allocated', 'dispatched', 'delivered', 'postponed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

-- Allocations table
CREATE TABLE allocations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    agent_id INT NOT NULL,
    order_id INT NOT NULL,
    allocated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_distance DECIMAL(8, 2),
    total_time INT,
    estimated_pay DECIMAL(8, 2),
    FOREIGN KEY (agent_id) REFERENCES agents(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- MySQL 8.0
- Git

### Frontend Setup

```bash
# Clone the repository
git clone <repository-url>
cd delivery-management-system

# Install dependencies
npm install

# Start development server
npm run dev
```

### Backend Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Set up environment variables
cp backend/.env.example backend/.env
# Edit .env with your database credentials

# Run database migrations
python backend/migrate.py

# Start the server
python backend/app.py
```

### Database Setup

```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE delivery_management;

# Import schema
mysql -u root -p delivery_management < backend/schema.sql

# Seed sample data
python backend/seed_data.py
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
DATABASE_URL=mysql://username:password@localhost:3306/delivery_management
JWT_SECRET=your-secret-key
API_PORT=8000
DEBUG=True
```

### Frontend Configuration

Update `src/config/api.ts`:

```typescript
export const API_BASE_URL = 'http://localhost:8000/api';
export const WEBSOCKET_URL = 'ws://localhost:8000/ws';
```

## 📊 Algorithm Details

### Allocation Strategy

1. **Constraint Validation**: Ensures compliance with working hour and distance limits
2. **Priority Sorting**: Orders sorted by priority (high → medium → low)
3. **Greedy Assignment**: Assigns orders to agents with minimum cost increase
4. **Load Balancing**: Distributes workload evenly across available agents

### Cost Optimization

- **Minimum Guarantee**: ₹500 per agent per day
- **Tier 1**: ₹35 per order for 25+ orders
- **Tier 2**: ₹42 per order for 50+ orders

### Distance Calculation

Uses Haversine formula for accurate GPS distance calculation:

```python
def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371  # Earth's radius in km
    dLat = radians(lat2 - lat1)
    dLon = radians(lon2 - lon1)
    a = sin(dLat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dLon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    return R * c
```

## 🚀 Deployment

### Production Build

```bash
# Frontend
npm run build

# Backend
pip install gunicorn
gunicorn --bind 0.0.0.0:8000 app:app
```

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Technology Stack Rationale

1. **React + TypeScript**: Type safety, component reusability, excellent ecosystem
2. **Falcon Framework**: Lightweight, fast, perfect for microservices
3. **MySQL**: ACID compliance, mature ecosystem, excellent for relational data
4. **Tailwind CSS**: Utility-first, rapid development, consistent design
5. **Docker**: Containerization for consistent deployments

## 📈 Performance Metrics

- **Allocation Time**: < 2 seconds for 600 orders across 200 agents
- **Memory Usage**: < 512MB for full dataset
- **API Response**: < 100ms average response time
- **Database Queries**: Optimized with proper indexing

## 🧪 Testing

```bash
# Run frontend tests
npm test

# Run backend tests
python -m pytest backend/tests/

# Run integration tests
npm run test:integration
```

## 📝 API Documentation

### Endpoints

- `GET /api/allocations/run` - Execute daily allocation
- `GET /api/agents` - List all agents
- `GET /api/orders` - List all orders
- `GET /api/warehouses` - List all warehouses
- `POST /api/agents/{id}/checkin` - Agent check-in

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Future Enhancements

- Real-time GPS tracking
- Machine learning for demand prediction
- Mobile app for delivery agents
- Advanced routing with traffic data
- Customer notification system

---

**Note**: This is an educational project demonstrating order allocation and route optimization concepts. The implementation focuses on core algorithmic challenges and system design principles.
