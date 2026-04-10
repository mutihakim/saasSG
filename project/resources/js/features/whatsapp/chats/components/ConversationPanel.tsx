import React, { FormEvent } from "react";
import { Badge, Button, Card, Col, Dropdown, Form, Row } from "react-bootstrap";

import illustration1 from "../../../../../images/illustrator-1.png";
import { ChatItem, ChatMessage } from "../types";
import { formatTime, initialsFromName } from "../utils";

type Labels = {
    selectChat: string;
    timeEmpty: string;
    searchMessagesPlaceholder: string;
    loadMoreBadge: string;
    loadingMore: string;
    loadMore: string;
    emptyMessagesTitle: string;
    emptyMessages: string;
    messagePlaceholder: string;
    send: string;
    search: string;
    archive: string;
    archiveInfo: string;
    mute: string;
    muteInfo: string;
    settings: string;
    clear: string;
    clearInfo: string;
    exportLabel: string;
    exportInfo: string;
    close: string;
};

type Props = {
    selectedChat: ChatItem | null;
    selectedJid: string | null;
    filteredMessages: ChatMessage[];
    searchMenuOpen: boolean;
    settingsMenuOpen: boolean;
    messageQuery: string;
    messageText: string;
    hasMoreMessages: boolean;
    loadingMore: boolean;
    loading: boolean;
    messagesEndRef: React.RefObject<HTMLDivElement | null>;
    conversationRef: React.RefObject<HTMLDivElement | null>;
    labels: Labels;
    onToggleSearch: () => void;
    onToggleSettings: () => void;
    onMessageQueryChange: (value: string) => void;
    onMessageTextChange: (value: string) => void;
    onLoadMore: () => void;
    onSend: (e: FormEvent) => Promise<void>;
    onInfo: (detail: string) => void;
};

const ConversationPanel = ({
    selectedChat,
    selectedJid,
    filteredMessages,
    searchMenuOpen,
    settingsMenuOpen,
    messageQuery,
    messageText,
    hasMoreMessages,
    loadingMore,
    loading,
    messagesEndRef,
    conversationRef,
    labels,
    onToggleSearch,
    onToggleSettings,
    onMessageQueryChange,
    onMessageTextChange,
    onLoadMore,
    onSend,
    onInfo,
}: Props) => (
    <div className="user-chat w-100 overflow-hidden">
        <Card className="mb-0">
            <Card.Header className="p-3 user-chat-topbar">
                <Row className="align-items-center">
                    <Col sm={4} xs={8}>
                        <div className="d-flex align-items-center">
                            <div className="flex-shrink-0 d-block d-lg-none me-3">
                                <button type="button" className="user-chat-remove fs-18 p-1 border-0 bg-transparent">
                                    <i className="ri-arrow-left-s-line align-bottom"></i>
                                </button>
                            </div>
                            <div className="flex-grow-1 overflow-hidden">
                                <h5 className="text-truncate mb-0 fs-16">{selectedChat?.name ?? labels.selectChat}</h5>
                                <p className="text-truncate text-muted fs-13 mb-0">{selectedChat?.jid ?? labels.timeEmpty}</p>
                            </div>
                        </div>
                    </Col>
                    <Col sm={8} xs={4}>
                        <ul className="list-inline user-chat-nav text-end mb-0">
                            <li className="list-inline-item m-0">
                                <Button variant="ghost-none" size="sm" className="btn btn-ghost-secondary btn-icon" disabled={!selectedChat}>
                                    <i className="ri-phone-line align-bottom"></i>
                                </Button>
                            </li>
                            <li className="list-inline-item m-0">
                                <Button variant="ghost-none" size="sm" className="btn btn-ghost-secondary btn-icon" disabled={!selectedChat}>
                                    <i className="ri-vidicon-line align-bottom"></i>
                                </Button>
                            </li>
                            <li className="list-inline-item m-0">
                                <Dropdown className="chat-option-dropdown" align="end">
                                    <Dropdown.Toggle as="button" className="btn btn-ghost-secondary btn-icon btn-sm border-0 bg-transparent">
                                        <i className="ri-more-2-fill align-middle"></i>
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                        <Dropdown.Item onClick={onToggleSearch}>{labels.search}</Dropdown.Item>
                                        <Dropdown.Item onClick={() => onInfo(labels.archiveInfo)}>{labels.archive}</Dropdown.Item>
                                        <Dropdown.Item onClick={() => onInfo(labels.muteInfo)}>{labels.mute}</Dropdown.Item>
                                        <Dropdown.Item onClick={onToggleSettings}>{labels.settings}</Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                            </li>
                        </ul>
                    </Col>
                </Row>
            </Card.Header>
            <Card.Body className="p-0">
                <div className={`position-relative ${searchMenuOpen ? "" : "d-none"}`}>
                    <div className="search-box chat-search-box">
                        <Form.Control
                            type="text"
                            className="form-control bg-light border-light"
                            placeholder={labels.searchMessagesPlaceholder}
                            value={messageQuery}
                            onChange={(e) => onMessageQueryChange(e.target.value)}
                        />
                        <i className="ri-search-2-line search-icon"></i>
                    </div>
                </div>

                <div
                    ref={conversationRef}
                    style={{ maxHeight: "calc(100vh - 420px)", minHeight: 360 }}
                    className="chat-conversation p-3 p-lg-4 overflow-auto"
                >
                    {selectedJid && hasMoreMessages && !messageQuery.trim() ? (
                        <div className="d-flex justify-content-center mb-3">
                            <div className="d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill border bg-light-subtle shadow-sm">
                                <Badge bg="secondary-subtle" text="secondary" pill className="text-uppercase">
                                    {labels.loadMoreBadge}
                                </Badge>
                                <Button
                                    size="sm"
                                    variant="outline-secondary"
                                    onClick={onLoadMore}
                                    disabled={loadingMore || loading}
                                    className="rounded-pill"
                                >
                                    {loadingMore ? labels.loadingMore : labels.loadMore}
                                </Button>
                            </div>
                        </div>
                    ) : null}

                    <ul className="list-unstyled chat-conversation-list">
                        {filteredMessages.map((message) => (
                            <li key={message.id} className={`chat-list ${message.direction === "incoming" ? "left" : "right"}`}>
                                <div className="conversation-list">
                                    {message.direction === "incoming" ? (
                                        <div className="chat-avatar">
                                            <div className="avatar-xs">
                                                <span className="avatar-title rounded-circle bg-light text-primary text-uppercase">
                                                    {selectedChat ? initialsFromName(selectedChat.name) : "U"}
                                                </span>
                                            </div>
                                        </div>
                                    ) : null}
                                    <div className="user-chat-content">
                                        <div className="ctext-wrap">
                                            <div className="ctext-wrap-content">
                                                <p className="mb-0 ctext-content">{message.payload?.text || "-"}</p>
                                            </div>
                                        </div>
                                        <div className="conversation-name">
                                            <small className="text-muted">{formatTime(message.created_at)}</small>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}

                        {!filteredMessages.length ? (
                            <li className="text-center text-muted py-5">
                                <img src={illustration1} alt="" className="img-fluid mb-3" style={{ maxWidth: 140 }} />
                                <h6 className="mb-1">{labels.emptyMessagesTitle}</h6>
                                <p className="mb-0">{labels.emptyMessages}</p>
                            </li>
                        ) : null}
                        <div ref={messagesEndRef} />
                    </ul>
                </div>

                <div className="chat-input-section p-3 p-lg-4 border-top border-top-dashed">
                    <Form onSubmit={onSend}>
                        <Row className="g-0 align-items-center">
                            <Col className="col-auto">
                                <div className="chat-input-links me-2">
                                    <div className="links-list-item">
                                        <button
                                            type="button"
                                            className="btn btn-link text-decoration-none btn btn-ghost-secondary btn-icon"
                                            onClick={onToggleSettings}
                                        >
                                            <i className="ri-emotion-line align-middle"></i>
                                        </button>
                                    </div>
                                </div>
                            </Col>
                            <Col>
                                <Form.Control
                                    className="chat-input bg-light border-light"
                                    placeholder={labels.messagePlaceholder}
                                    value={messageText}
                                    onChange={(e) => onMessageTextChange(e.target.value)}
                                    disabled={!selectedJid || loading}
                                />
                            </Col>
                            <Col className="col-auto">
                                <div className="chat-input-links ms-2">
                                    <div className="links-list-item">
                                        <Button type="submit" className="btn btn-success chat-send waves-effect waves-light" disabled={!selectedJid || loading || !messageText.trim()}>
                                            <i className="ri-send-plane-2-fill align-bottom"></i>
                                            <span className="ms-1 d-none d-sm-inline">{labels.send}</span>
                                        </Button>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </Form>
                </div>

                <div className={`border-top p-2 bg-light ${settingsMenuOpen ? "" : "d-none"}`}>
                    <div className="d-flex flex-wrap gap-2">
                        <Button size="sm" variant="light" onClick={() => onInfo(labels.clearInfo)}>
                            {labels.clear}
                        </Button>
                        <Button size="sm" variant="light" onClick={() => onInfo(labels.exportInfo)}>
                            {labels.exportLabel}
                        </Button>
                        <Button size="sm" variant="light" onClick={onToggleSettings}>
                            {labels.close}
                        </Button>
                    </div>
                </div>
            </Card.Body>
        </Card>
    </div>
);

export default ConversationPanel;
