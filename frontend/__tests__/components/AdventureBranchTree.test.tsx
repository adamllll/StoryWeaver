import { render } from '@testing-library/react';
import { AdventureBranchTree } from '@/components/adventure/AdventureBranchTree';

let mockOption: {
  tooltip: { renderMode: string; formatter: (params: unknown) => string };
  series: { data: unknown[] }[];
};
jest.mock('next/dynamic', () => () => function Chart({ option }: { option: typeof mockOption }) {
  mockOption = option;
  return null;
});

test('untrusted tree labels use native text tooltips, never HTML rendering', () => {
  const payload = '<img src=x onerror=alert(1)>';
  render(<AdventureBranchTree tree={{
    id: 1, title: payload, player_name: payload, category: '其他',
    total_nodes: 1, total_words: 3, is_finished: false, fork_count: 0, children: [],
  }} />);
  expect(mockOption.tooltip.renderMode).toBe('richText');
  const text = mockOption.tooltip.formatter({ data: mockOption.series[0].data[0] });
  expect(text).toContain(payload);
  expect(text).not.toContain('<div');
});
