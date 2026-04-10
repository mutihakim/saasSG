import React from 'react';
import { Card, CardHeader, CardBody, ProgressBar } from 'react-bootstrap';

interface Project {
    id: number;
    name: string;
    progress: number;
    status: string;
    dueDate: string;
    priority: string;
    color: string;
}

interface Props {
    projects: Project[];
}

const PremiumProjectList: React.FC<Props> = ({ projects }) => {
    return (
        <Card className="shadow-sm border-0">
            <CardHeader className="align-items-center d-flex border-0">
                <h4 className="card-title mb-0 flex-grow-1 fw-bold">Proyek Terbaru</h4>
                <div className="flex-shrink-0">
                    <div className="dropdown card-header-dropdown">
                        <button className="btn btn-soft-secondary btn-sm shadow-none" type="button">
                            Cek Detail
                        </button>
                    </div>
                </div>
            </CardHeader>

            <CardBody>
                <div className="table-responsive table-card">
                    <table className="table table-borderless table-centered align-middle table-nowrap mb-0">
                        <thead className="text-muted table-light">
                            <tr>
                                <th scope="col">Nama Proyek</th>
                                <th scope="col">Tenggat</th>
                                <th scope="col">Status</th>
                                <th scope="col">Progress</th>
                                <th scope="col">Prioritas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map((project) => (
                                <tr key={project.id}>
                                    <td>
                                        <h6 className="fs-14 mb-0 fw-semibold">{project.name}</h6>
                                    </td>
                                    <td className="text-muted">{project.dueDate}</td>
                                    <td>
                                        <span className={`badge badge-soft-${project.color} text-uppercase`}>{project.status}</span>
                                    </td>
                                    <td>
                                        <div className="d-flex align-items-center gap-2">
                                            <div className="flex-grow-1">
                                                <ProgressBar now={project.progress} variant={project.color} className="animated-progress shadow-none" style={{ height: '5px' }} />
                                            </div>
                                            <div className="flex-shrink-0 fs-12 text-muted">{project.progress}%</div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge bg-${project.priority === 'High' ? 'danger' : (project.priority === 'Medium' ? 'warning' : 'info')}`}>{project.priority}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardBody>
        </Card>
    );
};

export default PremiumProjectList;
