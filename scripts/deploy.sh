#!/bin/bash

# 🚀 Supaplate 배포 스크립트

set -e

echo "🚀 Supaplate 배포를 시작합니다..."

# 1. 환경 변수 확인
echo "📋 환경 변수 확인 중..."
required_vars=(
  "DATABASE_URL"
  "SUPABASE_URL"
  "SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "OPENAI_API_KEY"
  "VITE_APP_NAME"
  "SITE_URL"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ 필수 환경 변수가 설정되지 않았습니다: $var"
    exit 1
  fi
done

echo "✅ 모든 필수 환경 변수가 설정되었습니다."

# 2. 의존성 설치
echo "📦 의존성 설치 중..."
npm ci

# 3. 타입 체크
echo "🔍 타입 체크 중..."
npm run typecheck

# 4. 데이터베이스 마이그레이션
echo "🗄️ 데이터베이스 마이그레이션 중..."
npm run db:generate
npm run db:migrate
npm run db:typegen

# 5. 빌드
echo "🔨 애플리케이션 빌드 중..."
npm run build

# 6. 테스트 (선택사항)
if [ "$RUN_TESTS" = "true" ]; then
  echo "🧪 테스트 실행 중..."
  npm run test:e2e
fi

echo "✅ 배포 준비가 완료되었습니다!"

# 7. 배포 플랫폼별 실행
case "$DEPLOY_PLATFORM" in
  "vercel")
    echo "🚀 Vercel에 배포 중..."
    npx vercel --prod
    ;;
  "netlify")
    echo "🚀 Netlify에 배포 중..."
    npx netlify deploy --prod
    ;;
  "railway")
    echo "🚀 Railway에 배포 중..."
    npx railway up
    ;;
  "docker")
    echo "🐳 Docker 이미지 빌드 중..."
    docker build -t supaplate .
    echo "✅ Docker 이미지가 빌드되었습니다."
    echo "실행 명령어: docker run -p 3000:3000 supaplate"
    ;;
  *)
    echo "⚠️ 배포 플랫폼이 지정되지 않았습니다."
    echo "사용 가능한 옵션: vercel, netlify, railway, docker"
    echo "환경 변수 DEPLOY_PLATFORM을 설정하세요."
    ;;
esac

echo "🎉 배포가 완료되었습니다!" 