import { describe, it, expect } from 'vitest';
import { render, screen } from '../../__tests__/utils/test-utils';
import Card from './Card';

describe('Card', () => {
  it('renders children content', () => {
    render(
      <Card>
        <h2>Card Title</h2>
        <p>Card content</p>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('applies default card styling', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstChild;

    expect(card).toHaveClass('bg-white');
    expect(card).toHaveClass('border');
    expect(card).toHaveClass('border-gray-200');
    expect(card).toHaveClass('rounded');
  });

  it('applies default padding', () => {
    const { container } = render(<Card>Content</Card>);
    const card = container.firstChild;

    expect(card).toHaveClass('px-6');
    expect(card).toHaveClass('py-5');
  });

  it('removes padding when noPadding is true', () => {
    const { container } = render(<Card noPadding>Content</Card>);
    const card = container.firstChild;

    expect(card).not.toHaveClass('px-6');
    expect(card).not.toHaveClass('py-5');
  });

  it('renders as a div by default', () => {
    const { container } = render(<Card>Content</Card>);
    expect(container.firstChild.tagName).toBe('DIV');
  });

  describe('className passthrough', () => {
    it('merges additional classes with defaults', () => {
      const { container } = render(
        <Card className="custom-class shadow-lg">Content</Card>
      );
      const card = container.firstChild;

      expect(card).toHaveClass('custom-class');
      expect(card).toHaveClass('shadow-lg');
      expect(card).toHaveClass('bg-white'); // base class still present
      expect(card).toHaveClass('border'); // base class still present
    });
  });
});
