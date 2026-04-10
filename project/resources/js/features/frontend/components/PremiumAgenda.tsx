import React from 'react';
import { Card, CardHeader, CardBody } from 'react-bootstrap';

interface AgendaItem {
    title: string;
    date: string;
    time: string;
    category: string;
}

interface Props {
    agenda: AgendaItem[];
}

const PremiumAgenda: React.FC<Props> = ({ agenda }) => {
    return (
        <Card className="shadow-sm border-0 h-100">
            <CardHeader className="align-items-center d-flex border-0">
                <h4 className="card-title mb-0 flex-grow-1 fw-bold">Agenda Terdekat</h4>
            </CardHeader>
            <CardBody className="pt-0">
                <div className="vstack gap-3 mt-3">
                    {agenda.map((item, idx) => (
                        <div key={idx} className="d-flex align-items-center border border-dashed p-2 rounded">
                            <div className="flex-shrink-0 avatar-xs">
                                <div className="avatar-title bg-soft-info text-info rounded-circle fs-13">
                                    {item.date.split(' ')[0]}
                                </div>
                            </div>
                            <div className="flex-grow-1 ms-3 overflow-hidden">
                                <h6 className="fs-14 mb-1 text-truncate fw-semibold">{item.title}</h6>
                                <p className="text-muted mb-0 fs-12">{item.date}, {item.time}</p>
                            </div>
                            <div className="flex-shrink-0">
                                <span className={`badge badge-soft-${item.category === 'Meeting' ? 'primary' : (item.category === 'Shopping' ? 'success' : 'warning')} text-uppercase fs-10`}>
                                    {item.category}
                                </span>
                            </div>
                        </div>
                    ))}
                    {agenda.length === 0 && <p className="text-muted fs-12">Tidak ada agenda dalam waktu dekat.</p>}
                </div>
                <div className="mt-3 text-center">
                    <button className="btn btn-sm btn-link text-primary p-0">Buka Kalender <i className="ri-arrow-right-line align-middle ms-1"></i></button>
                </div>
            </CardBody>
        </Card>
    );
};

export default PremiumAgenda;
