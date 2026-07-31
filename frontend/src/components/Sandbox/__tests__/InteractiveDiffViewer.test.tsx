import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { InteractiveDiffViewer } from '../InteractiveDiffViewer';
import { describe, test, expect, vi, afterEach } from 'vitest';

describe('InteractiveDiffViewer', () => {
  afterEach(() => {
    cleanup();
  });

  const sampleExpected = 'const a = 1;\nconst b = 2;';
  const sampleSubmitted = 'const a = 1;\nconst b = 3;\nconst c = 4;';

  const mockDiffData = {
    has_changes: true,
    additions_count: 2,
    deletions_count: 1,
    lines: [
      { type: 'unchanged' as const, expected_line_num: 1, submitted_line_num: 1, content: 'const a = 1;' },
      { type: 'removed' as const, expected_line_num: 2, submitted_line_num: null, content: 'const b = 2;' },
      { type: 'added' as const, expected_line_num: null, submitted_line_num: 2, content: 'const b = 3;' },
      { type: 'added' as const, expected_line_num: null, submitted_line_num: 3, content: 'const c = 4;' },
    ],
    unified_diff: '--- Expected Solution\n+++ User Submission\n-const b = 2;\n+const b = 3;\n+const c = 4;',
  };

  test('renders diff header and addition/deletion counts', () => {
    render(<InteractiveDiffViewer expected={sampleExpected} submitted={sampleSubmitted} diffData={mockDiffData} />);

    expect(screen.getByText('Exercise Solution Diff Viewer')).toBeInTheDocument();
    expect(screen.getByText(/\+2 additions/i)).toBeInTheDocument();
    expect(screen.getByText(/-1 deletions/i)).toBeInTheDocument();
  });

  test('switches between split and unified view modes', () => {
    render(<InteractiveDiffViewer expected={sampleExpected} submitted={sampleSubmitted} diffData={mockDiffData} />);

    expect(screen.getByText('Expected Solution')).toBeInTheDocument();
    expect(screen.getByText('Your Submission')).toBeInTheDocument();

    const unifiedBtn = screen.getByRole('button', { name: /unified/i });
    fireEvent.click(unifiedBtn);

    expect(screen.getByText('Unified Stream')).toBeInTheDocument();
  });

  test('handles copy diff button click', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<InteractiveDiffViewer expected={sampleExpected} submitted={sampleSubmitted} diffData={mockDiffData} />);

    const copyBtn = screen.getByRole('button', { name: /copy diff/i });
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith(mockDiffData.unified_diff);
  });
});
