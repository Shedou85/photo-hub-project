import { describe, it, expect } from 'vitest';
import { render, screen } from '../../__tests__/utils/test-utils';
import Input from './Input';

describe('Input', () => {
  it('renders a text input', () => {
    render(<Input placeholder="Search..." />);
    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
  });

  describe('size prop', () => {
    it('applies medium size classes by default', () => {
      render(<Input placeholder="test" />);
      const input = screen.getByPlaceholderText('test');
      expect(input).toHaveClass('text-sm');
      expect(input).toHaveClass('py-2.5');
      expect(input).toHaveClass('px-4');
      expect(input).toHaveClass('rounded-lg');
    });

    it('applies small size classes', () => {
      render(<Input size="sm" placeholder="test" />);
      const input = screen.getByPlaceholderText('test');
      expect(input).toHaveClass('text-xs');
      expect(input).toHaveClass('py-1');
      expect(input).toHaveClass('px-2');
      expect(input).toHaveClass('rounded-md');
    });
  });

  describe('fullWidth prop', () => {
    it('applies w-full by default', () => {
      render(<Input placeholder="test" />);
      expect(screen.getByPlaceholderText('test')).toHaveClass('w-full');
    });

    it('does not apply w-full when fullWidth is false', () => {
      render(<Input fullWidth={false} placeholder="test" />);
      expect(screen.getByPlaceholderText('test')).not.toHaveClass('w-full');
    });
  });

  describe('error prop', () => {
    it('applies default border when no error', () => {
      render(<Input placeholder="test" />);
      const input = screen.getByPlaceholderText('test');
      expect(input).toHaveClass('border-white/[0.12]');
      expect(input).toHaveClass('focus:border-indigo-500/70');
    });

    it('applies error border classes when error is true', () => {
      render(<Input error placeholder="test" />);
      const input = screen.getByPlaceholderText('test');
      expect(input).toHaveClass('border-red-500/50');
      expect(input).toHaveClass('focus:border-red-500/70');
    });
  });

  describe('className passthrough', () => {
    it('merges additional classes with defaults', () => {
      render(<Input className="pl-10" placeholder="test" />);
      const input = screen.getByPlaceholderText('test');
      expect(input).toHaveClass('pl-10');
      expect(input).toHaveClass('bg-white/[0.06]'); // base class still present
    });
  });

  describe('disabled state', () => {
    it('is not disabled by default', () => {
      render(<Input placeholder="test" />);
      expect(screen.getByPlaceholderText('test')).not.toBeDisabled();
    });

    it('is disabled when disabled prop is true', () => {
      render(<Input disabled placeholder="test" />);
      expect(screen.getByPlaceholderText('test')).toBeDisabled();
    });
  });
});
