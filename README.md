# CAD Part Generator

A Supabase-powered CAD Part Generator application.

## Local Development with Supabase

This project has been initialized with a local Supabase configuration. 

### Prerequisites

- [Docker](https://www.docker.com/) (required to run the local Supabase stack)
- Node.js & npm (for running the Supabase CLI)

### Starting the Local Supabase Stack

To start the local database, auth, and storage services:

```bash
npx supabase start
```

This will spin up the local Supabase containers and print out your local credentials, API keys, and the URL for the local Studio dashboard (usually at `http://localhost:54321`).

### Useful Commands

- **Stop the local services:**
  ```bash
  npx supabase stop
  ```

- **Check status of services:**
  ```bash
  npx supabase status
  ```

- **Create a new database migration:**
  ```bash
  npx supabase migration new <migration_name>
  ```

- **Reset database to clean state:**
  ```bash
  npx supabase db reset
  ```
