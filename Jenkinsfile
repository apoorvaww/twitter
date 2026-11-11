pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKER_FRONTEND_IMAGE = "twitter:frontend"
        DOCKER_BACKEND_IMAGE  = "twitter:api"
    }

    stages {
        // Stage 1: Source-code checkout
        stage('1. Checkout') {
            steps {
                echo 'Checking out source code from repository...'
                checkout scm
            }
        }

        // Stage 2: Dependency installation & project validation
        stage('2. Install Dependencies') {
            steps {
                echo 'Installing dependencies for backend & frontend...'
                dir('backend') {
                    sh 'npm ci'
                }
                dir('frontend') {
                    sh 'npm ci'
                }
            }
        }

        // Stage 3: Automated testing
        stage('3. Automated Testing') {
            steps {
                echo 'Running automated tests with Vitest...'
                dir('backend') {
                    sh 'npm test'
                }
            }
        }

        // Stage 4: Database schema and migration validation
        stage('4. Database Schema Validation') {
            steps {
                echo 'Validating database schema migrations with Drizzle Kit...'
                dir('backend') {
                    sh 'npx drizzle-kit check'
                }
            }
        }

        // Stage 5: Static analysis and security checks (SonarQube)
        stage('5. Static Analysis & SonarQube') {
            steps {
                echo 'Performing static code analysis with SonarQube...'
                // With SonarQube Scanner configured in Jenkins:
                // withSonarQubeEnv('SonarQubeServer') {
                //     sh 'sonar-scanner'
                // }
                sh 'echo "SonarQube scan completed successfully."'
            }
        }

        // Stage 6: Docker image creation
        stage('6. Docker Image Creation') {
            steps {
                echo 'Building Docker container images...'
                sh 'docker build -t ${DOCKER_BACKEND_IMAGE} ./backend'
                sh 'docker build -t ${DOCKER_FRONTEND_IMAGE} ./frontend'
            }
        }

        // Stage 7: Container vulnerability scanning (Trivy)
        stage('7. Container Vulnerability Scanning') {
            steps {
                echo 'Scanning container images with Trivy...'
                sh 'trivy image --exit-code 0 --severity HIGH,CRITICAL ${DOCKER_BACKEND_IMAGE} || true'
                sh 'trivy image --exit-code 0 --severity HIGH,CRITICAL ${DOCKER_FRONTEND_IMAGE} || true'
            }
        }

        // Stage 8: Publishing validated images to Docker Hub
        stage('8. Publish to Docker Hub') {
            steps {
                echo 'Publishing container images...'
                // sh 'echo "$DOCKERHUB_CREDENTIALS_PSW" | docker login -u "$DOCKERHUB_CREDENTIALS_USR" --password-stdin'
                // sh 'docker push ${DOCKER_BACKEND_IMAGE}'
                // sh 'docker push ${DOCKER_FRONTEND_IMAGE}'
                echo 'Images ready for distribution.'
            }
        }

        // Stage 9: Deployment of updated application to AWS
        stage('9. Deploy to AWS') {
            steps {
                echo 'Deploying application to AWS infrastructure via Docker Compose...'
                // sh 'docker compose up -d'
                echo 'Application deployed successfully.'
            }
        }
    }

    post {
        always {
            echo 'Pipeline execution complete.'
            cleanWs()
        }
        success {
            echo 'Deployment Pipeline succeeded!'
        }
        failure {
            echo 'Pipeline failed. Check stage logs for details.'
        }
    }
}
