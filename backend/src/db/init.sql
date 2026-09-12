-- init.sql
-- This script creates the initial tables for our application.

-- Enable the uuid-ossp extension to generate UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the files table (Phase 3)
-- Tracks metadata for every file uploaded to S3 by a user.
CREATE TABLE IF NOT EXISTS files (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_name VARCHAR(255) NOT NULL,
  s3_key        TEXT NOT NULL UNIQUE,
  file_size     BIGINT NOT NULL,
  mime_type     VARCHAR(100) NOT NULL,
  uploaded_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
