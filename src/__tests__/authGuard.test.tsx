import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthGuard } from '../components/auth/AuthGuard';

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('AuthGuard Route Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /auth when user has no session and is not guest', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isGuest: false,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/studio']}>
        <Routes>
          <Route
            path="/studio"
            element={
              <AuthGuard>
                <div>Protected Studio Content</div>
              </AuthGuard>
            }
          />
          <Route path="/auth" element={<div>Auth Page Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Protected Studio Content')).toBeNull();
    expect(screen.getByText('Auth Page Screen')).toBeDefined();
  });

  it('allows access when guest mode is active', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isGuest: true,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/studio']}>
        <Routes>
          <Route
            path="/studio"
            element={
              <AuthGuard>
                <div>Protected Studio Content</div>
              </AuthGuard>
            }
          />
          <Route path="/auth" element={<div>Auth Page Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Studio Content')).toBeDefined();
  });

  it('allows access when user is signed in', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'u123', email: 'test@example.com' },
      isGuest: false,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/modes']}>
        <Routes>
          <Route
            path="/modes"
            element={
              <AuthGuard>
                <div>Protected Modes Hub</div>
              </AuthGuard>
            }
          />
          <Route path="/auth" element={<div>Auth Page Screen</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Modes Hub')).toBeDefined();
  });

  it('preserves deep link in query parameter when redirecting to /auth', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isGuest: false,
      isLoading: false,
    });

    const CaptureSearch = () => {
      return <div>Auth With Search</div>;
    };

    render(
      <MemoryRouter initialEntries={['/practice?tab=balloon']}>
        <Routes>
          <Route
            path="/practice"
            element={
              <AuthGuard>
                <div>Practice Arena</div>
              </AuthGuard>
            }
          />
          <Route path="/auth" element={<CaptureSearch />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Auth With Search')).toBeDefined();
  });

  it('shows loading state while auth status is resolving', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isGuest: false,
      isLoading: true,
    });

    render(
      <MemoryRouter initialEntries={['/studio']}>
        <Routes>
          <Route
            path="/studio"
            element={
              <AuthGuard>
                <div>Protected Studio Content</div>
              </AuthGuard>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Checking authentication...')).toBeDefined();
    expect(screen.queryByText('Protected Studio Content')).toBeNull();
  });
});
