# Developer Monitoring Extension

## Project Overview
A specialized VS Code extension designed to track, analyze, and visualize developer productivity and coding patterns. This tool aims to provide actionable insights into coding behavior, session duration, and workflow bottlenecks to help developers optimize their performance.

## System Architecture
The architecture follows a modular approach to ensure performance efficiency and minimal latency during coding sessions:

*   **Client-Side (VS Code Extension):** Developed using TypeScript and the VS Code Extension API. It hooks into workspace events (file changes, active editor tracking, focus time) to collect telemetry data.
*   **Data Transport:** Efficiently buffers and transmits data logs to the backend service.
*   **Backend & Storage:** Utilizes a scalable setup (e.g., Prisma and Supabase) to manage, persist, and query historical activity data.

## Tech Stack
*   **Editor:** VS Code (Extension API)
*   **Language:** TypeScript
*   **Backend/API:** Node.js, Prisma ORM
*   **Database:** Supabase (PostgreSQL)

## Key Features
*   **Activity Tracking:** Real-time monitoring of file interactions and coding frequency.
*   **Performance Metrics:** Automated generation of session reports and productivity patterns.
*   **Custom Insights:** Integration with user-defined workflow goals.

## Data Flow
1.  **Event Capture:** The extension listens for specific VS Code events (e.g., `onDidSaveTextDocument`, `onDidChangeActiveTextEditor`).
2.  **Normalization:** Captured raw data is normalized into a structured JSON format.
3.  **Persistence:** Data is sent via API to the database for long-term storage and analytical processing.

## Setup & Installation
1.  Clone the repository.
2.  Run `npm install` to install dependencies.
3.  Press `F5` in VS Code to launch the Extension Development Host.
4.  Configure the environment variables for your Supabase instance.
