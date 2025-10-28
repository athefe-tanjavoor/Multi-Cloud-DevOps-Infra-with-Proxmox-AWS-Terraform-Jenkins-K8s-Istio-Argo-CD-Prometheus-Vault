pipeline {
    agent any

    environment {
        DOCKER_IMAGE            = "yourdockerhubusername/media-server:latest"
        CONTAINER_NAME          = "media-server-container"
        APP_PORT                = "5000"
        HOST_UPLOAD_PATH        = "/home/rankraze/uploads/media-server/uploads"
        CONTAINER_UPLOAD_PATH   = "/app/uploads"
        REMOTE_VM               = "14.194.141.164"
    }

    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main',
                    credentialsId: 'github-creds-multi-cloud', // GitHub credentials stored in Jenkins
                    url: 'https://github.com/athefe-tanjavoor/Multi-Cloud-DevOps-Infra-with-Proxmox-AWS-Terraform-Jenkins-K8s-Istio-Argo-CD-Prometheus-Vault.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t $DOCKER_IMAGE .'
            }
        }

        stage('Push Docker Image to Docker Hub') {
            steps {
                // Use Docker Hub credentials stored in Jenkins
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh """
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        docker push $DOCKER_IMAGE
                    """
                }
            }
        }

        stage('Deploy on VM1 via SSH') {
            steps {
                // Use SSH credentials stored in Jenkins
                sshagent (credentials: ['vm1-ssh-creds']) {
                    sh """
                    ssh -o StrictHostKeyChecking=no jenkins@$REMOTE_VM '
                        echo "Pulling latest Docker image..."
                        docker pull $DOCKER_IMAGE

                        echo "Stopping old container if exists..."
                        docker stop $CONTAINER_NAME || true
                        docker rm $CONTAINER_NAME || true

                        echo "Ensuring uploads folder exists on host..."
                        mkdir -p $HOST_UPLOAD_PATH

                        echo "Running new container..."
                        docker run -d \
                            --name $CONTAINER_NAME \
                            --restart always \
                            -p $APP_PORT:$APP_PORT \
                            -v $HOST_UPLOAD_PATH:$CONTAINER_UPLOAD_PATH \
                            --user 1000:1000 \
                            $DOCKER_IMAGE

                        echo "Checking if container is running..."
                        retries=5
                        until [ \"\$(docker inspect -f '{{.State.Running}}' $CONTAINER_NAME)\" = "true" ] || [ \$retries -le 0 ]; do
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

                        echo "Verifying uploads folder..."
                        if [ -d "$HOST_UPLOAD_PATH" ]; then
                            echo "✅ Uploads folder exists on host."
                        else
                            echo "❌ Uploads folder does NOT exist!"
                            exit 1
                        fi
                    '
                    """
                }
            }
        }
    }

    post {
        success {
            echo "✅ Media-server deployed successfully at http://$REMOTE_VM:$APP_PORT/"
        }
        failure {
            echo "❌ Deployment failed!"
        }
    }
}
