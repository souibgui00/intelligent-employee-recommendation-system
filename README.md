# Intelligent Employee Recommendation System

## Overview
This project was developed as part of the PIDEV – 3rd Year Engineering Program at **Esprit School of Engineering** (Academic Year 2025–2026).
It consists of an advanced, full-stack HR platform that allows human resources personnel to manage employee activities and provides intelligent, personalized skill and activity recommendations using Natural Language Processing (NLP) and Machine Learning.

## Features
- **Role-Based Access Control:** Distinct interfaces and permissions for HR Administrators and Employees.
- **Intelligent Recommendations:** AI-driven activity suggestions based on employee profiles, skills, and past activities.
- **Real-Time Notifications:** Instant alerts for new activities and updates using WebSockets.
- **Data Visualization:** Interactive dashboards displaying employee performance metrics and skill progression.
- **Secure Authentication:** Robust security with JSON Web Tokens (JWT).

## Tech Stack

### Frontend
- React.js
- Vite
- Tailwind CSS
- Zod (Data Validation)
- Recharts (Data Visualization)

### Backend
- Node.js
- NestJS
- MongoDB (Mongoose)
- Socket.io (Real-time WebSockets)

### AI / NLP Service
- Python
- Scikit-Learn (Random Forest Classifier)
- Natural Language Processing (NLP)

## Architecture
The application is built on a modern, microservices-oriented architecture:
- **Frontend App:** The client-facing portal providing an intuitive UI for HR and employees.
- **Backend API:** The core server handling business logic, authentication, and database management.
- **NLP Service:** A dedicated Python microservice that processes recommendation logic using a trained Random Forest model.

## Contributors
- Souibgui Mohamed Amine
- Mrabet Sarra 
- Trabelsi Montaha
- Guedhami Montaha
- Gaaloul Mohamed

## Academic Context
Developed at **Esprit School of Engineering – Tunisia**
PIDEV – 4TWIN4 | 2025–2026

## Getting Started

### Prerequisites
- Node.js (v20.x or higher)
- Python (3.9 or higher)
- MongoDB instance running locally or on the cloud

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/souibgui00/Esprit-PIFullstackJS-4TWIN4-2026-IntelligentEmployeeRecommendationSystem.git
