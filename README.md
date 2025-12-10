# Idoneo

Platform for competitive exams preparation (Concorsi Pubblici).
Migrated from Next.js to **Vite + React**.

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Set up environment variables:
    - Copy `.env.local.example` (if exists) or create `.env.local`
    - Add:
      ```
      VITE_SUPABASE_URL=your_project_url
      VITE_SUPABASE_ANON_KEY=your_anon_key
      ```

### Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

- **`src/app`**: Main application pages (Client-side routing).
  - `admin/`: Admin Dashboard (protected routes).
  - `concorsi/`: Public flow for browsing contests.
  - `quiz/`: Quiz engine and simulation logic.
- **`src/components`**: Reusable UI components.
- **`src/lib`**: Utilities and Supabase client.
- **`src/App.tsx`**: Main router configuration.

## Admin Dashboard

Access the admin panel at `/admin`.
Features:
- Manage Structure (Categories > Roles)
- Manage Quizzes (Contests > Subjects)
- Manage Questions (Add, Edit, Image Upload)
- Bulk Import via CSV

## Deployment

Build the application for production:

```bash
npm run build
```

Preview the build:

```bash
npm run preview
```
