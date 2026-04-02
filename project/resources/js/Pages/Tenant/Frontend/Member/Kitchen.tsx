import React, { useState } from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';

import MemberLayout from '../Layouts/MemberLayout';

interface Props { tenantName: string; tenantSlug: string; member?: any; demo: any; }

const KitchenPage: React.FC<Props> = ({ tenantName, tenantSlug, member, demo }) => {
    const [shoppingItems, setShoppingItems] = useState(demo.shopping_list);

    const toggle = (id: number) => setShoppingItems((prev: any[]) => prev.map((i: any) => i.id === id ? {...i, bought: !i.bought} : i));
    const boughtCount = shoppingItems.filter((i: any) => i.bought).length;

    return (
        <MemberLayout title="Dapur & Belanja" tenantName={tenantName} tenantSlug={tenantSlug} memberName={member?.user?.name}>
            <section className="section nft-hero" style={{paddingTop:'80px',paddingBottom:'40px'}}>
                <div className="bg-overlay"></div>
                <Container>
                    <div className="text-center">
                        <Badge bg="danger-subtle" text="danger" className="mb-2 px-3 py-2 fs-12 rounded-pill">
                            <i className="ri-restaurant-2-line me-1"></i>PRD Modul D
                        </Badge>
                        <h2 className="text-white fw-bold mb-2">Dapur, Menu & Belanja</h2>
                        <p className="text-white-50">Meal planner mingguan, daftar belanja bersama, dan kalkulator resep</p>
                    </div>
                </Container>
            </section>
            <section className="section">
                <Container>
                    <Row className="g-4">
                        <Col lg={8}>
                            <Card className="border-0 shadow-sm mb-4">
                                <Card.Header className="bg-transparent border-0 pt-3">
                                    <h5 className="fw-bold mb-0"><i className="ri-restaurant-2-line me-2 text-danger"></i>Menu Makan Mingguan</h5>
                                </Card.Header>
                                <Card.Body>
                                    <div className="table-responsive">
                                        <table className="table table-bordered table-sm align-middle">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Hari</th>
                                                    <th><i className="ri-sun-line text-warning me-1"></i>Sarapan</th>
                                                    <th><i className="ri-restaurant-line text-success me-1"></i>Siang</th>
                                                    <th><i className="ri-moon-line text-primary me-1"></i>Malam</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {demo.menus.map((m: any, i: number) => (
                                                    <tr key={i} className={i === new Date().getDay() - 1 ? 'table-primary' : ''}>
                                                        <td className="fw-semibold">{m.day}</td>
                                                        <td className="fs-13">{m.breakfast}</td>
                                                        <td className="fs-13">{m.lunch}</td>
                                                        <td className="fs-13">{m.dinner}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col lg={4}>
                            <Card className="border-0 shadow-sm">
                                <Card.Header className="bg-transparent border-0 pt-3">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h5 className="fw-bold mb-0"><i className="ri-shopping-cart-2-line me-2 text-success"></i>Daftar Belanja</h5>
                                        <Badge bg="success">{boughtCount}/{shoppingItems.length}</Badge>
                                    </div>
                                </Card.Header>
                                <Card.Body>
                                    {shoppingItems.map((item: any) => (
                                        <div key={item.id} onClick={() => toggle(item.id)}
                                            className={`d-flex align-items-center p-2 mb-2 rounded-3 border ${item.bought ? 'bg-success-subtle border-success-subtle opacity-75' : ''}`}
                                            style={{cursor:'pointer'}}>
                                            <div className={`flex-shrink-0 me-2 rounded-circle border ${item.bought ? 'bg-success border-success' : 'border-secondary'} d-flex align-items-center justify-content-center`}
                                                style={{width:22,height:22,border:'2px solid'}}>
                                                {item.bought && <i className="ri-check-line text-white fs-11"></i>}
                                            </div>
                                            <div className="flex-grow-1">
                                                <p className={`mb-0 fs-13 ${item.bought ? 'text-decoration-line-through text-muted' : 'fw-medium'}`}>{item.item}</p>
                                                <p className="mb-0 text-muted fs-11">{item.qty} · {item.cat}</p>
                                            </div>
                                        </div>
                                    ))}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </section>
        </MemberLayout>
    );
};

export default KitchenPage;
