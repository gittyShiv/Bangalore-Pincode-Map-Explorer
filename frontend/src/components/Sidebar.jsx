import { normalizeText } from '../constants'

export default function Sidebar({ areas, query, corporationVisibility, onToggleCorporation, onPickArea }) {
    const filteredAreas = areas.filter((record) => {
        const visible = corporationVisibility[record.corporation]
        const queryText = normalizeText(query)
        const matchesQuery = !queryText || normalizeText(record.area).includes(queryText) || record.pincode.includes(queryText)
        return visible && matchesQuery
    })

    return (
        <section className="card sidebar-panel">
            <div className="section-head compact">
                <div>
                    <p className="eyebrow">Sidebar</p>
                    <h2>Filter areas</h2>
                </div>
            </div>

            <div className="corp-filter-grid">
                {Object.keys(corporationVisibility).map((corporation) => (
                    <label key={corporation} className="corp-filter">
                        <input
                            type="checkbox"
                            checked={corporationVisibility[corporation]}
                            onChange={() => onToggleCorporation(corporation)}
                        />
                        <span>{corporation}</span>
                    </label>
                ))}
            </div>

            <div className="sidebar-list">
                {filteredAreas.map((record) => (
                    <button key={`${record.pincode}-${record.area}`} className="sidebar-row" type="button" onClick={() => onPickArea(record)}>
                        <div>
                            <strong>{record.area}</strong>
                            <span>{record.pincode}</span>
                        </div>
                        <em>{record.corporation}</em>
                    </button>
                ))}
                {filteredAreas.length === 0 ? <p className="muted-copy">No areas match the current search and corporation filters.</p> : null}
            </div>
        </section>
    )
}
