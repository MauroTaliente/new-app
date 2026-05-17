import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '../src/components/dialog.js';

describe('Dialog', () => {
  it('muestra contenido cuando está open', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Confirm action</DialogTitle>
          <DialogDescription>This cannot be undone.</DialogDescription>
          <DialogFooter>
            <button type="button">OK</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByText('Confirm action')).toBeTruthy();
    expect(screen.getByText('This cannot be undone.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Close' })).toBeTruthy();
  });

  it('oculta el botón close con hideCloseButton', () => {
    render(
      <Dialog open>
        <DialogContent hideCloseButton>
          <DialogTitle>No close</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });

  it('usa closeAriaLabel custom', () => {
    render(
      <Dialog open>
        <DialogContent closeAriaLabel="Dismiss">
          <DialogTitle>Modal</DialogTitle>
        </DialogContent>
      </Dialog>,
    );

    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeTruthy();
  });
});
