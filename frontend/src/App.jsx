import { useEffect, useMemo, useState } from 'react'
import InfoPanel from './components/InfoPanel'
import MapView from './components/MapView'
import SearchBar from './components/SearchBar'
import Sidebar from './components/Sidebar'
import { CORPORATION_COLORS, normalizeText } from './constants'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

function apiUrl(path) {
    if (!API_BASE) {
        return path
    }

    return `${API_BASE}${path}`
}

function buildCorporationVisibility() {
    return Object.keys(CORPORATION_COLORS).reduce((accumulator, corporation) => {
        accumulator[corporation] = true
        return accumulator
    }, {})
}

function App() {
    const [areas, setAreas] = useState([])
    const [overview, setOverview] = useState(null)
    const [selected, setSelected] = useState(null)
    const [results, setResults] = useState([])
    const [query, setQuery] = useState('')
    const [mode, setMode] = useState('pincode')
    const [status, setStatus] = useState('Loading Bengaluru dataset...')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [corporationVisibility, setCorporationVisibility] = useState(buildCorporationVisibility)

    useEffect(() => {
        let cancelled = false

        async function loadAreas() {
            try {
                const response = await fetch(apiUrl('/api/areas'))
                if (!response.ok) {
                    throw new Error('Unable to load the dataset')
                }

                const data = await response.json()
                if (cancelled) {
                    return
                }

                setAreas(data.areas)
                setOverview(data.overview)
                setSelected(data.areas[0] ?? null)
                setResults(data.areas.slice(0, 5))
                setStatus('Search by pincode, area name, or click any marker on the map.')
            } catch (loadError) {
                if (!cancelled) {
                    setError(loadError.message)
                    setStatus('The application could not load the Bengaluru dataset.')
                }
            }
        }

        loadAreas()

        return () => {
            cancelled = true
        }
    }, [])

    const visibleAreas = useMemo(
        () => areas.filter((record) => corporationVisibility[record.corporation]),
        [areas, corporationVisibility],
    )

    async function lookup(nextMode = mode, nextQuery = query) {
        const trimmedQuery = nextQuery.trim()
        if (!trimmedQuery) {
            setError('Enter a pincode or area name before searching.')
            return
        }

        setLoading(true)
        setError('')
        setStatus('Looking up the Bengaluru dataset...')

        const endpoint =
            nextMode === 'pincode'
                ? apiUrl(`/api/lookup?pincode=${encodeURIComponent(trimmedQuery)}`)
                : apiUrl(`/api/lookup?area=${encodeURIComponent(trimmedQuery)}`)

        try {
            const response = await fetch(endpoint)
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.detail ?? 'Lookup failed')
            }

            setResults(data.matches)
            setSelected(data.matches[0] ?? null)
            setStatus(
                nextMode === 'pincode'
                    ? `Found ${data.total} area${data.total === 1 ? '' : 's'} for pincode ${trimmedQuery}.`
                    : `Found ${data.total} area${data.total === 1 ? '' : 's'} for ${trimmedQuery}.`,
            )
        } catch (lookupError) {
            setResults([])
            setError(lookupError.message)
            setStatus('No matches were found.')
        } finally {
            setLoading(false)
        }
    }

    async function resolveNearest(lat, lng) {
        try {
            setError('')
            const response = await fetch(apiUrl(`/api/nearest?lat=${lat}&lng=${lng}`))
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.detail ?? 'Unable to resolve the clicked location')
            }

            setSelected(data.match)
            setResults([data.match])
            setQuery(data.match.pincode)
            setMode('pincode')
            setStatus(`Nearest match is ${data.match.area} (${data.match.pincode}).`)
        } catch (nearestError) {
            setError(nearestError.message)
        }
    }

    function handleAreaSelect(record) {
        const samePincodeMatches = areas.filter((item) => item.pincode === record.pincode)
        setSelected(record)
        setResults(samePincodeMatches.length > 0 ? samePincodeMatches : [record])
        setStatus(`${record.area} is linked to pincode ${record.pincode}.`)
    }

    function handleLocateMe() {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported in this browser.')
            return
        }

        setLoading(true)
        setStatus('Locating your current position...')
        setError('')

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLoading(false)
                resolveNearest(position.coords.latitude, position.coords.longitude)
            },
            (geoError) => {
                setLoading(false)
                setError(geoError.message || 'Unable to access your location.')
            },
            { enableHighAccuracy: true, timeout: 10000 },
        )
    }

    function toggleCorporation(corporation) {
        setCorporationVisibility((current) => ({
            ...current,
            [corporation]: !current[corporation],
        }))
    }

    const filteredAreas = useMemo(() => {
        const normalizedQuery = normalizeText(query)
        return visibleAreas.filter((record) => {
            if (!normalizedQuery) {
                return true
            }

            return (
                normalizeText(record.area).includes(normalizedQuery) ||
                record.pincode.includes(normalizedQuery) ||
                normalizeText(record.corporation).includes(normalizedQuery)
            )
        })
    }, [query, visibleAreas])

    return (
        <div className="app-shell">
            <div className="bg-orb orb-a" />
            <div className="bg-orb orb-b" />

            <header className="hero card">
                <div>
                    <p className="eyebrow">Bengaluru 2026 municipal model</p>
                    <h1>Interactive Bangalore Pincode Map Explorer</h1>
                    <p className="hero-copy">
                        Explore Bengaluru's localities on a live Leaflet map, click markers for details, search by pincode,
                        or type an area name to jump to the correct corporation and pincode.
                    </p>
                </div>

                <div className="hero-metrics">
                    <article className="metric">
                        <span>Areas</span>
                        <strong>{overview?.uniqueAreas ?? '...'}</strong>
                    </article>
                    <article className="metric">
                        <span>Pincodes</span>
                        <strong>{overview?.uniquePincodes ?? '...'}</strong>
                    </article>
                    <article className="metric">
                        <span>Corporations</span>
                        <strong>{overview?.corporations?.length ?? '...'}</strong>
                    </article>
                </div>
            </header>

            <SearchBar
                mode={mode}
                query={query}
                loading={loading}
                status={status}
                error={error}
                onModeChange={setMode}
                onQueryChange={setQuery}
                onSubmit={() => lookup()}
                onLocateMe={handleLocateMe}
            />

            <main className="layout">
                <MapView
                    areas={areas}
                    selected={selected}
                    corporationVisibility={corporationVisibility}
                    onSelectArea={handleAreaSelect}
                    onMapClick={({ lat, lng }) => resolveNearest(lat, lng)}
                />

                <aside className="sidebar-column">
                    <InfoPanel
                        selected={selected}
                        results={results}
                        status={status}
                        error={error}
                        onPickResult={handleAreaSelect}
                    />

                    <Sidebar
                        areas={areas}
                        query={query}
                        corporationVisibility={corporationVisibility}
                        onToggleCorporation={toggleCorporation}
                        onPickArea={handleAreaSelect}
                    />
                </aside>
            </main>
        </div>
    )
}

export default App
