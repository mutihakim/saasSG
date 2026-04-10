import React from 'react';
import { Card, CardHeader, CardBody } from 'react-bootstrap';

import LazyApexChart from '@/components/ui/LazyApexChart';

interface FinanceData {
    month: string;
    income: number;
    expense: number;
}

interface Props {
    data: FinanceData[];
}

const PremiumFinances: React.FC<Props> = ({ data }) => {
    const series = [
        {
            name: 'Pemasukan',
            data: data.map(d => d.income)
        },
        {
            name: 'Pengeluaran',
            data: data.map(d => d.expense)
        }
    ];

    const options: any = {
        chart: {
            type: 'bar',
            height: 350,
            toolbar: {
                show: false,
            }
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '45%',
                borderRadius: 5,
            },
        },
        dataLabels: {
            enabled: false,
        },
        stroke: {
            show: true,
            width: 2,
            colors: ['transparent']
        },
        colors: ['#0ab39c', '#f06548'],
        xaxis: {
            categories: data.map(d => d.month),
        },
        yaxis: {
            title: {
                text: 'Rp (Rupiah)',
                style: {
                    fontWeight: 500,
                },
            },
        },
        grid: {
            borderColor: '#f1f1f1',
        },
        fill: {
            opacity: 1
        },
        tooltip: {
            y: {
                formatter: function (val: number) {
                    return "Rp " + val.toLocaleString('id-ID');
                }
            }
        }
    };

    return (
        <Card className="shadow-sm border-0 h-100">
            <CardHeader className="align-items-center d-flex border-0 pb-0">
                <h4 className="card-title mb-0 flex-grow-1 fw-bold">Ringkasan Keuangan</h4>
            </CardHeader>
            <CardBody>
                <LazyApexChart
                    options={options}
                    series={series}
                    type="bar"
                    height={350}
                    className="apex-charts"
                />
            </CardBody>
        </Card>
    );
};

export default PremiumFinances;
