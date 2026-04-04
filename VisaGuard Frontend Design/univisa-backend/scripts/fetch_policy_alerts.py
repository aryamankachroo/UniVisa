"""
Run policy-alert ingestion manually or from cron/GitHub Actions.
"""
from pathlib import Path
import sys

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")
load_dotenv(ROOT / ".eNV")

sys.path.insert(0, str(ROOT))

from services.policy_alert_ingest import ingest_policy_alerts  # noqa: E402


def main() -> None:
    result = ingest_policy_alerts(limit_per_source=20)
    print(result)


if __name__ == "__main__":
    main()

