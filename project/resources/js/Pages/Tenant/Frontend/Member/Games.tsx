import React, { useState } from 'react';
import { Container, Row, Col, Card, Badge } from 'react-bootstrap';

import MemberLayout from '../Layouts/MemberLayout';

interface Props { tenantName: string; tenantSlug: string; member?: any; demo: any; }

const gamesData = [
    {id:1, title:'Kuis Trivia Keluarga', icon:'ri-question-answer-line', color:'primary', desc:'Adu pengetahuan umum & fakta keluarga', players:'2-4', difficulty:'Semua Usia'},
    {id:2, title:'Tebak Kata & Gambar', icon:'ri-image-2-line', color:'success', desc:'Melatih kosa kata untuk balita & SD', players:'1-4', difficulty:'Balita & SD'},
    {id:3, title:'Tantangan Matematika', icon:'ri-calculator-line', color:'warning', desc:'Berhitung cepat menyesuaikan usia anak', players:'1-2', difficulty:'SD'},
    {id:4, title:'Puzzle Memori', icon:'ri-layout-grid-line', color:'info', desc:'Cocokkan kartu bergambar untuk melatih ingatan', players:'1-4', difficulty:'Semua Usia'},
    {id:5, title:'Tic-Tac-Toe', icon:'ri-grid-line', color:'danger', desc:'Permainan strategi klasik X vs O', players:'2', difficulty:'6+'},
    {id:6, title:'Catur Keluarga', icon:'ri-chess-line', color:'dark', desc:'Turnamen catur antar anggota keluarga', players:'2', difficulty:'8+'},
];

const GamesPage: React.FC<Props> = ({ tenantName, tenantSlug, member }) => {
    const [selectedGame, setSelectedGame] = useState<number|null>(null);
    return (
        <MemberLayout title="Game Center" tenantName={tenantName} tenantSlug={tenantSlug} memberName={member?.user?.name}>
            <section className="section nft-hero" style={{paddingTop:'80px',paddingBottom:'40px'}}>
                <div className="bg-overlay"></div>
                <Container>
                    <div className="text-center">
                        <Badge bg="info-subtle" text="info" className="mb-2 px-3 py-2 fs-12 rounded-pill">
                            <i className="ri-gamepad-line me-1"></i>PRD Modul H
                        </Badge>
                        <h2 className="text-white fw-bold mb-2">Game Center Keluarga</h2>
                        <p className="text-white-50">Mini-games edukatif yang aman & skor terintegrasi ke leaderboard</p>
                    </div>
                </Container>
            </section>
            <section className="section">
                <Container>
                    <Row className="g-4">
                        {gamesData.map(game => (
                            <Col md={6} lg={4} key={game.id}>
                                <Card className={`border-0 shadow-sm h-100 ${selectedGame === game.id ? 'border-primary border-2' : ''}`}
                                    style={{cursor:'pointer', transition:'transform 0.2s'}}
                                    onClick={() => setSelectedGame(game.id === selectedGame ? null : game.id)}
                                    onMouseEnter={e => (e.currentTarget.style.transform='translateY(-4px)')}
                                    onMouseLeave={e => (e.currentTarget.style.transform='')}>
                                    <Card.Body className="p-4 text-center">
                                        <div className={`rounded-3 mx-auto d-flex align-items-center justify-content-center mb-3 bg-${game.color}-subtle`}
                                            style={{width:64,height:64}}>
                                            <i className={`${game.icon} text-${game.color} fs-28`}></i>
                                        </div>
                                        <h5 className="fw-bold mb-2">{game.title}</h5>
                                        <p className="text-muted fs-13 mb-3">{game.desc}</p>
                                        <div className="d-flex gap-2 justify-content-center mb-3">
                                            <Badge bg="light" text="dark" className="border fs-11">
                                                <i className="ri-group-line me-1"></i>{game.players} Pemain
                                            </Badge>
                                            <Badge bg="light" text="dark" className="border fs-11">{game.difficulty}</Badge>
                                        </div>
                                        <button className={`btn btn-${game.color} btn-sm w-100`}>
                                            <i className="ri-play-circle-line me-1"></i>Mulai Game
                                        </button>
                                    </Card.Body>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                    <div className="text-center mt-4 p-4 bg-light rounded-4">
                        <i className="ri-trophy-line text-warning fs-32 d-block mb-2"></i>
                        <h6 className="fw-bold">Skor dikompetisikan di Family Leaderboard!</h6>
                        <p className="text-muted fs-13">Setiap game yang dimainkan menambah poin ke leaderboard keluarga</p>
                    </div>
                </Container>
            </section>
        </MemberLayout>
    );
};

export default GamesPage;
