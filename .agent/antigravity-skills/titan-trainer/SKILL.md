---
name: titan-trainer
description: Use this skill when working on Titan Trainer, a comprehensive fitness web application. Triggers include any mention of Titan Trainer, workout generation, exercise databases, progress tracking, fitness tracking, training plans, or gym-related app features. Also use for Titan Trainer's React/TypeScript/Supabase stack, workout CRUD operations, or exercise library management.
---

# Titan Trainer Development Skill

## About the Project

Titan Trainer is a comprehensive fitness web application built with React, TypeScript, and Supabase. It features workout generation, exercise databases, progress tracking, body measurements, and training plan management.

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Charts**: Recharts for progress visualization
- **Hosting**: Lovable / Vercel
- **Language**: Portuguese (pt-BR) for UI

## Data Model

### Core Entities

```
users
├── profiles (name, avatar, goals, measurements)
├── workouts (training sessions)
│   └── workout_exercises (exercises in a workout)
│       └── exercise_sets (sets within an exercise)
├── training_plans (weekly/monthly plans)
│   └── plan_days (day-by-day structure)
├── body_measurements (weight, body fat, etc.)
└── exercise_library (global exercise database)
```

### Exercise Library Schema

```sql
CREATE TABLE exercise_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_pt TEXT NOT NULL,          -- Portuguese name
  muscle_group TEXT NOT NULL,      -- chest, back, legs, shoulders, arms, core, cardio
  secondary_muscles TEXT[],
  equipment TEXT,                   -- barbell, dumbbell, machine, bodyweight, cable
  difficulty TEXT DEFAULT 'intermediate', -- beginner, intermediate, advanced
  instructions TEXT,
  instructions_pt TEXT,
  video_url TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Workout Session Schema

```sql
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  notes TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  total_volume NUMERIC,           -- total kg lifted
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercise_library(id),
  order_index INTEGER NOT NULL,
  rest_seconds INTEGER DEFAULT 60,
  notes TEXT
);

CREATE TABLE exercise_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id UUID REFERENCES workout_exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  reps INTEGER,
  weight NUMERIC,                  -- in kg
  duration_seconds INTEGER,        -- for timed exercises
  set_type TEXT DEFAULT 'normal',  -- normal, warmup, dropset, failure
  completed BOOLEAN DEFAULT false
);
```

## Instructions

1. **Exercise Library**: Use the canonical muscle groups: chest, back, legs, shoulders, arms, core, cardio. Always include pt-BR names.
2. **Workout Generation**: When auto-generating workouts, respect: muscle group split, equipment availability, user level, rest times.
3. **Progress Tracking**: Calculate total volume (sets × reps × weight). Show trends with Recharts.
4. **Body Measurements**: Track weight (kg), body fat (%), and muscle measurements. Show evolution charts.
5. **UI/UX**: Mobile-first. Large touch targets for gym use. Timer component for rest periods.

## Constraints

- Weight always in kg (allow user preference for lb display but store kg)
- Exercise names must have both `name` (English) and `name_pt` (Portuguese)
- Never delete exercise_library entries (they may be referenced by workouts)
- Workout duration calculated from started_at/finished_at, never manually entered
- All charts must be responsive and work on mobile
