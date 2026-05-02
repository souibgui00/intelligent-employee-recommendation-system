# Intelligent Employee Recommendation System

## Overview
This project was developed as part of the PIDEV – 3rd Year Engineering Program at **Esprit School of Engineering** (Academic Year 2025–2026).
It consists of a full-stack web application that allows HR personnel to manage employee activities and provides intelligent recommendations using NLP.

## Features
- Role-based Access Control (HR vs Employee)
- Intelligent Activity Recommendation based on employee profiles
- Real-time Notifications via Socket.io
- Data visualization for employee performance and skills
- Secure Authentication with JWT

## Tech Stack
### Frontend
- React.js
- Vite
- Tailwind CSS
- Zod (Validation)
- Recharts (Data Visualization)
### Backend
- Node.js
- NestJS
- MongoDB (Mongoose)
- Socket.io
### AI / NLP Service
- Python
- Scikit-Learn (Random Forest)

## Architecture
Microservices-oriented architecture:
- **Frontend App**: Client-facing portal for HR and employees.
- **Backend API**: Core business logic and database management.
- **NLP Service**: Python-based machine learning model for processing recommendation logic.

## Contributors
- [Your Name]
- [Teammate Name]

## Academic Context
Developed at **Esprit School of Engineering – Tunisia**
PIDEV – [Your Class, e.g., 3A10] | 2025–2026

## Getting Started
### Prerequisites
- Node.js (v20.x)
- Python (3.9+)
- MongoDB instance

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/Esprit-PIDEV-[Classe]-2026-HRRecommender.git
   ```
2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

### Running the App
1. Start the backend:
   ```bash
   cd backend
   npm run start:dev
   ```
2. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

## Acknowledgments
- Esprit School of Engineering
- Mentors and Supervisors
