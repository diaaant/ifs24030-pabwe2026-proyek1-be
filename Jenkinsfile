// Pipeline CI/CD BengkelKu Backend: lint, test, lalu deploy dengan Docker Compose.
// Prasyarat Jenkins: plugin Docker Pipeline, serta docker dan docker compose pada agent.
pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  parameters {
    booleanParam(name: 'DEPLOY', defaultValue: true, description: 'Jalankan tahap deploy setelah pengujian lulus')
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Lint dan test') {
      agent { docker { image 'node:22-bookworm'; reuseNode true } }
      environment { HOME = "${WORKSPACE}" }
      steps {
        sh 'npm ci'
        sh 'npm run lint'
        sh 'npm run test:coverage'
      }
    }

    stage('Deploy') {
      when { expression { params.DEPLOY } }
      steps {
        sh 'docker compose up -d --build'
        sh 'sleep 8 && curl -fsS http://localhost:8000/api/health'
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'coverage/**', allowEmptyArchive: true
    }
    success { echo 'Pipeline backend berhasil: pengujian lulus dan API ter-deploy.' }
    failure { echo 'Pipeline backend gagal: periksa log tahap yang gagal.' }
  }
}
