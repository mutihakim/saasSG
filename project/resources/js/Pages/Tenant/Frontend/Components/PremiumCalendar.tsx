import React, { useState } from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';

interface Routine { id: number; task: string; time: string; points: number; done: boolean; assignee: string; }
interface Event { id: number; title: string; start: string; className: string; }
interface Menu { day: string; breakfast: string; lunch: string; dinner: string; }

interface Props {
    calendar: Event[];
    routines: { morning: Routine[]; night: Routine[] };
    menus: Menu[];
}

const PremiumCalendar: React.FC<Props> = ({ calendar, routines, menus }) => {
    const [activeTab, setActiveTab] = useState<'agenda' | 'routines' | 'menu'>('agenda');

    const colorMap: Record<string, string> = {
        'bg-primary-subtle text-primary': '#405189',
        'bg-danger-subtle text-danger': '#dc3545',
        'bg-success-subtle text-success': '#0ab39c',
        'bg-warning-subtle text-warning': '#f7b84b',
        'bg-info-subtle text-info': '#299cdb',
    };

    const today = new Date();
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();

    const calendarDays: (number | null)[] = Array(firstDay).fill(null);
    for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

    const getEventsForDay = (day: number | null) => {
        if (!day) return [];
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return calendar.filter(e => e.start === dateStr || (e as any).end === dateStr);
    };

    return (
        <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent border-bottom-0 pt-4 pb-0">
                <div className="d-flex align-items-center justify-content-between">
                    <div>
                        <h5 className="mb-1 fw-semibold">
                            <i className="ri-calendar-2-line me-2 text-primary"></i>
                            Perencanaan & Kalender
                        </h5>
                        <p className="text-muted fs-13 mb-0">Jadwal, rutinitas, dan menu keluarga</p>
                    </div>
                    <div className="d-flex gap-1">
                        {(['agenda', 'routines', 'menu'] as const).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : 'btn-soft-secondary'}`}>
                                {tab === 'agenda' ? 'Kalender' : tab === 'routines' ? 'Rutinitas' : 'Menu'}
                            </button>
                        ))}
                    </div>
                </div>
            </Card.Header>
            <Card.Body>
                {activeTab === 'agenda' && (
                    <Row>
                        <Col lg={7}>
                            <div className="mb-3">
                                <h6 className="text-center fw-semibold text-muted mb-3">
                                    {monthNames[today.getMonth()]} {today.getFullYear()}
                                </h6>
                                <div className="d-grid gap-1" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                                    {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
                                        <div key={d} className="text-center fw-medium text-muted fs-12 py-1">{d}</div>
                                    ))}
                                    {calendarDays.map((day, i) => {
                                        const events = getEventsForDay(day);
                                        const isToday = day === today.getDate();
                                        return (
                                            <div key={i} className={`text-center p-1 rounded position-relative ${isToday ? 'bg-primary text-white' : day ? 'hover-bg-light' : ''}`}
                                                style={{ minHeight: '36px', cursor: day ? 'pointer' : 'default' }}>
                                                {day && <span className="fs-12 fw-medium">{day}</span>}
                                                {events.length > 0 && (
                                                    <div className="position-absolute bottom-0 start-50 translate-middle-x mb-1">
                                                        <div className="d-flex gap-1 justify-content-center">
                                                            {events.slice(0, 2).map((e, ei) => (
                                                                <span key={ei} className="rounded-circle"
                                                                    style={{ width: 6, height: 6, background: colorMap[e.className] || '#405189', display: 'block' }}></span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </Col>
                        <Col lg={5}>
                            <h6 className="fw-semibold mb-3">Agenda Mendatang</h6>
                            <div className="d-flex flex-column gap-2">
                                {calendar.map(evt => (
                                    <div key={evt.id} className={`p-3 rounded-3 ${evt.className?.split(' ')[0] || 'bg-primary-subtle'}`}>
                                        <div className="d-flex align-items-center gap-2">
                                            <i className="ri-calendar-event-line fs-16"></i>
                                            <div>
                                                <p className="fw-semibold mb-0 fs-13">{evt.title}</p>
                                                <p className="text-muted fs-12 mb-0">{new Date(evt.start).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Col>
                    </Row>
                )}

                {activeTab === 'routines' && (
                    <Row>
                        <Col md={6}>
                            <h6 className="fw-semibold mb-3"><i className="ri-sun-line me-2 text-warning"></i>Rutinitas Pagi</h6>
                            {routines.morning.map(r => (
                                <div key={r.id} className={`d-flex align-items-center p-2 mb-2 rounded-3 border ${r.done ? 'bg-success-subtle border-success-subtle' : 'border-light'}`}>
                                    <div className={`flex-shrink-0 me-3 rounded-circle d-flex align-items-center justify-content-center`}
                                        style={{ width: 28, height: 28, background: r.done ? '#0ab39c' : '#f3f6f9' }}>
                                        <i className={`${r.done ? 'ri-check-line text-white' : 'ri-time-line text-muted'} fs-13`}></i>
                                    </div>
                                    <div className="flex-grow-1">
                                        <p className={`mb-0 fs-13 ${r.done ? 'text-decoration-line-through text-muted' : 'fw-medium'}`}>{r.task}</p>
                                        <p className="mb-0 fs-11 text-muted">{r.time} · {r.assignee}</p>
                                    </div>
                                    <Badge bg={r.done ? 'success' : 'soft-primary'} className="fs-11">+{r.points} pts</Badge>
                                </div>
                            ))}
                        </Col>
                        <Col md={6}>
                            <h6 className="fw-semibold mb-3"><i className="ri-moon-line me-2 text-info"></i>Rutinitas Malam</h6>
                            {routines.night.map(r => (
                                <div key={r.id} className={`d-flex align-items-center p-2 mb-2 rounded-3 border ${r.done ? 'bg-success-subtle border-success-subtle' : 'border-light'}`}>
                                    <div className="flex-shrink-0 me-3 rounded-circle d-flex align-items-center justify-content-center"
                                        style={{ width: 28, height: 28, background: r.done ? '#0ab39c' : '#f3f6f9' }}>
                                        <i className={`${r.done ? 'ri-check-line text-white' : 'ri-time-line text-muted'} fs-13`}></i>
                                    </div>
                                    <div className="flex-grow-1">
                                        <p className={`mb-0 fs-13 ${r.done ? 'text-decoration-line-through text-muted' : 'fw-medium'}`}>{r.task}</p>
                                        <p className="mb-0 fs-11 text-muted">{r.time} · {r.assignee}</p>
                                    </div>
                                    <Badge bg="info" className="fs-11">+{r.points}</Badge>
                                </div>
                            ))}
                        </Col>
                    </Row>
                )}

                {activeTab === 'menu' && (
                    <div className="table-responsive">
                        <table className="table table-bordered table-sm align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>Hari</th>
                                    <th><i className="ri-sun-line text-warning me-1"></i>Sarapan</th>
                                    <th><i className="ri-restaurant-line text-success me-1"></i>Makan Siang</th>
                                    <th><i className="ri-moon-line text-primary me-1"></i>Makan Malam</th>
                                </tr>
                            </thead>
                            <tbody>
                                {menus.map((m, i) => (
                                    <tr key={i} className={i === today.getDay() - 1 ? 'table-primary' : ''}>
                                        <td className="fw-semibold">{m.day}</td>
                                        <td className="text-muted fs-13">{m.breakfast}</td>
                                        <td className="text-muted fs-13">{m.lunch}</td>
                                        <td className="text-muted fs-13">{m.dinner}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default PremiumCalendar;
