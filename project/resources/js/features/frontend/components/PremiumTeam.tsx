import React from 'react';
import { Card, CardHeader, CardBody, Table } from 'react-bootstrap';

interface TeamMember {
    name: string;
    role: string;
    img: string;
    status: string;
    points: number;
}

interface Props {
    team: TeamMember[];
}

const PremiumTeam: React.FC<Props> = ({ team }) => {
    return (
        <Card className="shadow-sm border-0">
            <CardHeader className="align-items-center d-flex border-0">
                <h4 className="card-title mb-0 flex-grow-1 fw-bold">Anggota Keluarga</h4>
                <div className="flex-shrink-0">
                    <button type="button" className="btn btn-soft-primary btn-sm shadow-none">
                        Lihat Semua
                    </button>
                </div>
            </CardHeader>

            <CardBody>
                <div className="table-responsive table-card">
                    <Table className="table-borderless align-middle mb-0">
                        <thead className="table-light text-muted">
                            <tr>
                                <th scope="col">Anggota</th>
                                <th scope="col">Peran</th>
                                <th scope="col">Poin</th>
                                <th scope="col">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {team.map((member, idx) => (
                                <tr key={idx}>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <div className="flex-shrink-0 me-2">
                                                <div className="avatar-xs">
                                                    <div className="avatar-title rounded-circle bg-soft-primary text-primary fs-14">
                                                        {member.name.charAt(0)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex-grow-1">
                                                <h6 className="fs-14 mb-0 fw-semibold">{member.name}</h6>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{member.role}</td>
                                    <td>
                                        <span className="badge badge-soft-warning">{member.points} pts</span>
                                    </td>
                                    <td>
                                        <span className={`ri-checkbox-blank-circle-fill align-middle me-1 text-${member.status === 'online' ? 'success' : 'secondary'} fs-8`}></span>
                                        <span className="fs-12 text-muted text-capitalize">{member.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            </CardBody>
        </Card>
    );
};

export default PremiumTeam;
