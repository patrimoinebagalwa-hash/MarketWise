import React, { useEffect, useState } from 'react';
import './marketwise.scss';

type StopReason = 'NONE' | 'MANUAL' | 'EMERGENCY' | 'DAILY_LOSS' | 'SESSION_LOSS' | 'CONSECUTIVE_LOSSES' | 'TIME_EXPIRED';

const MarketWise = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [isEmergencyStopped, setIsEmergencyStopped] = useState(false);
    const [stopReason, setStopReason] = useState<StopReason>('NONE');

    const [dailyLossLimit, setDailyLossLimit] = useState(5);
    const [sessionLossLimit, setSessionLossLimit] = useState(3);
    const [maxStakePercent, setMaxStakePercent] = useState(1);
    const [maxConsecutiveLosses, setMaxConsecutiveLosses] = useState(3);
    const [cooldownMinutes, setCooldownMinutes] = useState(10);
    const [minimumBalanceReserve, setMinimumBalanceReserve] = useState(50);
    const [maxOpenTrades, setMaxOpenTrades] = useState(1);

    // Auto-Run session controls
    const [durationValue, setDurationValue] = useState(1);
    const [durationUnit, setDurationUnit] = useState<'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS'>('HOURS');
    const [sessionEndTime, setSessionEndTime] = useState<number | null>(null);
    const [timeRemaining, setTimeRemaining] = useState(0);

    const startEngine = () => {
        if (isEmergencyStopped || !riskConfigValid || durationValue <= 0) return;

        const multiplier =
            durationUnit === 'MINUTES'
                ? 60 * 1000
                : durationUnit === 'HOURS'
                  ? 60 * 60 * 1000
                  : durationUnit === 'DAYS'
                    ? 24 * 60 * 60 * 1000
                    : 7 * 24 * 60 * 60 * 1000;

        const durationMs = durationValue * multiplier;
        const endTime = Date.now() + durationMs;

        setStopReason('NONE');
        setSessionEndTime(endTime);
        setTimeRemaining(durationMs);
        setIsRunning(true);
    };

    const stopEngine = () => {
        setIsRunning(false);
        setStopReason('MANUAL');
    };

    const emergencyStop = () => {
        setIsRunning(false);
        setIsEmergencyStopped(true);
        setStopReason('EMERGENCY');
    };

    const resetEmergencyStop = () => {
        setIsEmergencyStopped(false);
        setIsRunning(false);
        setStopReason('NONE');
    };

    useEffect(() => {
        if (!isRunning || sessionEndTime === null) return;

        const updateTimer = () => {
            const remaining = Math.max(0, sessionEndTime - Date.now());
            setTimeRemaining(remaining);

            if (remaining <= 0) {
                setIsRunning(false);
                setSessionEndTime(null);
                setTimeRemaining(0);
                setStopReason('TIME_EXPIRED');
            }
        };

        updateTimer();
        const timer = window.setInterval(updateTimer, 1000);

        return () => window.clearInterval(timer);
    }, [isRunning, sessionEndTime]);
    const riskConfigValid =
        dailyLossLimit > 0 &&
        sessionLossLimit > 0 &&
        maxStakePercent > 0 &&
        maxConsecutiveLosses > 0 &&
        cooldownMinutes >= 0 &&
        minimumBalanceReserve >= 0 &&
        maxOpenTrades > 0;

    return (
        <main className='marketwise'>
            <header className='marketwise__header'>
                <div>
                    <h1>MarketWise</h1>
                    <p>Premium Automated Trading Engine</p>
                </div>

                <div className='marketwise__status'>
                    <strong>
                        {isEmergencyStopped
                            ? 'EMERGENCY STOPPED'
                            : isRunning
                              ? 'ENGINE RUNNING'
                              : 'ENGINE STOPPED'}
                    </strong>
                </div>
            </header>

            <div className='marketwise__dashboard-grid'>
            <section className='marketwise__controls'>
                <h2>Trading Control</h2>

                <button
                    type='button'
                    onClick={startEngine}
                    disabled={isRunning || isEmergencyStopped || !riskConfigValid}
                >
                    Start Engine
                </button>

                <button type='button' onClick={stopEngine} disabled={!isRunning}>
                    Stop Engine
                </button>

                <button type='button' onClick={emergencyStop} disabled={isEmergencyStopped}>
                    Emergency Stop
                </button>

                <button
                    type='button'
                    onClick={resetEmergencyStop}
                    disabled={!isEmergencyStopped}
                >
                    Reset Emergency Stop
                </button>

                <p>Last stop reason: {stopReason}</p>
            </section>

            <section className='marketwise__autorun'>
                <h2>Auto-Run Session</h2>

                <label>
                    Duration
                    <input
                        type='number'
                        min='1'
                        step='1'
                        value={durationValue}
                        onChange={e => setDurationValue(Number(e.target.value))}
                        disabled={isRunning}
                    />
                </label>

                <label>
                    Duration unit
                    <select
                        value={durationUnit}
                        onChange={e => setDurationUnit(e.target.value as 'MINUTES' | 'HOURS' | 'DAYS' | 'WEEKS')}
                        disabled={isRunning}
                    >
                        <option value='MINUTES'>Minutes</option>
                        <option value='HOURS'>Hours</option>
                        <option value='DAYS'>Days</option>
                        <option value='WEEKS'>Weeks</option>
                    </select>
                </label>

                <p>
                    Selected session: <strong>{durationValue} {durationUnit.toLowerCase()}</strong>
                </p>

                <p>
                    Time remaining:{' '}
                    <strong>
                        {isRunning ? Math.floor(timeRemaining / 3600000) + 'h ' + Math.floor((timeRemaining % 3600000) / 60000) + 'm ' + Math.floor((timeRemaining % 60000) / 1000) + 's' : 'Not running'}
                    </strong>
                </p>

                <p>
                    Session ends:{' '}
                    <strong>
                        {isRunning && sessionEndTime
                            ? new Date(sessionEndTime).toLocaleString()
                            : 'Not scheduled'}
                    </strong>
                </p>
            </section>
            <section className='marketwise__risk'>
                <h2>Risk Protection</h2>

                <p>
                    These are hard engine limits. A strategy will not be allowed to override them.
                </p>

                <label>
                    Daily loss limit (%)
                    <input
                        type='number'
                        min='0.1'
                        max='100'
                        step='0.1'
                        value={dailyLossLimit}
                        onChange={e => setDailyLossLimit(Number(e.target.value))}
                        disabled={isRunning}
                    />
                </label>

                <label>
                    Session loss limit (%)
                    <input
                        type='number'
                        min='0.1'
                        max='100'
                        step='0.1'
                        value={sessionLossLimit}
                        onChange={e => setSessionLossLimit(Number(e.target.value))}
                        disabled={isRunning}
                    />
                </label>

                <label>
                    Maximum stake per trade (% of balance)
                    <input
                        type='number'
                        min='0.1'
                        max='100'
                        step='0.1'
                        value={maxStakePercent}
                        onChange={e => setMaxStakePercent(Number(e.target.value))}
                        disabled={isRunning}
                    />
                </label>

                <label>
                    Maximum consecutive losses
                    <input
                        type='number'
                        min='1'
                        step='1'
                        value={maxConsecutiveLosses}
                        onChange={e => setMaxConsecutiveLosses(Number(e.target.value))}
                        disabled={isRunning}
                    />
                </label>

                <label>
                    Cooldown after loss (minutes)
                    <input
                        type='number'
                        min='0'
                        step='1'
                        value={cooldownMinutes}
                        onChange={e => setCooldownMinutes(Number(e.target.value))}
                        disabled={isRunning}
                    />
                </label>

                <label>
                    Minimum balance reserve (%)
                    <input
                        type='number'
                        min='0'
                        max='100'
                        step='1'
                        value={minimumBalanceReserve}
                        onChange={e => setMinimumBalanceReserve(Number(e.target.value))}
                        disabled={isRunning}
                    />
                </label>

                <label>
                    Maximum simultaneous open trades
                    <input
                        type='number'
                        min='1'
                        step='1'
                        value={maxOpenTrades}
                        onChange={e => setMaxOpenTrades(Number(e.target.value))}
                        disabled={isRunning}
                    />
                </label>

                <p>
                    Risk configuration: <strong>{riskConfigValid ? 'READY' : 'INVALID'}</strong>
                </p>
            </section>

            <section className='marketwise__engine'>
                <h2>Strategy Engine</h2>
                <p>NO TRADE — waiting for a qualified opportunity.</p>
                <p>Risk Manager must approve every future trade before execution.</p>
            </section>            </div>

        </main>
    );
};

export default MarketWise;











