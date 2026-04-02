import React, { useState } from 'react';
import { Card, Row, Col, Badge, ProgressBar } from 'react-bootstrap';

interface Project {
    id: number;
    name: string;
    status: string;
    progress: number;
    members: number;
    due: string;
    priority: string;
    color: string;
    tasks_done: number;
    tasks_total: number;
}

interface KanbanTask { id: number; title: string; priority: string; assignee: string; }
interface KanbanBoard { todo: KanbanTask[]; inprogress: KanbanTask[]; done: KanbanTask[]; }
interface ShoppingItem { id: number; item: string; qty: string; cat: string; bought: boolean; }

interface Props {
    projects: Project[];
    kanban: KanbanBoard;
    shopping_list: ShoppingItem[];
}

const priorityColor: Record<string, string> = { High: 'danger', Medium: 'warning', Low: 'success' };
const priorityIcon: Record<string, string> = { High: 'ri-arrow-up-line', Medium: 'ri-subtract-line', Low: 'ri-arrow-down-line' };

const PremiumProjects: React.FC<Props> = ({ projects, kanban, shopping_list }) => {
    const [activeTab, setActiveTab] = useState<'projects' | 'kanban' | 'shopping'>('projects');
    const [shoppingItems, setShoppingItems] = useState(shopping_list);

    const toggleBought = (id: number) => {
        setShoppingItems(items => items.map(i => i.id === id ? { ...i, bought: !i.bought } : i));
    };

    const columns = [
        { key: 'todo', label: 'To Do', color: 'secondary', items: kanban.todo },
        { key: 'inprogress', label: 'In Progress', color: 'warning', items: kanban.inprogress },
        { key: 'done', label: 'Done', color: 'success', items: kanban.done },
    ];

    const boughtCount = shoppingItems.filter(i => i.bought).length;

    return (
        <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent border-bottom-0 pt-4 pb-0">
                <div className="d-flex align-items-center justify-content-between">
                    <div>
                        <h5 className="mb-1 fw-semibold">
                            <i className="ri-kanban-view me-2 text-warning"></i>
                            Proyek & Tugas
                        </h5>
                        <p className="text-muted fs-13 mb-0">Pantau progres proyek dan tugas keluarga</p>
                    </div>
                    <div className="d-flex gap-1">
                        {(['projects', 'kanban', 'shopping'] as const).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className={`btn btn-sm ${activeTab === tab ? 'btn-warning' : 'btn-soft-secondary'}`}>
                                {tab === 'projects' ? 'Proyek' : tab === 'kanban' ? 'Kanban' : 'Belanja'}
                            </button>
                        ))}
                    </div>
                </div>
            </Card.Header>
            <Card.Body>
                {activeTab === 'projects' && (
                    <Row className="g-3">
                        {projects.map(p => (
                            <Col md={12} key={p.id}>
                                <div className="border rounded-3 p-3 hover-shadow" style={{ transition: 'box-shadow 0.2s' }}>
                                    <div className="d-flex align-items-start justify-content-between mb-2">
                                        <div className="flex-grow-1">
                                            <h6 className="mb-1 fw-semibold">{p.name}</h6>
                                            <div className="d-flex gap-2 flex-wrap">
                                                <Badge bg={p.color} className="fs-11">{p.status}</Badge>
                                                <Badge bg={priorityColor[p.priority] || 'secondary'} className="fs-11">
                                                    <i className={`${priorityIcon[p.priority] || ''} me-1`}></i>{p.priority}
                                                </Badge>
                                                <span className="text-muted fs-11"><i className="ri-calendar-line me-1"></i>{p.due}</span>
                                                <span className="text-muted fs-11"><i className="ri-team-line me-1"></i>{p.members} anggota</span>
                                            </div>
                                        </div>
                                        <span className={`fw-bold text-${p.color} fs-18`}>{p.progress}%</span>
                                    </div>
                                    <ProgressBar now={p.progress} variant={p.color} style={{ height: 8 }} className="rounded-pill mb-2" />
                                    <div className="d-flex justify-content-between">
                                        <span className="text-muted fs-12">{p.tasks_done}/{p.tasks_total} tugas selesai</span>
                                        <button className="btn btn-sm btn-soft-primary py-0 px-2 fs-11">Lihat Detail</button>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                )}

                {activeTab === 'kanban' && (
                    <Row className="g-3">
                        {columns.map(col => (
                            <Col md={4} key={col.key}>
                                <div className="rounded-3 p-3" style={{ background: '#f8f9fa', minHeight: 300 }}>
                                    <div className="d-flex align-items-center justify-content-between mb-3">
                                        <h6 className="mb-0 fw-semibold">
                                            <span className={`badge bg-${col.color} me-2`}>{col.items.length}</span>
                                            {col.label}
                                        </h6>
                                    </div>
                                    {col.items.map(task => (
                                        <div key={task.id} className="bg-white rounded-3 p-3 mb-2 border shadow-sm">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <p className="mb-0 fw-medium fs-13">{task.title}</p>
                                                <Badge bg={priorityColor[task.priority] || 'secondary'} className="fs-11 ms-1 flex-shrink-0">{task.priority}</Badge>
                                            </div>
                                            <div className="d-flex align-items-center gap-2">
                                                <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center"
                                                    style={{ width: 22, height: 22 }}>
                                                    <span className="text-white" style={{ fontSize: 10, fontWeight: 700 }}>{task.assignee.charAt(0)}</span>
                                                </div>
                                                <span className="text-muted fs-11">{task.assignee}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {col.items.length === 0 && (
                                        <div className="text-center text-muted py-4">
                                            <i className="ri-inbox-line fs-24 d-block mb-2"></i>
                                            <small>Kosong</small>
                                        </div>
                                    )}
                                </div>
                            </Col>
                        ))}
                    </Row>
                )}

                {activeTab === 'shopping' && (
                    <div>
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <div>
                                <h6 className="mb-0 fw-semibold">Daftar Belanja Bersama</h6>
                                <p className="text-muted fs-12 mb-0">{boughtCount}/{shoppingItems.length} item sudah dibeli</p>
                            </div>
                            <ProgressBar now={Math.round((boughtCount / shoppingItems.length) * 100)}
                                variant="success" style={{ width: 100, height: 8 }} className="rounded-pill" />
                        </div>
                        {shoppingItems.map(item => (
                            <div key={item.id} onClick={() => toggleBought(item.id)}
                                className={`d-flex align-items-center p-3 mb-2 rounded-3 border cursor-pointer ${item.bought ? 'bg-success-subtle border-success-subtle opacity-75' : 'border-light'}`}
                                style={{ cursor: 'pointer' }}>
                                <div className={`flex-shrink-0 me-3 rounded-circle d-flex align-items-center justify-content-center border-2 ${item.bought ? 'bg-success border-success' : 'border border-secondary'}`}
                                    style={{ width: 24, height: 24, border: '2px solid' }}>
                                    {item.bought && <i className="ri-check-line text-white fs-11"></i>}
                                </div>
                                <div className="flex-grow-1">
                                    <p className={`mb-0 fw-medium fs-13 ${item.bought ? 'text-decoration-line-through text-muted' : ''}`}>{item.item}</p>
                                    <p className="mb-0 text-muted fs-11">{item.qty} · {item.cat}</p>
                                </div>
                            </div>
                        ))}
                        <div className="mt-3 p-3 bg-light rounded-3 text-center">
                            <i className="ri-whatsapp-line text-success fs-16 me-2"></i>
                            <span className="fs-12 text-muted">Ketik <code>belanja [item]</code> di WhatsApp untuk tambah item</span>
                        </div>
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default PremiumProjects;
