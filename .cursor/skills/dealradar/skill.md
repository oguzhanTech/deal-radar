# DealRadar Skill

DealRadar is a mobile-first PWA web application built with modern best practices.

## Core Stack

- Next.js (App Router)
- TypeScript
- TailwindCSS
- shadcn/ui
- Supabase (Auth, Database, Storage)
- Framer Motion

## Architecture Principles

- Mobile-first design always
- Component-driven architecture
- Reusable UI components
- Clean folder structure
- Type-safe code

## UI Guidelines

The UI must feel like a modern mobile app.

Use:

- Card-based layout
- Rounded corners
- Clean spacing
- Soft shadows
- Smooth animations

Avoid:

- Desktop-heavy layouts
- Old-style web design

Design inspiration:

Modern Dribbble mobile apps.

## Deal Model Rules

Every deal must include:

- image
- title
- provider
- country
- end date
- countdown

Countdown must always be visible.

## Authentication Rules

Anonymous users can browse.

Authentication required for:

- saving deals
- creating deals
- commenting
- voting

Use Supabase Auth.

## Reminder System

Reminder system must support:

- countdown tracking
- reminder scheduling
- email notifications
- in-app notifications

Code must be structured so push notifications can be added later.

## Admin System

Admin panel must allow:

- managing deals
- managing users
- approving deals

## Code Quality Rules

Always prefer:

- clean code
- readable code
- reusable components

Avoid:

- unnecessary complexity
- duplicate code
