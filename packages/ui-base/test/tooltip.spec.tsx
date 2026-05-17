import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  SimpleTooltip,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../src/components/tooltip.js';

describe('Tooltip', () => {
  it('muestra contenido cuando el root está open', () => {
    render(
      <TooltipProvider>
        <Tooltip open>
          <TooltipTrigger asChild>
            <button type="button">Info</button>
          </TooltipTrigger>
          <TooltipContent>Help text</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    expect(screen.getByRole('button', { name: 'Info' })).toBeTruthy();
    expect(screen.getAllByText('Help text').length).toBeGreaterThan(0);
  });
});

describe('SimpleTooltip', () => {
  it('renderiza el trigger', () => {
    render(
      <TooltipProvider>
        <SimpleTooltip content="Help text">
          <button type="button">Info</button>
        </SimpleTooltip>
      </TooltipProvider>,
    );

    expect(screen.getByRole('button', { name: 'Info' })).toBeTruthy();
  });
});
