#!/usr/bin/env python3
"""
Update skills from configured git repository feeds.

Usage:
    ./update_feeds.py [--config feeds.json]
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import List, Optional


DEFAULT_FEEDS_CONFIG = {
    "feeds": [
        {
            "name": "official",
            "url": "https://github.com/anthropics/skills.git",
            "enabled": False,
            "description": "Official Anthropic skills repository"
        }
    ],
    "local_skills_dir": "skills",
    "cache_dir": ".skill-cache"
}


def load_config(config_path: Path) -> dict:
    """Load feeds configuration."""
    if config_path.exists():
        return json.loads(config_path.read_text())
    return DEFAULT_FEEDS_CONFIG


def save_config(config: dict, config_path: Path):
    """Save feeds configuration."""
    config_path.write_text(json.dumps(config, indent=2))


def clone_or_update_repo(url: str, cache_dir: Path, name: str) -> Optional[Path]:
    """Clone or update a git repository."""
    repo_dir = cache_dir / name
    
    try:
        if repo_dir.exists():
            print(f"  Updating {name}...")
            subprocess.run(
                ["git", "-C", str(repo_dir), "pull", "--ff-only"],
                check=True,
                capture_output=True,
                text=True
            )
        else:
            print(f"  Cloning {name}...")
            subprocess.run(
                ["git", "clone", "--depth", "1", url, str(repo_dir)],
                check=True,
                capture_output=True,
                text=True
            )
        return repo_dir
    except subprocess.CalledProcessError as e:
        print(f"  ✗ Error: {e.stderr}")
        return None


def discover_skills_in_repo(repo_dir: Path) -> List[Path]:
    """Find all skills in a repository."""
    skills = []
    
    # Check common locations
    for search_path in [repo_dir, repo_dir / "skills"]:
        if search_path.exists():
            for item in search_path.iterdir():
                if item.is_dir() and (item / "SKILL.md").exists():
                    skills.append(item)
    
    return skills


def import_skill(skill_path: Path, target_dir: Path, overwrite: bool = False) -> bool:
    """Import a skill into the local skills directory."""
    skill_name = skill_path.name
    target_path = target_dir / skill_name
    
    if target_path.exists():
        if overwrite:
            shutil.rmtree(target_path)
        else:
            print(f"    Skipping {skill_name} (already exists)")
            return False
    
    shutil.copytree(skill_path, target_path)
    print(f"    ✓ Imported {skill_name}")
    return True


def update_feeds(config_path: Path, import_all: bool = False, overwrite: bool = False):
    """Update all enabled feeds."""
    config = load_config(config_path)
    
    cache_dir = Path(config.get("cache_dir", ".skill-cache"))
    cache_dir.mkdir(parents=True, exist_ok=True)
    
    local_skills_dir = Path(config.get("local_skills_dir", "skills"))
    
    enabled_feeds = [f for f in config.get("feeds", []) if f.get("enabled", True)]
    
    if not enabled_feeds:
        print("No enabled feeds found.")
        print("Add feeds to feeds.json or enable existing ones.")
        return
    
    print(f"Updating {len(enabled_feeds)} feed(s)...")
    print()
    
    total_imported = 0
    
    for feed in enabled_feeds:
        name = feed["name"]
        url = feed["url"]
        description = feed.get("description", "")
        
        print(f"Feed: {name}")
        if description:
            print(f"  {description}")
        
        repo_dir = clone_or_update_repo(url, cache_dir, name)
        if repo_dir is None:
            continue
        
        skills = discover_skills_in_repo(repo_dir)
        print(f"  Found {len(skills)} skill(s)")
        
        if import_all:
            for skill_path in skills:
                if import_skill(skill_path, local_skills_dir, overwrite):
                    total_imported += 1
        else:
            for skill_path in skills:
                print(f"    - {skill_path.name}")
        
        print()
    
    if import_all:
        print(f"Imported {total_imported} skill(s)")
    else:
        print("Use --import to import skills from feeds")


def add_feed(config_path: Path, name: str, url: str, description: str = ""):
    """Add a new feed to configuration."""
    config = load_config(config_path)
    
    # Check if feed already exists
    for feed in config.get("feeds", []):
        if feed["name"] == name:
            print(f"Feed '{name}' already exists")
            return
    
    config.setdefault("feeds", []).append({
        "name": name,
        "url": url,
        "enabled": True,
        "description": description
    })
    
    save_config(config, config_path)
    print(f"✓ Added feed: {name}")


def list_feeds(config_path: Path):
    """List configured feeds."""
    config = load_config(config_path)
    
    feeds = config.get("feeds", [])
    if not feeds:
        print("No feeds configured")
        return
    
    print("Configured Feeds:")
    print("=" * 60)
    
    for feed in feeds:
        status = "✓" if feed.get("enabled", True) else "✗"
        print(f"  {status} {feed['name']}")
        print(f"    URL: {feed['url']}")
        if feed.get("description"):
            print(f"    {feed['description']}")
        print()


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Update skills from git repository feeds",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        "--config",
        type=Path,
        default=Path("feeds.json"),
        help="Path to feeds configuration file (default: feeds.json)"
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Commands")
    
    # Update command
    update_parser = subparsers.add_parser("update", help="Update feeds")
    update_parser.add_argument("--import", dest="import_all", action="store_true",
                               help="Import skills from feeds")
    update_parser.add_argument("--overwrite", action="store_true",
                               help="Overwrite existing skills")
    
    # Add command
    add_parser = subparsers.add_parser("add", help="Add a new feed")
    add_parser.add_argument("name", help="Feed name")
    add_parser.add_argument("url", help="Git repository URL")
    add_parser.add_argument("--description", default="", help="Feed description")
    
    # List command
    subparsers.add_parser("list", help="List configured feeds")
    
    # Init command
    subparsers.add_parser("init", help="Initialize default feeds configuration")
    
    args = parser.parse_args()
    
    if args.command == "update":
        update_feeds(args.config, args.import_all, args.overwrite)
    elif args.command == "add":
        add_feed(args.config, args.name, args.url, args.description)
    elif args.command == "list":
        list_feeds(args.config)
    elif args.command == "init":
        if args.config.exists():
            print(f"Config file already exists: {args.config}")
        else:
            save_config(DEFAULT_FEEDS_CONFIG, args.config)
            print(f"✓ Created {args.config}")
    else:
        # Default to update if no command
        update_feeds(args.config)


if __name__ == "__main__":
    main()
