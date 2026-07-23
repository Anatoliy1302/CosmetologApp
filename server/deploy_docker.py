#!/usr/bin/env python3
"""
Deploy Cosmetolog API to VPS via Docker.
Usage: python deploy_docker.py <ssh_password>

Uploads server files, stops systemd service, starts docker compose.
Existing SQLite data in /opt/cosmetolog-api/data is preserved.
"""
from __future__ import annotations

import os
import sys
import paramiko

HOST = "79.137.192.194"
USER = "root"
REMOTE_DIR = "/opt/cosmetolog-api"

LOCAL_DIR = os.path.dirname(os.path.abspath(__file__))
FILES = [
    "Dockerfile",
    ".dockerignore",
    "docker-compose.yml",
    "index.js",
    "db.js",
    "package.json",
    "package-lock.json",
]


def upload_files(sftp: paramiko.SFTPClient) -> None:
    for name in FILES:
        local = os.path.join(LOCAL_DIR, name)
        if not os.path.exists(local):
            print(f"skip missing: {name}")
            continue
        remote = f"{REMOTE_DIR}/{name}"
        print(f"upload {name}")
        sftp.put(local, remote)


def run(client: paramiko.SSHClient, cmd: str) -> tuple[int, str, str]:
    print(f"$ {cmd}")
    _, stdout, stderr = client.exec_command(cmd, timeout=600)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    code = stdout.channel.recv_exit_status()
    if out.strip():
        print(out.encode("ascii", errors="replace").decode("ascii"))
    if err.strip():
        print(err.encode("ascii", errors="replace").decode("ascii"))
    return code, out, err


def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python deploy_docker.py <ssh_password>")
        sys.exit(1)

    password = sys.argv[1]
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=password, timeout=30)

    sftp = client.open_sftp()
    upload_files(sftp)
    sftp.close()

    commands = [
        f"cd {REMOTE_DIR}",
        "systemctl stop cosmetolog-api || true",
        "systemctl disable cosmetolog-api || true",
        "docker compose down 2>/dev/null || true",
        "docker compose up -d --build",
        "sleep 5",
        "docker compose ps",
        "curl -s http://127.0.0.1:3847/health",
    ]
    code, _, _ = run(client, " && ".join(commands))
    client.close()
    sys.exit(code)


if __name__ == "__main__":
    main()
