import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import CountUp from 'react-countup';

interface SummaryCardProps {
    title: string;
    amount: number;
    currency: string;
    icon: string;
    color: 'primary' | 'success' | 'danger' | 'warning' | 'info';
}

const SummaryCardComponent = ({ title, amount, currency, icon, color }: SummaryCardProps) => {
    return (
        <Card className={`card-animate card-${color}`}>
            <Card.Body>
                <div className="d-flex align-items-center">
                    <div className="flex-grow-1 overflow-hidden">
                        <p className="text-uppercase fw-medium text-muted text-truncate mb-0">
                            {title}
                        </p>
                    </div>
                    <div className="flex-shrink-0">
                        <div className="avatar-sm">
                            <span className={`avatar-title bg-soft-${color} text-${color} rounded fs-18`}>
                                <i className={icon}></i>
                            </span>
                        </div>
                    </div>
                </div>
                <div className="d-flex align-items-end justify-content-between mt-4">
                    <div>
                        <h4 className="fs-22 fw-semibold ff-secondary mb-4">
                            <span className="me-1">{currency}</span>
                            <CountUp
                                start={0}
                                end={amount}
                                separator=","
                                decimals={0}
                                duration={1.5}
                                enableScrollSpy={false}
                                useEasing={false}
                            />
                        </h4>
                    </div>
                </div>
            </Card.Body>
        </Card>
    );
};

interface WidgetsProps {
    summary: {
        income: number;
        expense: number;
        net: number;
        savings: number;
        currency: string;
    };
}

const Widgets = ({ summary }: WidgetsProps) => {
    return (
        <>
            <Col xl={3} md={6}>
                <SummaryCardComponent
                    title="Income"
                    amount={summary.income}
                    currency={summary.currency}
                    icon="ri-arrow-right-up-line"
                    color="success"
                />
            </Col>
            <Col xl={3} md={6}>
                <SummaryCardComponent
                    title="Expense"
                    amount={summary.expense}
                    currency={summary.currency}
                    icon="ri-arrow-right-down-line"
                    color="danger"
                />
            </Col>
            <Col xl={3} md={6}>
                <SummaryCardComponent
                    title="Net Balance"
                    amount={summary.net}
                    currency={summary.currency}
                    icon="ri-wallet-3-line"
                    color="primary"
                />
            </Col>
            <Col xl={3} md={6}>
                <SummaryCardComponent
                    title="Savings"
                    amount={summary.savings}
                    currency={summary.currency}
                    icon="ri-safe-2-line"
                    color="info"
                />
            </Col>
        </>
    );
};

export default Widgets;
