# Grace & Truth Church App - Java 21 Spring Boot Backend

This directory contains the complete **Java 21 + Spring Boot 3 + Spring Data JPA + PostgreSQL** backend for the Church Application.

## Why Java in this Directory?
The live Google AI Studio cloud sandbox uses a Node.js Linux runtime to serve the browser iframe preview. Because JDK 21 is not installed in the browser preview container, this complete Java 21 Spring Boot project is included here so you can run, build, or deploy it with your preferred Java tooling.

---

## 1. Quick Start (Run Locally)

### Prerequisites
- **JDK 21** installed (`java -version`)
- **Maven 3.9+** installed (`mvn -version`)
- **PostgreSQL** instance running (local or cloud like Neon, Supabase, Cloud SQL)

### Setup Database & Run
1. Update `src/main/resources/application.properties` with your PostgreSQL credentials:
   ```properties
   spring.datasource.url=jdbc:postgresql://localhost:5432/churchdb
   spring.datasource.username=postgres
   spring.datasource.password=your_password
   ```

2. Run the application:
   ```bash
   mvn clean spring-boot:run
   ```
   The API will start on `http://localhost:8080`.

---

## 2. Where to Host Java 21 for Free

Here are the best free hosting options for Java 21 + Spring Boot:

1. **Google Cloud Run (Recommended)**:
   - **Free Tier**: 2 million requests/month, 360,000 vCPU-seconds, and 180,000 GiB-seconds free every month.
   - Deploy using a simple `Dockerfile` containing `eclipse-temurin:21-jre-alpine`.
   
2. **Render.com**:
   - Offers a free tier for web services. Connect your GitHub repository, choose Docker, and deploy.

3. **Railway.app / Fly.io**:
   - Provides free monthly hobby tier credits for containerized Spring Boot apps.

4. **Free PostgreSQL Cloud Databases**:
   - **Neon.tech**: Free serverless PostgreSQL (0.5 GB storage, instant branching).
   - **Supabase**: Free tier PostgreSQL database (500 MB storage).

---

## 3. Comparison: Java Spring Boot vs. Node.js

If you're wondering how the Node.js code in `server.ts` maps to your familiar Java concepts:

| Spring Boot 3 (Java 21) | Node.js + Express (TypeScript) | Purpose |
| :--- | :--- | :--- |
| `@RestController` | `app.use(express.json())` | REST API handling |
| `@GetMapping("/api/events")` | `app.get("/api/events", ...)` | Route handler |
| `@Entity` (`ChurchEvent.java`) | `pgTable('events', ...)` in `schema.ts` | Database table model |
| `JpaRepository<ChurchEvent, Long>` | `db.select().from(events)` (Drizzle ORM) | Query execution |
| `HikariCP` connection pool | `pg.Pool` connection pool | Managing DB connections |
| `application.properties` | `.env` and environment variables | Configuration |
