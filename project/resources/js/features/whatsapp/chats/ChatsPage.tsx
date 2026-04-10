import { Head, usePage } from "@inertiajs/react";
import axios from "axios";
import React, { FormEvent, Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";
import { Card, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";


import { ChatItem, ChatMessage } from "./types";

import { useTenantRoute } from "@/core/config/routes";
import { notify } from "@/core/lib/notify";
import { parseApiError } from "@/core/types/apiError.types";
import TenantLayout from "@/layouts/TenantLayout";

const ChatListPanel = lazy(() => import("./components/ChatListPanel"));
const ConversationPanel = lazy(() => import("./components/ConversationPanel"));

const MESSAGE_BATCH_SIZE = 15;

type PageProps = {
    currentTenant?: { id: number } | null;
};

const panelFallback = (
    <Card className="mb-0">
        <Card.Body className="d-flex align-items-center justify-content-center" style={{ minHeight: 260 }}>
            <Spinner animation="border" size="sm" className="me-2" />
            <span>Loading…</span>
        </Card.Body>
    </Card>
);

function WhatsAppChatsPage() {
    const { t } = useTranslation();
    const tenantRoute = useTenantRoute();
    const { props } = usePage<PageProps>();
    const tenantId = props.currentTenant?.id ?? null;
    const apiBase = tenantRoute.apiTo("/whatsapp");
    const [loading, setLoading] = useState(false);
    const [chats, setChats] = useState<ChatItem[]>([]);
    const [selectedJid, setSelectedJid] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [hasMoreMessages, setHasMoreMessages] = useState(false);
    const [nextBeforeId, setNextBeforeId] = useState<number | null>(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [messageText, setMessageText] = useState("");
    const [contactQuery, setContactQuery] = useState("");
    const [messageQuery, setMessageQuery] = useState("");
    const [searchMenuOpen, setSearchMenuOpen] = useState(false);
    const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    const conversationRef = React.useRef<HTMLDivElement>(null);
    const shouldAutoScrollRef = React.useRef(true);
    const redirectingToLoginRef = React.useRef(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    React.useEffect(() => {
        if (!shouldAutoScrollRef.current) {
            shouldAutoScrollRef.current = true;
            return;
        }

        scrollToBottom();
    }, [messages]);

    const selectedChat = useMemo(
        () => chats.find((chat) => chat.jid === selectedJid) ?? null,
        [chats, selectedJid],
    );

    const filteredChats = useMemo(() => {
        if (!contactQuery) return chats;
        const q = contactQuery.toLowerCase();
        return chats.filter((chat) => chat.name.toLowerCase().includes(q) || chat.jid.toLowerCase().includes(q));
    }, [chats, contactQuery]);

    const filteredMessages = useMemo(() => {
        if (!messageQuery.trim()) return messages;
        const q = messageQuery.toLowerCase();
        return messages.filter((message) => (message.payload?.text ?? "").toLowerCase().includes(q));
    }, [messages, messageQuery]);

    function redirectToLogin() {
        if (redirectingToLoginRef.current) {
            return;
        }

        redirectingToLoginRef.current = true;
        const intended = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        window.location.assign(`/login?intended=${encodeURIComponent(intended)}`);
    }

    const showApiError = useCallback((err: any, fallback: string) => {
        const parsed = parseApiError(err, fallback);
        notify.error({
            title: parsed.title,
            detail: parsed.detail ?? t("tenant.whatsapp.chats.error.try_again"),
        });

        if (err?.response?.status === 401) {
            redirectToLogin();
        }
    }, [t]);

    const contactTypeLabel = useCallback((type: ChatItem["contact_type"]) => {
        return t(`tenant.whatsapp.chats.contact_type.${type}`, {
            defaultValue: type,
        });
    }, [t]);

    const loadChats = useCallback(async () => {
        const response = await axios.get(`${apiBase}/chats`);
        const nextChats = response.data.data.chats as ChatItem[];
        setChats(nextChats);
        if (!selectedJid && nextChats.length > 0) {
            setSelectedJid(nextChats[0].jid);
        }
    }, [apiBase, selectedJid]);

    const loadMessages = useCallback(async (
        jid: string,
        options?: {
            beforeId?: number | null;
            prepend?: boolean;
        },
    ) => {
        const response = await axios.get(`${apiBase}/chats/${encodeURIComponent(jid)}/messages`, {
            params: {
                limit: MESSAGE_BATCH_SIZE,
                before_id: options?.beforeId ?? undefined,
            },
        });

        const payload = response.data.data ?? {};
        const incomingMessages = (payload.messages ?? []) as ChatMessage[];
        const hasMore = Boolean(payload.has_more);
        const nextBefore = payload.next_before_id ? Number(payload.next_before_id) : null;

        if (options?.prepend) {
            const listEl = conversationRef.current;
            const prevHeight = listEl?.scrollHeight ?? 0;
            const prevTop = listEl?.scrollTop ?? 0;

            shouldAutoScrollRef.current = false;
            setMessages((current) => {
                const existingIds = new Set(current.map((item) => item.id));
                const olderMessages = incomingMessages.filter((item) => !existingIds.has(item.id));
                return [...olderMessages, ...current];
            });

            requestAnimationFrame(() => {
                if (!listEl) return;
                const nextHeight = listEl.scrollHeight;
                listEl.scrollTop = prevTop + (nextHeight - prevHeight);
            });
        } else {
            shouldAutoScrollRef.current = true;
            setMessages(incomingMessages);
        }

        setHasMoreMessages(hasMore);
        setNextBeforeId(nextBefore);
    }, [apiBase, conversationRef]);

    const markRead = useCallback(async (jid: string) => {
        await axios.post(`${apiBase}/chats/${encodeURIComponent(jid)}/read`);
    }, [apiBase]);

    const bootstrap = useCallback(async () => {
        setLoading(true);
        try {
            await loadChats();
        } catch (err: any) {
            showApiError(err, t("tenant.whatsapp.chats.error.load_chats_failed"));
        } finally {
            setLoading(false);
        }
    }, [loadChats, showApiError, t]);

    // Effect 1: Bootstrap on mount
    useEffect(() => {
        bootstrap();
    }, [bootstrap]);

    // Effect 2: Load messages when selected chat changes
    useEffect(() => {
        if (!selectedJid) {
            setMessages([]);
            setHasMoreMessages(false);
            setNextBeforeId(null);
            return;
        }

        (async () => {
            setLoading(true);
            try {
                await loadMessages(selectedJid);
                await markRead(selectedJid);
                await loadChats();
            } catch (err: any) {
                showApiError(err, t("tenant.whatsapp.chats.error.load_messages_failed"));
            } finally {
                setLoading(false);
            }
        })();
    }, [selectedJid, loadMessages, markRead, loadChats, showApiError, t]);

    const selectedJidRef = React.useRef(selectedJid);
    React.useEffect(() => {
        selectedJidRef.current = selectedJid;
    }, [selectedJid]);

    // Effect 3: WebSocket listener for new messages
    React.useEffect(() => {
        if (!tenantId) return;
        if (!(window as any).Echo) return;

        const channelName = `tenant.${tenantId}.whatsapp`;
        const channel = (window as any).Echo.private(channelName);

        channel.listen(".whatsapp.message.received", () => {
            const currentJid = selectedJidRef.current;
            if (currentJid) {
                loadMessages(currentJid).catch((err) => {
                    if (err?.response?.status === 401) {
                        redirectToLogin();
                    }
                });
            }
            loadChats().catch((err) => {
                if (err?.response?.status === 401) {
                    redirectToLogin();
                }
            });
        });

        return () => {
            channel.stopListening(".whatsapp.message.received");
        };
    }, [tenantId, loadMessages, loadChats]);

    async function onLoadMore() {
        if (!selectedJid || !hasMoreMessages || !nextBeforeId || loadingMore) {
            return;
        }

        setLoadingMore(true);
        try {
            await loadMessages(selectedJid, { prepend: true, beforeId: nextBeforeId });
        } catch (err: any) {
            showApiError(err, t("tenant.whatsapp.chats.error.load_messages_failed"));
        } finally {
            setLoadingMore(false);
        }
    }

    async function onSend(e: FormEvent) {
        e.preventDefault();
        if (!selectedJid || !messageText.trim()) {
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${apiBase}/chats/${encodeURIComponent(selectedJid)}/send`, {
                message: messageText,
            });
            setMessageText("");
            notify.success(t("tenant.whatsapp.chats.toast.queued"));
            await loadMessages(selectedJid);
            await loadChats();
        } catch (err: any) {
            showApiError(err, t("tenant.whatsapp.chats.error.send_failed"));
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Head title={t("tenant.whatsapp.chats.page_title")} />
            <div className="chat-wrapper d-lg-flex gap-1 mx-n4 mt-n4 p-1">
                <Suspense fallback={panelFallback}>
                    <ChatListPanel
                        contactQuery={contactQuery}
                        onContactQueryChange={setContactQuery}
                        filteredChats={filteredChats}
                        selectedJid={selectedJid}
                        onSelectChat={setSelectedJid}
                        contactTypeLabel={contactTypeLabel}
                        panelTitle={t("tenant.whatsapp.chats.panel_title")}
                        searchPlaceholder={t("tenant.whatsapp.chats.search_placeholder")}
                        emptyChatsLabel={t("tenant.whatsapp.chats.empty_chats")}
                    />
                </Suspense>

                <Suspense fallback={panelFallback}>
                    <ConversationPanel
                        selectedChat={selectedChat}
                        selectedJid={selectedJid}
                        filteredMessages={filteredMessages}
                        searchMenuOpen={searchMenuOpen}
                        settingsMenuOpen={settingsMenuOpen}
                        messageQuery={messageQuery}
                        messageText={messageText}
                        hasMoreMessages={hasMoreMessages}
                        loadingMore={loadingMore}
                        loading={loading}
                        messagesEndRef={messagesEndRef}
                        conversationRef={conversationRef}
                        labels={{
                            selectChat: t("tenant.whatsapp.chats.select_chat"),
                            timeEmpty: t("tenant.whatsapp.chats.time_empty"),
                            searchMessagesPlaceholder: t("tenant.whatsapp.chats.search_messages_placeholder"),
                            loadMoreBadge: t("tenant.whatsapp.chats.load_more_badge"),
                            loadingMore: t("tenant.whatsapp.chats.loading_more"),
                            loadMore: t("tenant.whatsapp.chats.load_more"),
                            emptyMessagesTitle: t("tenant.whatsapp.chats.empty_messages_title"),
                            emptyMessages: t("tenant.whatsapp.chats.empty_messages"),
                            messagePlaceholder: t("tenant.whatsapp.chats.message_placeholder"),
                            send: t("tenant.whatsapp.chats.send"),
                            search: t("tenant.whatsapp.chats.actions.search"),
                            archive: t("tenant.whatsapp.chats.actions.archive"),
                            archiveInfo: t("tenant.whatsapp.chats.actions.archive_info"),
                            mute: t("tenant.whatsapp.chats.actions.mute"),
                            muteInfo: t("tenant.whatsapp.chats.actions.mute_info"),
                            settings: t("tenant.whatsapp.chats.actions.settings"),
                            clear: t("tenant.whatsapp.chats.actions.clear"),
                            clearInfo: t("tenant.whatsapp.chats.actions.clear_info"),
                            exportLabel: t("tenant.whatsapp.chats.actions.export"),
                            exportInfo: t("tenant.whatsapp.chats.actions.export_info"),
                            close: t("tenant.whatsapp.chats.actions.close"),
                        }}
                        onToggleSearch={() => setSearchMenuOpen((prev) => !prev)}
                        onToggleSettings={() => setSettingsMenuOpen((prev) => !prev)}
                        onMessageQueryChange={setMessageQuery}
                        onMessageTextChange={setMessageText}
                        onLoadMore={onLoadMore}
                        onSend={onSend}
                        onInfo={(detail) => notify.info(detail)}
                    />
                </Suspense>
            </div>
        </>
    );
}

WhatsAppChatsPage.layout = (page: React.ReactNode) => <TenantLayout>{page}</TenantLayout>;

export default WhatsAppChatsPage;
