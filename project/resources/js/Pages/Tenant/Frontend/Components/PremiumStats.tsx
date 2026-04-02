import React from 'react';
import { Card, Col, Row } from 'react-bootstrap';
import CountUp from "react-countup";

interface StatItem {
    label: string;
    counter: number;
    feaIcon: string;
    feaIconClass: string;
    badgeClass: string;
    percentage: string;
    icon: string;
    caption: string;
    suffix?: string;
}

interface Props {
    stats: StatItem[];
}

const PremiumStats: React.FC<Props> = ({ stats }) => {
    return (
        <Row>
            {stats.map((item, key) => (
                <Col xl={4} key={key}>
                    <Card className="card-animate shadow-sm border-0">
                        <Card.Body>
                            <div className="d-flex align-items-center">
                                <div className="avatar-sm flex-shrink-0">
                                    <span className={`avatar-title bg-soft-${item.feaIconClass} text-${item.feaIconClass} rounded-2 fs-2`}>
                                        <i className={`ri-${item.feaIcon}-line`}></i>
                                    </span>
                                </div>
                                <div className="flex-grow-1 overflow-hidden ms-3">
                                    <p className="text-uppercase fw-medium text-muted text-truncate mb-3 fs-12">{item.label}</p>
                                    <div className="d-flex align-items-center mb-1">
                                        <h4 className="fs-22 flex-grow-1 mb-0 fw-bold">
                                            {item.suffix && <span className="fs-14 fw-normal text-muted me-1">{item.suffix}</span>}
                                            <CountUp
                                                start={0}
                                                end={item.counter}
                                                duration={2}
                                                separator="."
                                            />
                                        </h4>
                                        <span className={`fs-12 badge bg-soft-${item.badgeClass} text-${item.badgeClass}`}>
                                            <i className={`${item.icon} align-middle me-1`}></i>{item.percentage}
                                        </span>
                                    </div>
                                    <p className="text-muted text-truncate mb-0 fs-12">{item.caption}</p>
                                </div>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            ))}
        </Row>
    );
};

export default PremiumStats;
