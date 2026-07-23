#!/usr/bin/env python3
"""Deploy cosmetolog API to VPS. Usage:
  set VPS_SSH_PASSWORD=... && set VPS_API_KEY=... && python scripts/deploy-vps.py
"""
import os, sys, io, tarfile

try:
    import paramiko
except ImportError:
    os.system(f'{sys.executable} -m pip install paramiko -q')
    import paramiko

HOST = os.environ.get('VPS_HOST', '79.137.192.194')
USER = os.environ.get('VPS_USER', 'root')
SSH_PASSWORD = os.environ.get('VPS_SSH_PASSWORD', '')
API_KEY = os.environ.get('VPS_API_KEY', '')
PORT = int(os.environ.get('VPS_API_PORT', '3847'))
REMOTE_DIR = '/opt/cosmetolog-api'
LOCAL_SERVER = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', 'server'))
FILES = ['index.js', 'db.js', 'package.json']

def main():
    if not SSH_PASSWORD or not API_KEY:
        print('Set VPS_SSH_PASSWORD and VPS_API_KEY env vars', file=sys.stderr)
        return 1

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f'Connecting to {HOST}...')
    client.connect(HOST, username=USER, password=SSH_PASSWORD, timeout=30)

    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode='w:gz') as tar:
        for name in FILES:
            tar.add(os.path.join(LOCAL_SERVER, name), arcname=name)

    sftp = client.open_sftp()
    remote_tar = '/tmp/cosmetolog-server.tar.gz'
    with sftp.file(remote_tar, 'wb') as f:
        f.write(buf.getvalue())
    sftp.close()

    env_escaped = f'PORT={PORT}\\nAPI_KEY={API_KEY}\\nHOST=0.0.0.0\\n'
    cmd = f'''set -e
mkdir -p {REMOTE_DIR} && cd {REMOTE_DIR}
tar -xzf {remote_tar} && rm -f {remote_tar}
printf '{env_escaped}' > .env
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs build-essential python3
fi
npm install --omit=dev
printf '%s\\n' '[Unit]' 'Description=Cosmetolog API' 'After=network.target' '' '[Service]' 'Type=simple' 'WorkingDirectory={REMOTE_DIR}' 'ExecStart=/usr/bin/node index.js' 'Restart=always' 'RestartSec=5' '' '[Install]' 'WantedBy=multi-user.target' > /etc/systemd/system/cosmetolog-api.service
systemctl daemon-reload
systemctl enable cosmetolog-api
systemctl restart cosmetolog-api
sleep 3
systemctl is-active cosmetolog-api
curl -s http://127.0.0.1:{PORT}/health
ufw allow {PORT}/tcp 2>/dev/null || true
'''
    stdin, stdout, stderr = client.exec_command(cmd, timeout=300)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    code = stdout.channel.recv_exit_status()
    sys.stdout.buffer.write(out.encode('utf-8', errors='replace'))
    if err:
        sys.stdout.buffer.write(err.encode('utf-8', errors='replace'))
    client.close()
    print(f'\nDeploy exit: {code}')
    return code

if __name__ == '__main__':
    sys.exit(main())
