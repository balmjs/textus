-- Sample data for Textus
-- Run this after initial migration to populate test data

-- Insert sample groups
INSERT INTO groups (name, order_num, is_public) VALUES
  ('Development Tools', 0, 1),
  ('Design Resources', 1, 1),
  ('Social Media', 2, 1),
  ('Private Resources', 3, 0);

-- Insert sample sites
INSERT INTO sites (group_id, name, url, icon, description, order_num, is_public) VALUES
  -- Development Tools
  (1, 'GitHub', 'https://github.com', 'https://github.com/favicon.ico', 'Code hosting platform', 0, 1),
  (1, 'Stack Overflow', 'https://stackoverflow.com', 'https://stackoverflow.com/favicon.ico', 'Developer Q&A', 1, 1),
  (1, 'MDN Web Docs', 'https://developer.mozilla.org', 'https://developer.mozilla.org/favicon.ico', 'Web documentation', 2, 1),

  -- Design Resources
  (2, 'Figma', 'https://figma.com', 'https://figma.com/favicon.ico', 'Collaborative design tool', 0, 1),
  (2, 'Dribbble', 'https://dribbble.com', 'https://dribbble.com/favicon.ico', 'Design inspiration', 1, 1),

  -- Social Media
  (3, 'Twitter', 'https://twitter.com', 'https://twitter.com/favicon.ico', 'Social networking', 0, 1),
  (3, 'LinkedIn', 'https://linkedin.com', 'https://linkedin.com/favicon.ico', 'Professional network', 1, 1),

  -- Private Resources (only visible to admins)
  (4, 'Admin Panel', 'https://admin.example.com', null, 'Internal admin panel', 0, 0),
  (4, 'Analytics', 'https://analytics.example.com', null, 'Private analytics', 1, 0);

-- Insert sample configs
INSERT INTO configs (key, value) VALUES
  ('SITE_TITLE', 'Textus'),
  ('SITE_DESCRIPTION', 'My Personal Navigation Hub'),
  ('BACKGROUND_IMAGE', ''),
  ('CUSTOM_CSS', '');
