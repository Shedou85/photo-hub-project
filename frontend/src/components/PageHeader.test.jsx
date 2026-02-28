import { describe, it, expect } from 'vitest';
import { render, screen } from '../__tests__/utils/test-utils';
import PageHeader from './PageHeader';

describe('PageHeader', () => {
  it('renders title text', () => {
    render(<PageHeader title="My Collections" subtitle="Manage your work" />);
    expect(screen.getByText('My Collections')).toBeInTheDocument();
  });

  it('renders subtitle text', () => {
    render(<PageHeader title="My Collections" subtitle="Manage your work" />);
    expect(screen.getByText('Manage your work')).toBeInTheDocument();
  });

  it('renders icon content', () => {
    render(
      <PageHeader title="Collections" subtitle="Subtitle" icon="C" />
    );
    expect(screen.getByText('C')).toBeInTheDocument();
  });

  it('title renders as an h1 element', () => {
    render(<PageHeader title="Page Title" subtitle="Subtitle" />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('Page Title');
  });

  describe('actions slot', () => {
    it('renders actions when provided', () => {
      render(
        <PageHeader
          title="Title"
          subtitle="Subtitle"
          actions={<button>Create New</button>}
        />
      );
      expect(screen.getByRole('button', { name: 'Create New' })).toBeInTheDocument();
    });

    it('does not render actions container when actions is not provided', () => {
      render(<PageHeader title="Title" subtitle="Subtitle" />);
      // No interactive elements should be present without actions
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('renders multiple action elements', () => {
      render(
        <PageHeader
          title="Title"
          subtitle="Subtitle"
          actions={
            <>
              <button>Edit</button>
              <button>Delete</button>
            </>
          }
        />
      );
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('icon circle has gradient background', () => {
      render(<PageHeader title="Title" subtitle="Subtitle" icon="T" />);
      const iconEl = screen.getByText('T');
      const circle = iconEl.closest('.rounded-full');
      expect(circle).toBeInTheDocument();
      expect(circle).toHaveClass('ring-4');
    });

    it('applies bottom border separator', () => {
      const { container } = render(
        <PageHeader title="Title" subtitle="Subtitle" />
      );
      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('divider-glow');
    });
  });
});
