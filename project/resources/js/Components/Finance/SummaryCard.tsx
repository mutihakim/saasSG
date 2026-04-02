import React from "react";
import { Card } from "react-bootstrap";
import CountUp from "react-countup";

interface SummaryCardProps {
  title: string;
  amount: number;
  currency: string;
  icon: string;
  color: "primary" | "success" | "danger" | "warning" | "info" | "secondary";
  decimalPlaces?: number;
}

const SummaryCard = ({
  title,
  amount,
  currency,
  icon,
  color,
  decimalPlaces = 0
}: SummaryCardProps) => {
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
            <div className={`avatar-sm`}>
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
                decimals={decimalPlaces}
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

export default SummaryCard;
