import React from 'react';
import CountUp from "react-countup";
import { Card, Col, Row } from 'react-bootstrap';

interface WidgetItemProps {
    title: string;
    counter: number;
    icon: string;
    color: string;
    decimals?: number;
    prefix?: string;
    suffix?: string;
}

const WidgetItem = ({ title, counter, icon, color, decimals, prefix, suffix }: WidgetItemProps) => (
    <Col xxl={3} sm={6}>
        <Card className="card-animate">
            <Card.Body>
                <div className="d-flex justify-content-between">
                    <div>
                        <p className="fw-medium text-muted mb-0">{title}</p>
                        <h2 className="mt-4 ff-secondary">
                            <span className="counter-value">
                                <CountUp
                                    start={0}
                                    end={counter}
                                    duration={2}
                                    decimals={decimals}
                                    prefix={prefix}
                                    suffix={suffix}
                                />
                            </span>
                        </h2>
                        <p className="mb-0 text-muted">
                            <span className={`badge bg-success-subtle text-success mb-0`}>
                                <i className="ri-arrow-up-line align-middle"></i> Active
                            </span>
                        </p>
                    </div>
                    <div>
                        <div className="avatar-sm flex-shrink-0">
                            <span className={`avatar-title bg-${color}-subtle text-${color} rounded-circle fs-4`}>
                                <i className={icon}></i>
                            </span>
                        </div>
                    </div>
                </div>
            </Card.Body>
        </Card>
    </Col>
);

interface CategoriesWidgetsProps {
    total: number;
    finance: number;
    grocery: number;
    task: number;
}

const CategoriesWidgets = ({ total, finance, grocery, task }: CategoriesWidgetsProps) => {
    const widgets = [
        { title: "Total Categories", counter: total, icon: "ri-stack-line", color: "primary" },
        { title: "Finance", counter: finance, icon: "ri-money-dollar-circle-line", color: "success" },
        { title: "Groceries", counter: grocery, icon: "ri-shopping-cart-2-line", color: "info" },
        { title: "Tasks", counter: task, icon: "ri-checkbox-circle-line", color: "warning" },
    ];

    return (
        <Row>
            {widgets.map((item, key) => (
                <WidgetItem key={key} {...item} />
            ))}
        </Row>
    );
};

export default CategoriesWidgets;
