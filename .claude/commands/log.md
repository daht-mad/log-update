# /log - Claude Code 대화 내역 문서화 도구

Claude Code와의 대화 내역을 의미 단위로 정리하여 마크다운 문서로 저장합니다.

## 실행 단계

### Step 1: 설치 여부 확인

```bash
which log-update
```

### Step 2-A: 이미 설치된 경우 → 업데이트 확인

```bash
TOOL_PATH=$(dirname $(dirname $(which log-update))) && cd $TOOL_PATH && git fetch origin && LOCAL=$(git rev-parse HEAD) && REMOTE=$(git rev-parse origin/master) && if [ "$LOCAL" != "$REMOTE" ]; then echo "업데이트 중..." && git pull origin master && npm install && npm run build && echo "업데이트 완료"; else echo "최신 버전입니다"; fi
```

### Step 2-B: 설치되지 않은 경우 → 자동 설치

```bash
git clone https://github.com/daht-mad/log-update.git /tmp/log-update && cd /tmp/log-update && npm install && npm run build && npm link
```

### Step 3: 도구 실행하여 대화 내역 가져오기

```bash
log-update
```

### Step 4: 대화 내역을 의미 단위로 정리

도구가 출력한 대화 내역을 분석하여 **의미 단위로 묶어서** 문서를 작성합니다.

#### 정리 규칙

1. **의미 단위로 그룹화**: 연관된 대화들을 하나의 작업으로 묶습니다
   - 예: "API 만들어줘" → "수정해줘" → "테스트해봐" = 하나의 "API 구현" 작업
   - 새로운 주제가 시작되면 새 작업으로 분리

2. **작업 제목**: 해당 작업의 핵심을 설명하는 짧은 제목
   - 좋은 예: "결제 API 엔드포인트 구현", "로그인 버그 수정"
   - 나쁜 예: "수정해줘", "했어"

3. **비개발자 친화적 표현**: 기술 용어를 쉽게 풀어서 설명
   - Write/Edit → "파일 생성/수정"
   - Bash(npm run build) → "프로젝트 빌드"
   - git commit → "변경사항 저장"

4. **파일명 포함**: 수정된 파일명을 명시 (3개 초과시 "외 N개")

#### 출력 형식

```markdown
# Claude Code 작업 기록

> 이 문서는 Claude Code와의 대화 내역을 자동으로 정리한 것입니다.

## YYYY-MM-DD

### 1. 작업 제목 (핵심을 설명하는 짧은 문장)

**수행된 작업:**
- 파일 확인: config.ts, index.ts
- 파일 수정: api.ts, routes.ts
- 프로젝트 빌드

**결과:**
작업 결과를 1-2문장으로 요약

---

### 2. 다음 작업 제목

...
```

### Step 5: 파일 저장

정리한 내용을 `docs/log-YYYY-MM-DD.md` 파일에 저장합니다.

기존 파일이 있으면 새 내용을 **아래에 추가**합니다.

## 파일 구조

```
your-project/
├── docs/
│   └── log-2025-12-22.md    # 생성된 문서
└── .log-state.json          # 상태 추적 파일
```

## 에러 처리

- **"command not found: log-update"**: Step 2-B 실행
- **"대화 내역을 찾을 수 없습니다"**: Claude Code로 대화한 적 있는지 확인
- **"새로운 대화 내역이 없습니다"**: 이미 모든 내역이 문서화됨
