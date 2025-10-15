-- Create auth service database
CREATE DATABASE nilecare_auth;

-- Connect to auth database
\c nilecare_auth;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE nilecare_auth TO nilecare;
GRANT ALL ON SCHEMA public TO nilecare;

-- Create initial schema will be handled by migration script

