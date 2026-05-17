import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Popover, PopoverContent, PopoverTrigger } from '../src/components/popover.js';

describe('Popover', () => {
  it('muestra contenido en portal cuando está open', () => {
    render(
      <Popover open>
        <PopoverTrigger asChild>
          <button type="button">Open menu</button>
        </PopoverTrigger>
        <PopoverContent>Popover body</PopoverContent>
      </Popover>,
    );

    expect(screen.getByText('Popover body')).toBeTruthy();
  });
});
