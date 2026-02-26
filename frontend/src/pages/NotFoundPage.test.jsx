import { describe, it, expect } from 'vitest';
import { render, screen } from '../__tests__/utils/test-utils';
import NotFoundPage from './NotFoundPage';

describe('NotFoundPage', () => {
  it('renders 404 heading text', () => {
    render(<NotFoundPage />);
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('renders translated error message', () => {
    render(<NotFoundPage />);
    // en.json: errors.page_not_found = "This page could not be found."
    expect(screen.getByText('This page could not be found.')).toBeInTheDocument();
  });

  it('renders a link back to the homepage', () => {
    render(<NotFoundPage />);
    const link = screen.getByRole('link', { name: /go to homepage/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });

  it('renders the go home link text from translations', () => {
    render(<NotFoundPage />);
    // en.json: errors.go_home = "Go to homepage"
    expect(screen.getByText('Go to homepage')).toBeInTheDocument();
  });

  it('404 text is in an h1 element', () => {
    render(<NotFoundPage />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('404');
  });
});
