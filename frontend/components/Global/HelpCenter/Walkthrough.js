import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTheme } from 'styled-components';
import 'intro.js/introjs.css';

export default function Walkthrough({ onStartWalkthrough }) {
    const [hasTour, setHasTour] = useState(false);
    const [tours, setTours] = useState(null);
    const [selectedComponent, setSelectedComponent] = useState(null);
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
                // Import tours directly without importing the component
                const developToursImport = await import('../../Dashboard/Develop/tours');
                componentImport = {
                    default: { hasTour: true },
                    tours: developToursImport.developTours
                };
            } else if (
                router.pathname.startsWith('/dashboard/[area]') &&
                router.query.area === 'review'
            ) {
                // Import tours directly without importing the component
                const reviewOverviewToursImport = await import('../../Dashboard/Review/Overview/tours');
                componentImport = {
                    default: { hasTour: true },
                    tours: reviewOverviewToursImport.reviewOverviewTours
                };
            } else if (
                router.pathname === '/builder/[area]' &&
                router.query.area === 'projects' &&
                router.query.selector
            ) {
                // Import the specific tab component based on the tab parameter
                const tab = router.query.tab || 'board'; // Default to 'board' if no tab specified
                switch (tab) {
                    case 'board':
                        // Import tours directly without importing the component
                        const boardToursImport = await import('../../Builder/Project/ProjectBoard/tours');
                        componentImport = {
                            default: { hasTour: true },
                            tours: boardToursImport.projectBoardTours
                        };
                        break;
                    case 'builder':
                        // Import tours directly without importing the component
                        const toursImport = await import('../../Builder/Project/Builder/tours');
                        componentImport = {
                            default: { hasTour: true },
                            tours: toursImport.builderTours
                        };
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
                try {
                    const component = componentImport.default;
                    // Handle both component functions and our custom structure
                    if (typeof component === 'function') {
                        setHasTour(component.hasTour === true);
                        setTours(component.tours || null);
                        setSelectedComponent(component);
                    } else if (component && typeof component === 'object') {
                        // Handle our custom structure for builder component
                        setHasTour(component.hasTour === true);
                        setTours(componentImport.tours || null);
                        setSelectedComponent(component);
                    } else {
                        setHasTour(false);
                        setTours(null);
                        setSelectedComponent(null);
                    }
                } catch (error) {
                    console.error('Error loading component for walkthrough:', error);
                    setHasTour(false);
                    setTours(null);
                    setSelectedComponent(null);
                }
            }
        }
        checkTour();
        return () => { isMounted = false; };
    }, [router.pathname, router.query.area, router.query.selector, router.query.tab]);

    const handleStart = (tourId = 'overview') => {
        // Dispatch custom event with tour ID
        window.dispatchEvent(new CustomEvent('start-walkthrough-tour', {
            detail: { tourId }
        }));
        // Only call onStartWalkthrough if it exists and we're not already in a tour
        if (onStartWalkthrough) {
            onStartWalkthrough();
        }
    };

    return (
        <div>
            {hasTour && !tours && (
                <button 
                    className="primaryBtn" 
                    style={{ border: `1px solid ${theme.secondaryBlue}`, background: theme.secondaryBlue }} 
                    onClick={() => handleStart()}
                >
                    Start a tour !
                </button>
            )}
            {hasTour && tours && (
                <div>
                    <p>Available Tours:</p>
                    {Object.entries(tours).map(([tourId, tour]) => (
                    <div key={tourId} style={{ display: 'flex', alignItems: 'center', marginBottom: '1em' }}>
                        <button
                            className="primaryBtn"
                            style={{
                                border: `1px solid ${theme.secondaryBlue}`,
                                background: theme.secondaryBlue,
                                marginRight: '1em',
                                whiteSpace: 'nowrap'
                            }}
                            onClick={() => handleStart(tourId)}
                        >
                            <span style={{ color: theme.neutral5, margin: 0, whiteSpace: 'nowrap' }}>Start tour!</span>
                        </button>
                        <div>
                            <p style={{ color: theme.neutral1, margin: 0, fontWeight: 'bold' }}>{tour.title}</p>
                            <p style={{ color: theme.neutral3 }}>{tour.description}</p>
                        </div>
                    </div>
                    ))}
                </div>
            )}
            {!hasTour && <p>Oops! No walkthrough available for this page.</p>}
        </div>
    );
}