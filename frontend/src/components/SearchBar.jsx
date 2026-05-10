export default function SearchBar({ mode, query, loading, status, error, onModeChange, onQueryChange, onSubmit, onLocateMe }) {
    return (
        <section className="search-shell card">
            <div className="search-header">
                <div>
                    <p className="eyebrow">Search</p>
                    <h2>Find a pincode or area</h2>
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
                    placeholder={mode === 'pincode' ? 'Enter a 6-digit pincode' : 'Enter an area name'}
                    aria-label="Search input"
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Searching...' : 'Search'}
                </button>
                <button type="button" className="ghost-button" onClick={onLocateMe}>
                    Locate Me
                </button>
            </form>

            <div className="status-row" aria-live="polite">
                {error ? <span className="error-text">{error}</span> : <span>{status}</span>}
            </div>
        </section>
    )
}
