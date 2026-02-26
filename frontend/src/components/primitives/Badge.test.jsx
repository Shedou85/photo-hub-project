import { describe, it, expect } from 'vitest';
import { render, screen } from '../../__tests__/utils/test-utils';
import Badge from './Badge';

describe('Badge', () => {
  it('renders label text', () => {
    render(<Badge status="DRAFT">Draft</Badge>);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  describe('status variants', () => {
    it('applies DRAFT status classes', () => {
      const { container } = render(<Badge status="DRAFT">Draft</Badge>);
      const badge = container.firstChild;

      expect(badge).toHaveClass('bg-white/[0.08]');
      expect(badge).toHaveClass('text-white/50');
    });

    it('applies SELECTING status classes (blue)', () => {
      const { container } = render(<Badge status="SELECTING">Selecting</Badge>);
      const badge = container.firstChild;

      expect(badge).toHaveClass('bg-blue-400/15');
      expect(badge).toHaveClass('text-blue-400');
    });

    it('applies REVIEWING status classes (amber)', () => {
      const { container } = render(<Badge status="REVIEWING">Reviewing</Badge>);
      const badge = container.firstChild;

      expect(badge).toHaveClass('bg-amber-400/15');
      expect(badge).toHaveClass('text-amber-400');
    });

    it('applies DELIVERED status classes (emerald)', () => {
      const { container } = render(<Badge status="DELIVERED">Delivered</Badge>);
      const badge = container.firstChild;

      expect(badge).toHaveClass('bg-emerald-400/15');
      expect(badge).toHaveClass('text-emerald-400');
    });

    it('applies DOWNLOADED status classes (green)', () => {
      const { container } = render(<Badge status="DOWNLOADED">Downloaded</Badge>);
      const badge = container.firstChild;

      expect(badge).toHaveClass('bg-green-400/20');
      expect(badge).toHaveClass('text-green-400');
    });

    it('applies ARCHIVED status classes', () => {
      const { container } = render(<Badge status="ARCHIVED">Archived</Badge>);
      const badge = container.firstChild;

      expect(badge).toHaveClass('bg-white/[0.06]');
      expect(badge).toHaveClass('text-white/50');
    });

    it('defaults to DRAFT classes for unknown status', () => {
      const { container } = render(<Badge status="UNKNOWN">Unknown</Badge>);
      const badge = container.firstChild;

      expect(badge).toHaveClass('bg-white/[0.08]');
      expect(badge).toHaveClass('text-white/50');
    });
  });

  describe('colored dot indicator', () => {
    it('does not render dot by default', () => {
      const { container } = render(<Badge status="SELECTING">Selecting</Badge>);
      const dot = container.querySelector('.w-2.h-2.rounded-full');

      expect(dot).not.toBeInTheDocument();
    });

    it('renders colored dot when showDot is true', () => {
      const { container } = render(
        <Badge status="SELECTING" showDot>Selecting</Badge>
      );
      const dot = container.querySelector('.w-2');

      expect(dot).toBeInTheDocument();
      expect(dot).toHaveClass('rounded-full');
      expect(dot).toHaveClass('bg-blue-400');
    });

    it('renders DRAFT dot color when showDot is true', () => {
      const { container } = render(
        <Badge status="DRAFT" showDot>Draft</Badge>
      );
      const dot = container.querySelector('.w-2');

      expect(dot).toHaveClass('bg-white/50');
    });

    it('renders REVIEWING dot color (amber) when showDot is true', () => {
      const { container } = render(
        <Badge status="REVIEWING" showDot>Reviewing</Badge>
      );
      const dot = container.querySelector('.w-2');

      expect(dot).toHaveClass('bg-amber-400');
    });

    it('renders DELIVERED dot color (emerald) when showDot is true', () => {
      const { container } = render(
        <Badge status="DELIVERED" showDot>Delivered</Badge>
      );
      const dot = container.querySelector('.w-2');

      expect(dot).toHaveClass('bg-emerald-400');
    });

    it('dot has aria-hidden attribute', () => {
      const { container } = render(
        <Badge status="DELIVERED" showDot>Delivered</Badge>
      );
      const dot = container.querySelector('.w-2');

      expect(dot).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('className passthrough', () => {
    it('merges additional classes with defaults', () => {
      const { container } = render(
        <Badge status="SELECTING" className="custom-class">Selecting</Badge>
      );
      const badge = container.firstChild;

      expect(badge).toHaveClass('custom-class');
      expect(badge).toHaveClass('inline-flex'); // base class still present
    });
  });
});
