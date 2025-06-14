
# Idea Management Platform

A comprehensive web application for managing, tracking, and collaborating on ideas with integrated project management capabilities.

## 🚀 Live Demo

**URL**: 

## 📋 Features Overview

### 🔐 Authentication & User Management
- **Secure Authentication**: Email/password authentication powered by Supabase
- **User Profiles**: Automatic profile creation with customizable user information
- **Role-Based Access Control**: Admin and regular user roles with different permissions
- **User Avatar Integration**: Profile pictures and user identification

### 💡 Idea Management
- **Create Ideas**: Rich idea creation form with multiple fields
- **Idea Details**: Comprehensive idea information including:
  - Title and detailed descriptions
  - Business unit categorization
  - Technology stack tagging
  - Custom tags and labels
  - Priority levels (Low, Medium, High, Critical)
  - Status tracking (Draft, Under Review, Approved, In Progress, Completed, Rejected)
  - Progress percentage tracking
  - Timeline management (start/end dates)

### 📊 Project Tracking & Progress
- **Status Management**: Visual status badges with color coding
- **Priority System**: Priority-based organization and filtering
- **Progress Tracking**: Percentage-based progress indicators with visual progress bars
- **Timeline Tracking**: Expected start and end date management
- **Activity Logging**: Comprehensive audit trail of all idea changes

### 👥 Collaboration & Team Management
- **Volunteer System**: 
  - Users can volunteer to work on ideas
  - Idea creators can manage volunteer applications
  - Accept/reject volunteer requests
  - View volunteer profiles and skills
- **Team Assignment**: Assign specific users to ideas
- **Comments System**: 
  - Threaded discussions on ideas
  - Real-time comment notifications
  - Comment moderation capabilities
- **Idea Forwarding**: Forward ideas to specific departments or teams

### 🔔 Notification System
- **Email Subscriptions**: Subscribe to idea updates and notifications
- **Real-time Notifications**: In-app notification center
- **Customizable Preferences**: Choose notification types (status changes, comments, updates)
- **Automatic Notifications**: Trigger notifications for:
  - Status changes
  - Progress updates
  - New comments
  - Volunteer applications

### 🔍 Advanced Filtering & Search
- **Multi-criteria Filtering**:
  - Filter by status, priority, business unit
  - Technology stack filtering
  - Date range filtering
  - Creator/assignee filtering
- **Search Functionality**: Full-text search across ideas
- **Sorting Options**: Sort by creation date, priority, progress, etc.

### 🔗 External Integrations
- **Partially implemented GitLab Integration**: 
  - Connect ideas to GitLab projects
  - Automatic progress tracking from GitLab issues
  - Sync issue completion status
  - Project milestone tracking

### 🎨 User Interface & Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Theme**: Theme toggle with system preference detection
- **Modern UI Components**: Built with shadcn/ui component library
- **Interactive Elements**: 
  - Like/unlike ideas
  - Real-time interaction feedback
  - Smooth animations and transitions
- **Accessibility**: WCAG compliant design patterns

### 📈 Analytics & Reporting
- **Idea Metrics**: Track likes, comments, and engagement
- **Progress Analytics**: Visual progress tracking and reporting

### 🛡️ Security & Privacy
- **Row Level Security (RLS)**: Database-level security policies
- **Data Privacy**: Users only see data they're authorized to view
- **Secure API**: All API calls authenticated and authorized

## 🛠️ Technology Stack

### Frontend
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Full type safety and better developer experience
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Modern component library
- **React Router**: Client-side routing
- **React Query**: Data fetching and state management
- **Lucide React**: Beautiful icon library

### Backend & Database
- **Supabase**: Backend-as-a-Service platform
- **PostgreSQL**: Robust relational database
- **Row Level Security**: Database-level security policies
- **Real-time Subscriptions**: Live data updates
- **Edge Functions**: Serverless functions for custom logic

### Development Tools
- **ESLint**: Code linting and quality
- **TypeScript**: Static type checking
- **PostCSS**: CSS processing
- **Date-fns**: Date manipulation library

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - The project uses Supabase for backend services, so for local development, you may need to configure Supabase settings

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Navigate to `http://localhost:5173`
   - The application will hot-reload as you make changes

### Building for Production

```bash
npm run build
```

This creates a `dist` folder with the production build.

## 📝 Usage Guide

### Creating Your First Idea
1. Sign up or log in to the platform
2. Click "Create New Idea" button
3. Fill in the idea details:
   - Title and description
   - Select business unit
   - Add relevant tech stack
   - Set priority level
   - Add custom tags
4. Submit the idea for review

### Managing Ideas
- **View Ideas**: Browse all ideas on the main dashboard
- **Filter & Search**: Use filters to find specific ideas
- **Like Ideas**: Show support for ideas you find interesting
- **Comment**: Engage in discussions about ideas
- **Subscribe**: Get notified about idea updates

### Volunteering
- **Browse Ideas**: Find ideas you'd like to work on
- **Apply to Volunteer**: Click "Apply to Volunteer" on interesting ideas
- **Manage Applications**: Track your volunteer applications
- **Collaborate**: Work with other volunteers and idea creators

### Admin Features
- **User Management**: Manage user roles and permissions
- **Idea Moderation**: Review and moderate submitted ideas
- **System Configuration**: Configure platform settings
- **Analytics**: View platform usage and engagement metrics

### Manual Deployment Options

#### Netlify
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy automatically on git push

#### Vercel
1. Import your GitHub repository to Vercel
2. Configure build settings (auto-detected)
3. Deploy with automatic CI/CD

#### Self-Hosted
1. Run `npm run build`
2. Serve the `dist` folder with any static file server
3. Configure environment variables in your hosting environment

## 🔧 Configuration

### Environment Variables
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key

### Database Configuration
The application uses Supabase with the following main tables:
- `profiles`: User profile information
- `ideas`: Core idea data
- `comments`: Idea comments and discussions
- `likes`: User likes on ideas
- `volunteers`: Volunteer applications
- `idea_subscriptions`: Email subscription preferences
- `notifications`: User notifications
- `idea_activity`: Activity audit trail

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes
4. Test thoroughly
5. Commit: `git commit -m 'Add new feature'`
6. Push: `git push origin feature/new-feature`
7. Create a Pull Request

### Code Style
- Follow TypeScript best practices
- Use functional components with hooks
- Follow the existing component structure
- Write meaningful commit messages
- Add comments for complex logic

### Testing
- Test all new features thoroughly
- Ensure responsive design works on all devices
- Verify authentication and authorization
- Test database operations

## 🐛 Troubleshooting

### Common Issues
1. **Authentication Issues**: Verify Supabase configuration
2. **Database Errors**: Check RLS policies and permissions
3. **Build Errors**: Ensure all dependencies are installed
4. **Deployment Issues**: Verify environment variables

### Getting Help
- Check the console for error messages
- Review the database logs in Supabase
- Create an issue in the GitHub repository

## 🙏 Acknowledgments

- Built with the help of [Lovable](https://lovable.dev) - AI-powered web development
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Backend powered by [Supabase](https://supabase.com)
- Icons by [Lucide](https://lucide.dev)

---
