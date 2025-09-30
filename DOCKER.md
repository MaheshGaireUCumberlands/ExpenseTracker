# 🐳 Docker Commands Reference

## Development Environment

### Start development environment with Docker Compose
```bash
docker-compose up
```

### Start in detached mode
```bash
docker-compose up -d
```

### Stop development environment
```bash
docker-compose down
```

### View logs
```bash
docker-compose logs -f frontend
docker-compose logs -f backend
```

## Production Environment

### Build production image
```bash
docker build -t angular-expense-tracker:latest .
```

### Run production container
```bash
docker run -p 8080:80 angular-expense-tracker:latest
```

### Start production environment with Docker Compose
```bash
docker-compose -f docker-compose.prod.yml up
```

### Build and run production
```bash
docker-compose -f docker-compose.prod.yml up --build
```

## Useful Docker Commands

### Clean up containers and images
```bash
# Remove all stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove everything (use with caution)
docker system prune -a
```

### Inspect running containers
```bash
# List running containers
docker ps

# Execute commands in running container
docker exec -it expense-tracker-frontend sh

# View container logs
docker logs expense-tracker-frontend
```

### Health checks
```bash
# Check container health
docker inspect expense-tracker-frontend | grep -A 10 Health

# Test health endpoint
curl http://localhost:8080/health
```

## Environment Variables

Create `.env` file for environment-specific configurations:

```env
NODE_ENV=production
API_URL=http://localhost:3000
PORT=8080
```

## Production Deployment

### Push to Container Registry
```bash
# Build for multiple platforms
docker buildx build --platform linux/amd64,linux/arm64 -t ghcr.io/username/angular-expense-tracker:latest --push .

# Tag and push
docker tag angular-expense-tracker:latest ghcr.io/username/angular-expense-tracker:latest
docker push ghcr.io/username/angular-expense-tracker:latest
```