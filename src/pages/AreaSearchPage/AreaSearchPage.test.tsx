import { ChakraProvider } from '@chakra-ui/react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { system } from '@/theme/theme';

import { AreaSearchPage } from './AreaSearchPage';
import { defaultFormState } from './buildSearchAreasRequest';
import { encodeAreaSearchQueryParam } from './areaSearchUrlState';

beforeEach(() => {
  window.history.replaceState(null, '', '/');
});

afterEach(() => {
  cleanup();
});

function renderAtPath(path: string) {
  window.history.replaceState(null, '', path);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ChakraProvider value={system}>
        <AreaSearchPage />
      </ChakraProvider>
    </MemoryRouter>,
  );
}

describe('AreaSearchPage', () => {
  it('renders primary heading', () => {
    renderAtPath('/');
    expect(
      screen.getByRole('heading', { level: 1, name: /find areas to buy/i }),
    ).toBeInTheDocument();
  });

  it('hydrates workplace from valid q in the address bar', async () => {
    const form = { ...defaultFormState(), workplaceLabel: 'Shared Canary Wharf' };
    const q = encodeAreaSearchQueryParam(form);
    renderAtPath(`/?q=${encodeURIComponent(q)}`);

    await waitFor(() => {
      expect(screen.getByLabelText(/workplace label/i)).toHaveValue('Shared Canary Wharf');
    });
  });

  it('does not show the default-settings message on first load without q', async () => {
    renderAtPath('/');

    await waitFor(() => {
      expect(screen.getByLabelText(/workplace label/i)).toHaveValue('Old Street');
    });
    expect(screen.queryByText(/default search settings/i)).not.toBeInTheDocument();
  });

  it('keeps edited field values while the URL updates on a debounce (no stale q overwrite)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      renderAtPath('/');

      const maxPrice = await screen.findByLabelText(/maximum price in GBP/i);
      fireEvent.change(maxPrice, { target: { value: '500000' } });
      expect(maxPrice).toHaveValue(500000);

      await vi.advanceTimersByTimeAsync(500);
      await waitFor(() => {
        expect(maxPrice).toHaveValue(500000);
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('falls back to defaults when q is invalid', async () => {
    renderAtPath('/?q=not-valid-payload');

    await waitFor(() => {
      expect(screen.getByLabelText(/workplace label/i)).toHaveValue('Old Street');
    });
  });

  it('reset search restores default workplace and clears criteria-driven state', async () => {
    const form = { ...defaultFormState(), workplaceLabel: 'Before reset' };
    const q = encodeAreaSearchQueryParam(form);
    renderAtPath(`/?q=${encodeURIComponent(q)}`);

    await waitFor(() => {
      expect(screen.getByLabelText(/workplace label/i)).toHaveValue('Before reset');
    });

    fireEvent.click(screen.getByRole('button', { name: /reset search criteria to defaults/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/workplace label/i)).toHaveValue('Old Street');
    });
    expect(screen.getByText(/default search settings/i)).toBeInTheDocument();
  });
});
