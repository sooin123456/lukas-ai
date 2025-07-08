# 🚀 Supaplate 배포 가이드

## **1. 환경 변수 설정**

### **필수 환경 변수**
```bash
# Supabase 설정
DATABASE_URL=postgresql://username:password@host:port/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI API (AI Assistant 기능)
OPENAI_API_KEY=your-openai-api-key

# 앱 설정
VITE_APP_NAME=Lukas AI
SITE_URL=https://your-domain.com
```

### **선택적 환경 변수**
```bash
# 결제 기능 (Toss Payments)
VITE_TOSS_PAYMENTS_CLIENT_KEY=your-toss-client-key

# 이메일 서비스 (Resend)
RESEND_API_KEY=your-resend-api-key
ADMIN_EMAIL=admin@yourcompany.com

# 분석 도구
VITE_GOOGLE_TAG_ID=your-google-tag-id
VITE_CHANNEL_PLUGIN_KEY=your-channel-plugin-key

# 에러 추적 (Sentry)
VITE_SENTRY_DSN=your-sentry-dsn
SENTRY_ORG=your-sentry-org
SENTRY_PROJECT=your-sentry-project
SENTRY_AUTH_TOKEN=your-sentry-auth-token

# CAPTCHA (연락처 폼)
HCAPTCHA_SITE_KEY=your-hcaptcha-site-key
HCAPTCHA_SECRET_KEY=your-hcaptcha-secret-key
TURNSTILE_SITE_KEY=your-turnstile-site-key
TURNSTILE_SECRET_KEY=your-turnstile-secret-key

# CRON Secret (이메일 큐)
CRON_SECRET=your-cron-secret-key
```

## **2. Supabase 설정**

### **2.1 Supabase 프로젝트 생성**
1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. 프로젝트 설정에서 Database URL과 API 키 복사
3. SQL Editor에서 마이그레이션 실행

### **2.2 데이터베이스 마이그레이션**
```bash
# 마이그레이션 생성
npm run db:generate

# 마이그레이션 실행
npm run db:migrate

# 타입 생성
npm run db:typegen
```

## **3. 배포 플랫폼별 가이드**

### **3.1 Vercel 배포 (추천)**

#### **준비 단계**
1. [Vercel](https://vercel.com) 계정 생성
2. GitHub/GitLab 저장소 연결

#### **배포 설정**
1. Vercel 대시보드에서 새 프로젝트 생성
2. 환경 변수 설정 (위의 환경 변수들)
3. Build Command: `npm run build`
4. Output Directory: `build`
5. Install Command: `npm install`

#### **Vercel 설정 파일**
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "installCommand": "npm install",
  "framework": "react-router",
  "functions": {
    "app/entry.server.tsx": {
      "maxDuration": 30
    }
  }
}
```

### **3.2 Netlify 배포**

#### **준비 단계**
1. [Netlify](https://netlify.com) 계정 생성
2. GitHub/GitLab 저장소 연결

#### **배포 설정**
1. Build Command: `npm run build`
2. Publish Directory: `build`
3. 환경 변수 설정

#### **Netlify 설정 파일**
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### **3.3 Railway 배포**

#### **준비 단계**
1. [Railway](https://railway.app) 계정 생성
2. GitHub 저장소 연결

#### **배포 설정**
1. 새 프로젝트 생성
2. 환경 변수 설정
3. 자동 배포 활성화

### **3.4 AWS/Google Cloud 배포**

#### **Docker 설정**
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### **Docker Compose**
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
```

## **4. 배포 전 체크리스트**

### **4.1 코드 준비**
- [ ] 환경 변수 설정 완료
- [ ] Supabase 프로젝트 설정 완료
- [ ] 데이터베이스 마이그레이션 실행
- [ ] OpenAI API 키 설정
- [ ] 도메인 설정 (선택사항)

### **4.2 테스트**
- [ ] 로컬에서 `npm run build` 성공
- [ ] 로컬에서 `npm start` 실행 확인
- [ ] AI Assistant 기능 테스트
- [ ] 결제 기능 테스트 (선택사항)

### **4.3 보안**
- [ ] 환경 변수 노출 방지
- [ ] API 키 보안 설정
- [ ] CORS 설정 확인
- [ ] Rate Limiting 설정 (선택사항)

## **5. 배포 후 설정**

### **5.1 도메인 설정**
1. 커스텀 도메인 연결
2. SSL 인증서 설정
3. DNS 설정 확인

### **5.2 모니터링 설정**
1. Sentry 에러 추적 설정
2. Google Analytics 설정
3. Uptime 모니터링 설정

### **5.3 백업 설정**
1. 데이터베이스 백업 설정
2. 파일 백업 설정
3. 로그 백업 설정

## **6. 문제 해결**

### **6.1 일반적인 문제들**
- **빌드 실패**: Node.js 버전 확인, 의존성 설치 확인
- **환경 변수 오류**: 모든 필수 환경 변수 설정 확인
- **데이터베이스 연결 오류**: Supabase 설정 확인
- **AI 기능 오류**: OpenAI API 키 설정 확인

### **6.2 로그 확인**
```bash
# Vercel
vercel logs

# Netlify
netlify logs

# Railway
railway logs
```

## **7. 성능 최적화**

### **7.1 빌드 최적화**
- 이미지 최적화
- 번들 크기 최소화
- 코드 스플리팅

### **7.2 런타임 최적화**
- 캐싱 설정
- CDN 설정
- 데이터베이스 인덱싱

## **8. 유지보수**

### **8.1 정기 업데이트**
- 의존성 패키지 업데이트
- 보안 패치 적용
- 성능 모니터링

### **8.2 백업 및 복구**
- 정기 백업 스케줄링
- 재해 복구 계획
- 데이터 마이그레이션 계획 