/*
  # Create Student Platform Database Schema

  ## Overview
  This migration sets up the core database structure for the student disability platform,
  including user profiles and notes storage.

  ## 1. New Tables
  
  ### `profiles`
  - `id` (uuid, primary key) - Links to auth.users
  - `name` (text) - Student's full name
  - `city` (text) - Student's city
  - `age` (integer) - Student's age
  - `disability` (text) - Type of disability
  - `memo` (text) - Short personal memo/bio
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last profile update timestamp

  ### `notes`
  - `id` (uuid, primary key) - Unique note identifier
  - `user_id` (uuid, foreign key) - References profiles.id
  - `title` (text) - Note title
  - `content` (text) - Note content (from speech-to-text)
  - `created_at` (timestamptz) - Note creation timestamp
  - `updated_at` (timestamptz) - Last note update timestamp

  ## 2. Security
  
  ### Row Level Security (RLS)
  - RLS enabled on both tables
  
  ### Profiles Policies
  1. Users can view their own profile
  2. Users can insert their own profile during signup
  3. Users can update their own profile
  4. Users can delete their own profile
  
  ### Notes Policies
  1. Users can view only their own notes
  2. Users can create notes for themselves
  3. Users can update their own notes
  4. Users can delete their own notes

  ## 3. Important Notes
  - All timestamps use timestamptz for timezone awareness
  - Foreign key constraints ensure data integrity
  - Cascading deletes remove notes when a profile is deleted
  - Default values ensure timestamps are always set
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  city text DEFAULT '',
  age integer,
  disability text DEFAULT '',
  memo text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled Note',
  content text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Enable RLS on notes table
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Notes policies
CREATE POLICY "Users can view own notes"
  ON notes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own notes"
  ON notes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own notes"
  ON notes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own notes"
  ON notes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS notes_user_id_idx ON notes(user_id);
CREATE INDEX IF NOT EXISTS notes_created_at_idx ON notes(created_at DESC);