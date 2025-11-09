import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

function Button({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick} data-testid="button">
      {children}
    </button>
  );
}

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByTestId('button')).toBeInTheDocument();
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    screen.getByTestId('button').click();
    expect(handleClick).toHaveBeenCalled();
  });
});