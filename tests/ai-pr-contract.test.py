"""Exercise the contributor contract's actual workflow script with deterministic API fixtures."""
import contextlib
import io
import json
import os
from pathlib import Path
import re
import textwrap
import unittest
from unittest.mock import patch

workflow = Path(".github/workflows/ai-pr-contract.yml").read_text(encoding="utf-8")
script = compile(textwrap.dedent(re.search(r"python3 - <<'PY'\n(.*?)^\s*PY$", workflow, re.M | re.S)[1]),
                 "ai-pr-contract.yml", "exec")

class ContributorContractTest(unittest.TestCase):
    def check_contract(self, other_prs):
        sha = "a" * 40
        spec_path = "prompts/123-example.md"
        body = (
            f"Task issue: #123\nApproved spec: {spec_path} @ {sha}\n"
            "Scope: Test contributor metadata\nRelated PRs/duplicates: None\n"
            "Test evidence: Fixture\nHandover: Fixture\nRisks: None\n"
        )
        env = {"PR_TITLE": "[WT-123] Example", "PR_BODY": body, "PR_NUMBER": "50",
               "GH_REPOSITORY": "example/studio", "GH_TOKEN": "fixture-token"}
        responses = {
            "issues/123": {"title": "[WT-123] Example task"},
            "pulls?state=open&per_page=100&page=1": [{"number": 50, "body": body}, *other_prs],
            f"contents/{spec_path}?ref={sha}": {"type": "file"},
        }

        def fetch(request, timeout):
            key = request.full_url.removeprefix("https://api.github.com/repos/example/studio/")
            return io.StringIO(json.dumps(responses[key]))

        output = io.StringIO()
        status = 0
        with patch.dict(os.environ, env), patch("urllib.request.urlopen", side_effect=fetch):
            with contextlib.redirect_stdout(output):
                try:
                    exec(script, {})
                except SystemExit as exc:
                    status = exc.code
        return status, output.getvalue()

    def test_valid_task_and_current_pr_exclusion(self):
        status, output = self.check_contract([{"number": 51, "body": "Task issue: #1234"}])
        self.assertEqual(status, 0, output)
        self.assertIn("External contributor contract verified for WT-123", output)

    def test_duplicate_claim_is_rejected(self):
        status, output = self.check_contract([{"number": 51, "body": "Task issue: #123"}])
        self.assertEqual(status, 1)
        self.assertIn("Duplicate task claim: PR #51 already references Issue #123", output)

if __name__ == "__main__":
    unittest.main(verbosity=2)
