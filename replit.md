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
- July 06, 2025. Fixed critical daily view timing alignment issues with 0.75 scaling factor
- July 06, 2025. Extended timeline to full page height (6:00-23:30) with proper grid sizing
- July 06, 2025. **MAJOR FIX**: Resolved daily view appointment positioning using CSS Grid and exact HTML template calculations
- July 06, 2025. Restored full appointment management: drag-and-drop, create/delete, Google Calendar selection controls
- July 06, 2025. Implemented proper authentication handling for Google Calendar event updates
- July 06, 2025. **CALENDAR SELECTION FIX**: Fixed event loading and filtering with proper calendar legend showing SimplePractice, Google Calendar, and Personal checkboxes
- July 06, 2025. Implemented calendar filtering system with proper event-to-calendar ID mapping for Google Calendar events
- July 06, 2025. **EVENT PERSISTENCE FIX**: Fixed critical issue where Google Calendar fetch was overriding database events, ensuring events persist across page refreshes
- July 06, 2025. **WEEKLY ANALYTICS**: Updated weekly analytics to filter events strictly by current week date range, ensuring statistics reset properly each week
- July 06, 2025. **COMPREHENSIVE CALENDAR SYNC**: Expanded calendar sync to fetch ALL events from January 1, 2025 to current date with increased API limits (2500 events per calendar)
- July 06, 2025. **SIMPLEPRACTICE EVENT DETECTION**: Fixed recurring SimplePractice appointment detection and styling across daily, weekly, and calendar grid views using "Appointment" title pattern
- July 06, 2025. **TIMEZONE CORRECTION**: Fixed critical timezone handling issue where events were displaying 4 hours earlier than correct EST/EDT times by properly parsing UTC database timestamps as local time
- July 06, 2025. **EVENT DURATION FIX**: Resolved Blake call event duration display showing correct 50-minute duration instead of incorrect 30-minute slots
- July 07, 2025. **MONDAY APPOINTMENT DISPLAY FIX**: Resolved critical issue where Monday appointments weren't displaying in weekly view by fixing calendar selection initialization and setting default week view to July 7-13, 2025
- July 07, 2025. **COMPREHENSIVE REMARKABLE PRO OPTIMIZATION**: Implemented complete reMarkable Pro optimizations including:
  - Native resolution support (2160x1620, 229 PPI, 11.8" diagonal)
  - E-ink optimized PDF exports (weekly, daily, monthly) with exact dimensions (239x179mm landscape)
  - High-contrast color scheme and typography for e-ink readability
  - Stylus-optimized touch targets (44px minimum) and focus states
  - Performance optimizations for e-ink refresh rates
  - reMarkable Pro detection and automatic optimization application
  - Comprehensive export functionality with both standard and reMarkable-optimized PDFs
- July 07, 2025. **PDF EXPORT FORMATTING PERFECTED**: Fixed critical PDF formatting issues:
  - Resolved button functionality calling wrong export functions
  - Improved text readability with optimal font sizes (6px names, 5px times)
  - Automatic text cleanup: removes "Appointment" suffix and handles long titles
  - Enhanced multi-line text wrapping for better appointment name display
  - Proper time stamp positioning at bottom of appointment blocks
  - Optimized spacing and layout for professional, readable output
- July 07, 2025. **COMPREHENSIVE WEEKLY GRID ENHANCEMENT**: Implemented professional weekly layout matching user template requirements:
  - A3 landscape format (1190x842 points) accommodating full 06:00-23:30 time range
  - Dynamic slot height calculation (720 points ÷ 35 slots = 20 points per 30-minute slot)
  - Horizontal grid lines extending across entire week for :30 minute slots with light gray background
  - Solid hour separation lines (2pt thickness, dark gray) across entire week for top-of-hour differentiation
  - Font size hierarchy: 11pt bold for hour labels, 8pt normal for :30 labels
  - Perfect appointment positioning using slot index calculation with light blue highlighting
- July 07, 2025. **HEADER SCALING OPTIMIZATION**: Final refinement of PDF header proportions:
  - Reduced title font from 20pt to 14pt for better visual balance
  - Adjusted week date font from 14pt to 12pt for optimal proportion
  - Header now properly scaled to match the rest of the layout
  - **PROJECT MILESTONE ACHIEVED**: Professional-grade PDF export system completed with user-approved formatting
- July 07, 2025. **AUTHENTICATION SYSTEM DIAGNOSIS & ENHANCEMENT**: Comprehensive session management improvements:
  - Identified and documented session persistence issue where each request created new session ID
  - Enhanced session configuration for development environment compatibility
  - Added comprehensive debugging middleware for authentication flow tracking
  - Improved passport serialization/deserialization with error handling
  - Secured events endpoint with proper user validation and development fallbacks
  - Google OAuth configuration confirmed working (credentials present, API calls successful)
  - Session debugging shows authentication infrastructure is functional but requires session store fixes
- July 08, 2025. **PDF EXPORT RENDERING OPTIMIZATION**: Major improvements to PDF generation quality and layout:
  - Upgraded from US Letter to A3 landscape format (1190x842 points) for enhanced visibility and professional appearance
  - Fixed critical event positioning and time slot alignment issues that caused overlapping appointments
  - Enhanced header proportions with larger fonts (20pt title, 14pt week info) optimized for A3 dimensions
  - Improved legend positioning with centered horizontal layout and proper item spacing
  - Implemented better event styling with distinct visual differentiation (SimplePractice: light gray + blue border, Google Calendar: light green + green border)
  - Enhanced grid structure with alternating half-hour slot backgrounds and stronger hour boundary lines
  - Improved text readability with larger fonts (8pt event names, 6pt times) and better spacing
  - **RESULT**: Professional-grade PDF exports now match user expectations with clean, readable layout and proper event positioning

## User Preferences

Preferred communication style: Simple, everyday language.