-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- ===========================================
-- 1. TABLE: companies
-- ===========================================
CREATE TABLE companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- 2. TABLE: users
-- ===========================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) CHECK (role IN ('admin', 'supervisor', 'worker')) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_company ON users(company_id);
CREATE INDEX idx_users_email ON users(email);

-- ===========================================
-- 3. TABLE: roads
-- ===========================================
CREATE TABLE roads (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  description TEXT,
  geom GEOMETRY(LINESTRING, 4326),
  length_km FLOAT,
  status VARCHAR(20) DEFAULT 'good' CHECK (status IN ('good', 'fair', 'poor', 'critical')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_roads_geom ON roads USING GIST (geom);
CREATE INDEX idx_roads_company ON roads(company_id);
CREATE INDEX idx_roads_status ON roads(status);

-- ===========================================
-- 4. TABLE: damages
-- ===========================================
CREATE TABLE damages (
  id SERIAL PRIMARY KEY,
  road_id INTEGER REFERENCES roads(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('crack', 'pothole', 'rutting', 'raveling', 'depression', 'other')),
  severity INTEGER CHECK (severity BETWEEN 1 AND 5) NOT NULL,
  geom GEOMETRY(POINT, 4326) NOT NULL,
  image_url TEXT,
  video_url TEXT,
  detected_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'rejected')),
  description TEXT,
  ai_confidence FLOAT,
  detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_damages_geom ON damages USING GIST (geom);
CREATE INDEX idx_damages_status ON damages(status);
CREATE INDEX idx_damages_road ON damages(road_id);
CREATE INDEX idx_damages_type ON damages(type);

-- ===========================================
-- 5. TABLE: tasks
-- ===========================================
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  damage_id INTEGER REFERENCES damages(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
  start_date TIMESTAMP,
  due_date TIMESTAMP,
  completed_at TIMESTAMP,
  photo_before TEXT,
  photo_after TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_damage ON tasks(damage_id);
CREATE INDEX idx_tasks_priority ON tasks(priority);

-- ===========================================
-- 6. TABLE: notifications (optional - useful)
-- ===========================================
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- ===========================================
-- 7. Create trigger functions for updated_at
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roads_updated_at BEFORE UPDATE ON roads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_damages_updated_at BEFORE UPDATE ON damages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 8. Insert sample data (optional)
-- ===========================================
-- Sample company
INSERT INTO companies (name, email, password_hash, phone, address) VALUES
('UBND Tỉnh Đồng Nai', 'contact@dongnai.gov.vn', '$2b$10$samplehash', '0251234567', 'Biên Hòa, Đồng Nai');

-- Sample users (password: 'password123' - hash mẫu)
INSERT INTO users (company_id, name, email, password_hash, role, phone) VALUES
(1, 'Admin User', 'admin@dongnai.gov.vn', '$2b$10$samplehash', 'admin', '0901234567'),
(1, 'Giám sát viên', 'supervisor@dongnai.gov.vn', '$2b$10$samplehash', 'supervisor', '0901234568'),
(1, 'Công nhân', 'worker@dongnai.gov.vn', '$2b$10$samplehash', 'worker', '0901234569');

-- Sample road
INSERT INTO roads (company_id, name, code, description, length_km, status) VALUES
(1, 'Đường Phạm Văn Thuận', 'DN-PVT-01', 'Tuyến đường chính nội thành', 5.2, 'good');

COMMENT ON TABLE companies IS 'Bảng lưu thông tin công ty/đơn vị quản lý';
COMMENT ON TABLE users IS 'Bảng lưu thông tin người dùng';
COMMENT ON TABLE roads IS 'Bảng lưu thông tin tuyến đường';
COMMENT ON TABLE damages IS 'Bảng lưu thông tin hư hỏng';
COMMENT ON TABLE tasks IS 'Bảng lưu thông tin công việc sửa chữa';