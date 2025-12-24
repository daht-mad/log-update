# log-update

Claude Code와의 대화 내역을 자동으로 마크다운 문서로 변환하는 스킬입니다.

## 기능

- **자동 파싱**: Claude Code의 JSONL 대화 내역을 자동으로 읽어옵니다
- **의미 단위 정리**: Claude가 대화 흐름을 분석하여 관련 대화를 하나의 작업으로 묶습니다
- **비개발자 친화적**: 기술 용어를 쉽게 풀어서 설명합니다
- **증분 업데이트**: 한 번 문서화한 후에는 새로운 내용만 추가합니다

## 설치

### npm으로 설치

```bash
npm install @anthropic/claude-code-skill-log-update
```

### 또는 GitHub에서 직접 설치

```bash
npm install github:daht-mad/log-update
```

설치 후 스킬 파일을 프로젝트에 복사:

```bash
cp -r node_modules/@anthropic/claude-code-skill-log-update/.claude .
```

## 사용법

Claude Code에서:

```bash
/log-update
```

또는 "대화 내역 정리해줘", "작업 기록 문서화해줘" 등으로 요청하면 스킬이 자동으로 실행됩니다.

## 출력 예시

실행하면 `docs/log-YYYY-MM-DD.md` 파일이 생성됩니다:

```markdown
# Claude Code 작업 기록

> 이 문서는 Claude Code와의 대화 내역을 자동으로 정리한 것입니다.

## 2025-12-22

### 1. 결제 API 엔드포인트 구현

**수행된 작업:**
- 파일 확인: api.ts, routes.ts
- 파일 생성: payment.ts
- 프로젝트 빌드

**결과:**
결제 API 엔드포인트를 추가했습니다. POST /api/payment 경로로 접근 가능합니다.

---

### 2. 로그인 버그 수정

...
```

## 작동 원리

1. `~/.claude/projects/` 디렉토리에서 현재 프로젝트의 대화 내역 파일(.jsonl)을 찾습니다
2. JSONL 파일을 파싱하여 사용자 명령어, Claude의 응답, 도구 사용 정보를 추출합니다
3. Claude가 대화 흐름을 분석하여 의미 단위로 그룹화합니다
4. 비개발자도 이해할 수 있는 형식으로 마크다운 문서를 생성합니다
5. `docs/log-YYYY-MM-DD.md` 파일로 저장합니다

## 파일 구조

```text
your-project/
├── .claude/
│   └── skills/
│       └── log-update/
│           ├── SKILL.md           # 스킬 정의
│           └── scripts/
│               └── log-update.js  # 실행 스크립트
├── docs/
│   └── log-2025-12-22.md          # 생성된 문서
└── .log-state.json                # 상태 추적 파일
```

## 사용 시나리오

- **작업 일지**: 매일 작업 종료 전에 실행하여 하루 작업 내역 기록
- **팀 협업**: docs 디렉토리를 Git에 포함시켜 팀원과 작업 내역 공유
- **학습 기록**: Claude와의 대화를 통해 배운 내용을 문서로 보관

## 문제 해결

**"대화 내역을 찾을 수 없습니다"**
→ Claude Code로 해당 프로젝트에서 대화를 나눈 적이 있는지 확인

**"새로운 대화 내역이 없습니다"**
→ 이미 모든 내역이 문서화됨

## 라이선스

MIT

## 기여

이슈 리포트와 풀 리퀘스트를 환영합니다!

**GitHub**: [https://github.com/daht-mad/log-update](https://github.com/daht-mad/log-update)
