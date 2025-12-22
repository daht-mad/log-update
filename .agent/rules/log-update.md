---
trigger: glob
glob: "**/*"
---

# log-update - Claude Code 대화 내역 문서화 도구

Claude Code와의 대화 내역을 의미 단위로 정리하여 마크다운 문서로 저장합니다.

## 실행 전 확인 단계

### Step 1: 설치 여부 확인

```bash
which dahtmad-log-update
```

### Step 2-A: 이미 설치된 경우 -> 업데이트 확인

```bash
TOOL_PATH=$(dirname $(dirname $(which dahtmad-log-update))) && cd $TOOL_PATH && git fetch origin && LOCAL=$(git rev-parse HEAD) && REMOTE=$(git rev-parse origin/master) && if [ "$LOCAL" != "$REMOTE" ]; then echo "새 버전 발견, 업데이트 중..." && git pull origin master && npm install && npm run build && echo "업데이트 완료!"; else echo "이미 최신 버전입니다."; fi
```

### Step 2-B: 설치되지 않은 경우 -> 자동 설치

```bash
git clone https://github.com/daht-mad/log-update.git /tmp/log-update && cd /tmp/log-update && npm install && npm run build && npm link
```

### Step 3: 도구 실행

```bash
dahtmad-log-update
```

### Step 4: 대화 내역을 의미 단위로 정리

도구가 출력한 대화 내역을 분석하여 **의미 단위로 묶어서** 문서를 작성합니다.

#### 정리 규칙

1. **의미 단위로 그룹화**: 연관된 대화들을 하나의 작업으로 묶습니다
   - 예: "API 만들어줘" -> "수정해줘" -> "테스트해봐" = 하나의 "API 구현" 작업
   - 새로운 주제가 시작되면 새 작업으로 분리

2. **작업 제목**: 해당 작업의 핵심을 설명하는 짧은 제목
   - 좋은 예: "결제 API 엔드포인트 구현", "로그인 버그 수정"
   - 나쁜 예: "수정해줘", "했어"

3. **비개발자 친화적 표현**: 기술 용어를 쉽게 풀어서 설명
   - Write/Edit -> "파일 생성/수정"
   - Bash(npm run build) -> "프로젝트 빌드"
   - git commit -> "변경사항 저장"

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

## 사용 예시

```
/log-update
```

## 파일 구조

```
your-project/
├── docs/
│   └── log-2025-12-22.md    # 생성된 문서
└── .log-state.json          # 상태 추적 파일
```

## 에러 처리

- **"command not found"**: Step 2-B 실행
- **"대화 내역을 찾을 수 없습니다"**: Claude Code로 대화한 적 있는지 확인
- **"새로운 대화 내역이 없습니다"**: 이미 모든 내역이 문서화됨
- **"Permission denied"**: `sudo npm link` 실행
- **"Module not found"**: 도구 디렉토리에서 `npm install` 실행

## 작동 원리 (How It Works)

### 1. 대화 내역 파일 탐색

Claude Code는 모든 대화 내역을 `~/.claude/projects/` 디렉토리에 저장합니다.

```
~/.claude/projects/
└── -Users-username-Documents-my-project/    # 프로젝트 경로를 하이픈으로 변환
    ├── abc123.jsonl                         # 세션 1
    ├── def456.jsonl                         # 세션 2
    └── agent-xyz789.jsonl                   # 에이전트 세션 (제외됨)
```

**경로 변환 규칙**: 프로젝트 경로의 `/`와 `.`를 `-`로 변환
- `/Users/dahye/Documents/my-project` → `-Users-dahye-Documents-my-project`

**코드 동작**:
```typescript
const normalizedPath = projectPath.replace(/[/.]/g, '-');
const projectDir = path.join(CLAUDE_HOME, 'projects', normalizedPath);
```

### 2. JSONL 파일 파싱

각 `.jsonl` 파일은 한 줄에 하나의 JSON 객체를 포함합니다:

```jsonl
{"type":"user","timestamp":"2025-12-22T10:00:00Z","message":{"role":"user","content":"API 만들어줘"}}
{"type":"assistant","timestamp":"2025-12-22T10:00:05Z","message":{"role":"assistant","content":[{"type":"text","text":"네, API를 만들겠습니다."},{"type":"tool_use","name":"Write","input":{"file_path":"/path/to/api.ts"}}]}}
```

**메시지 구조**:
| 필드 | 설명 |
|------|------|
| `type` | `user` 또는 `assistant` |
| `timestamp` | ISO 8601 형식의 시간 |
| `message.role` | 메시지 발신자 |
| `message.content` | 텍스트 또는 도구 호출 배열 |

### 3. 증분 처리 (Incremental Update)

이전에 처리한 내역을 다시 처리하지 않기 위해 상태 파일을 사용합니다.

**상태 파일** (`.session-doc-state.json`):
```json
{
  "lastProcessedTimestamp": "2025-12-22T15:30:00Z",
  "totalSessions": 5
}
```

**동작 흐름**:
1. 상태 파일에서 `lastProcessedTimestamp` 읽기
2. 해당 시간 이후의 메시지만 필터링
3. 처리 완료 후 새로운 타임스탬프 저장

```typescript
if (lastTimestamp && msg.timestamp) {
  const msgTime = new Date(msg.timestamp).getTime();
  const lastTime = new Date(lastTimestamp).getTime();
  if (msgTime <= lastTime) continue;  // 이미 처리된 메시지 건너뛰기
}
```

### 4. 시스템 태그 제거

Claude Code가 자동으로 추가하는 시스템 태그들을 제거합니다:

```typescript
const patterns = [
  /<ide_opened_file>[\s\S]*?<\/ide_opened_file>/g,
  /<ide_selection>[\s\S]*?<\/ide_selection>/g,
  /<system-reminder>[\s\S]*?<\/system-reminder>/g,
  /<user-prompt-submit-hook>[\s\S]*?<\/user-prompt-submit-hook>/g,
  // ...
];
```

**제거되는 태그 종류**:
- `<ide_opened_file>`: IDE에서 열린 파일 정보
- `<ide_selection>`: IDE에서 선택된 텍스트
- `<system-reminder>`: 시스템 리마인더
- `<command-message>`: 슬래시 커맨드 메타데이터

### 5. 도구 사용 정보 추출

Claude의 응답에서 도구 호출 정보를 추출합니다:

```typescript
if (item.type === 'tool_use') {
  const toolName = item.name;    // "Read", "Write", "Edit", "Bash" 등
  const input = item.input;      // { file_path: "/path/to/file.ts" }

  tools.push(toolName);
  if (input.file_path) {
    files.push(getFileName(input.file_path));  // 파일명만 추출
  }
}
```

### 6. 비개발자 친화적 변환

기술 용어를 일반인이 이해할 수 있는 표현으로 변환합니다:

```typescript
const toolActions = {
  'Read': '파일 확인',
  'Write': '파일 생성',
  'Edit': '파일 수정',
  'Bash': '명령어 실행',
  'Glob': '파일 검색',
  'Grep': '코드 검색',
  'Task': '하위 작업 수행',
  'WebFetch': '웹 정보 조회',
  'WebSearch': '웹 검색',
  'AskUserQuestion': '사용자에게 질문',
  'TodoWrite': '작업 목록 관리',
};
```

### 7. 세션 그룹화

연속된 메시지들을 하나의 세션으로 묶습니다:

```
사용자: "API 만들어줘"           ─┐
Claude: [Write api.ts]          │  세션 1: API 구현
Claude: "API를 만들었습니다"     ─┘

사용자: "테스트해줘"             ─┐
Claude: [Bash npm test]         │  세션 2: 테스트 실행
Claude: "테스트 통과했습니다"    ─┘
```

**세션 데이터 구조**:
```typescript
interface Session {
  userRequests: string[];     // 사용자 요청들
  claudeActions: string[];    // Claude 응답 요약
  errors: string[];           // 발생한 에러들
  filesModified: string[];    // 수정된 파일들
  toolsUsed: string[];        // 사용된 도구들
  timestamp: string;          // 세션 시작 시간
}
```

### 8. 자동 업데이트 로직

커맨드 실행 시 최신 버전을 확인하고 자동으로 업데이트합니다:

```bash
# 1. 도구 설치 경로 찾기
TOOL_PATH=$(dirname $(dirname $(which dahtmad-log-update)))

# 2. 원격 저장소와 비교
git fetch origin
LOCAL=$(git rev-parse HEAD)           # 로컬 커밋 해시
REMOTE=$(git rev-parse origin/master)  # 원격 커밋 해시

# 3. 버전이 다르면 업데이트
if [ "$LOCAL" != "$REMOTE" ]; then
  git pull origin master  # 코드 다운로드
  npm install             # 의존성 업데이트
  npm run build           # 다시 빌드
fi
```

**업데이트 흐름도**:
```
실행 시작
    ↓
which dahtmad-log-update (설치 확인)
    ↓
┌─ 미설치 ──────────────────┐
│  git clone → npm install  │
│  → npm run build          │
│  → npm link               │
└───────────────────────────┘
    ↓
┌─ 설치됨 ──────────────────┐
│  git fetch origin         │
│  LOCAL vs REMOTE 비교     │
│  ↓                        │
│  다르면 → git pull        │
│          → npm install    │
│          → npm run build  │
└───────────────────────────┘
    ↓
도구 실행 (dahtmad-log-update)
```

### 전체 처리 흐름 요약

```
1. 프로젝트 경로 → ~/.claude/projects/ 디렉토리 탐색
                           ↓
2. *.jsonl 파일들 발견 (agent-*.jsonl 제외)
                           ↓
3. 상태 파일에서 마지막 처리 시점 확인
                           ↓
4. 새로운 메시지만 필터링하여 읽기
                           ↓
5. 시스템 태그 제거 및 노이즈 필터링
                           ↓
6. 사용자-Claude 대화를 세션으로 그룹화
                           ↓
7. 도구 사용 정보 추출 및 비개발자 용어로 변환
                           ↓
8. JSON 형식으로 출력 (Claude가 후처리)
                           ↓
9. Claude가 의미 단위로 재정리하여 마크다운 생성
                           ↓
10. docs/log-YYYY-MM-DD.md 파일로 저장
```
