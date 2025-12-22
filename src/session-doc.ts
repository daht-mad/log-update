#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface Message {
  role: 'user' | 'assistant';
  content: any;
  timestamp?: string;
  type?: string;
  toolUseResult?: any;
  message?: any;
}

interface StateTracker {
  lastProcessedTimestamp: string;
  processedCount: number;
}

interface DocumentSection {
  timestamp: string;
  userCommand?: string;
  assistantSummary?: string;
  errors?: string[];
  toolCalls?: string[];
}

const CLAUDE_HOME = path.join(os.homedir(), '.claude');
const STATE_FILE = '.session-doc-state.json';

/**
 * 현재 프로젝트의 대화 세션 파일 경로를 찾습니다
 */
function findProjectSessionFiles(projectPath: string): string[] {
  // Claude는 경로를 /와 .를 -로 바꿔서 저장합니다
  // /Users/dahye.dyan/... -> -Users-dahye-dyan-...
  const normalizedPath = projectPath.replace(/[/.]/g, '-');
  const projectDir = path.join(CLAUDE_HOME, 'projects', normalizedPath);

  if (!fs.existsSync(projectDir)) {
    console.error(`❌ 프로젝트 대화 내역을 찾을 수 없습니다: ${projectDir}`);
    return [];
  }

  const files = fs.readdirSync(projectDir);
  const sessionFiles = files
    .filter(f => f.endsWith('.jsonl') && !f.startsWith('agent-'))
    .map(f => path.join(projectDir, f))
    .filter(f => fs.statSync(f).size > 0); // 빈 파일 제외

  return sessionFiles;
}

/**
 * JSONL 파일에서 메시지들을 읽어옵니다
 */
function readMessages(filePath: string, lastTimestamp?: string): Message[] {
  const messages: Message[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n').filter(line => line.trim());

  for (const line of lines) {
    try {
      const msg = JSON.parse(line);

      // 증분 업데이트: 마지막 처리 시점 이후의 메시지만
      if (lastTimestamp && msg.timestamp) {
        const msgTime = new Date(msg.timestamp).getTime();
        const lastTime = new Date(lastTimestamp).getTime();
        if (msgTime <= lastTime) {
          continue;
        }
      }

      messages.push(msg);
    } catch (e) {
      // JSON 파싱 에러는 무시
      continue;
    }
  }

  return messages;
}

/**
 * 시스템 태그를 제거합니다 (ide_opened_file, ide_selection, system-reminder 등)
 */
function removeSystemTags(text: string): string {
  // XML 스타일 시스템 태그 제거
  const patterns = [
    /<ide_opened_file>[\s\S]*?<\/ide_opened_file>/g,
    /<ide_selection>[\s\S]*?<\/ide_selection>/g,
    /<system-reminder>[\s\S]*?<\/system-reminder>/g,
    /<user-prompt-submit-hook>[\s\S]*?<\/user-prompt-submit-hook>/g,
  ];

  let cleaned = text;
  for (const pattern of patterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  return cleaned.trim();
}

/**
 * 사용자 명령어를 추출합니다
 */
function extractUserCommand(message: Message): string | undefined {
  if (message.type === 'user' || message.message?.role === 'user') {
    const content = message.message?.content || message.content;

    if (typeof content === 'string') {
      return removeSystemTags(content);
    }

    if (Array.isArray(content)) {
      // 텍스트 콘텐츠만 추출
      const textContent = content
        .filter(c => c.type === 'text')
        .map(c => c.text)
        .join('\n');

      if (textContent.trim()) {
        return removeSystemTags(textContent);
      }
    }
  }

  return undefined;
}

/**
 * 도구 호출 정보를 추출합니다
 */
function extractToolCalls(message: Message): string[] {
  const tools: string[] = [];

  if (message.message?.content && Array.isArray(message.message.content)) {
    for (const item of message.message.content) {
      if (item.type === 'tool_use') {
        const toolName = item.name || 'unknown';
        tools.push(toolName);
      }
    }
  }

  return tools;
}

/**
 * 에러 정보를 추출합니다
 */
function extractErrors(message: Message): string[] {
  const errors: string[] = [];

  // Tool result에서 에러 찾기
  if (message.toolUseResult?.stderr) {
    errors.push(message.toolUseResult.stderr);
  }

  if (message.toolUseResult?.is_error || message.message?.content?.[0]?.is_error) {
    const errorContent = message.toolUseResult?.stdout ||
                         message.message?.content?.[0]?.content ||
                         'Unknown error';
    errors.push(errorContent);
  }

  return errors;
}

/**
 * 어시스턴트의 응답을 요약합니다
 */
function summarizeAssistantResponse(message: Message): string | undefined {
  if (message.type === 'assistant' || message.message?.role === 'assistant') {
    const content = message.message?.content || message.content;

    if (typeof content === 'string') {
      // 긴 응답은 요약
      if (content.length > 300) {
        return content.substring(0, 297) + '...';
      }
      return content;
    }

    if (Array.isArray(content)) {
      // 텍스트 콘텐츠만 추출
      const textContent = content
        .filter(c => c.type === 'text')
        .map(c => c.text)
        .join('\n');

      if (textContent.trim()) {
        if (textContent.length > 300) {
          return textContent.substring(0, 297) + '...';
        }
        return textContent;
      }
    }
  }

  return undefined;
}

/**
 * 메시지들을 문서 섹션으로 그룹화합니다
 */
function groupIntoSections(messages: Message[]): DocumentSection[] {
  const sections: DocumentSection[] = [];
  let currentSection: DocumentSection | null = null;

  for (const msg of messages) {
    const userCmd = extractUserCommand(msg);
    if (userCmd) {
      // 새로운 사용자 명령어 시작
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        timestamp: msg.timestamp || new Date().toISOString(),
        userCommand: userCmd,
        errors: [],
        toolCalls: []
      };
    } else if (currentSection) {
      // 현재 섹션에 정보 추가
      const summary = summarizeAssistantResponse(msg);
      if (summary && !currentSection.assistantSummary) {
        currentSection.assistantSummary = summary;
      }

      const errors = extractErrors(msg);
      if (errors.length > 0) {
        currentSection.errors!.push(...errors);
      }

      const tools = extractToolCalls(msg);
      if (tools.length > 0) {
        currentSection.toolCalls!.push(...tools);
      }
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

/**
 * 작업 내용을 비개발자가 이해할 수 있는 수준으로 요약합니다
 */
function summarizeWorkflow(section: DocumentSection): string {
  const tools = section.toolCalls || [];
  const uniqueTools = [...new Set(tools)];

  const workItems: string[] = [];

  // 도구 사용 패턴을 분석해서 작업 내용 추론
  if (uniqueTools.includes('Read') || uniqueTools.includes('Glob') || uniqueTools.includes('Grep')) {
    workItems.push('코드/파일 분석');
  }
  if (uniqueTools.includes('Write') || uniqueTools.includes('Edit')) {
    workItems.push('파일 생성/수정');
  }
  if (uniqueTools.includes('Bash')) {
    workItems.push('명령어 실행');
  }
  if (uniqueTools.includes('WebFetch') || uniqueTools.includes('WebSearch')) {
    workItems.push('웹 검색/조회');
  }
  if (uniqueTools.includes('Task')) {
    workItems.push('하위 작업 수행');
  }

  if (workItems.length === 0 && section.assistantSummary) {
    return section.assistantSummary;
  }

  return workItems.join(', ');
}

/**
 * 마크다운 문서를 생성합니다 (LOG.md 스타일)
 */
function generateMarkdown(sections: DocumentSection[], projectPath: string): string {
  const date = new Date().toISOString().split('T')[0];
  let md = `# 작업 로그\n\n`;
  md += `## ${date}: 세션 기록\n\n`;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];

    md += `### ${i + 1}. ${getTaskTitle(section)}\n\n`;

    if (section.userCommand) {
      md += `**사용자 명령:**\n`;
      md += `\`\`\`\n${section.userCommand}\n\`\`\`\n\n`;
    }

    md += `**Claude Code 작업 내용:**\n\n`;
    const workflow = summarizeWorkflow(section);
    if (workflow) {
      md += `- ${workflow}\n`;
    }
    md += `\n`;

    // 에러가 있으면 시행착오 및 배운 점 섹션 추가
    if (section.errors && section.errors.length > 0) {
      md += `**시행착오:**\n\n`;
      for (const error of section.errors) {
        // 에러 메시지를 간략하게 정리
        const shortError = error.length > 200 ? error.substring(0, 200) + '...' : error;
        md += `- ${shortError}\n`;
      }
      md += `\n`;

      md += `**배운 점:**\n`;
      md += `- (시행착오를 통해 배운 내용을 여기에 정리)\n\n`;
    }

    md += `---\n\n`;
  }

  return md;
}

/**
 * 사용자 명령어에서 작업 제목을 추출합니다
 */
function getTaskTitle(section: DocumentSection): string {
  if (!section.userCommand) {
    return '작업';
  }

  const cmd = section.userCommand.trim();

  // 첫 줄만 사용하고 너무 길면 자르기
  const firstLine = cmd.split('\n')[0];
  if (firstLine.length > 50) {
    return firstLine.substring(0, 47) + '...';
  }

  return firstLine || '작업';
}

/**
 * 상태를 로드합니다
 */
function loadState(projectPath: string): StateTracker | null {
  const stateFile = path.join(projectPath, STATE_FILE);

  if (fs.existsSync(stateFile)) {
    try {
      const content = fs.readFileSync(stateFile, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      return null;
    }
  }

  return null;
}

/**
 * 상태를 저장합니다
 */
function saveState(projectPath: string, state: StateTracker): void {
  const stateFile = path.join(projectPath, STATE_FILE);
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
}

export async function main(args: string[]): Promise<void> {
  console.log('📝 Claude Code 세션 문서화 도구\n');

  // 현재 작업 디렉토리
  const projectPath = process.cwd();
  console.log(`프로젝트 경로: ${projectPath}`);

  // 기존 상태 로드
  const state = loadState(projectPath);
  const lastTimestamp = state?.lastProcessedTimestamp;

  if (lastTimestamp) {
    console.log(`📌 마지막 처리 시점: ${new Date(lastTimestamp).toLocaleString('ko-KR')}`);
    console.log(`📊 이전 처리 개수: ${state?.processedCount || 0}개\n`);
  }

  // 세션 파일 찾기
  const sessionFiles = findProjectSessionFiles(projectPath);

  if (sessionFiles.length === 0) {
    console.error('❌ 대화 내역을 찾을 수 없습니다.');
    console.error('   Claude Code로 이 프로젝트에서 대화를 나눈 적이 있는지 확인하세요.');
    process.exit(1);
  }

  console.log(`✓ ${sessionFiles.length}개의 세션 파일을 찾았습니다.\n`);

  // 모든 메시지 읽기
  let allMessages: Message[] = [];
  for (const file of sessionFiles) {
    const messages = readMessages(file, lastTimestamp);
    allMessages.push(...messages);
  }

  if (allMessages.length === 0) {
    console.log('ℹ️ 새로운 대화 내역이 없습니다.');
    process.exit(0);
  }

  console.log(`✓ ${allMessages.length}개의 새로운 메시지를 읽었습니다.\n`);

  // 타임스탬프 순으로 정렬
  allMessages.sort((a, b) => {
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return timeA - timeB;
  });

  // 섹션으로 그룹화
  const sections = groupIntoSections(allMessages);
  console.log(`✓ ${sections.length}개의 대화 세션으로 그룹화했습니다.\n`);

  // 마크다운 생성
  const markdown = generateMarkdown(sections, projectPath);

  // docs 디렉토리 생성
  const docsDir = path.join(projectPath, 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  // 파일명 생성 (날짜 기반)
  const date = new Date().toISOString().split('T')[0];
  const filename = `session-${date}.md`;
  const filepath = path.join(docsDir, filename);

  // 기존 파일이 있으면 덧붙이기
  if (fs.existsSync(filepath) && state) {
    console.log(`ℹ️ 기존 문서에 내용을 추가합니다: ${filename}`);
    const existing = fs.readFileSync(filepath, 'utf-8');
    fs.writeFileSync(filepath, existing + '\n\n' + markdown);
  } else {
    fs.writeFileSync(filepath, markdown);
  }

  console.log(`✅ 문서가 생성되었습니다: ${filename}\n`);

  // 상태 업데이트
  const latestTimestamp = allMessages[allMessages.length - 1]?.timestamp || new Date().toISOString();
  const newState: StateTracker = {
    lastProcessedTimestamp: latestTimestamp,
    processedCount: (state?.processedCount || 0) + sections.length
  };
  saveState(projectPath, newState);

  console.log('📊 통계:');
  console.log(`   - 처리된 세션: ${sections.length}개`);
  console.log(`   - 총 누적 세션: ${newState.processedCount}개`);
  console.log(`   - 저장 위치: docs/${filename}\n`);
  console.log('✨ 완료!');
}

// CLI 진입점
if (require.main === module) {
  main(process.argv.slice(2)).catch(err => {
    console.error('에러 발생:', err.message);
    process.exit(1);
  });
}
