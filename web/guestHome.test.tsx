/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../App';

describe('guest home', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  afterEach(() => {
    cleanup();
  });

  it('offers consultation and booking without a customer account', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { name: /without creating an account/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /request a consultation/i }).getAttribute('href')).toBe('/consult');
    expect(screen.getByRole('link', { name: /book a service/i }).getAttribute('href')).toBe('/book');
    expect(screen.queryByText(/create account/i)).toBeNull();
    expect(screen.queryByText(/sign in/i)).toBeNull();
    expect(screen.getByRole('link', { name: 'Staff' }).getAttribute('href')).toBe('/staff');
  });

  it('opens the consultation form without asking for an account', async () => {
    window.history.pushState({}, '', '/consult');
    render(<App />);
    expect(await screen.findByRole('heading', { name: /request a consultation/i })).toBeTruthy();
    expect(screen.getByLabelText(/your name/i)).toBeTruthy();
    expect(screen.queryByText(/sign in/i)).toBeNull();
    expect(screen.queryByText(/create account/i)).toBeNull();
  });

  it('opens the booking form without asking for an account', async () => {
    window.history.pushState({}, '', '/book');
    render(<App />);
    expect(await screen.findByRole('heading', { name: /book a service/i })).toBeTruthy();
    expect(screen.getByLabelText(/your name/i)).toBeTruthy();
    expect(screen.getByLabelText(/address/i)).toBeTruthy();
    expect(screen.queryByText(/sign in/i)).toBeNull();
    expect(screen.queryByText(/create account/i)).toBeNull();
  });
});
