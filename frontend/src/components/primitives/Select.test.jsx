import { describe, it, expect } from 'vitest';
import { render, screen } from '../../__tests__/utils/test-utils';
import Select from './Select';

describe('Select', () => {
  it('renders with option children', () => {
    render(
      <Select aria-label="sort">
        <option value="a">Alpha</option>
        <option value="b">Beta</option>
      </Select>
    );
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
    expect(select.options).toHaveLength(2);
  });

  it('applies colorScheme dark style for native option theming', () => {
    render(
      <Select aria-label="sort">
        <option value="a">Alpha</option>
      </Select>
    );
    expect(screen.getByRole('combobox')).toHaveStyle({ colorScheme: 'dark' });
  });

  describe('size prop', () => {
    it('applies medium size classes by default', () => {
      render(
        <Select aria-label="sort">
          <option>A</option>
        </Select>
      );
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('text-sm');
      expect(select).toHaveClass('py-2.5');
      expect(select).toHaveClass('px-4');
      expect(select).toHaveClass('rounded-lg');
    });

    it('applies small size classes', () => {
      render(
        <Select size="sm" aria-label="sort">
          <option>A</option>
        </Select>
      );
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('text-xs');
      expect(select).toHaveClass('py-1');
      expect(select).toHaveClass('px-2');
      expect(select).toHaveClass('rounded-md');
    });
  });

  describe('fullWidth prop', () => {
    it('does not apply w-full by default', () => {
      render(
        <Select aria-label="sort">
          <option>A</option>
        </Select>
      );
      expect(screen.getByRole('combobox')).not.toHaveClass('w-full');
    });

    it('applies w-full when fullWidth is true', () => {
      render(
        <Select fullWidth aria-label="sort">
          <option>A</option>
        </Select>
      );
      expect(screen.getByRole('combobox')).toHaveClass('w-full');
    });
  });

  describe('className passthrough', () => {
    it('merges additional classes with defaults', () => {
      render(
        <Select className="custom-class" aria-label="sort">
          <option>A</option>
        </Select>
      );
      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('custom-class');
      expect(select).toHaveClass('cursor-pointer'); // base class still present
    });
  });
});
