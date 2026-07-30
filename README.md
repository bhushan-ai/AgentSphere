# 🤖 AgentSphere Backend

![Node.js](https://img.shields.io/badge/Node.js-20+-green)
![Express](https://img.shields.io/badge/Express.js-Backend-black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-336791)
![License](https://img.shields.io/badge/License-MIT-blue)

> A production-ready, scalable backend for building AI-powered applications with multi-tenant workspaces, role-based access control, and an extensible architecture for AI agents, knowledge bases, and multiple LLM providers.

---

# 📖 Overview

AgentSphere Backend is a modern backend built using **Node.js**, **Express.js**, **TypeScript**, **Prisma ORM**, and **PostgreSQL**.

The project follows a **multi-tenant architecture**, allowing organizations to manage their own workspaces, members, and AI resources while keeping data securely isolated between tenants.

It is designed with scalability in mind and provides a strong foundation for building AI-powered SaaS applications.

---

# 📑 Table of Contents

- Overview
- Features
- Architecture
- Database Design
- Tech Stack
- API Endpoints
- Installation
- Environment Variables
- Folder Structure
- Roadmap
- Contributing
- License

---

# ✨ Current Features

## 🔐 Authentication

- User Registration
- Secure Login
- JWT Authentication
- Access & Refresh Tokens
- HttpOnly Cookie Authentication
- Password Hashing using bcrypt
- Protected Routes

---

## 🏢 Workspace Management

- Create Workspace
- Retrieve User Workspaces
- Multi-Tenant Workspace Architecture
- Workspace Ownership

---

## 👥 Team Management

- Invite Existing Users
- Workspace Membership
- Prevent Duplicate Members
- Member Validation

---

## 🔒 Role-Based Access Control (RBAC)

Supported Roles

- OWNER
- ADMIN
- MEMBER

### OWNER

- Full Workspace Management
- Invite Members
- Manage Roles
- Create AI Agents

### ADMIN

- Invite Members
- Manage AI Agents

### MEMBER

- Access Workspace Resources

---

# 🏗️ Architecture

```text
                    Client
                       │
                       ▼
                Express REST API
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
 Authentication   Workspace      AI Services
        │              │
        └──────────────┼──────────────┘
                       ▼
                  PostgreSQL
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
      Redis         BullMQ      Vector Database
                       │
                       ▼
                  LLM Providers
```

---

# 🗄️ Database Design

```text
User
 │
 └──────────────<
                │
        WorkspaceMember
                │
        >──────────────
                │
          Workspace
                │
                ▼
             AI Agent
                │
       ┌────────┴────────┐
       ▼                 ▼
 Conversation      Knowledge Base
       │                 │
       ▼                 ▼
    Messages         Documents
```

---

# 📦 Database Schema

## User

```text
id
name
email
password
createdAt
updatedAt
```

---

## Workspace

```text
id
name
ownerId
createdAt
updatedAt
```

---

## Workspace Member

```text
id
workspaceId
userId
role
createdAt
```

---

## AI Agent (Planned)

```text
id
workspaceId
name
description
provider
model
systemPrompt
temperature
createdAt
```

---

## Conversation (Planned)

```text
id
agentId
title
createdAt
```

---

## Message (Planned)

```text
id
conversationId
content
role
createdAt
```

---

## Knowledge Base (Planned)

```text
id
agentId
title
createdAt
```

---

## Document (Planned)

```text
id
knowledgeBaseId
fileName
fileUrl
status
fileSize
createdAt
```

---

# ⚙️ Tech Stack

## Backend

- Node.js
- Express.js
- TypeScript

## Database

- PostgreSQL
- Prisma ORM

## Authentication

- JWT
- bcrypt
- Cookie Parser

## Validation

- Zod

## Future Integrations

- Redis
- BullMQ
- AWS S3
- Cloudinary
- OpenAI
- Anthropic
- Google Gemini
- Groq
- OpenRouter
- Ollama
- Pinecone
- Qdrant
- Weaviate

---

# 📂 Folder Structure

```text
src
│
├── config/
├── controllers/
├── middleware/
├── routes/
├── services/
├── repositories/
├── validators/
├── generated/
├── prisma/
├── utils/
├── types/
└── app.ts

prisma
│
├── migrations/
└── schema.prisma
```

---

# 🔐 Authentication Flow

```text
Register
     │
     ▼
Login
     │
     ▼
Generate Access Token
Generate Refresh Token
     │
     ▼
HttpOnly Cookies
     │
     ▼
Protected Routes
```

---

# 🏢 Workspace Flow

```text
User
   │
   ▼
Create Workspace
   │
   ▼
Workspace Created
   │
   ▼
Creator becomes OWNER
   │
   ▼
Invite Members
   │
   ▼
WorkspaceMember Created
```

---

# 🌐 API Endpoints

## Authentication

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Register User |
| POST | `/api/auth/login` | Login User |
| POST | `/api/auth/logout` | Logout User |
| POST | `/api/auth/refresh` | Refresh Access Token |

---

## Workspace

| Method | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/workspaces` | Create Workspace |
| GET | `/api/workspaces` | Get User Workspaces |
| POST | `/api/workspaces/:workspaceId/invite` | Invite User |

---

# 🔒 Security Features

- JWT Authentication
- Refresh Token Authentication
- HttpOnly Cookies
- Password Hashing
- Protected Routes
- Role-Based Authorization
- Multi-Tenant Data Isolation
- Transaction-Based Database Operations

---

# ⚙️ Environment Variables

Create a `.env` file.

```env
DATABASE_URL=

JWT_ACCESS_SECRET=

JWT_REFRESH_SECRET=

PORT=5000

NODE_ENV=development
```

---

# 🚀 Getting Started

Clone the repository

```bash
git clone https://github.com/bhushan-ai/AgentSphere.git
```

Move into the project

```bash
cd AgentSphere
```

Install dependencies

```bash
npm install
```

Generate Prisma Client

```bash
npx prisma generate
```

Run database migrations

```bash
npx prisma migrate dev
```

Start the development server

```bash
npm run dev
```

---

# 💡 Why AgentSphere?

Modern AI applications require much more than simply calling an LLM API.

They need:

- Authentication
- Multi-Tenant Organizations
- Team Collaboration
- Role-Based Access Control
- Conversation Management
- Knowledge Base Management
- Scalable AI Infrastructure

AgentSphere provides these building blocks while remaining provider-agnostic, making it easy to integrate with multiple AI providers and extend the platform as requirements grow.

---

# 📌 Design Principles

- Multi-Tenant Architecture
- Clean Code Architecture
- RESTful API Design
- Provider-Agnostic AI Layer
- Transaction-Based Operations
- Secure Authentication
- Role-Based Access Control
- Scalable Database Design
- Extensible Service Layer

---

# 🛣️ Roadmap

- [ ] AI Agent Management
- [ ] Conversation Management
- [ ] Knowledge Base Management
- [ ] Document Upload
- [ ] Retrieval-Augmented Generation (RAG)
- [ ] Vector Database Integration
- [ ] Semantic Search
- [ ] Multiple LLM Providers
- [ ] Streaming AI Responses
- [ ] Redis Caching
- [ ] BullMQ Background Workers
- [ ] API Keys
- [ ] Usage Analytics
- [ ] Docker Support
- [ ] AWS Deployment
- [ ] Team Collaboration
- [ ] Webhooks
- [ ] Agent Templates
- [ ] Function Calling
- [ ] Memory Management

---

# 🤝 Contributing

Contributions, feature requests, and suggestions are always welcome.

1. Fork the repository
2. Create a new branch

```bash
git checkout -b feature/your-feature
```

3. Commit your changes

```bash
git commit -m "Add your feature"
```

4. Push to your branch

```bash
git push origin feature/your-feature
```

5. Open a Pull Request

---

# 📜 License

This project is licensed under the **MIT License**.

---

# 👨‍💻 Author

**Bhushan Ingole**

- GitHub: https://github.com/bhushan-ai
- LinkedIn: https://www.linkedin.com/in/bhushan-ai/

---

## ⭐ Support

If you found this project useful, consider giving it a **⭐ on GitHub**. It helps others discover the project and motivates future development.