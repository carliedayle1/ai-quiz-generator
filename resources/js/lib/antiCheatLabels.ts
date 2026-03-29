export const ANTI_CHEAT_LABELS: Record<string, string> = {
    tab_switch: 'Tab Switch',
    window_blur: 'Window Lost Focus',
    copy: 'Copy Attempt',
    paste: 'Paste Attempt',
    right_click: 'Right-Click',
    devtools_open: 'DevTools Opened',
    fullscreen_exit: 'Exited Fullscreen',
    visibility_hidden: 'Tab Hidden',
    focus_lost: 'Focus Lost',
    keyboard_shortcut: 'Keyboard Shortcut',
};

export function antiCheatLabel(eventType: string): string {
    return ANTI_CHEAT_LABELS[eventType] ?? eventType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
