# Database Setup Instructions

This document explains how to set up the database for the Peer Assessment application.

## Prerequisites

- MySQL Server installed and running
- MySQL client (MySQL Workbench, CLI, etc.)
- Database administrator privileges

## Setup Steps

1. **Create the database:**

```sql
CREATE DATABASE IF NOT EXISTS peer_evaluation;
USE peer_evaluation;
```

2. **Import the schema:**

Execute the `schema.sql` file to create all required tables:

```bash
mysql -u root -p peer_evaluation < schema.sql
```

Or use your MySQL client to run the script.

3. **Set up triggers (optional but recommended):**

Due to MySQL's DELIMITER handling in scripts, it's best to run the trigger file separately:

```bash
mysql -u root -p peer_evaluation < triggers.sql
```

If you encounter errors with the trigger file, you may need to execute each trigger separately
in your MySQL client.

4. **Update environment variables:**

Ensure the `.env` file contains the correct MySQL connection details:

