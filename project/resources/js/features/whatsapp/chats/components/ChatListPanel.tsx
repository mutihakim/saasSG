import React from "react";
import { Badge, Card, Form } from "react-bootstrap";

import { ChatItem } from "../types";
import { formatTime, initialsFromName } from "../utils";

type Props = {
    contactQuery: string;
    onContactQueryChange: (value: string) => void;
    filteredChats: ChatItem[];
    selectedJid: string | null;
    onSelectChat: (jid: string) => void;
    contactTypeLabel: (type: ChatItem["contact_type"]) => string;
    panelTitle: string;
    searchPlaceholder: string;
    emptyChatsLabel: string;
};

const ChatListPanel = ({
    contactQuery,
    onContactQueryChange,
    filteredChats,
    selectedJid,
    onSelectChat,
    contactTypeLabel,
    panelTitle,
    searchPlaceholder,
    emptyChatsLabel,
}: Props) => (
    <div className="chat-leftsidebar">
        <Card className="mb-0">
            <div className="px-4 pt-4 mb-3">
                <div className="d-flex align-items-center mb-3">
                    <h5 className="mb-0 flex-grow-1">{panelTitle}</h5>
                </div>
                <div className="search-box">
                    <Form.Control
                        type="text"
                        placeholder={searchPlaceholder}
                        value={contactQuery}
                        onChange={(e) => onContactQueryChange(e.target.value)}
                    />
                    <i className="ri-search-line search-icon"></i>
                </div>
            </div>
            <div className="chat-room-list pt-3 overflow-auto" style={{ maxHeight: "calc(100vh - 260px)", margin: "-16px 0px 0px" }}>
                <div className="chat-message-list">
                    <ul className="list-unstyled chat-list chat-user-list users-list mb-0">
                        {filteredChats.map((chat) => (
                            <li key={chat.jid} className={selectedJid === chat.jid ? "active" : ""}>
                                <button
                                    type="button"
                                    className={`w-100 border-0 bg-transparent text-start p-0 ${chat.unread_count > 0 ? "unread-msg-user" : ""}`}
                                    onClick={() => onSelectChat(chat.jid)}
                                >
                                    <div className="d-flex align-items-center">
                                        <div className="flex-shrink-0 chat-user-img online user-own-img align-self-center me-3 ms-0">
                                            <div className="avatar-xs">
                                                <span className="avatar-title rounded-circle bg-primary-subtle text-primary text-uppercase">
                                                    {initialsFromName(chat.name)}
                                                </span>
                                            </div>
                                            <span className="user-status"></span>
                                        </div>
                                        <div className="flex-grow-1 overflow-hidden">
                                            <p className="fw-medium text-truncate mb-0">
                                                {chat.name}{" "}
                                                <Badge bg="light" text="dark" className="ms-1 text-capitalize">
                                                    {contactTypeLabel(chat.contact_type)}
                                                </Badge>
                                            </p>
                                            <p className="text-muted text-truncate mb-0">{chat.last_message || chat.jid}</p>
                                        </div>
                                        <div className="flex-shrink-0 ms-2 text-end">
                                            <small className="text-muted d-block">{formatTime(chat.last_message_at)}</small>
                                            {chat.unread_count > 0 ? <Badge pill bg="danger">{chat.unread_count}</Badge> : null}
                                        </div>
                                    </div>
                                </button>
                            </li>
                        ))}
                        {!filteredChats.length ? <li className="text-center text-muted py-4">{emptyChatsLabel}</li> : null}
                    </ul>
                </div>
            </div>
        </Card>
    </div>
);

export default ChatListPanel;
