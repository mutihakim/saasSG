import React, { useState } from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';

interface Reward { id: number; title: string; cost: number; icon: string; color: string; category: string; }
interface LeaderEntry { name: string; points: number; rank: number; badge: string; weekly_gain: number; avatar: string; }

interface Props {
    rewards: Reward[];
    leaderboard: LeaderEntry[];
}

const badgeColors: Record<string, string> = { gold: '#ffd700', silver: '#c0c0c0', bronze: '#cd7f32' };
const badgeIcons: Record<string, string> = { gold: 'ri-vip-crown-fill', silver: 'ri-medal-fill', bronze: 'ri-medal-2-fill' };

const PremiumRewards: React.FC<Props> = ({ rewards, leaderboard }) => {
    const [activeTab, setActiveTab] = useState<'store' | 'leaderboard'>('store');
    const [redeemed, setRedeemed] = useState<number[]>([]);

    const topUser = leaderboard[0];

    return (
        <Card className="border-0 shadow-sm">
            <Card.Header className="bg-transparent border-bottom-0 pt-4 pb-0">
                <div className="d-flex align-items-center justify-content-between">
                    <div>
                        <h5 className="mb-1 fw-semibold">
                            <i className="ri-trophy-line me-2 text-warning"></i>
                            Rewards & Gamifikasi
                        </h5>
                        <p className="text-muted fs-13 mb-0">Tukarkan poin dengan hadiah menarik</p>
                    </div>
                    <div className="d-flex gap-1">
                        {(['store', 'leaderboard'] as const).map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className={`btn btn-sm ${activeTab === tab ? 'btn-warning' : 'btn-soft-secondary'}`}>
                                {tab === 'store' ? '🎁 Toko Hadiah' : '🏆 Leaderboard'}
                            </button>
                        ))}
                    </div>
                </div>
            </Card.Header>
            <Card.Body>
                {activeTab === 'store' && (
                    <Row className="g-3">
                        {rewards.map(r => (
                            <Col md={6} lg={4} key={r.id}>
                                <div className={`p-3 rounded-3 border text-center h-100 ${redeemed.includes(r.id) ? 'opacity-50' : ''}`}
                                    style={{ background: `linear-gradient(135deg, var(--bs-${r.color}-bg, #f8f9fa) 0%, white 100%)` }}>
                                    <div className={`mx-auto mb-3 rounded-3 d-flex align-items-center justify-content-center bg-${r.color}-subtle`}
                                        style={{ width: 56, height: 56 }}>
                                        <i className={`${r.icon} text-${r.color} fs-24`}></i>
                                    </div>
                                    <h6 className="fw-bold mb-1">{r.title}</h6>
                                    <Badge bg="secondary" className="mb-2 fs-11">{r.category}</Badge>
                                    <div className="d-flex align-items-center justify-content-center gap-1 mb-3">
                                        <i className="ri-star-fill text-warning fs-14"></i>
                                        <span className="fw-bold fs-16">{r.cost.toLocaleString()}</span>
                                        <span className="text-muted fs-12">poin</span>
                                    </div>
                                    <button
                                        className={`btn btn-sm w-100 ${redeemed.includes(r.id) ? 'btn-soft-secondary' : `btn-${r.color}`}`}
                                        onClick={() => !redeemed.includes(r.id) && setRedeemed(prev => [...prev, r.id])}>
                                        {redeemed.includes(r.id) ? '✓ Ditukar!' : 'Tukar Sekarang'}
                                    </button>
                                </div>
                            </Col>
                        ))}
                    </Row>
                )}

                {activeTab === 'leaderboard' && (
                    <div>
                        {/* Winner podium */}
                        {topUser && (
                            <div className="text-center p-4 rounded-4 mb-4"
                                style={{ background: 'linear-gradient(135deg, #f7b84b 0%, #f7561a 100%)' }}>
                                <div className="rounded-circle bg-white d-flex align-items-center justify-content-center mx-auto mb-2"
                                    style={{ width: 56, height: 56 }}>
                                    <span className="fw-bold text-warning fs-22">{topUser.avatar}</span>
                                </div>
                                <i className="ri-vip-crown-fill text-white fs-24 d-block mb-1"></i>
                                <h5 className="text-white fw-bold mb-0">{topUser.name}</h5>
                                <p className="text-white-50 fs-12 mb-1">Pemenang Minggu Ini</p>
                                <h3 className="text-white fw-bold mb-0">{topUser.points.toLocaleString()} pts</h3>
                                <small className="text-white-50">+{topUser.weekly_gain} poin minggu ini</small>
                            </div>
                        )}

                        {/* Rankings */}
                        {leaderboard.map((entry) => (
                            <div key={entry.rank} className={`d-flex align-items-center p-3 mb-2 rounded-3 border ${entry.rank === 1 ? 'border-warning bg-warning-subtle' : 'border-light'}`}>
                                <div className="flex-shrink-0 me-3 d-flex align-items-center justify-content-center"
                                    style={{ width: 36, height: 36 }}>
                                    {entry.badge ? (
                                        <i className={`${badgeIcons[entry.badge]} fs-22`}
                                            style={{ color: badgeColors[entry.badge] }}></i>
                                    ) : (
                                        <span className="fw-bold text-muted fs-18">#{entry.rank}</span>
                                    )}
                                </div>
                                <div className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 me-3"
                                    style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #405189, #0ab39c)' }}>
                                    <span className="text-white fw-bold">{entry.avatar}</span>
                                </div>
                                <div className="flex-grow-1">
                                    <p className="mb-0 fw-semibold">{entry.name}</p>
                                    <p className="mb-0 text-success fs-12">
                                        <i className="ri-arrow-up-line me-1"></i>
                                        +{entry.weekly_gain} minggu ini
                                    </p>
                                </div>
                                <div className="text-end">
                                    <div className="fw-bold fs-16 text-primary">{entry.points.toLocaleString()}</div>
                                    <div className="text-muted fs-11">poin total</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card.Body>
        </Card>
    );
};

export default PremiumRewards;
