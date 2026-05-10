import { useEffect, useMemo, useState } from 'react'
import { Circle, CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import { DEFAULT_CENTER, colorForCorporation } from '../constants'

function MapController({ selected }) {
    const map = useMap()

    useEffect(() => {
        if (!selected) {
            return
        }

        map.flyTo([selected.lat, selected.lng], 13, { duration: 0.85 })
    }, [map, selected])

    return null
}

function ClickCapture({ onMapClick }) {
    useMapEvents({
        click(event) {
            onMapClick(event.latlng)
        },
    })

    return null
}

function SelectedPulse({ selected }) {
    const [pulse, setPulse] = useState(false)

    useEffect(() => {
        if (!selected) {
            return undefined
        }

        const timer = window.setInterval(() => {
            setPulse((value) => !value)
        }, 650)

        return () => window.clearInterval(timer)
    }, [selected])

    if (!selected) {
        return null
    }

    return (
        <Circle
            center={[selected.lat, selected.lng]}
            radius={pulse ? 2100 : 1650}
            pathOptions={{
                color: colorForCorporation(selected.corporation),
                fillColor: colorForCorporation(selected.corporation),
                fillOpacity: 0.1,
                weight: 2,
                dashArray: '8 8',
            }}
        />
    )
}

export default function MapView({ areas, selected, corporationVisibility, visibleCount, onSelectArea, onMapClick }) {
    const visibleAreas = useMemo(
        () => areas.filter((record) => corporationVisibility[record.corporation]),
        [areas, corporationVisibility],
    )

    return (
        <section className="card map-panel">
            <div className="section-head compact map-head">
                <div>
                    <p className="eyebrow">Map</p>
                    <h2>Bengaluru localities</h2>
                    <p className="map-subtext">Click markers for details, or click anywhere to find the nearest locality.</p>
                </div>
                <div className="legend">
                    {Object.entries(corporationVisibility).map(([corporation, enabled]) => (
                        <span key={corporation} className={enabled ? '' : 'disabled'} style={{ '--accent': colorForCorporation(corporation) }}>
                            {corporation}
                        </span>
                    ))}
                </div>
            </div>
            <div className="map-meta-row">
                <span>{visibleCount} visible markers</span>
                <span>{areas.length} total localities</span>
            </div>

            <div className="map-frame">
                <MapContainer center={DEFAULT_CENTER} zoom={11} scrollWheelZoom className="leaflet-surface">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapController selected={selected} />
                    <ClickCapture onMapClick={onMapClick} />
                    <SelectedPulse selected={selected} />

                    {visibleAreas.map((record) => {
                        const isSelected = selected?.area === record.area && selected?.pincode === record.pincode
                        const corporationColor = colorForCorporation(record.corporation)

                        return (
                            <CircleMarker
                                key={`${record.pincode}-${record.area}`}
                                center={[record.lat, record.lng]}
                                radius={isSelected ? 12 : 7}
                                pathOptions={{
                                    color: corporationColor,
                                    fillColor: corporationColor,
                                    fillOpacity: isSelected ? 0.95 : 0.62,
                                    weight: isSelected ? 3 : 1.4,
                                }}
                                eventHandlers={{
                                    click: () => onSelectArea(record),
                                }}
                            >
                                <Popup>
                                    <strong>{record.area}</strong>
                                    <br />
                                    {record.pincode}
                                    <br />
                                    {record.corporation}
                                </Popup>
                            </CircleMarker>
                        )
                    })}
                </MapContainer>
            </div>
        </section>
    )
}
