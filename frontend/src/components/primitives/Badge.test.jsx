import { describe, it, expect } from 'vitest';
import { render, screen } from '../../__tests__/utils/test-utils';
import Badge from './Badge';

describe('Badge', () => {
  it('renders label text', () => {
    render(<Badge status="DRAFT">Draft</Badge>);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  describe('status variants', () => {
    it('applies DRAFT status classes (gray)', () => {
      const { container } = render(<Badge status="DRAFT">Draft</Badge>);
      const badge = container.firstChild;

      expect(badge).toHaveClass('bg-gray-100');
      expect(badge).toHaveClass('text-gray-600');
    });

    it('applies SELECTING status classes (blue)', () => {
      const { container } = render(<Badge status="SELECTING">Selecting</Badge>);
      const badge = container.firstChild;

      expect(badge).toHaveClass('bg-blue-100');
      expect(badge).toHaveClass('text-blue-700');
    });

    it('applies REVIEWING status classes (green)', () => {
      const { container } = render(<Badge status="REVIEWING">Reviewing</Badge>);
      const badge = container.firstChild;

      expect(badge).toHaveClass('bg-green-100');
      expect(badge).toHaveClass('text-green-700');
    });

    it('applies DELIVERED status classes (purple)', () => {
      const { container } = render(<Badge status="DELIVERED">Delivered</Badge>);
      const badge = container.firstChild;

      expect(badge).toHaveClass('bg-purple-100');
      expect(badge).toHaveClass('text-purple-700');
    });

    it('applies DOWNLOADED status classes (darker purple)', () => {
      const { container } = render(<Badge status="DOWNLOADED">Downloaded</Badge>);
      const badge = container.firstChild;

      expect(badge).toHaveClass('bg-purple-200');
      expect(badge).toHaveClass('text-purple-800');
    });

    it('defaults to DRAFT classes for unknown status', () => {
      const { container } = render(<Badge status="UNKNOWN">Unknown</Badge>);
      const badge = container.firstChild;

      expect(badge).toHaveClass('bg-gray-100');
      expect(badge).toHaveClass('text-gray-600');
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
      expect(dot).toHaveClass('bg-blue-700');
    });

    it('renders DRAFT dot color (gray) when showDot is true', () => {
      const { container } = render(
        <Badge status="DRAFT" showDot>Draft</Badge>
      );
      const dot = container.querySelector('.w-2');

      expect(dot).toHaveClass('bg-gray-600');
    });

    it('renders REVIEWING dot color (green) when showDot is true', () => {
      const { container } = render(
        <Badge status="REVIEWING" showDot>Reviewing</Badge>
      );
      const dot = container.querySelector('.w-2');

      expect(dot).toHaveClass('bg-green-700');
    });

    it('renders DELIVERED dot color (purple) when showDot is true', () => {
      const { container } = render(
        <Badge status="DELIVERED" showDot>Delivered</Badge>
      );
      const dot = container.querySelector('.w-2');

      expect(dot).toHaveClass('bg-purple-700');
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
