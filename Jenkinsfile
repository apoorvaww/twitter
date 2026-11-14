
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

        // Stage 2: Dependency installation
        stage('2. Install Dependencies') {
            steps {
                echo 'Installing dependencies for backend & frontend...'

                dir('backend') {
                    bat 'npm ci'
                }

                dir('frontend') {
                    bat 'npm ci'
                }
            }
        }

        // Stage 3: Automated testing
        stage('3. Automated Testing') {
            steps {
                echo 'Running automated tests with Vitest...'

                dir('backend') {
                    bat 'npm test'
                }
            }
        }

        // Stage 4: Database schema validation
        stage('4. Database Schema Validation') {
            steps {
                echo 'Validating database schema migrations with Drizzle Kit...'

                dir('backend') {
                    bat 'npx drizzle-kit check'
                }
            }
        }

        // Stage 5: Static analysis and SonarQube
        stage('5. Static Analysis & SonarQube') {
            steps {
                echo 'Checking SonarQube configuration...'

                // Configure SonarQube before enabling the actual scan.
                // withSonarQubeEnv('SonarQubeServer') {
                //     bat 'sonar-scanner'
                // }

                echo 'SonarQube scan is currently not enabled.'
            }
        }

        // Stage 6: Docker image creation
        stage('6. Docker Image Creation') {
            steps {
                echo 'Building Docker container images...'

                bat 'docker build -t %DOCKER_BACKEND_IMAGE% ./backend'

                bat 'docker build -t %DOCKER_FRONTEND_IMAGE% ./frontend'
            }
        }

        // Stage 7: Container vulnerability scanning
        
        stage('7. Container Vulnerability Scanning') {
            steps {
                echo 'Scanning Docker images with Trivy...'

                // Export backend image
                bat 'docker save -o backend-image.tar %DOCKER_BACKEND_IMAGE%'

                // Scan backend image using the official Trivy container
                bat 'docker run --rm -v "%CD%:/work" aquasec/trivy:0.76.2 image --input /work/backend-image.tar --severity HIGH,CRITICAL --exit-code 0'

                // Export frontend image
                bat 'docker save -o frontend-image.tar %DOCKER_FRONTEND_IMAGE%'

                // Scan frontend image using the official Trivy container
                bat 'docker run --rm -v "%CD%:/work" aquasec/trivy:0.76.2 image --input /work/frontend-image.tar --severity HIGH,CRITICAL --exit-code 0'
            }
        }


        // Stage 8: Publish images to Docker Hub
        stage('8. Publish to Docker Hub') {
            steps {
                echo 'Checking Docker Hub publishing configuration...'

                // Enable these commands after configuring Docker Hub
                // bat 'echo %DOCKERHUB_CREDENTIALS_PSW% | docker login -u %DOCKERHUB_CREDENTIALS_USR% --password-stdin'
                // bat 'docker push %DOCKER_BACKEND_IMAGE%'
                // bat 'docker push %DOCKER_FRONTEND_IMAGE%'

                echo 'Docker Hub publishing is currently not enabled.'
            }
        }

        // Stage 9: AWS deployment
        stage('9. Deploy to AWS') {
            steps {
                echo 'Checking AWS deployment configuration...'

                // Enable after configuring the AWS deployment environment.
                // bat 'docker compose up -d'

                echo 'AWS deployment is currently not enabled.'
            }
        }
    }

    post {
        always {
            echo 'Pipeline execution complete.'
            cleanWs()
        }

        success {
            echo 'CI/CD Pipeline completed successfully!'
        }

        failure {
            echo 'Pipeline failed. Check stage logs for details.'
        }
    }
}
