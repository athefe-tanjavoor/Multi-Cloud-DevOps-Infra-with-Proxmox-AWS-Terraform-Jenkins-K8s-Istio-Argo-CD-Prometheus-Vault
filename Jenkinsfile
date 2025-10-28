pipeline {
    agent any

    environment {
        DOCKER_IMAGE          = "your-dockerhub-username/media-server" // Replace with your Docker Hub username
        CONTAINER_NAME        = "media-server-container"
        APP_PORT              = "5000"
        HOST_UPLOAD_PATH      = "/home/jenkins/uploads/media-server/uploads"
        CONTAINER_UPLOAD_PATH = "/app/uploads"
        DOCKERHUB_CREDENTIALS = "dockerhub-creds" // Jenkins credentials ID for Docker Hub
    }

    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main',
                    credentialsId: 'github-creds-multi-cloud', 
                    url: 'https://github.com/athefe-tanjavoor/Multi-Cloud-DevOps-Infra-with-Proxmox-AWS-Terraform-Jenkins-K8s-Istio-Argo-CD-Prometheus-Vault.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install --production'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t $DOCKER_IMAGE ."
            }
        }

        stage('Docker Login') {
            steps {
                withCredentials([usernamePassword(credentialsId: "$DOCKERHUB_CREDENTIALS", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                }
            }
        }

        stage('Push Docker Image') {
            steps {
                sh "docker push $DOCKER_IMAGE"
            }
        }

        stage('Stop Old Container') {
            steps {
                sh """
                echo "Stopping old container if exists..."
                docker stop $CONTAINER_NAME || true
                docker rm $CONTAINER_NAME || true
                """
            }
        }

        stage('Ensure Host Upload Folder') {
            steps {
                sh """
                echo "Ensuring uploads folder exists on host..."
                mkdir -p $HOST_UPLOAD_PATH
                """
            }
        }

        stage('Run Container') {
            steps {
                sh """
                echo "Running new container..."
                docker run -d \
                    --name $CONTAINER_NAME \
                    --restart always \
                    -p $APP_PORT:$APP_PORT \
                    -v $HOST_UPLOAD_PATH:$CONTAINER_UPLOAD_PATH \
                    --user 1000:1000 \
                    $DOCKER_IMAGE
                """
            }
        }

        stage('Health Check') {
            steps {
                sh """
                echo "Checking if container is running..."
                retries=5
                until [ "\$(docker inspect -f '{{.State.Running}}' $CONTAINER_NAME)" = "true" ] || [ \$retries -le 0 ]; do
                    echo "Waiting for container to start..."
                    sleep 5
                    retries=\$((retries-1))
                done

                if [ \$retries -le 0 ]; then
                    echo "❌ Container failed to start!"
                    docker logs $CONTAINER_NAME
                    exit 1
                fi
                echo "✅ Container is running."
                """
            }
        }

        stage('Verify Upload Folder') {
            steps {
                sh """
                echo "Verifying uploads folder..."
                if [ -d "$HOST_UPLOAD_PATH" ]; then
                    echo "✅ Uploads folder exists on host."
                else
                    echo "❌ Uploads folder does NOT exist!"
                    exit 1
                fi
                """
            }
        }
    }

    post {
        success {
            echo "✅ Media-server deployed successfully at http://localhost:$APP_PORT/"
        }
        failure {
            echo "❌ Deployment failed!"
            sh 'docker logs $CONTAINER_NAME || true'
        }
    }
}
