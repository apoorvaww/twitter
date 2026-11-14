
pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKER_FRONTEND_IMAGE = "apoorvaww/twitter-frontend:latest"
        DOCKER_BACKEND_IMAGE  = "apoorvaww/twitter-backend:latest"
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
                script {
                    def scannerHome = tool 'SonarScanner'

                    withSonarQubeEnv('SonarQube') {
                        bat """
                            "${scannerHome}\\bin\\sonar-scanner.bat" ^
                            -Dsonar.projectKey=twitter-ci-cd ^
                            -Dsonar.projectName=Twitter-CI-CD ^
                            -Dsonar.sources=backend,frontend ^
                            -Dsonar.exclusions=**/node_modules/**,**/dist/**,**/coverage/**
                        """
                    }
                }
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

                bat 'docker save -o backend-image.tar %DOCKER_BACKEND_IMAGE%'

                bat 'docker run --rm -v "%CD%:/work" aquasec/trivy:0.76.2 image --input /work/backend-image.tar --severity HIGH,CRITICAL --exit-code 0'

                bat 'docker save -o frontend-image.tar %DOCKER_FRONTEND_IMAGE%'

                bat 'docker run --rm -v "%CD%:/work" aquasec/trivy:0.76.2 image --input /work/frontend-image.tar --severity HIGH,CRITICAL --exit-code 0'
            }
        }

        // Stage 8: Publish images to Docker Hub
        stage('8. Publish to Docker Hub') {
            steps {
                echo 'Authenticating with Docker Hub...'

                bat '''
                    powershell.exe -NoProfile -NonInteractive -Command "$env:DOCKERHUB_CREDENTIALS_PSW | docker login -u $env:DOCKERHUB_CREDENTIALS_USR --password-stdin"
                '''

                echo 'Pushing backend image...'
                bat 'docker push %DOCKER_BACKEND_IMAGE%'

                echo 'Pushing frontend image...'
                bat 'docker push %DOCKER_FRONTEND_IMAGE%'
            }
        }

        // Stage 9: AWS deployment
        stage('9. Deploy to AWS') {
            steps {
                echo 'AWS deployment will be configured after EC2 SSH setup.'
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
