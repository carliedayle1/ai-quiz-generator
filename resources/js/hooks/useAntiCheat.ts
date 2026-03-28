import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';

export interface AntiCheatState {
    tabSwitchCount: number;
    copyPasteAttempts: number;
    warningVisible: boolean;
    warningMessage: string;
    isFullscreen: boolean;
}

export function useAntiCheat(submissionId: number, enableFullscreen = false): AntiCheatState {
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [copyPasteAttempts, setCopyPasteAttempts] = useState(0);
    const [warningVisible, setWarningVisible] = useState(false);
    const [warningMessage, setWarningMessage] = useState('');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showWarning = useCallback((message: string) => {
        setWarningMessage(message);
        setWarningVisible(true);
        if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = setTimeout(() => setWarningVisible(false), 3000);
    }, []);

    const logEvent = useCallback(
        (eventType: string, metadata?: Record<string, unknown>) => {
            if (debounceRef.current) return;
            debounceRef.current = setTimeout(() => {
                debounceRef.current = null;
            }, 2000);

            axios.post(route('exam-logs.store', submissionId), {
                event_type: eventType,
                metadata: metadata || {},
            }).catch(() => {
                // Silently fail — don't interrupt the exam
            });
        },
        [submissionId]
    );

    // Fullscreen management
    useEffect(() => {
        if (!enableFullscreen) return;

        const requestFullscreen = () => {
            const el = document.documentElement;
            if (el.requestFullscreen) {
                el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
            }
        };

        requestFullscreen();

        const handleFullscreenChange = () => {
            const inFullscreen = !!document.fullscreenElement;
            setIsFullscreen(inFullscreen);
            if (!inFullscreen) {
                showWarning('Fullscreen mode exited! Please return to fullscreen.');
                logEvent('fullscreen_exit', { timestamp: new Date().toISOString() });
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [enableFullscreen, logEvent, showWarning]);

    // Tab switch + window blur detection
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setTabSwitchCount((prev) => prev + 1);
                showWarning('Tab switch detected! Stay on this page during the exam.');
                logEvent('tab_hidden', { timestamp: new Date().toISOString() });
            } else {
                logEvent('tab_visible', { timestamp: new Date().toISOString() });
            }
        };

        const handleBlur = () => {
            setTabSwitchCount((prev) => prev + 1);
            showWarning('Window focus lost! Stay on this page during the exam.');
            logEvent('window_blur', { timestamp: new Date().toISOString() });
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
        };
    }, [logEvent, showWarning]);

    // Copy/paste detection
    useEffect(() => {
        const handleCopy = (e: ClipboardEvent) => {
            e.preventDefault();
            setCopyPasteAttempts((prev) => prev + 1);
            showWarning('Copying is not allowed during the exam.');
            logEvent('copy_attempt', { timestamp: new Date().toISOString() });
        };

        const handlePaste = (e: ClipboardEvent) => {
            e.preventDefault();
            setCopyPasteAttempts((prev) => prev + 1);
            showWarning('Pasting is not allowed during the exam.');
            logEvent('paste_attempt', { timestamp: new Date().toISOString() });
        };

        const handleCut = (e: ClipboardEvent) => {
            e.preventDefault();
            setCopyPasteAttempts((prev) => prev + 1);
            showWarning('Cutting is not allowed during the exam.');
            logEvent('cut_attempt', { timestamp: new Date().toISOString() });
        };

        document.addEventListener('copy', handleCopy);
        document.addEventListener('paste', handlePaste);
        document.addEventListener('cut', handleCut);

        return () => {
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('paste', handlePaste);
            document.removeEventListener('cut', handleCut);
        };
    }, [logEvent, showWarning]);

    // Right-click blocking
    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            logEvent('right_click', { timestamp: new Date().toISOString() });
        };

        document.addEventListener('contextmenu', handleContextMenu);
        return () => document.removeEventListener('contextmenu', handleContextMenu);
    }, [logEvent]);

    // Cleanup warning timeout on unmount
    useEffect(() => {
        return () => {
            if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    return { tabSwitchCount, copyPasteAttempts, warningVisible, warningMessage, isFullscreen };
}
