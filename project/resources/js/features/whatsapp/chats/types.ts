export type ChatItem = {
    jid: string;
    name: string;
    contact_type: "member" | "external" | "group";
    member_id: number | null;
    last_message: string;
    last_message_at: string | null;
    unread_count: number;
};

export type ChatMessage = {
    id: number;
    direction: "incoming" | "outgoing";
    chat_jid: string;
    sender_jid: string | null;
    recipient_jid: string | null;
    payload: { text?: string; delivery?: string } | null;
    read_at: string | null;
    created_at: string;
};
