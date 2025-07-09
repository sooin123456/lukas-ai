# Lukas AI 배포 가이드

## 1. Supabase 프로젝트 설정

### 1.1 Supabase 프로젝트 생성
1. [Supabase](https://supabase.com)에 로그인
2. "New Project" 클릭
3. 프로젝트 이름: `lukas-ai`
4. 데이터베이스 비밀번호 설정
5. 지역 선택 (가까운 지역 선택)

### 1.2 데이터베이스 마이그레이션
```bash
# 환경변수 설정
export SUPABASE_URL="your_supabase_url"
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# 마이그레이션 적용
npx drizzle-kit push
```

### 1.3 RLS (Row Level Security) 활성화
Supabase Dashboard → Authentication → Policies에서 각 테이블의 RLS 정책이 활성화되어 있는지 확인

## 🚀 **Vercel 환경변수 설정**

Vercel Dashboard에서 다음 환경변수들을 설정해주세요:

### **Supabase 설정**
```
SUPABASE_URL=https://xylezpqstzqbtcckaabh.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5bGV6cHFzdHpxYnRjY2thYWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5NDg2MDMsImV4cCI6MjA2NzUyNDYwM30.yeDhDAINPOGI8oX_8CXWhvnrcr7EwwD_FdziP0j9Chc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5bGV6cHFzdHpxYnRjY2thYWJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0ODYwMywiZXhwIjoyMDY3NTI0NjAzfQ.dVVkUIs3mwll5Gk-Qa7efazx7kEk5XagI7NK3FsVAfE
```

### **기본 앱 설정**
```
NODE_ENV=production
SITE_URL=https://your-vercel-domain.vercel.app
COOKIE_SECRET=your_random_secret_key_here
```

**Vercel Dashboard**에서 이 환경변수들을 설정하시면, 다음 단계로 데이터베이스 마이그레이션을 진행하겠습니다! 

환경변수 설정이 완료되면 알려주세요!

## 2. Vercel 배포

### 2.1 Vercel 프로젝트 생성
1. [Vercel](https://vercel.com)에 로그인
2. "New Project" 클릭
3. GitHub 저장소 연결
4. Framework Preset: Remix 선택

### 2.2 환경변수 설정
Vercel Dashboard → Settings → Environment Variables에서 다음 변수들을 설정:

#### Supabase 설정
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

#### Stripe 설정 (결제 기능)
```
STRIPE_SECRET_KEY=sk_test_... # 테스트용
STRIPE_PUBLISHABLE_KEY=pk_test_... # 테스트용
STRIPE_WEBHOOK_SECRET=whsec_... # Stripe Dashboard에서 생성
```

#### AI API 설정
```
OPENAI_API_KEY=sk-... # OpenAI API 키
ANTHROPIC_API_KEY=sk-ant-... # Anthropic API 키 (선택사항)
```

#### 이메일 설정
```
RESEND_API_KEY=re_... # Resend API 키
```

#### 보안 설정
```
SESSION_SECRET=your_random_secret_key_here
ENCRYPTION_KEY=your_encryption_key_here
```

#### 앱 설정
```
NODE_ENV=production
APP_URL=https://your-domain.vercel.app
```

### 2.3 빌드 설정
- Build Command: `npm run build`
- Output Directory: `public`
- Install Command: `npm install`

## 3. Stripe 설정 (결제 기능)

### 3.1 Stripe 계정 설정
1. [Stripe](https://stripe.com) 계정 생성
2. Dashboard에서 API Keys 확인
3. Webhook 엔드포인트 설정:
   - URL: `https://your-domain.vercel.app/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

### 3.2 제품 및 가격 설정
Stripe Dashboard → Products에서:
- Basic Plan: $0/month
- Pro Plan: $10/month

## 4. 파일 업로드 설정

### 4.1 Supabase Storage 설정
1. Supabase Dashboard → Storage
2. 새 버킷 생성: `documents`
3. RLS 정책 설정 (비공개)

### 4.2 파일 업로드 권한 설정
```sql
-- 문서 업로드 정책
CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (auth.uid() = owner);

-- 문서 다운로드 정책
CREATE POLICY "Users can download their own documents" ON storage.objects
FOR SELECT USING (auth.uid() = owner);
```

## 5. AI API 설정

### 5.1 OpenAI 설정
1. [OpenAI](https://platform.openai.com) 계정 생성
2. API Keys 생성
3. 사용량 제한 설정 (선택사항)

### 5.2 Anthropic 설정 (선택사항)
1. [Anthropic](https://console.anthropic.com) 계정 생성
2. API Keys 생성

## 6. 이메일 설정

### 6.1 Resend 설정
1. [Resend](https://resend.com) 계정 생성
2. 도메인 설정 (선택사항)
3. API Keys 생성

## 7. 모니터링 설정 (선택사항)

### 7.1 Sentry 설정
1. [Sentry](https://sentry.io) 계정 생성
2. 프로젝트 생성
3. DSN 설정

## 8. 배포 후 확인사항

### 8.1 기능 테스트
- [ ] 사용자 가입/로그인
- [ ] 결제 플로우
- [ ] AI 채팅
- [ ] 문서 업로드
- [ ] 회의 기능
- [ ] 일정 관리
- [ ] 분석 대시보드

### 8.2 보안 확인
- [ ] 환경변수 노출 확인
- [ ] RLS 정책 작동 확인
- [ ] 파일 업로드 권한 확인
- [ ] API 키 보안 확인

### 8.3 성능 확인
- [ ] 페이지 로딩 속도
- [ ] API 응답 시간
- [ ] 데이터베이스 쿼리 성능

## 9. 문제 해결

### 9.1 일반적인 문제
- **빌드 실패**: Node.js 버전 확인 (18+ 권장)
- **환경변수 오류**: Vercel에서 환경변수 재설정
- **데이터베이스 연결 오류**: Supabase URL/키 확인
- **결제 오류**: Stripe 키 및 Webhook 설정 확인

### 9.2 로그 확인
- Vercel Dashboard → Functions → Logs
- Supabase Dashboard → Logs
- Stripe Dashboard → Logs

## 10. 프로덕션 체크리스트

- [ ] 모든 환경변수 설정 완료
- [ ] 데이터베이스 마이그레이션 완료
- [ ] RLS 정책 활성화
- [ ] 파일 업로드 권한 설정
- [ ] 결제 Webhook 설정
- [ ] AI API 키 설정
- [ ] 이메일 서비스 설정
- [ ] 도메인 설정 (선택사항)
- [ ] SSL 인증서 확인
- [ ] 백업 설정 (선택사항)

## 11. 유지보수

### 11.1 정기 업데이트
- 의존성 패키지 업데이트
- 보안 패치 적용
- 성능 모니터링

### 11.2 백업
- 데이터베이스 백업 설정
- 파일 스토리지 백업

### 11.3 모니터링
- 에러 로그 모니터링
- 사용량 및 비용 모니터링
- 성능 지표 추적 