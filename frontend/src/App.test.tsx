import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from './App';

describe('App', () => {
  it('renders the workflow navigation', () => {
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /job search/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^jobs$/i })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /applications/i }),
    ).toBeInTheDocument();
  });
});
