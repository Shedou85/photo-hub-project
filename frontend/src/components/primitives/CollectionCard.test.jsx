import { describe, it, expect } from 'vitest';
import { render, screen } from '../../__tests__/utils/test-utils';
import CollectionCard from './CollectionCard';

describe('CollectionCard', () => {
  const mockCollection = {
    id: 'cuid123',
    name: 'Wedding Photos',
    createdAt: '2025-01-15T10:00:00Z',
    photoCount: 150,
    status: 'SELECTING'
  };

  it('renders collection title', () => {
    render(<CollectionCard {...mockCollection} />);
    expect(screen.getByText('Wedding Photos')).toBeInTheDocument();
  });

  it('renders photo count', () => {
    render(<CollectionCard {...mockCollection} />);
    expect(screen.getByText('150 photos')).toBeInTheDocument();
  });

  it('renders photo count singular form for 1 photo', () => {
    render(<CollectionCard {...mockCollection} photoCount={1} />);
    expect(screen.getByText('1 photo')).toBeInTheDocument();
  });

  it('renders status badge with correct status text', () => {
    render(<CollectionCard {...mockCollection} />);
    expect(screen.getByText('Selecting')).toBeInTheDocument();
  });

  it('does not render status badge for DRAFT status', () => {
    render(<CollectionCard {...mockCollection} status="DRAFT" />);
    expect(screen.queryByText('Draft')).not.toBeInTheDocument();
  });

  it('renders formatted date', () => {
    render(<CollectionCard {...mockCollection} />);
    const formattedDate = new Date('2025-01-15T10:00:00Z').toLocaleDateString();
    expect(screen.getByText(formattedDate)).toBeInTheDocument();
  });

  describe('cover image', () => {
    it('renders img when coverImageUrl is provided', () => {
      render(
        <CollectionCard
          {...mockCollection}
          coverImageUrl="https://example.com/cover.jpg"
        />
      );

      const img = screen.getByAltText('Wedding Photos');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', 'https://example.com/cover.jpg');
    });

    it('renders placeholder with first letter when coverImageUrl is not provided', () => {
      const { container } = render(
        <CollectionCard {...mockCollection} coverImageUrl={undefined} />
      );

      const placeholder = container.querySelector('.bg-\\[linear-gradient\\(135deg\\,\\#3b82f6_0\\%\\,\\#6366f1_100\\%\\)\\]');
      expect(placeholder).toBeInTheDocument();
      expect(placeholder).toHaveTextContent('W');
    });

    it('applies hover scale to cover image', () => {
      render(
        <CollectionCard
          {...mockCollection}
          coverImageUrl="https://example.com/cover.jpg"
        />
      );

      const img = screen.getByAltText('Wedding Photos');
      expect(img).toHaveClass('group-hover:scale-105');
    });
  });

  describe('click behavior', () => {
    it('renders link to collection details page', () => {
      render(<CollectionCard {...mockCollection} />);
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/collection/cuid123');
    });
  });

  describe('actions rendering', () => {
    it('renders action buttons in footer', () => {
      render(
        <CollectionCard
          {...mockCollection}
          actions={
            <>
              <button>Share</button>
              <button>Delete</button>
            </>
          }
        />
      );

      expect(screen.getByText('Share')).toBeInTheDocument();
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('does not render actions section when actions is not provided', () => {
      const { container } = render(<CollectionCard {...mockCollection} />);
      expect(container.querySelector('.p-3')).not.toBeInTheDocument();
    });
  });

  describe('hover effects', () => {
    it('applies hover border and transform classes', () => {
      const { container } = render(<CollectionCard {...mockCollection} />);
      const card = container.firstChild;
      expect(card).toHaveClass('hover:border-blue-300');
      expect(card).toHaveClass('hover:-translate-y-[2px]');
    });
  });
});
