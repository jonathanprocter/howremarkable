# reMarkable Pro Digital Planner

## Overview

The reMarkable Pro Digital Planner is a React-based single-page application designed specifically for the reMarkable Pro tablet. It provides a comprehensive digital planning experience with weekly and daily calendar views, Google Calendar integration, and PDF export capabilities. The application is built with modern web technologies and optimized for the reMarkable Pro's e-ink display.

## System Architecture

The application follows a monorepo structure with clear separation between client, server, and shared code:

- **Frontend**: React-based SPA with TypeScript
- **Backend**: Express.js server with REST API
- **Database**: PostgreSQL with Drizzle ORM
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Build Tool**: Vite for development and production builds
- **Package Manager**: npm with workspace configuration

## Key Components

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React hooks with custom calendar state management
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Query Management**: TanStack Query for server state management

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Session Management**: Express sessions with PostgreSQL storage
- **API Design**: RESTful endpoints with proper error handling
- **Development**: Hot reloading with Vite integration

### Database Schema
The application uses three main entities:
- **Users**: Authentication and user management
- **Events**: Calendar events with support for multiple sources (manual, Google Calendar, SimplePractice)
- **Daily Notes**: Date-specific notes and planning content

### UI/UX Design
- **Target Resolution**: 1404x1872 pixels (reMarkable Pro native resolution)
- **Fixed Width**: 1404px application width
- **Color Scheme**: High contrast design optimized for e-ink display
- **Layout**: Two-column layout with sidebar navigation and main content area
- **Typography**: Clean, readable fonts with appropriate sizing for stylus interaction

## Data Flow

1. **User Authentication**: Users authenticate through the backend API
2. **Calendar State**: Custom React hook manages calendar state and operations
3. **Event Management**: Events are fetched from the backend and can be synchronized with Google Calendar
4. **Real-time Updates**: TanStack Query provides efficient data fetching and caching
5. **PDF Export**: Client-side PDF generation for planning documents
6. **Google Integration**: OAuth2 flow for Google Calendar and Drive access

## External Dependencies

### Core Dependencies
- **React Ecosystem**: React, React DOM, React Router (Wouter)
- **UI Components**: Radix UI primitives, shadcn/ui components
- **Database**: Drizzle ORM, Neon serverless PostgreSQL
- **Styling**: Tailwind CSS, class-variance-authority
- **Build Tools**: Vite, TypeScript, PostCSS

### Third-Party Integrations
- **Google Calendar API**: For calendar synchronization
- **Google Drive API**: For PDF export to cloud storage
- **SimplePractice**: Healthcare scheduling integration
- **PDF Generation**: Client-side PDF creation capabilities

### Development Tools
- **TypeScript**: Type safety across the entire application
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting (implicit through tooling)
- **Vite**: Development server and build tool

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot reloading
- **Database**: Local PostgreSQL or Neon serverless database
- **Environment Variables**: Local .env configuration
- **Replit Integration**: Optimized for Replit development environment

### Production Deployment
- **Build Process**: Vite builds the client, esbuild bundles the server
- **Server**: Node.js Express server serving static files and API
- **Database**: PostgreSQL with connection pooling
- **Environment**: Production environment variables for API keys and database connections

### Database Migrations
- **Schema Management**: Drizzle migrations for database schema changes
- **Deployment**: `npm run db:push` for schema synchronization

## Changelog

- July 06, 2025. Initial setup
- July 06, 2025. Google OAuth2 integration with Calendar and Drive APIs
- July 06, 2025. PDF export functionality for weekly and daily views
- July 06, 2025. Google Drive upload to "reMarkable Calendars" folder

## User Preferences

Preferred communication style: Simple, everyday language.