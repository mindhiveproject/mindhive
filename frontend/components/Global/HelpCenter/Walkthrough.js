import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from 'styled-components';
import 'intro.js/introjs.css';

export default function Walkthrough({ onStartWalkthrough }) {
    const [hasTour, setHasTour] = useState(false);
    const router = useRouter();
    const theme = useTheme();

    useEffect(() => {
        let isMounted = true;
        async function checkTour() {
            let componentImport;
            
            // Dashboard area routing
            if (
                router.pathname.startsWith('/dashboard/[area]') &&
                router.query.area === 'develop'
            ) {
                componentImport = await import('../../Dashboard/Develop/Main');
            } else if (
                router.pathname.startsWith('/dashboard/[area]') &&
                router.query.area === 'review'
            ) {
                componentImport = await import('../../Dashboard/Review/Overview/Main');
            } else if (
                router.pathname === '/builder/[area]' &&
                router.query.area === 'projects' &&
                router.query.selector
            ) {
                // Import the specific tab component based on the tab parameter
                const tab = router.query.tab || 'board'; // Default to 'board' if no tab specified
                switch (tab) {
                    case 'board':
                        componentImport = await import('../../Builder/Project/ProjectBoard/Main');
                        break;
                    case 'builder':
                        componentImport = await import('../../Builder/Project/Builder/Main');
                        break;
                    case 'review':
                        componentImport = await import('../../Builder/Project/Review/Main');
                        break;
                    case 'page':
                        componentImport = await import('../../Builder/Project/ParticipantPage/Main');
                        break;
                    case 'collect':
                        componentImport = await import('../../Builder/Project/Collect/Wrapper');
                        break;
                    case 'visualize':
                        componentImport = await import('../../Builder/Project/Visualize/Wrapper');
                        break;
                    case 'journal':
                        componentImport = await import('../../Builder/Project/DataJournal/Wrapper');
                        break;
                    default:
                        setHasTour(false);
                        return;
                }
            } else if (router.pathname.startsWith('/studies')) {
                console.log('Walkthrough: Detected studies route');
            } else {
                setHasTour(false);
                return;
            }
            
            if (isMounted) {
                setHasTour(componentImport.default.hasTour === true);
            }
        }
        checkTour();
        return () => { isMounted = false; };
    }, [router.pathname, router.query.area, router.query.selector, router.query.tab]);

    const handleStart = () => {
        if (onStartWalkthrough) onStartWalkthrough();
    };

    return (
        <div>
            {hasTour && <button className="primaryBtn" style={{ border: `1px solid ${theme.secondaryBlue}`, background: theme.secondaryBlue }} onClick={handleStart}>
                Start a tour !
                </button>}
            {!hasTour && <p>Oops! No walkthrough available for this page.</p>}
        </div>
    );
}