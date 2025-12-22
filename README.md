# session-doc

Claude Code와의 대화 내역을 자동으로 마크다운 문서로 변환하는 도구입니다.

## 기능

- **자동 파싱**: Claude Code의 JSONL 대화 내역을 자동으로 읽어옵니다
- **증분 업데이트**: 한 번 문서화한 후에는 새로운 내용만 추가합니다
- **구조화된 문서**: 사용자 명령어, Claude 작업 요약, 에러 내역을 체계적으로 정리합니다
- **프로젝트별 관리**: 각 프로젝트의 대화 내역을 독립적으로 관리합니다

## 설치

### 방법 1: Claude Code 슬래시 커맨드로 설치 (권장)

```bash
mkdir -p .claude/commands && curl -o .claude/commands/session-doc.md https://raw.githubusercontent.com/daht-mad/session-doc/master/.claude/commands/session-doc.md
```

설치 후 Claude Code에서:
```
/session-doc
```

### 방법 2: 직접 설치

```bash
git clone https://github.com/daht-mad/session-doc.git
cd session-doc
npm install
npm run build
npm link
```

## 사용법

### Claude Code로 사용

```
/session-doc
```

### CLI로 사용

```bash
cd your-project
session-doc
```

## 출력 예시

실행하면 `docs/session-YYYY-MM-DD.md` 파일이 생성됩니다:

```markdown
# Claude Code 세션 기록

**생성일**: 2025-12-22
**총 작업 수**: 15개

---

## 작업 1

**시간**: 2025. 12. 22. 오후 6:30:00

### 요청 내용

AI 도구 만들어줘

### 작업 결과

비개발자도 쉽게 사용할 수 있는 AI 도구를 만들었습니다.
질문에 답하면 자동으로 맞춤형 도구가 생성됩니다.

---

## 작업 2

...
```

## 실행 예시

### 첫 실행

```bash
$ session-doc
📝 Claude Code 세션 문서화 도구

✅ 문서가 생성되었습니다: docs/session-2025-12-22.md
   12개의 작업이 기록되었습니다.

✨ 완료!
```

### 추가 실행

```bash
$ session-doc
📝 Claude Code 세션 문서화 도구

✅ 문서가 업데이트되었습니다: docs/session-2025-12-22.md
   3개의 새 작업이 추가되었습니다. (총 15개)

✨ 완료!
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

- **작업 일지**: 매일 작업 종료 전에 실행하여 하루 작업 내역 기록
- **팀 협업**: docs 디렉토리를 Git에 포함시켜 팀원과 작업 내역 공유
- **학습 기록**: Claude와의 대화를 통해 배운 내용을 문서로 보관
- **디버깅 추적**: 에러 발생 시 해결 과정을 자동으로 문서화
- **프로젝트 히스토리**: 프로젝트의 전체 개발 과정을 타임라인으로 기록

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

**"대화 내역을 찾을 수 없습니다"**
→ Claude Code로 해당 프로젝트에서 대화를 나눈 적이 있는지 확인
→ 프로젝트 경로가 올바른지 확인

## 팁

- 정기적으로 실행하여 작업 내역을 문서화하세요
- Git에 커밋하기 전에 실행하면 변경사항을 추적하기 좋습니다
- `docs/` 디렉토리를 Git에 포함시켜 팀원과 공유할 수 있습니다
- `.session-doc-state.json`은 `.gitignore`에 추가하는 것을 권장합니다

## 라이선스

MIT

## 기여

이슈 리포트와 풀 리퀘스트를 환영합니다!

**GitHub**: [https://github.com/daht-mad/session-doc](https://github.com/daht-mad/session-doc)
