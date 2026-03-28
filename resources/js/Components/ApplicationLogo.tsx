import { SVGAttributes } from 'react';

export default function ApplicationLogo(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 120 120"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
        >
            {/* Brain/quiz icon with lightning bolt - neo-brutalism style */}
            <rect
                x="4"
                y="4"
                width="112"
                height="112"
                rx="0"
                fill="hsl(262, 83%, 58%)"
                stroke="currentColor"
                strokeWidth="6"
            />
            {/* Letter Q */}
            <path
                d="M38 35C38 35 35 35 35 42V72C35 79 38 82 45 82H68C75 82 78 79 78 72V42C78 35 75 35 68 35H45Z"
                stroke="currentColor"
                strokeWidth="5"
                fill="hsl(47, 100%, 62%)"
            />
            <line
                x1="62"
                y1="68"
                x2="82"
                y2="92"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="square"
            />
            {/* Lightning bolt */}
            <polygon
                points="88,20 78,52 90,52 76,90 106,46 92,46 104,20"
                fill="hsl(47, 100%, 62%)"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinejoin="bevel"
            />
            {/* Checkmark accent */}
            <polyline
                points="42,56 50,64 65,48"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="square"
                fill="none"
            />
        </svg>
    );
}
