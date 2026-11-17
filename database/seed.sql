USE asset_tracking_db;

INSERT IGNORE INTO departments (id, name, code, description) VALUES
  (1, 'Information Technology', 'IT', 'Handles technology infrastructure and support.'),
  (2, 'Operations', 'OP', 'Handles day-to-day operational activities.'),
  (3, 'Engineering', 'EN', 'Handles engineering and maintenance activities.'),
  (4, 'Management', 'MG', 'Handles planning and administration.');

INSERT IGNORE INTO assets (id, asset_id, name, category, description, status, assigned_to, purchase_date, return_date) VALUES
  (1, 'AST-0001', 'Dell Latitude 5420', 'Laptop', 'Engineering laptop', 'Available', NULL, '2024-01-15', NULL),
  (2, 'AST-0002', 'HP LaserJet Pro', 'Printer', 'Office printer', 'Available', NULL, '2024-02-10', NULL),
  (3, 'AST-0003', 'Cisco Catalyst Switch', 'Networking', 'Network switch', 'Available', NULL, '2024-03-05', NULL),
  (4, 'AST-0004', 'Wacom Tablet', 'Electronics', 'Design tablet', 'Available', NULL, '2024-04-20', NULL),
  (5, 'AST-0005', 'Toyota Forklift', 'Vehicle', 'Warehouse forklift', 'Available', NULL, '2024-05-12', NULL);
