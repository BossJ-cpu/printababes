import React, { useState } from 'react';

interface CoordinateCalibrationProps {
    onCalibration: (calibrationFactor: { x: number, y: number }) => void;
}

const CoordinateCalibration: React.FC<CoordinateCalibrationProps> = ({ onCalibration }) => {
    const [calibrationPoints, setCalibrationPoints] = useState<Array<{ 
        expected: { x: number, y: number }, 
        actual: { x: number, y: number } 
    }>>([]);
    const [testMode, setTestMode] = useState(false);

    const addCalibrationPoint = (expectedX: number, expectedY: number, actualX: number, actualY: number) => {
        setCalibrationPoints(prev => [...prev, { 
            expected: { x: expectedX, y: expectedY }, 
            actual: { x: actualX, y: actualY } 
        }]);
    };

    const calculateCalibration = () => {
        if (calibrationPoints.length < 2) {
            alert('Need at least 2 calibration points');
            return;
        }

        // Calculate average offset
        const totalXOffset = calibrationPoints.reduce((sum, point) => 
            sum + (point.expected.x - point.actual.x), 0);
        const totalYOffset = calibrationPoints.reduce((sum, point) => 
            sum + (point.expected.y - point.actual.y), 0);

        const avgXOffset = totalXOffset / calibrationPoints.length;
        const avgYOffset = totalYOffset / calibrationPoints.length;

        // Calculate scale factors
        const xScale = calibrationPoints.length > 1 ? 
            (calibrationPoints[1].expected.x - calibrationPoints[0].expected.x) / 
            (calibrationPoints[1].actual.x - calibrationPoints[0].actual.x) : 1;
        
        const yScale = calibrationPoints.length > 1 ? 
            (calibrationPoints[1].expected.y - calibrationPoints[0].expected.y) / 
            (calibrationPoints[1].actual.y - calibrationPoints[0].actual.y) : 1;

        onCalibration({
            x: xScale || 1,
            y: yScale || 1
        });

        console.log('Calibration calculated:', {
            points: calibrationPoints,
            avgOffset: { x: avgXOffset, y: avgYOffset },
            scaleFactors: { x: xScale, y: yScale }
        });
    };

    return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-yellow-800 mb-2">Coordinate Calibration Tool</h3>
            <div className="space-y-2 text-sm">
                <button 
                    onClick={() => setTestMode(!testMode)}
                    className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                    {testMode ? 'Exit Test Mode' : 'Enter Test Mode'}
                </button>
                
                {testMode && (
                    <div className="bg-white p-3 rounded border">
                        <p className="mb-2">Test Mode: Click on known coordinates and record the results</p>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <strong>Calibration Points:</strong>
                                {calibrationPoints.map((point, idx) => (
                                    <div key={idx} className="text-xs">
                                        Expected: {point.expected.x}, {point.expected.y} → 
                                        Actual: {point.actual.x}, {point.actual.y}
                                    </div>
                                ))}
                            </div>
                            <button 
                                onClick={calculateCalibration}
                                className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                                disabled={calibrationPoints.length < 2}
                            >
                                Calculate Calibration
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CoordinateCalibration;