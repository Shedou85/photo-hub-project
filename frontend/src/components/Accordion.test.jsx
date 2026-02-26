import { describe, it, expect } from 'vitest';
import { render, screen } from '../__tests__/utils/test-utils';
import userEvent from '@testing-library/user-event';
import Accordion from './Accordion';

describe('Accordion', () => {
  it('renders title text', () => {
    render(<Accordion title="Section Title">Content here</Accordion>);
    expect(screen.getByText('Section Title')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(<Accordion title="Title">Panel content</Accordion>);
    expect(screen.getByText('Panel content')).toBeInTheDocument();
  });

  describe('open/closed state', () => {
    it('is closed by default (max-h-0 on panel)', () => {
      const { container } = render(
        <Accordion title="Title">Content</Accordion>
      );
      const panel = container.querySelector('[role="region"]');
      expect(panel).toHaveClass('max-h-0');
    });

    it('opens when defaultOpen is true', () => {
      const { container } = render(
        <Accordion title="Title" defaultOpen>Content</Accordion>
      );
      const panel = container.querySelector('[role="region"]');
      expect(panel).toHaveClass('max-h-[1000px]');
    });

    it('toggles open on header click', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Accordion title="Toggle Me">Content</Accordion>
      );
      const header = screen.getByRole('button', { name: /Toggle Me/i });
      const panel = container.querySelector('[role="region"]');

      expect(panel).toHaveClass('max-h-0');

      await user.click(header);
      expect(panel).toHaveClass('max-h-[1000px]');

      await user.click(header);
      expect(panel).toHaveClass('max-h-0');
    });

    it('toggles closed when defaultOpen and header is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Accordion title="Open Initially" defaultOpen>Content</Accordion>
      );
      const header = screen.getByRole('button', { name: /Open Initially/i });
      const panel = container.querySelector('[role="region"]');

      expect(panel).toHaveClass('max-h-[1000px]');

      await user.click(header);
      expect(panel).toHaveClass('max-h-0');
    });
  });

  describe('aria attributes', () => {
    it('header has aria-expanded=false when closed', () => {
      render(<Accordion title="Title">Content</Accordion>);
      const header = screen.getByRole('button', { name: /Title/i });
      expect(header).toHaveAttribute('aria-expanded', 'false');
    });

    it('header has aria-expanded=true when open', () => {
      render(<Accordion title="Title" defaultOpen>Content</Accordion>);
      const header = screen.getByRole('button', { name: /Title/i });
      expect(header).toHaveAttribute('aria-expanded', 'true');
    });

    it('updates aria-expanded to true after clicking to open', async () => {
      const user = userEvent.setup();
      render(<Accordion title="Title">Content</Accordion>);
      const header = screen.getByRole('button', { name: /Title/i });

      await user.click(header);
      expect(header).toHaveAttribute('aria-expanded', 'true');
    });

    it('header aria-controls points to panel id', () => {
      const { container } = render(
        <Accordion title="Title">Content</Accordion>
      );
      const header = screen.getByRole('button', { name: /Title/i });
      const panel = container.querySelector('[role="region"]');

      const controls = header.getAttribute('aria-controls');
      expect(controls).toBeTruthy();
      expect(panel).toHaveAttribute('id', controls);
    });

    it('panel has role="region"', () => {
      render(<Accordion title="Title">Content</Accordion>);
      expect(screen.getByRole('region')).toBeInTheDocument();
    });
  });

  describe('keyboard interaction', () => {
    it('toggles open with Enter key', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Accordion title="Title">Content</Accordion>
      );
      const header = screen.getByRole('button', { name: /Title/i });
      const panel = container.querySelector('[role="region"]');

      header.focus();
      await user.keyboard('{Enter}');
      expect(panel).toHaveClass('max-h-[1000px]');
    });

    it('toggles open with Space key', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Accordion title="Title">Content</Accordion>
      );
      const header = screen.getByRole('button', { name: /Title/i });
      const panel = container.querySelector('[role="region"]');

      header.focus();
      await user.keyboard(' ');
      expect(panel).toHaveClass('max-h-[1000px]');
    });

    it('header is focusable via tabIndex', () => {
      render(<Accordion title="Title">Content</Accordion>);
      const header = screen.getByRole('button', { name: /Title/i });
      expect(header).toHaveAttribute('tabindex', '0');
    });
  });
});
