import difflib
from typing import Any, Dict, List


def compute_diff(expected: str, submitted: str) -> Dict[str, Any]:
    """
    Computes side-by-side and unified line-by-line diff between expected solution and submitted user code/text.

    Returns structured diff metadata including line numbers, change types, and counts.
    """
    expected_lines = expected.splitlines() if expected else []
    submitted_lines = submitted.splitlines() if submitted else []

    matcher = difflib.SequenceMatcher(None, expected_lines, submitted_lines)
    diff_lines: List[Dict[str, Any]] = []

    additions_count = 0
    deletions_count = 0

    orig_num = 1
    mod_num = 1

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            for line in expected_lines[i1:i2]:
                diff_lines.append(
                    {
                        "type": "unchanged",
                        "original_line_num": orig_num,
                        "modified_line_num": mod_num,
                        "content": line,
                    }
                )
                orig_num += 1
                mod_num += 1
        elif tag == "replace":
            for line in expected_lines[i1:i2]:
                diff_lines.append(
                    {
                        "type": "removed",
                        "original_line_num": orig_num,
                        "modified_line_num": None,
                        "content": line,
                    }
                )
                orig_num += 1
                deletions_count += 1
            for line in submitted_lines[j1:j2]:
                diff_lines.append(
                    {
                        "type": "added",
                        "original_line_num": None,
                        "modified_line_num": mod_num,
                        "content": line,
                    }
                )
                mod_num += 1
                additions_count += 1
        elif tag == "delete":
            for line in expected_lines[i1:i2]:
                diff_lines.append(
                    {
                        "type": "removed",
                        "original_line_num": orig_num,
                        "modified_line_num": None,
                        "content": line,
                    }
                )
                orig_num += 1
                deletions_count += 1
        elif tag == "insert":
            for line in submitted_lines[j1:j2]:
                diff_lines.append(
                    {
                        "type": "added",
                        "original_line_num": None,
                        "modified_line_num": mod_num,
                        "content": line,
                    }
                )
                mod_num += 1
                additions_count += 1

    raw_unified = list(
        difflib.unified_diff(
            expected_lines,
            submitted_lines,
            fromfile="Expected Solution",
            tofile="User Submission",
            lineterm="",
        )
    )

    return {
        "has_changes": additions_count > 0 or deletions_count > 0,
        "additions_count": additions_count,
        "deletions_count": deletions_count,
        "lines": diff_lines,
        "unified_diff": "\n".join(raw_unified),
    }
