export default function SearchBar({
    mode,
    query,
    loading,
    resultCount,
    quickSearches,
    status,
    error,
    onQuickPick,
    onModeChange,
    onQueryChange,
    onSubmit,
    onLocateMe,
}) {
    return (
        <section className="search-shell card">
            <div className="search-header">
                <div>
                    <p className="eyebrow">Search by pincode or area</p>
                    <h2>Map Command Center</h2>
                    <p className="search-hint">
                        {mode === 'pincode'
                            ? 'Use a 6-digit pincode to jump instantly.'
                            : 'Area search supports partial matches (example: Korama).'}
                    </p>
                </div>
                <div className="search-toggle" role="tablist" aria-label="Search mode">
                    <button className={mode === 'pincode' ? 'active' : ''} onClick={() => onModeChange('pincode')} type="button">
                        Pincode
                    </button>
                    <button className={mode === 'area' ? 'active' : ''} onClick={() => onModeChange('area')} type="button">
                        Area
                    </button>
                </div>
            </div>

            <form
                className="search-form"
                onSubmit={(event) => {
                    event.preventDefault()
                    onSubmit()
                }}
            >
                <input
                    value={query}
                    onChange={(event) => onQueryChange(event.target.value)}
                    placeholder={mode === 'pincode' ? 'Search by pincode (e.g. 560001)' : 'Search by area (e.g. Koramangala)'}
                    aria-label="Search input"
                />
                <button type="button" className="ghost-button" onClick={onLocateMe}>
                    Locate Me
                </button>
                <button type="submit" disabled={loading}>
                    {loading ? 'Searching...' : 'Search'}
                </button>
            </form>

            <div className="quick-search-row">
                {quickSearches.map((item) => (
                    <button key={item} type="button" className="quick-chip" onClick={() => onQuickPick(item)}>
                        {item}
                    </button>
                ))}
            </div>

            <div className="status-row" aria-live="polite">
                {error ? <span className="error-text">{error}</span> : <span>{status}</span>}
                {!error ? <span className="result-badge">{resultCount} loaded</span> : null}
            </div>
        </section>
    )
}
