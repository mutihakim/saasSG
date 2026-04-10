import React from 'react';
import { Col } from 'react-bootstrap';

import SummaryCard from '@/components/ui/SummaryCard';

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
                <SummaryCard
                    title="Income"
                    amount={summary.income}
                    currency={summary.currency}
                    icon="ri-arrow-right-up-line"
                    color="success"
                />
            </Col>
            <Col xl={3} md={6}>
                <SummaryCard
                    title="Expense"
                    amount={summary.expense}
                    currency={summary.currency}
                    icon="ri-arrow-right-down-line"
                    color="danger"
                />
            </Col>
            <Col xl={3} md={6}>
                <SummaryCard
                    title="Net Balance"
                    amount={summary.net}
                    currency={summary.currency}
                    icon="ri-wallet-3-line"
                    color="primary"
                />
            </Col>
            <Col xl={3} md={6}>
                <SummaryCard
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
