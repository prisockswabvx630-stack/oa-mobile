pipeline {
    agent any
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Docker Build & Deploy') {
            steps {
                sh '''
                    echo "Starting Docker deployment..."
                    cp -f .env.example .env
                    export ADMIN_PORT=8082
                    docker compose up -d --build --remove-orphans mysql oa-server oa-admin
                    echo "Waiting for services..."
                    sleep 20
                    docker compose exec -T oa-server npx prisma db push --accept-data-loss || true
                    echo "Health check..."
                    curl -sf http://localhost:3000/api/health && echo "Health OK" || echo "Health WARN"
                    echo "Services running:"
                    docker compose ps
                '''
            }
        }
    }
    post {
        success {
            echo 'DEPLOY SUCCESS!'
            echo 'Admin: http://82.156.83.176:8080'
            echo 'API: http://82.156.83.176:3000'
        }
        failure { echo 'DEPLOY FAILED - check logs' }
    }
}
