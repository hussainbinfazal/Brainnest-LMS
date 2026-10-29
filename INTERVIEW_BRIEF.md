# Brainnest LMS — Interview Video Brief

*Personal preparation notes; not product or scale claims.*

## 1. The project in one sentence

Brainnest is a full-stack learning platform where instructors publish structured courses, learners purchase and complete them, and asynchronous services handle work such as certificates and content ingestion.

## 2. Product story

- **Instructor:** create and manage courses, sections, lessons, media, topics, and course details.
- **Learner:** discover courses, purchase access, track lesson completion, and receive a certificate on completion.
- **Platform:** supports course reviews, learner–instructor messaging, payment reconciliation, and background processing.

## 3. Architecture

This is a **pnpm TypeScript monorepo**:

- `apps/web` — Next.js App Router product UI and API routes.
- `apps/Chat` — Express chat/payment service with Socket.IO.
- `apps/Worker` — BullMQ workers for certificates, email, maintenance, progress, and ingestion jobs.
- `packages/shared` — MongoDB/Mongoose models, validation, Redis and server utilities shared across apps.
- `packages/payment` — Razorpay services, signature verification, and payment reconciliation.
- `packages/ai-service` — scraping, chunking, embeddings, vector search, and a retrieval-augmented generation (RAG) chain.

**Core stack:** Next.js, React, TypeScript, MongoDB, Mongoose, Redis, BullMQ, Socket.IO, Razorpay, Cloudinary, Zod, and LangChain.

## 4. Engineering highlights to explain

1. **Reliable lesson completion:** a unique upsert with `$setOnInsert` makes completion idempotent. Progress increments only for a newly completed lesson, avoiding duplicate counts on retries.
2. **Transactional course updates:** sections, lessons, and course metadata are synchronized in a MongoDB transaction. A document diff separates inserts, updates, and deletes; totals are recomputed from persisted lessons.
3. **Payment recovery:** HMAC signature verification authenticates payment events. A reconciliation flow repairs stuck orders and updates payment, enrollment, and course-access records transactionally.
4. **Asynchronous work:** BullMQ moves certificate generation and other slower tasks out of the learner-facing request path.
5. **Grounded AI retrieval:** the AI pipeline scrapes content, chunks it, embeds and indexes it, retrieves the top five relevant chunks, then instructs the model to answer only from that context.
6. **Shared contracts:** common TypeScript models and Zod schemas reduce drift between API inputs, application code, and database records.

## 5. Suggested 60-second introduction

> “I built Brainnest as a modular learning platform, not just a course catalogue. Instructors can structure courses into sections and lessons; learners can purchase a course, track progress, and earn a certificate when they finish. The system is a TypeScript monorepo: Next.js handles the product and APIs, MongoDB stores the learning domain, and Redis with BullMQ handles asynchronous jobs. A few engineering decisions I’m particularly proud of are making lesson completion idempotent, using transactions and document diffs for course updates, and reconciling payment events so a delayed webhook does not leave an order permanently stuck. I also built a separate RAG pipeline for grounded course-content retrieval.”

## 6. Demo order

1. Show an instructor course with its section/lesson hierarchy.
2. Show the learner purchase and course-access flow.
3. Mark a lesson complete; explain idempotency, progress, and certificate queuing.
4. If available, show the RAG flow and explain retrieval before generation.

## 7. Be precise in the interview

- Present AI/RAG as a **separate pipeline** unless demonstrating its end-to-end product integration.
- Explain the design and trade-offs you can defend; do not claim user counts, uptime, revenue, or performance numbers without evidence.
- Distinguish the implemented real-time messaging flow from durable message persistence if asked about chat storage.
