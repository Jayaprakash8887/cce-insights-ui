import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState title="No deviations found" />);
    expect(screen.getByText('No deviations found')).toBeInTheDocument();
  });

  it('renders the description when provided', () => {
    render(<EmptyState title="Nothing here" description="Try widening the date range" />);
    expect(screen.getByText('Try widening the date range')).toBeInTheDocument();
  });

  it('omits the description paragraph when not provided', () => {
    const { container } = render(<EmptyState title="Nothing here" />);
    expect(container.querySelector('p')).toBeNull();
  });
});
