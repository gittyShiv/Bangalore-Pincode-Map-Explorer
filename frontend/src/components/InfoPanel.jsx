function ResultRow({ record, active, onPick }) {
    return (
        <button className={`result-row ${active ? 'active' : ''}`} onClick={() => onPick(record)} type="button">
            <div>
                <strong>{record.area}</strong>
                <span>{record.pincode}</span>
            </div>
            <em>{record.corporation}</em>
        </button>
    )
}

export default function InfoPanel({ selected, results, status, error, onPickResult }) {
    return (
        <section className="card info-panel">
            <div className="section-head">
                <div>
                    <p className="eyebrow">Info panel</p>
                    <h2>{selected ? selected.area : 'Select a marker'}</h2>
                </div>
            </div>

            {selected ? (
                <div className="detail-grid">
                    <div>
                        <span className="label">Area</span>
                        <strong>{selected.area}</strong>
                    </div>
                    <div>
                        <span className="label">Pincode</span>
                        <strong>{selected.pincode}</strong>
                    </div>
                    <div>
                        <span className="label">Corporation</span>
                        <strong>{selected.corporation}</strong>
                    </div>
                    <div>
                        <span className="label">Coordinates</span>
                        <strong>
                            {selected.lat.toFixed(4)}, {selected.lng.toFixed(4)}
                        </strong>
                    </div>
                    {selected.distance_km != null ? (
                        <div>
                            <span className="label">Nearest click</span>
                            <strong>{selected.distance_km.toFixed(2)} km away</strong>
                        </div>
                    ) : null}
                </div>
            ) : (
                <p className="muted-copy">Search for a pincode or area, or click any marker on the map.</p>
            )}

            <div className="message-line" aria-live="polite">
                {error ? <span className="error-text">{error}</span> : <span>{status}</span>}
            </div>

            {results.length > 1 ? (
                <div className="result-stack">
                    <p className="stack-title">Matches</p>
                    {results.map((record) => (
                        <ResultRow
                            key={`${record.pincode}-${record.area}`}
                            record={record}
                            active={selected?.area === record.area && selected?.pincode === record.pincode}
                            onPick={onPickResult}
                        />
                    ))}
                </div>
            ) : null}
        </section>
    )
}
