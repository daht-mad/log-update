#!/usr/bin/env python3
"""
스킬 자동 업데이트 스크립트
SKILL.md의 frontmatter에서 repo와 version을 읽어 업데이트 여부를 확인하고 처리합니다.

사용법:
    python3 check_update.py [--auto] [--quiet]
"""

import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request


def get_skill_path() -> str:
    """현재 스크립트 기준 스킬 경로 반환"""
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def get_skill_info(skill_path: str) -> dict:
    """SKILL.md에서 스킬 정보 추출"""
    skill_md_path = os.path.join(skill_path, 'SKILL.md')

    if not os.path.exists(skill_md_path):
        print(f"에러: SKILL.md를 찾을 수 없습니다: {skill_md_path}")
        sys.exit(1)

    with open(skill_md_path, 'r', encoding='utf-8') as f:
        content = f.read()

    info = {}

    name_match = re.search(r'^name:\s*(.+)$', content, re.MULTILINE)
    if name_match:
        info['name'] = name_match.group(1).strip()

    repo_match = re.search(r'^repo:\s*(.+)$', content, re.MULTILINE)
    if repo_match:
        info['repo'] = repo_match.group(1).strip()

    version_match = re.search(r'^version:\s*(.+)$', content, re.MULTILINE)
    if version_match:
        info['version'] = version_match.group(1).strip()

    if 'repo' not in info or 'TODO' in info.get('repo', ''):
        print("에러: SKILL.md에 유효한 repo 필드가 없습니다.")
        sys.exit(1)

    if 'version' not in info:
        print("에러: SKILL.md에 version 필드가 없습니다.")
        sys.exit(1)

    if 'name' not in info:
        print("에러: SKILL.md에 name 필드가 없습니다.")
        sys.exit(1)

    return info


def get_remote_version(repo: str, skill_name: str) -> str | None:
    """GitHub에서 원격 버전 확인"""
    urls = [
        f"https://raw.githubusercontent.com/{repo}/master/SKILL.md",
        f"https://raw.githubusercontent.com/{repo}/main/SKILL.md",
    ]

    for url in urls:
        try:
            with urllib.request.urlopen(url, timeout=10) as response:
                content = response.read().decode('utf-8')
                version_match = re.search(r'^version:\s*(.+)$', content, re.MULTILINE)
                if version_match:
                    return version_match.group(1).strip()
        except Exception:
            continue

    return None


def compare_versions(local: str, remote: str) -> int:
    """버전 비교: local < remote면 -1, 같으면 0, local > remote면 1"""
    def parse_version(v: str) -> tuple:
        parts = v.split('.')
        return tuple(int(p) for p in parts if p.isdigit())

    local_parts = parse_version(local)
    remote_parts = parse_version(remote)

    if local_parts < remote_parts:
        return -1
    elif local_parts > remote_parts:
        return 1
    return 0


def update_skill(repo: str, skill_name: str, skill_path: str):
    """스킬 업데이트 실행"""
    print(f"📥 업데이트 다운로드 중...")

    with tempfile.TemporaryDirectory() as temp_dir:
        archive_url = f"https://github.com/{repo}/archive/refs/heads/master.tar.gz"
        archive_path = os.path.join(temp_dir, "archive.tar.gz")

        try:
            urllib.request.urlretrieve(archive_url, archive_path)
        except Exception:
            archive_url = f"https://github.com/{repo}/archive/refs/heads/main.tar.gz"
            try:
                urllib.request.urlretrieve(archive_url, archive_path)
            except Exception as e:
                print(f"에러: 다운로드 실패 - {e}")
                sys.exit(1)

        subprocess.run(['tar', '-xzf', archive_path, '-C', temp_dir], check=True)

        repo_name = repo.split('/')[-1]
        extracted_dirs = [d for d in os.listdir(temp_dir) if d.startswith(repo_name)]
        if not extracted_dirs:
            print("에러: 압축 해제 실패")
            sys.exit(1)

        extracted_path = os.path.join(temp_dir, extracted_dirs[0])

        if os.path.exists(skill_path):
            shutil.rmtree(skill_path)

        shutil.copytree(extracted_path, skill_path)

    print(f"   ✓ 업데이트 완료")


def main():
    import argparse

    parser = argparse.ArgumentParser(description='스킬 업데이트를 확인하고 적용합니다.')
    parser.add_argument('--auto', '-a', action='store_true', help='업데이트가 있으면 자동으로 적용')
    parser.add_argument('--quiet', '-q', action='store_true', help='최신 버전일 때 출력 없음')

    args = parser.parse_args()

    skill_path = get_skill_path()
    skill_info = get_skill_info(skill_path)
    skill_name = skill_info['name']
    repo = skill_info['repo']
    local_version = skill_info['version']

    remote_version = get_remote_version(repo, skill_name)

    if remote_version is None:
        if not args.quiet:
            print(f"⚠️  원격 버전을 확인할 수 없습니다: {repo}")
        sys.exit(0)

    comparison = compare_versions(local_version, remote_version)

    if comparison == 0:
        if not args.quiet:
            print(f"✓ {skill_name} v{local_version} - 최신 버전입니다.")
        sys.exit(0)
    elif comparison > 0:
        if not args.quiet:
            print(f"⚠️  {skill_name} v{local_version} - 로컬이 원격(v{remote_version})보다 높습니다.")
        sys.exit(0)
    else:
        print(f"🔄 {skill_name} 업데이트 가능: v{local_version} → v{remote_version}")

        if args.auto:
            update_skill(repo, skill_name, skill_path)
            print(f"🔄 {skill_name} 업데이트 완료: v{local_version} → v{remote_version}")
        else:
            print(f"\n업데이트하려면 --auto 옵션을 사용하세요:")
            print(f"  python3 scripts/check_update.py --auto")

        sys.exit(0)


if __name__ == "__main__":
    main()
