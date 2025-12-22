# /session-doc - Claude Code 대화 내역 문서화 도구

Claude Code와의 대화 내역을 자동으로 마크다운 문서로 변환합니다.

## 사용법

```
/session-doc
```

## 주요 기능

- **자동 파싱**: Claude Code의 JSONL 대화 내역을 자동으로 읽어옵니다
- **증분 업데이트**: 한 번 문서화한 후에는 새로운 내용만 추가합니다
- **구조화된 문서**: 사용자 명령어, Claude 작업 요약, 에러 내역을 체계적으로 정리합니다
- **프로젝트별 관리**: 각 프로젝트의 대화 내역을 독립적으로 관리합니다

## 설치 확인 및 자동 업데이트

### 1. 설치 여부 확인

```bash
which session-doc
```

### 2-A. 이미 설치된 경우 - 자동 업데이트

설치 경로에서 GitHub 최신 버전 확인 후 업데이트:

```bash
# 설치 경로 찾기
TOOL_PATH=$(dirname $(dirname $(which session-doc)))
cd $TOOL_PATH

# 원격 변경사항 확인
git fetch origin
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/master)

# 새 버전이 있으면 업데이트
if [ "$LOCAL" != "$REMOTE" ]; then
  echo "🔄 새 버전 발견, 업데이트 중..."
  git pull origin master
  npm install
  npm run build
  echo "✅ 업데이트 완료!"
else
  echo "✅ 이미 최신 버전입니다."
fi
```

### 2-B. 설치되지 않은 경우 - 자동 설치

```bash
git clone https://github.com/daht-mad/session-doc.git /tmp/session-doc
cd /tmp/session-doc
npm install
npm run build
npm link
```

### 3. 확인

```bash
which session-doc
```

경로가 표시되어야 함 (예: /usr/local/bin/session-doc)

## 실행 단계

사용자가 `/session-doc`를 실행하면:

1. **설치 확인** → 없으면 자동 설치, 있으면 업데이트 확인
2. **문서 생성**: `session-doc` 명령어 실행
3. **결과 확인**: `docs/session-YYYY-MM-DD.md` 파일이 생성되었는지 확인
4. **사용자에게 결과 보고**: 생성된 문서 경로와 통계 정보 표시

## 출력 예시

```markdown
# Claude Code 세션 기록

**프로젝트**: /Users/username/my-project
**생성일**: 2025-12-22
**세션 수**: 15

---

## 세션 1

**시간**: 2025. 12. 22. 오후 6:30:00

### 사용자 명령어

```
/create-tool
```

### Claude 작업 요약

비개발자도 쉽게 사용할 수 있는 AI 도구를 만들어드리겠습니다...

### 사용된 도구

- AskUserQuestion
- Write
- Bash

---
```

## 에러 처리

### 도구가 설치되지 않은 경우
```
❌ session-doc 명령어를 찾을 수 없습니다.

다음 명령어로 설치해주세요:

git clone https://github.com/daht-mad/session-doc.git /tmp/session-doc
cd /tmp/session-doc
npm install
npm run build
npm link
```

### 대화 내역이 없는 경우
```
❌ 대화 내역을 찾을 수 없습니다.
   Claude Code로 이 프로젝트에서 대화를 나눈 적이 있는지 확인하세요.
```

### 새로운 내역이 없는 경우
```
ℹ️ 새로운 대화 내역이 없습니다.
```

## 작동 원리

1. `~/.claude/projects/` 디렉토리에서 현재 프로젝트의 대화 내역 파일(.jsonl)을 찾습니다
2. JSONL 파일을 파싱하여 사용자 명령어, Claude의 응답, 도구 사용, 에러 정보를 추출합니다
3. 타임스탬프를 기준으로 대화를 시간순으로 정렬합니다
4. 마크다운 형식으로 구조화된 문서를 생성합니다
5. `docs/session-YYYY-MM-DD.md` 파일로 저장합니다
6. `.session-doc-state.json` 파일에 마지막 처리 시점을 기록하여 다음 실행 시 증분 업데이트를 지원합니다

## 파일 구조

```
your-project/
├── docs/
│   └── session-2025-12-22.md    # 생성된 문서
└── .session-doc-state.json      # 상태 추적 파일 (gitignore에 추가 권장)
```

## 사용 시나리오

### 시나리오 1: 첫 실행
```bash
$ session-doc
📝 Claude Code 세션 문서화 도구

프로젝트 경로: /Users/username/my-project
✓ 3개의 세션 파일을 찾았습니다.
✓ 45개의 새로운 메시지를 읽었습니다.
✓ 12개의 대화 세션으로 그룹화했습니다.
✅ 문서가 생성되었습니다: session-2025-12-22.md

📊 통계:
   - 처리된 세션: 12개
   - 총 누적 세션: 12개
   - 저장 위치: docs/session-2025-12-22.md

✨ 완료!
```

### 시나리오 2: 증분 업데이트
```bash
$ session-doc
📝 Claude Code 세션 문서화 도구

프로젝트 경로: /Users/username/my-project
📌 마지막 처리 시점: 2025. 12. 22. 오후 3:00:00
📊 이전 처리 개수: 12개

✓ 3개의 세션 파일을 찾았습니다.
✓ 8개의 새로운 메시지를 읽었습니다.
✓ 3개의 대화 세션으로 그룹화했습니다.
ℹ️ 기존 문서에 내용을 추가합니다: session-2025-12-22.md
✅ 문서가 생성되었습니다: session-2025-12-22.md

📊 통계:
   - 처리된 세션: 3개
   - 총 누적 세션: 15개
   - 저장 위치: docs/session-2025-12-22.md

✨ 완료!
```

## 문제 해결

**"command not found: session-doc"**
→ Node.js 설치 확인: `node --version`
→ npm link 재실행: `cd /path/to/session-doc && npm link`

**"Permission denied"**
→ 실행: `sudo npm link`

**"Module not found"**
→ 도구 디렉토리에서 실행: `npm install`

**"Build failed"**
→ Node.js 버전 확인 (18+ 필요)
→ TypeScript 설치: `npm install -g typescript`

## 팁

- 정기적으로 실행하여 작업 내역을 문서화하세요
- Git에 커밋하기 전에 실행하면 변경사항을 추적하기 좋습니다
- `docs/` 디렉토리를 Git에 포함시켜 팀원과 공유할 수 있습니다
- `.session-doc-state.json`은 `.gitignore`에 추가하는 것을 권장합니다
