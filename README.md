# log-update

Claude Code와의 대화 내역을 의미 단위로 정리하여 마크다운 문서로 저장합니다.

## 기능

- 대화 내역 자동 분석
- 의미 단위로 작업 그룹화
- 비개발자 친화적 표현으로 정리
- 마크다운 문서 자동 생성

## 설치

```bash
mkdir -p .claude/skills && curl -sL https://github.com/daht-mad/log-update/archive/refs/heads/master.tar.gz | tar -xz -C /tmp && mv /tmp/log-update-master .claude/skills/log-update
```

## 사용법

Claude Code에서:

```text
오늘 작업 내역 정리해줘
```

또는:

```text
log-update 실행해줘
```

## 필요 환경

- Node.js 18+

---

Last updated: 2025-12-28
