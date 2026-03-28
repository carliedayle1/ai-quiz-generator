import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-background pt-6 sm:justify-center sm:pt-0">
            <div>
                <Link href="/" className="flex flex-col items-center gap-2">
                    <ApplicationLogo className="h-16 w-16" />
                    <span className="font-extrabold text-xl text-foreground tracking-tight">QuizAI</span>
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden border-3 border-foreground bg-card px-6 py-4 shadow-brutal sm:max-w-md">
                {children}
            </div>
        </div>
    );
}
