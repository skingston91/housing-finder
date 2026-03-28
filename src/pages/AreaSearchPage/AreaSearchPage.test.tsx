import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { system } from '@/theme/theme';

import { AreaSearchPage } from './AreaSearchPage';

const wrapper = ({ children }: { children: ReactNode }) => (
  <ChakraProvider value={system}>{children}</ChakraProvider>
);

describe('AreaSearchPage', () => {
  it('renders primary heading', () => {
    render(<AreaSearchPage />, { wrapper });
    expect(
      screen.getByRole('heading', { level: 1, name: /find areas to buy/i }),
    ).toBeInTheDocument();
  });
});
