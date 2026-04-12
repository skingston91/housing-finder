import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { system } from '@/theme/theme';

import { ScoreBar } from './ScoreBar';

describe('ScoreBar', () => {
  it('treats non-finite values as neutral 50 so the UI never shows NaN', () => {
    render(
      <ChakraProvider value={system}>
        <ScoreBar label="Price momentum (UK HPI YoY, relative)" value={Number.NaN} />
      </ChakraProvider>,
    );
    expect(screen.getByText(/Price momentum/)).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });
});
