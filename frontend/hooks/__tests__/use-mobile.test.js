import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from '../use-mobile';

describe('useIsMobile Hook', () => {
  let matchMediaMock;

  beforeEach(() => {
    // Mock matchMedia
    matchMediaMock = jest.fn().mockImplementation((query) => ({
      matches: query.includes('max-width') && globalThis.innerWidth < 768,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    globalThis.matchMedia = matchMediaMock;
    globalThis.innerWidth = 1024;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return false when window width is >= 768', () => {
    globalThis.innerWidth = 1024;
    const { result } = renderHook(() => useIsMobile());

    // Wait for state update
    expect(result.current).toBe(false);
  });

  it('should return true when window width is < 768', () => {
    globalThis.innerWidth = 500;
    const { result } = renderHook(() => useIsMobile());

    // Wait for state update
    expect(result.current).toBe(true);
  });

  it('should initially have undefined value', () => {
    const { result } = renderHook(() => useIsMobile());

    // Initial state is undefined
    expect(result.current).toBeUndefined();
  });

  it('should update on window resize', () => {
    const { result, rerender } = renderHook(() => useIsMobile());

    // Simulate resize
    act(() => {
      globalThis.innerWidth = 600;
      const listeners = matchMediaMock.mock.results[0].value.addEventListener.mock.calls;
      if (listeners.length > 0) {
        listeners[0][1]();
      }
    });

    rerender();
    expect(result.current).toBe(true);
  });

  it('should attach event listener on mount', () => {
    const { result } = renderHook(() => useIsMobile());

    const addEventListenerCalls = matchMediaMock.mock.results[0].value.addEventListener.mock.calls;
    expect(addEventListenerCalls.length).toBeGreaterThan(0);
    expect(addEventListenerCalls[0][0]).toBe('change');
  });

  it('should remove event listener on unmount', () => {
    const { unmount } = renderHook(() => useIsMobile());

    const removeEventListenerCalls = matchMediaMock.mock.results[0].value.removeEventListener.mock.calls;
    expect(removeEventListenerCalls.length).toBe(0);

    unmount();

    const callsAfterUnmount = matchMediaMock.mock.results[0].value.removeEventListener.mock.calls;
    expect(callsAfterUnmount.length).toBeGreaterThan(0);
  });

  it('should handle edge case at 768px boundary', () => {
    globalThis.innerWidth = 768;
    const { result } = renderHook(() => useIsMobile());

    // 768 and above should return false
    expect(result.current).toBe(false);
  });

  it('should handle 767px (just below threshold)', () => {
    globalThis.innerWidth = 767;
    const { result } = renderHook(() => useIsMobile());

    // Below 768 should return true
    expect(result.current).toBe(true);
  });
});
