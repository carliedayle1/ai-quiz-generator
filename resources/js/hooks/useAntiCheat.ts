import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';

export function useAntiCheat(submissionId: number) {
    const [tabSwitchCount, setTabSwitchCount] = useState(0);
    const [warningVisible, setWarningVisible] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const logEvent = useCallback(
        (eventType: string, metadata?: Record<string, any>) => {
            // Debounce: don't log the same event more than once per 2 seconds
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

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                setTabSwitchCount((prev) => prev + 1);
                setWarningVisible(true);
                logEvent('tab_hidden', { timestamp: new Date().toISOString() });

                // Auto-dismiss warning after 3 seconds
                setTimeout(() => setWarningVisible(false), 3000);
            } else {
                logEvent('tab_visible', { timestamp: new Date().toISOString() });
            }
        };

        const handleBlur = () => {
            setTabSwitchCount((prev) => prev + 1);
            setWarningVisible(true);
            logEvent('window_blur', { timestamp: new Date().toISOString() });
            setTimeout(() => setWarningVisible(false), 3000);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
        };
    }, [logEvent]);

    return { tabSwitchCount, warningVisible };
}
