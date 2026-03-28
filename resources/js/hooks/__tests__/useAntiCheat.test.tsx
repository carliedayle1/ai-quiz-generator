import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, afterEach } from 'vitest';
import { fireEvent } from '@testing-library/react';

// Mock axios
vi.mock('axios', () => ({
    default: {
        post: vi.fn().mockResolvedValue({ data: {} }),
        get: vi.fn(),
    },
}));

// Mock Ziggy route helper used inside the hook
vi.stubGlobal('route', (name: string, id: number) => `/exam-logs/${id}`);

import { useAntiCheat } from '../useAntiCheat';
import axios from 'axios';

const mockedAxiosPost = vi.mocked(axios.post);

describe('useAntiCheat', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        mockedAxiosPost.mockClear();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('returns initial state with zero counts and warning not visible', () => {
        const { result } = renderHook(() => useAntiCheat(1));
        expect(result.current.tabSwitchCount).toBe(0);
        expect(result.current.warningVisible).toBe(false);
    });

    it('increments tabSwitchCount and sets warningVisible on tab switch (visibilitychange)', () => {
        const { result } = renderHook(() => useAntiCheat(1));

        act(() => {
            // Simulate document becoming hidden (tab switch away)
            Object.defineProperty(document, 'hidden', {
                configurable: true,
                get: () => true,
            });
            fireEvent(document, new Event('visibilitychange'));
        });

        expect(result.current.tabSwitchCount).toBe(1);
        expect(result.current.warningVisible).toBe(true);
    });

    it('posts tab_hidden event to exam-logs on visibilitychange when document is hidden', () => {
        renderHook(() => useAntiCheat(42));

        act(() => {
            Object.defineProperty(document, 'hidden', {
                configurable: true,
                get: () => true,
            });
            fireEvent(document, new Event('visibilitychange'));
        });

        expect(mockedAxiosPost).toHaveBeenCalledWith(
            expect.stringContaining('42'),
            expect.objectContaining({ event_type: 'tab_hidden' }),
        );
    });

    it('posts tab_visible event when document becomes visible again', () => {
        renderHook(() => useAntiCheat(1));

        // First make it hidden (to trigger the debounce timer consumption)
        act(() => {
            Object.defineProperty(document, 'hidden', {
                configurable: true,
                get: () => true,
            });
            fireEvent(document, new Event('visibilitychange'));
        });

        // Advance past the debounce window
        act(() => {
            vi.advanceTimersByTime(2100);
        });

        act(() => {
            Object.defineProperty(document, 'hidden', {
                configurable: true,
                get: () => false,
            });
            fireEvent(document, new Event('visibilitychange'));
        });

        const calls = mockedAxiosPost.mock.calls.map((c) => (c[1] as any).event_type);
        expect(calls).toContain('tab_visible');
    });

    it('increments tabSwitchCount and shows warning on window blur', () => {
        const { result } = renderHook(() => useAntiCheat(1));

        act(() => {
            fireEvent.blur(window);
        });

        expect(result.current.tabSwitchCount).toBe(1);
        expect(result.current.warningVisible).toBe(true);
    });

    it('posts window_blur event to exam-logs on window blur', () => {
        renderHook(() => useAntiCheat(5));

        act(() => {
            fireEvent.blur(window);
        });

        expect(mockedAxiosPost).toHaveBeenCalledWith(
            expect.stringContaining('5'),
            expect.objectContaining({ event_type: 'window_blur' }),
        );
    });

    it('auto-dismisses warning after 3 seconds', () => {
        const { result } = renderHook(() => useAntiCheat(1));

        act(() => {
            fireEvent.blur(window);
        });

        expect(result.current.warningVisible).toBe(true);

        act(() => {
            vi.advanceTimersByTime(3000);
        });

        expect(result.current.warningVisible).toBe(false);
    });

    it('debounces repeated events — only one POST within the 2s debounce window', () => {
        renderHook(() => useAntiCheat(1));

        act(() => {
            fireEvent.blur(window);
        });
        act(() => {
            fireEvent.blur(window);
        });
        act(() => {
            fireEvent.blur(window);
        });

        // All three blurs within the debounce window should only trigger one POST
        expect(mockedAxiosPost).toHaveBeenCalledTimes(1);
    });

    it('allows a new POST after the debounce window expires', () => {
        renderHook(() => useAntiCheat(1));

        act(() => {
            fireEvent.blur(window);
        });

        act(() => {
            vi.advanceTimersByTime(2100);
        });

        act(() => {
            fireEvent.blur(window);
        });

        expect(mockedAxiosPost).toHaveBeenCalledTimes(2);
    });

    it('removes event listeners on unmount', () => {
        const addSpy = vi.spyOn(document, 'addEventListener');
        const removeSpy = vi.spyOn(document, 'removeEventListener');
        const windowAddSpy = vi.spyOn(window, 'addEventListener');
        const windowRemoveSpy = vi.spyOn(window, 'removeEventListener');

        const { unmount } = renderHook(() => useAntiCheat(1));

        expect(addSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
        expect(windowAddSpy).toHaveBeenCalledWith('blur', expect.any(Function));

        unmount();

        expect(removeSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
        expect(windowRemoveSpy).toHaveBeenCalledWith('blur', expect.any(Function));
    });

    it('accumulates tab switch count across multiple separate blur events', () => {
        const { result } = renderHook(() => useAntiCheat(1));

        // First blur
        act(() => {
            fireEvent.blur(window);
        });

        // Advance past debounce
        act(() => {
            vi.advanceTimersByTime(2100);
        });

        // Second blur
        act(() => {
            fireEvent.blur(window);
        });

        expect(result.current.tabSwitchCount).toBe(2);
    });
});
