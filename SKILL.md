---
name: log-update
version: 1.0.2
repo: daht-mad/log-update
description: |
  Claude Code 대화 내역을 마크다운 문서로 자동 정리하는 도구.
  다음과 같은 요청에 이 스킬을 사용하세요:
  - "오늘 작업 내역 정리해줘"
  - "대화 기록 문서화해줘"
  - "log-update 실행해줘"
  - "/log-update"
---

# log-update

Claude Code와의 대화 내역을 의미 단위로 정리하여 마크다운 문서로 저장합니다.

## 실행

의존성 설치 후 스크립트 실행:

```bash
npm install typescript @types/node && npm run build && node scripts/log-update.js
```

## 동작 순서

1. **도구 실행**: `node scripts/log-update.js`
2. **대화 내역 분석**: 의미 단위로 그룹화
3. **파일 저장**: `docs/log-YYYY-MM-DD.md`

## 정리 규칙

- **의미 단위로 그룹화**: 연관된 대화를 하나의 작업으로 묶음
- **작업 제목**: 핵심을 설명하는 짧은 제목
- **비개발자 친화적 표현**: 기술 용어를 쉽게 풀어서 설명
- **파일명 포함**: 수정된 파일명 명시 (3개 초과시 "외 N개")

## 출력 형식

```markdown
# Claude Code 작업 기록

## YYYY-MM-DD

### 1. 작업 제목

**수행된 작업:**
- 파일 확인: config.ts, index.ts
- 파일 수정: api.ts

**결과:**
작업 결과 요약
```

## 스크립트

실행 스크립트: [log-update.js](scripts/log-update.js)

## 자동 업데이트

스킬 실행 전 업데이트 확인:

```bash
python3 scripts/check_update.py --auto --quiet
```
