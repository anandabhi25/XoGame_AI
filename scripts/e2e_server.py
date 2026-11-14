"""A disposable, isolated database and media directory for browser tests."""

import os
import subprocess
import sys
import tempfile

with tempfile.TemporaryDirectory(prefix="xogame-e2e-") as directory:
    environment = {
        **os.environ,
        "DATABASE_PATH": directory + "/test.db",
        "MEDIA_PATH": directory + "/media",
    }
    subprocess.run(
        [
            sys.executable,
            "-m",
            "uvicorn",
            "backend.main:app",
            "--host",
            "127.0.0.1",
            "--port",
            "8010",
        ],
        env=environment,
        check=True,
    )
