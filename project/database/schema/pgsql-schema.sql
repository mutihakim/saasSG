--
-- PostgreSQL database dump
--

\restrict eZfNB39JFfYyikRcVizuNIJcUa4m2qKsIxcXuzjYhCpnmaLyhMg2jaoibHC8XDt

-- Dumped from database version 14.22 (Ubuntu 14.22-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 14.22 (Ubuntu 14.22-0ubuntu0.22.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_logs (
    id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    actor_user_id bigint,
    actor_member_id bigint,
    action character varying(120) NOT NULL,
    target_type character varying(120) NOT NULL,
    target_id character varying(120) NOT NULL,
    changes json,
    metadata json,
    request_id character varying(120),
    occurred_at timestamp(0) with time zone NOT NULL,
    result_status character varying(20) NOT NULL,
    before_version bigint,
    after_version bigint,
    source_ip character varying(45),
    user_agent text,
    created_at timestamp(0) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.activity_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- Name: curriculum_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.curriculum_questions (
    id bigint NOT NULL,
    tenant_id bigint,
    curriculum_unit_id bigint NOT NULL,
    question_key character varying(120) NOT NULL,
    question_text text NOT NULL,
    options json NOT NULL,
    correct_answer character varying(255) NOT NULL,
    question_type character varying(50) DEFAULT 'multiple_choice'::character varying NOT NULL,
    points integer DEFAULT 10 NOT NULL,
    difficulty_order integer DEFAULT 1 NOT NULL,
    metadata json,
    row_version integer DEFAULT 1 NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);


--
-- Name: curriculum_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.curriculum_questions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: curriculum_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.curriculum_questions_id_seq OWNED BY public.curriculum_questions.id;


--
-- Name: curriculum_units; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.curriculum_units (
    id bigint NOT NULL,
    tenant_id bigint,
    educational_phase character varying(30),
    grade integer,
    subject character varying(120) NOT NULL,
    semester integer,
    chapter character varying(180) NOT NULL,
    curriculum_type character varying(60) DEFAULT 'kurikulum_merdeka'::character varying NOT NULL,
    difficulty_level character varying(60),
    metadata json,
    row_version integer DEFAULT 1 NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);


--
-- Name: curriculum_units_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.curriculum_units_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: curriculum_units_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.curriculum_units_id_seq OWNED BY public.curriculum_units.id;


--
-- Name: failed_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.failed_jobs (
    id bigint NOT NULL,
    uuid character varying(255) NOT NULL,
    connection text NOT NULL,
    queue text NOT NULL,
    payload text NOT NULL,
    exception text NOT NULL,
    failed_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.failed_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.failed_jobs_id_seq OWNED BY public.failed_jobs.id;


--
-- Name: finance_month_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.finance_month_reviews (
    id character(26) NOT NULL,
    tenant_id bigint NOT NULL,
    period_month character varying(7) NOT NULL,
    status character varying(20) DEFAULT 'open'::character varying NOT NULL,
    started_by bigint,
    started_at timestamp(0) without time zone,
    closed_by bigint,
    closed_at timestamp(0) without time zone,
    snapshot_payload json,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: finance_wallet_member_access; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.finance_wallet_member_access (
    id bigint NOT NULL,
    finance_wallet_id character(26) NOT NULL,
    member_id bigint NOT NULL,
    can_view boolean DEFAULT true NOT NULL,
    can_use boolean DEFAULT true NOT NULL,
    can_manage boolean DEFAULT false NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: finance_pocket_member_access_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.finance_pocket_member_access_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: finance_pocket_member_access_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.finance_pocket_member_access_id_seq OWNED BY public.finance_wallet_member_access.id;


--
-- Name: finance_savings_goals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.finance_savings_goals (
    id character(26) NOT NULL,
    tenant_id bigint NOT NULL,
    wallet_id character(26) NOT NULL,
    owner_member_id bigint,
    name character varying(120) NOT NULL,
    target_amount numeric(15,2) NOT NULL,
    current_amount numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    target_date date,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    notes text,
    row_version bigint DEFAULT '1'::bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);


--
-- Name: finance_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.finance_transactions (
    id character(26) NOT NULL,
    tenant_id bigint NOT NULL,
    category_id bigint,
    currency_id bigint NOT NULL,
    created_by bigint,
    updated_by bigint,
    approved_by bigint,
    type character varying(255) NOT NULL,
    transaction_date date NOT NULL,
    amount numeric(15,2) NOT NULL,
    description character varying(255) NOT NULL,
    exchange_rate numeric(18,6) DEFAULT 1.000000 NOT NULL,
    base_currency_code character(3) DEFAULT 'IDR'::bpchar NOT NULL,
    amount_base numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    notes text,
    payment_method character varying(255),
    reference_number character varying(100),
    merchant_name character varying(150),
    location character varying(200),
    status character varying(255) DEFAULT 'terverifikasi'::character varying NOT NULL,
    source_type character varying(100),
    source_id character varying(100),
    budget_id character(26),
    bank_account_id character(26),
    approved_at timestamp(0) with time zone,
    is_internal_transfer boolean DEFAULT false NOT NULL,
    transfer_pair_id character(26),
    row_version bigint DEFAULT '1'::bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    owner_member_id bigint,
    budget_status character varying(20) DEFAULT 'unbudgeted'::character varying NOT NULL,
    budget_delta numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    transfer_direction character varying(10),
    wallet_id character(26) NOT NULL,
    CONSTRAINT finance_transactions_payment_method_check CHECK (((payment_method)::text = ANY (ARRAY[('tunai'::character varying)::text, ('transfer'::character varying)::text, ('kartu_kredit'::character varying)::text, ('kartu_debit'::character varying)::text, ('dompet_digital'::character varying)::text, ('qris'::character varying)::text, ('lainnya'::character varying)::text]))),
    CONSTRAINT finance_transactions_status_check CHECK (((status)::text = ANY (ARRAY[('terverifikasi'::character varying)::text, ('pending'::character varying)::text, ('ditandai'::character varying)::text]))),
    CONSTRAINT finance_transactions_type_check CHECK (((type)::text = ANY (ARRAY[('pemasukan'::character varying)::text, ('pengeluaran'::character varying)::text, ('transfer'::character varying)::text])))
);


--
-- Name: finance_wallets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.finance_wallets (
    id character(26) NOT NULL,
    tenant_id bigint NOT NULL,
    real_account_id character(26) NOT NULL,
    owner_member_id bigint,
    name character varying(100) NOT NULL,
    slug character varying(120),
    type character varying(30) DEFAULT 'personal'::character varying NOT NULL,
    scope character varying(20) DEFAULT 'private'::character varying NOT NULL,
    currency_code character varying(3) DEFAULT 'IDR'::character varying NOT NULL,
    reference_code character varying(40) NOT NULL,
    icon_key character varying(60),
    current_balance numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    notes text,
    is_active boolean DEFAULT true NOT NULL,
    row_version bigint DEFAULT '1'::bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    is_system boolean DEFAULT false NOT NULL,
    default_budget_id character(26),
    budget_lock_enabled boolean DEFAULT false NOT NULL,
    default_budget_key character varying(120),
    purpose_type character varying(20) DEFAULT 'spending'::character varying NOT NULL,
    background_color character varying(255)
);


--
-- Name: idempotency_keys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.idempotency_keys (
    id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    actor_user_id bigint NOT NULL,
    endpoint character varying(190) NOT NULL,
    idempotency_key character varying(190) NOT NULL,
    request_hash character varying(64) NOT NULL,
    response_payload json,
    created_at timestamp(0) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: idempotency_keys_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.idempotency_keys_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: idempotency_keys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.idempotency_keys_id_seq OWNED BY public.idempotency_keys.id;


--
-- Name: job_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_batches (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    total_jobs integer NOT NULL,
    pending_jobs integer NOT NULL,
    failed_jobs integer NOT NULL,
    failed_job_ids text NOT NULL,
    options text,
    cancelled_at integer,
    created_at integer NOT NULL,
    finished_at integer
);


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jobs (
    id bigint NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    attempts smallint NOT NULL,
    reserved_at integer,
    available_at integer NOT NULL,
    created_at integer NOT NULL
);


--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: model_has_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.model_has_permissions (
    permission_id bigint NOT NULL,
    model_type character varying(255) NOT NULL,
    model_id bigint NOT NULL,
    tenant_id bigint NOT NULL
);


--
-- Name: model_has_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.model_has_roles (
    role_id bigint NOT NULL,
    model_type character varying(255) NOT NULL,
    model_id bigint NOT NULL,
    tenant_id bigint NOT NULL
);


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    created_at timestamp(0) without time zone
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    guard_name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: permissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.permissions_id_seq OWNED BY public.permissions.id;


--
-- Name: personal_access_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personal_access_tokens (
    id bigint NOT NULL,
    tokenable_type character varying(255) NOT NULL,
    tokenable_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    token character varying(64) NOT NULL,
    abilities text,
    last_used_at timestamp(0) without time zone,
    expires_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.personal_access_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.personal_access_tokens_id_seq OWNED BY public.personal_access_tokens.id;


--
-- Name: role_has_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_has_permissions (
    permission_id bigint NOT NULL,
    role_id bigint NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id bigint NOT NULL,
    tenant_id bigint,
    name character varying(255) NOT NULL,
    guard_name character varying(255) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    display_name character varying(255),
    row_version integer DEFAULT 1 NOT NULL,
    is_system boolean DEFAULT false NOT NULL
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: social_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.social_accounts (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    provider character varying(30) NOT NULL,
    provider_id character varying(191) NOT NULL,
    provider_email character varying(255),
    provider_payload json,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: social_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.social_accounts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: social_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.social_accounts_id_seq OWNED BY public.social_accounts.id;


--
-- Name: telescope_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.telescope_entries (
    sequence bigint NOT NULL,
    uuid uuid NOT NULL,
    batch_id uuid NOT NULL,
    family_hash character varying(255),
    should_display_on_index boolean DEFAULT true NOT NULL,
    type character varying(20) NOT NULL,
    content text NOT NULL,
    created_at timestamp(0) without time zone
);


--
-- Name: telescope_entries_sequence_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.telescope_entries_sequence_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: telescope_entries_sequence_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.telescope_entries_sequence_seq OWNED BY public.telescope_entries.sequence;


--
-- Name: telescope_entries_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.telescope_entries_tags (
    entry_uuid uuid NOT NULL,
    tag character varying(255) NOT NULL
);


--
-- Name: telescope_monitoring; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.telescope_monitoring (
    tag character varying(255) NOT NULL
);


--
-- Name: tenant_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_attachments (
    id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    attachable_type character varying(100) NOT NULL,
    attachable_id character varying(100) NOT NULL,
    file_name character varying(255) NOT NULL,
    file_path character varying(255) NOT NULL,
    mime_type character varying(100),
    file_size bigint DEFAULT '0'::bigint NOT NULL,
    label character varying(100),
    sort_order integer DEFAULT 0 NOT NULL,
    row_version integer DEFAULT 1 NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    status character varying(20) DEFAULT 'ready'::character varying NOT NULL,
    processing_error text,
    processed_at timestamp(0) without time zone
);


--
-- Name: tenant_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_attachments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenant_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenant_attachments_id_seq OWNED BY public.tenant_attachments.id;


--
-- Name: tenant_bank_account_member_access; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_bank_account_member_access (
    id bigint NOT NULL,
    tenant_bank_account_id character(26) NOT NULL,
    member_id bigint NOT NULL,
    can_view boolean DEFAULT true NOT NULL,
    can_use boolean DEFAULT true NOT NULL,
    can_manage boolean DEFAULT false NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: tenant_bank_account_member_access_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_bank_account_member_access_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenant_bank_account_member_access_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenant_bank_account_member_access_id_seq OWNED BY public.tenant_bank_account_member_access.id;


--
-- Name: tenant_bank_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_bank_accounts (
    id character(26) NOT NULL,
    tenant_id bigint NOT NULL,
    owner_member_id bigint,
    name character varying(100) NOT NULL,
    scope character varying(20) DEFAULT 'private'::character varying NOT NULL,
    type character varying(30) NOT NULL,
    currency_code character varying(3) DEFAULT 'IDR'::character varying NOT NULL,
    opening_balance numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    current_balance numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    notes text,
    is_active boolean DEFAULT true NOT NULL,
    row_version bigint DEFAULT '1'::bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);


--
-- Name: tenant_budget_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_budget_lines (
    id character(26) NOT NULL,
    tenant_id bigint NOT NULL,
    budget_id character(26) NOT NULL,
    finance_transaction_id character(26),
    member_id bigint,
    entry_type character varying(20) DEFAULT 'expense'::character varying NOT NULL,
    amount numeric(15,2) NOT NULL,
    balance_after numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    notes character varying(255),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: tenant_budget_member_access; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_budget_member_access (
    id bigint NOT NULL,
    tenant_budget_id character(26) NOT NULL,
    member_id bigint NOT NULL,
    can_view boolean DEFAULT true NOT NULL,
    can_use boolean DEFAULT true NOT NULL,
    can_manage boolean DEFAULT false NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: tenant_budget_member_access_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_budget_member_access_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenant_budget_member_access_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenant_budget_member_access_id_seq OWNED BY public.tenant_budget_member_access.id;


--
-- Name: tenant_budgets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_budgets (
    id character(26) NOT NULL,
    tenant_id bigint NOT NULL,
    owner_member_id bigint,
    name character varying(100) NOT NULL,
    code character varying(50),
    scope character varying(20) DEFAULT 'shared'::character varying NOT NULL,
    period_month character varying(7) NOT NULL,
    allocated_amount numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    spent_amount numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    remaining_amount numeric(15,2) DEFAULT '0'::numeric NOT NULL,
    notes text,
    is_active boolean DEFAULT true NOT NULL,
    row_version bigint DEFAULT '1'::bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    wallet_id character(26),
    budget_key character varying(120)
);


--
-- Name: tenant_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_categories (
    id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    module character varying(30) NOT NULL,
    sub_type character varying(30),
    parent_id bigint,
    name character varying(100) NOT NULL,
    icon character varying(60),
    color character varying(7),
    sort_order smallint DEFAULT '0'::smallint NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    row_version bigint DEFAULT '1'::bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    description text
);


--
-- Name: tenant_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenant_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenant_categories_id_seq OWNED BY public.tenant_categories.id;


--
-- Name: tenant_currencies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_currencies (
    id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    code character(3) NOT NULL,
    name character varying(80) NOT NULL,
    symbol character varying(10) NOT NULL,
    symbol_position character varying(255) DEFAULT 'before'::character varying NOT NULL,
    decimal_places smallint DEFAULT '0'::smallint NOT NULL,
    thousands_sep character(1) DEFAULT '.'::bpchar NOT NULL,
    decimal_sep character(1) DEFAULT ','::bpchar NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    sort_order smallint DEFAULT '0'::smallint NOT NULL,
    row_version integer DEFAULT 1 NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    CONSTRAINT tenant_currencies_symbol_position_check CHECK (((symbol_position)::text = ANY (ARRAY[('before'::character varying)::text, ('after'::character varying)::text])))
);


--
-- Name: tenant_currencies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_currencies_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenant_currencies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenant_currencies_id_seq OWNED BY public.tenant_currencies.id;


--
-- Name: tenant_curriculum_entitlements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_curriculum_entitlements (
    id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    user_id bigint,
    educational_phase character varying(30),
    grade integer,
    subject character varying(120) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    valid_until timestamp(0) without time zone,
    metadata json,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: tenant_curriculum_entitlements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_curriculum_entitlements_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenant_curriculum_entitlements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenant_curriculum_entitlements_id_seq OWNED BY public.tenant_curriculum_entitlements.id;


--
-- Name: tenant_game_curriculum_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_game_curriculum_settings (
    id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    member_id bigint NOT NULL,
    grade integer,
    default_mode character varying(50) DEFAULT 'practice'::character varying NOT NULL,
    default_question_count integer DEFAULT 10 NOT NULL,
    default_time_limit integer DEFAULT 20 NOT NULL,
    mastered_threshold integer DEFAULT 5 NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: tenant_game_curriculum_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_game_curriculum_settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenant_game_curriculum_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenant_game_curriculum_settings_id_seq OWNED BY public.tenant_game_curriculum_settings.id;


--
-- Name: tenant_game_math_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_game_math_settings (
    id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    member_id bigint NOT NULL,
    operator character varying(10) NOT NULL,
    default_mode character varying(50) DEFAULT 'mencariC'::character varying NOT NULL,
    default_question_count integer DEFAULT 10 NOT NULL,
    default_time_limit integer DEFAULT 15 NOT NULL,
    mastered_threshold integer DEFAULT 8 NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: tenant_game_math_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_game_math_settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenant_game_math_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenant_game_math_settings_id_seq OWNED BY public.tenant_game_math_settings.id;


--
-- Name: tenant_game_math_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_game_math_stats (
    id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    member_id bigint NOT NULL,
    operator character varying(10) NOT NULL,
    angka_pilihan integer NOT NULL,
    angka_random integer NOT NULL,
    jumlah_benar integer DEFAULT 0 NOT NULL,
    jumlah_salah integer DEFAULT 0 NOT NULL,
    current_streak_benar integer DEFAULT 0 NOT NULL,
    max_streak_benar integer DEFAULT 0 NOT NULL,
    last_played_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: tenant_game_math_stats_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_game_math_stats_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenant_game_math_stats_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenant_game_math_stats_id_seq OWNED BY public.tenant_game_math_stats.id;


--
-- Name: tenant_game_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_game_sessions (
    id character(26) NOT NULL,
    tenant_id bigint NOT NULL,
    member_id bigint NOT NULL,
    game_slug character varying(50) NOT NULL,
    metadata json,
    question_count integer DEFAULT 0 NOT NULL,
    correct_count integer DEFAULT 0 NOT NULL,
    wrong_count integer DEFAULT 0 NOT NULL,
    best_streak integer DEFAULT 0 NOT NULL,
    score_percent numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    duration_seconds integer DEFAULT 0 NOT NULL,
    summary json,
    started_at timestamp(0) without time zone,
    finished_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: tenant_game_vocabulary_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_game_vocabulary_progress (
    id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    member_id bigint NOT NULL,
    word_id bigint NOT NULL,
    language character varying(20) NOT NULL,
    jumlah_benar integer DEFAULT 0 NOT NULL,
    jumlah_salah integer DEFAULT 0 NOT NULL,
    correct_streak integer DEFAULT 0 NOT NULL,
    max_streak integer DEFAULT 0 NOT NULL,
    is_mastered boolean DEFAULT false NOT NULL,
    last_practiced_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: tenant_game_vocabulary_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_game_vocabulary_progress_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenant_game_vocabulary_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenant_game_vocabulary_progress_id_seq OWNED BY public.tenant_game_vocabulary_progress.id;


--
-- Name: tenant_game_vocabulary_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_game_vocabulary_settings (
    id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    member_id bigint NOT NULL,
    language character varying(20) NOT NULL,
    default_mode character varying(50) DEFAULT 'practice'::character varying NOT NULL,
    default_question_count integer DEFAULT 6 NOT NULL,
    mastered_threshold integer DEFAULT 8 NOT NULL,
    default_time_limit integer DEFAULT 8 NOT NULL,
    auto_tts boolean DEFAULT true NOT NULL,
    translation_direction character varying(30) DEFAULT 'id_to_target'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: tenant_game_vocabulary_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_game_vocabulary_settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenant_game_vocabulary_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenant_game_vocabulary_settings_id_seq OWNED BY public.tenant_game_vocabulary_settings.id;


--
-- Name: tenant_game_vocabulary_words; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_game_vocabulary_words (
    id bigint NOT NULL,
    tenant_id bigint,
    bahasa_indonesia character varying(255) NOT NULL,
    bahasa_inggris character varying(255),
    fonetik character varying(255),
    bahasa_arab character varying(255),
    fonetik_arab character varying(255),
    bahasa_mandarin character varying(255),
    fonetik_mandarin character varying(255),
    kategori character varying(120) NOT NULL,
    hari integer NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: tenant_game_vocabulary_words_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_game_vocabulary_words_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenant_game_vocabulary_words_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenant_game_vocabulary_words_id_seq OWNED BY public.tenant_game_vocabulary_words.id;


--
-- Name: tenant_invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_invitations (
    id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    member_id bigint,
    invited_by_user_id bigint NOT NULL,
    email character varying(255) NOT NULL,
    role_code character varying(50) NOT NULL,
    status character varying(30) DEFAULT 'pending'::character varying NOT NULL,
    token character varying(255) NOT NULL,
    expires_at timestamp(0) with time zone NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    note text,
    full_name character varying(255)
);


--
-- Name: tenant_invitations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_invitations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenant_invitations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenant_invitations_id_seq OWNED BY public.tenant_invitations.id;


--
-- Name: tenant_member_links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_member_links (
    id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    member_id bigint NOT NULL,
    linked_member_id bigint NOT NULL,
    link_type character varying(50) NOT NULL,
    access_scope character varying(100),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: tenant_member_links_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_member_links_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenant_member_links_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenant_member_links_id_seq OWNED BY public.tenant_member_links.id;


--
-- Name: tenant_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_members (
    id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    user_id bigint,
    full_name character varying(255) NOT NULL,
    role_code character varying(50) NOT NULL,
    profile_status character varying(30) DEFAULT 'active'::character varying NOT NULL,
    row_version bigint DEFAULT '1'::bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    whatsapp_jid character varying(60),
    onboarding_status character varying(30) DEFAULT 'no_account'::character varying NOT NULL
);


--
-- Name: tenant_members_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_members_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenant_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenant_members_id_seq OWNED BY public.tenant_members.id;


--
-- Name: tenant_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_notifications (
    id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    member_id bigint,
    notification_type character varying(100) NOT NULL,
    payload json,
    read_at timestamp(0) with time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: tenant_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenant_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenant_notifications_id_seq OWNED BY public.tenant_notifications.id;


--
-- Name: tenant_recurring_rules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_recurring_rules (
    id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    ruleable_type character varying(100) NOT NULL,
    ruleable_id character varying(100) NOT NULL,
    frequency character varying(20) NOT NULL,
    "interval" integer DEFAULT 1 NOT NULL,
    by_day json,
    day_of_month integer,
    start_date date NOT NULL,
    end_date date,
    total_occurrences integer,
    next_run_at timestamp(0) with time zone,
    is_active boolean DEFAULT true NOT NULL,
    row_version integer DEFAULT 1 NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);


--
-- Name: tenant_recurring_rules_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_recurring_rules_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenant_recurring_rules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenant_recurring_rules_id_seq OWNED BY public.tenant_recurring_rules.id;


--
-- Name: tenant_taggables; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_taggables (
    tenant_tag_id bigint NOT NULL,
    taggable_type character varying(100) NOT NULL,
    taggable_id character varying(100) NOT NULL,
    created_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: tenant_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_tags (
    id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    name character varying(50) NOT NULL,
    color character varying(7),
    usage_count integer DEFAULT 0 NOT NULL,
    row_version integer DEFAULT 1 NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: tenant_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_tags_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenant_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenant_tags_id_seq OWNED BY public.tenant_tags.id;


--
-- Name: tenant_uom; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_uom (
    id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(50) NOT NULL,
    abbreviation character varying(10) NOT NULL,
    dimension_type character varying(30) NOT NULL,
    base_unit_code character varying(20),
    base_factor numeric(18,6) DEFAULT 1.000000 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    sort_order smallint DEFAULT '0'::smallint NOT NULL,
    row_version integer DEFAULT 1 NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);


--
-- Name: tenant_uom_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_uom_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenant_uom_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenant_uom_id_seq OWNED BY public.tenant_uom.id;


--
-- Name: tenant_whatsapp_command_contexts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_whatsapp_command_contexts (
    id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    sender_jid character varying(60) NOT NULL,
    context_type character varying(80) NOT NULL,
    payload json,
    expires_at timestamp(0) with time zone NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: tenant_whatsapp_command_contexts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_whatsapp_command_contexts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenant_whatsapp_command_contexts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenant_whatsapp_command_contexts_id_seq OWNED BY public.tenant_whatsapp_command_contexts.id;


--
-- Name: tenant_whatsapp_contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_whatsapp_contacts (
    id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    member_id bigint,
    jid character varying(60) NOT NULL,
    contact_type character varying(20) DEFAULT 'external'::character varying NOT NULL,
    display_name character varying(255),
    last_message_at timestamp(0) with time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: tenant_whatsapp_contacts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_whatsapp_contacts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenant_whatsapp_contacts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenant_whatsapp_contacts_id_seq OWNED BY public.tenant_whatsapp_contacts.id;


--
-- Name: tenant_whatsapp_intent_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_whatsapp_intent_items (
    id bigint NOT NULL,
    intent_id bigint NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    description character varying(255),
    amount numeric(18,2),
    currency_code character varying(10),
    payload json,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: tenant_whatsapp_intent_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_whatsapp_intent_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenant_whatsapp_intent_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenant_whatsapp_intent_items_id_seq OWNED BY public.tenant_whatsapp_intent_items.id;


--
-- Name: tenant_whatsapp_intents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_whatsapp_intents (
    id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    member_id bigint,
    source_message_id bigint,
    media_id bigint,
    token character varying(120) NOT NULL,
    command character varying(40) NOT NULL,
    intent_type character varying(40) NOT NULL,
    input_type character varying(20) DEFAULT 'text'::character varying NOT NULL,
    status character varying(30) DEFAULT 'received'::character varying NOT NULL,
    ai_provider character varying(40),
    ai_model character varying(80),
    confidence_score numeric(5,4),
    processing_time_ms integer,
    raw_input json,
    extracted_payload json,
    error_payload json,
    linked_resource_type character varying(40),
    linked_resource_id bigint,
    app_opened_at timestamp(0) with time zone,
    expires_at timestamp(0) with time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    sender_jid character varying(60) NOT NULL,
    ai_raw_response json
);


--
-- Name: tenant_whatsapp_intents_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_whatsapp_intents_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenant_whatsapp_intents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenant_whatsapp_intents_id_seq OWNED BY public.tenant_whatsapp_intents.id;


--
-- Name: tenant_whatsapp_media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_whatsapp_media (
    id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    sender_jid character varying(60),
    mime_type character varying(120) NOT NULL,
    size_bytes bigint NOT NULL,
    storage_path character varying(255) NOT NULL,
    meta json,
    consumed_at timestamp(0) with time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: tenant_whatsapp_media_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_whatsapp_media_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenant_whatsapp_media_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenant_whatsapp_media_id_seq OWNED BY public.tenant_whatsapp_media.id;


--
-- Name: tenant_whatsapp_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_whatsapp_messages (
    id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    direction character varying(20) NOT NULL,
    whatsapp_message_id character varying(120) NOT NULL,
    sender_jid character varying(60),
    recipient_jid character varying(60),
    payload json,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    chat_jid character varying(60),
    read_at timestamp(0) with time zone
);


--
-- Name: tenant_whatsapp_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_whatsapp_messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenant_whatsapp_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenant_whatsapp_messages_id_seq OWNED BY public.tenant_whatsapp_messages.id;


--
-- Name: tenant_whatsapp_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_whatsapp_notifications (
    id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    member_id bigint,
    notification_type character varying(80) NOT NULL,
    notification_key character varying(160) NOT NULL,
    status character varying(30) DEFAULT 'sent'::character varying NOT NULL,
    context json,
    service_response json,
    sent_at timestamp(0) with time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: tenant_whatsapp_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_whatsapp_notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenant_whatsapp_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenant_whatsapp_notifications_id_seq OWNED BY public.tenant_whatsapp_notifications.id;


--
-- Name: tenant_whatsapp_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenant_whatsapp_settings (
    id bigint NOT NULL,
    tenant_id bigint NOT NULL,
    session_name character varying(120) NOT NULL,
    connection_status character varying(30) DEFAULT 'disconnected'::character varying NOT NULL,
    connected_jid character varying(60),
    auto_connect boolean DEFAULT true NOT NULL,
    meta json,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: tenant_whatsapp_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenant_whatsapp_settings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenant_whatsapp_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenant_whatsapp_settings_id_seq OWNED BY public.tenant_whatsapp_settings.id;


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenants (
    id bigint NOT NULL,
    owner_user_id bigint NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    locale character varying(10) DEFAULT 'id'::character varying NOT NULL,
    timezone character varying(64) DEFAULT 'UTC'::character varying NOT NULL,
    plan_code character varying(50) DEFAULT 'free'::character varying NOT NULL,
    status character varying(30) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    display_name character varying(255),
    legal_name character varying(255),
    registration_number character varying(255),
    tax_id character varying(255),
    industry character varying(255),
    website_url character varying(255),
    support_email character varying(255),
    billing_email character varying(255),
    billing_contact_name character varying(255),
    phone character varying(50),
    address_line_1 character varying(255),
    address_line_2 character varying(255),
    city character varying(255),
    state_region character varying(255),
    postal_code character varying(40),
    country_code character varying(2),
    currency_code character varying(3),
    logo_light_path character varying(255),
    logo_dark_path character varying(255),
    logo_icon_path character varying(255),
    favicon_path character varying(255)
);


--
-- Name: tenants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tenants_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tenants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tenants_id_seq OWNED BY public.tenants.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    email_verified_at timestamp(0) without time zone,
    password character varying(255) NOT NULL,
    remember_token character varying(100),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    is_superadmin boolean DEFAULT false NOT NULL,
    ui_preferences json,
    phone character varying(255),
    job_title character varying(255),
    bio text,
    avatar_url character varying(255),
    address_line character varying(255),
    city character varying(255),
    country character varying(255),
    postal_code character varying(255),
    two_factor_secret text,
    two_factor_recovery_codes text,
    two_factor_confirmed_at timestamp(0) with time zone
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: wallet_wishes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wallet_wishes (
    id character(26) NOT NULL,
    tenant_id bigint NOT NULL,
    owner_member_id bigint,
    goal_id character(26),
    title character varying(140) NOT NULL,
    description text,
    estimated_amount numeric(15,2),
    priority character varying(20) DEFAULT 'medium'::character varying NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    image_url character varying(2000),
    approved_at timestamp(0) with time zone,
    approved_by_member_id bigint,
    notes text,
    row_version integer DEFAULT 1 NOT NULL,
    created_at timestamp(0) with time zone,
    updated_at timestamp(0) with time zone,
    deleted_at timestamp(0) with time zone
);


--
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- Name: curriculum_questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.curriculum_questions ALTER COLUMN id SET DEFAULT nextval('public.curriculum_questions_id_seq'::regclass);


--
-- Name: curriculum_units id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.curriculum_units ALTER COLUMN id SET DEFAULT nextval('public.curriculum_units_id_seq'::regclass);


--
-- Name: failed_jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs ALTER COLUMN id SET DEFAULT nextval('public.failed_jobs_id_seq'::regclass);


--
-- Name: finance_wallet_member_access id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_wallet_member_access ALTER COLUMN id SET DEFAULT nextval('public.finance_pocket_member_access_id_seq'::regclass);


--
-- Name: idempotency_keys id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.idempotency_keys ALTER COLUMN id SET DEFAULT nextval('public.idempotency_keys_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: permissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions ALTER COLUMN id SET DEFAULT nextval('public.permissions_id_seq'::regclass);


--
-- Name: personal_access_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_access_tokens ALTER COLUMN id SET DEFAULT nextval('public.personal_access_tokens_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: social_accounts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_accounts ALTER COLUMN id SET DEFAULT nextval('public.social_accounts_id_seq'::regclass);


--
-- Name: telescope_entries sequence; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telescope_entries ALTER COLUMN sequence SET DEFAULT nextval('public.telescope_entries_sequence_seq'::regclass);


--
-- Name: tenant_attachments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_attachments ALTER COLUMN id SET DEFAULT nextval('public.tenant_attachments_id_seq'::regclass);


--
-- Name: tenant_bank_account_member_access id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_bank_account_member_access ALTER COLUMN id SET DEFAULT nextval('public.tenant_bank_account_member_access_id_seq'::regclass);


--
-- Name: tenant_budget_member_access id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_budget_member_access ALTER COLUMN id SET DEFAULT nextval('public.tenant_budget_member_access_id_seq'::regclass);


--
-- Name: tenant_categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_categories ALTER COLUMN id SET DEFAULT nextval('public.tenant_categories_id_seq'::regclass);


--
-- Name: tenant_currencies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_currencies ALTER COLUMN id SET DEFAULT nextval('public.tenant_currencies_id_seq'::regclass);


--
-- Name: tenant_curriculum_entitlements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_curriculum_entitlements ALTER COLUMN id SET DEFAULT nextval('public.tenant_curriculum_entitlements_id_seq'::regclass);


--
-- Name: tenant_game_curriculum_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_game_curriculum_settings ALTER COLUMN id SET DEFAULT nextval('public.tenant_game_curriculum_settings_id_seq'::regclass);


--
-- Name: tenant_game_math_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_game_math_settings ALTER COLUMN id SET DEFAULT nextval('public.tenant_game_math_settings_id_seq'::regclass);


--
-- Name: tenant_game_math_stats id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_game_math_stats ALTER COLUMN id SET DEFAULT nextval('public.tenant_game_math_stats_id_seq'::regclass);


--
-- Name: tenant_game_vocabulary_progress id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_game_vocabulary_progress ALTER COLUMN id SET DEFAULT nextval('public.tenant_game_vocabulary_progress_id_seq'::regclass);


--
-- Name: tenant_game_vocabulary_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_game_vocabulary_settings ALTER COLUMN id SET DEFAULT nextval('public.tenant_game_vocabulary_settings_id_seq'::regclass);


--
-- Name: tenant_game_vocabulary_words id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_game_vocabulary_words ALTER COLUMN id SET DEFAULT nextval('public.tenant_game_vocabulary_words_id_seq'::regclass);


--
-- Name: tenant_invitations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_invitations ALTER COLUMN id SET DEFAULT nextval('public.tenant_invitations_id_seq'::regclass);


--
-- Name: tenant_member_links id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_member_links ALTER COLUMN id SET DEFAULT nextval('public.tenant_member_links_id_seq'::regclass);


--
-- Name: tenant_members id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_members ALTER COLUMN id SET DEFAULT nextval('public.tenant_members_id_seq'::regclass);


--
-- Name: tenant_notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_notifications ALTER COLUMN id SET DEFAULT nextval('public.tenant_notifications_id_seq'::regclass);


--
-- Name: tenant_recurring_rules id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_recurring_rules ALTER COLUMN id SET DEFAULT nextval('public.tenant_recurring_rules_id_seq'::regclass);


--
-- Name: tenant_tags id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_tags ALTER COLUMN id SET DEFAULT nextval('public.tenant_tags_id_seq'::regclass);


--
-- Name: tenant_uom id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_uom ALTER COLUMN id SET DEFAULT nextval('public.tenant_uom_id_seq'::regclass);


--
-- Name: tenant_whatsapp_command_contexts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_command_contexts ALTER COLUMN id SET DEFAULT nextval('public.tenant_whatsapp_command_contexts_id_seq'::regclass);


--
-- Name: tenant_whatsapp_contacts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_contacts ALTER COLUMN id SET DEFAULT nextval('public.tenant_whatsapp_contacts_id_seq'::regclass);


--
-- Name: tenant_whatsapp_intent_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_intent_items ALTER COLUMN id SET DEFAULT nextval('public.tenant_whatsapp_intent_items_id_seq'::regclass);


--
-- Name: tenant_whatsapp_intents id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_intents ALTER COLUMN id SET DEFAULT nextval('public.tenant_whatsapp_intents_id_seq'::regclass);


--
-- Name: tenant_whatsapp_media id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_media ALTER COLUMN id SET DEFAULT nextval('public.tenant_whatsapp_media_id_seq'::regclass);


--
-- Name: tenant_whatsapp_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_messages ALTER COLUMN id SET DEFAULT nextval('public.tenant_whatsapp_messages_id_seq'::regclass);


--
-- Name: tenant_whatsapp_notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_notifications ALTER COLUMN id SET DEFAULT nextval('public.tenant_whatsapp_notifications_id_seq'::regclass);


--
-- Name: tenant_whatsapp_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_settings ALTER COLUMN id SET DEFAULT nextval('public.tenant_whatsapp_settings_id_seq'::regclass);


--
-- Name: tenants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants ALTER COLUMN id SET DEFAULT nextval('public.tenants_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: curriculum_questions curriculum_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.curriculum_questions
    ADD CONSTRAINT curriculum_questions_pkey PRIMARY KEY (id);


--
-- Name: curriculum_questions curriculum_questions_unique_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.curriculum_questions
    ADD CONSTRAINT curriculum_questions_unique_key UNIQUE (curriculum_unit_id, question_key);


--
-- Name: tenant_game_curriculum_settings curriculum_settings_unique_grade; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_game_curriculum_settings
    ADD CONSTRAINT curriculum_settings_unique_grade UNIQUE (tenant_id, member_id, grade);


--
-- Name: curriculum_units curriculum_units_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.curriculum_units
    ADD CONSTRAINT curriculum_units_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_uuid_unique UNIQUE (uuid);


--
-- Name: finance_month_reviews finance_month_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_month_reviews
    ADD CONSTRAINT finance_month_reviews_pkey PRIMARY KEY (id);


--
-- Name: finance_month_reviews finance_month_reviews_tenant_period_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_month_reviews
    ADD CONSTRAINT finance_month_reviews_tenant_period_unique UNIQUE (tenant_id, period_month);


--
-- Name: finance_wallet_member_access finance_pocket_member_access_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_wallet_member_access
    ADD CONSTRAINT finance_pocket_member_access_pkey PRIMARY KEY (id);


--
-- Name: finance_wallets finance_pockets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_wallets
    ADD CONSTRAINT finance_pockets_pkey PRIMARY KEY (id);


--
-- Name: finance_wallets finance_pockets_tenant_reference_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_wallets
    ADD CONSTRAINT finance_pockets_tenant_reference_unique UNIQUE (tenant_id, reference_code);


--
-- Name: finance_savings_goals finance_savings_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_savings_goals
    ADD CONSTRAINT finance_savings_goals_pkey PRIMARY KEY (id);


--
-- Name: finance_transactions finance_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_transactions
    ADD CONSTRAINT finance_transactions_pkey PRIMARY KEY (id);


--
-- Name: finance_wallet_member_access fpma_pocket_member_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_wallet_member_access
    ADD CONSTRAINT fpma_pocket_member_unique UNIQUE (finance_wallet_id, member_id);


--
-- Name: idempotency_keys idem_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.idempotency_keys
    ADD CONSTRAINT idem_unique UNIQUE (tenant_id, actor_user_id, endpoint, idempotency_key);


--
-- Name: idempotency_keys idempotency_keys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.idempotency_keys
    ADD CONSTRAINT idempotency_keys_pkey PRIMARY KEY (id);


--
-- Name: job_batches job_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_batches
    ADD CONSTRAINT job_batches_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: tenant_game_math_settings math_settings_unique_operator; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_game_math_settings
    ADD CONSTRAINT math_settings_unique_operator UNIQUE (tenant_id, member_id, operator);


--
-- Name: tenant_game_math_stats math_stats_unique_pair; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_game_math_stats
    ADD CONSTRAINT math_stats_unique_pair UNIQUE (tenant_id, member_id, operator, angka_pilihan, angka_random);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: model_has_permissions model_has_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_has_permissions
    ADD CONSTRAINT model_has_permissions_pkey PRIMARY KEY (tenant_id, permission_id, model_id, model_type);


--
-- Name: model_has_roles model_has_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_has_roles
    ADD CONSTRAINT model_has_roles_pkey PRIMARY KEY (tenant_id, role_id, model_id, model_type);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (email);


--
-- Name: permissions permissions_name_guard_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_name_guard_name_unique UNIQUE (name, guard_name);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: personal_access_tokens personal_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_pkey PRIMARY KEY (id);


--
-- Name: personal_access_tokens personal_access_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_token_unique UNIQUE (token);


--
-- Name: role_has_permissions role_has_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_has_permissions
    ADD CONSTRAINT role_has_permissions_pkey PRIMARY KEY (permission_id, role_id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: roles roles_tenant_id_name_guard_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_tenant_id_name_guard_name_unique UNIQUE (tenant_id, name, guard_name);


--
-- Name: social_accounts social_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_accounts
    ADD CONSTRAINT social_accounts_pkey PRIMARY KEY (id);


--
-- Name: social_accounts social_accounts_provider_provider_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_accounts
    ADD CONSTRAINT social_accounts_provider_provider_id_unique UNIQUE (provider, provider_id);


--
-- Name: tenant_bank_account_member_access tbama_account_member_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_bank_account_member_access
    ADD CONSTRAINT tbama_account_member_unique UNIQUE (tenant_bank_account_id, member_id);


--
-- Name: tenant_budget_member_access tbma_budget_member_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_budget_member_access
    ADD CONSTRAINT tbma_budget_member_unique UNIQUE (tenant_budget_id, member_id);


--
-- Name: telescope_entries telescope_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telescope_entries
    ADD CONSTRAINT telescope_entries_pkey PRIMARY KEY (sequence);


--
-- Name: telescope_entries_tags telescope_entries_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telescope_entries_tags
    ADD CONSTRAINT telescope_entries_tags_pkey PRIMARY KEY (entry_uuid, tag);


--
-- Name: telescope_entries telescope_entries_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telescope_entries
    ADD CONSTRAINT telescope_entries_uuid_unique UNIQUE (uuid);


--
-- Name: telescope_monitoring telescope_monitoring_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telescope_monitoring
    ADD CONSTRAINT telescope_monitoring_pkey PRIMARY KEY (tag);


--
-- Name: tenant_attachments tenant_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_attachments
    ADD CONSTRAINT tenant_attachments_pkey PRIMARY KEY (id);


--
-- Name: tenant_bank_account_member_access tenant_bank_account_member_access_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_bank_account_member_access
    ADD CONSTRAINT tenant_bank_account_member_access_pkey PRIMARY KEY (id);


--
-- Name: tenant_bank_accounts tenant_bank_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_bank_accounts
    ADD CONSTRAINT tenant_bank_accounts_pkey PRIMARY KEY (id);


--
-- Name: tenant_budget_lines tenant_budget_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_budget_lines
    ADD CONSTRAINT tenant_budget_lines_pkey PRIMARY KEY (id);


--
-- Name: tenant_budget_member_access tenant_budget_member_access_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_budget_member_access
    ADD CONSTRAINT tenant_budget_member_access_pkey PRIMARY KEY (id);


--
-- Name: tenant_budgets tenant_budgets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_budgets
    ADD CONSTRAINT tenant_budgets_pkey PRIMARY KEY (id);


--
-- Name: tenant_budgets tenant_budgets_unique_period_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_budgets
    ADD CONSTRAINT tenant_budgets_unique_period_name UNIQUE (tenant_id, period_month, name, deleted_at);


--
-- Name: tenant_categories tenant_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_categories
    ADD CONSTRAINT tenant_categories_pkey PRIMARY KEY (id);


--
-- Name: tenant_currencies tenant_currencies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_currencies
    ADD CONSTRAINT tenant_currencies_pkey PRIMARY KEY (id);


--
-- Name: tenant_curriculum_entitlements tenant_curriculum_entitlements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_curriculum_entitlements
    ADD CONSTRAINT tenant_curriculum_entitlements_pkey PRIMARY KEY (id);


--
-- Name: tenant_game_curriculum_settings tenant_game_curriculum_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_game_curriculum_settings
    ADD CONSTRAINT tenant_game_curriculum_settings_pkey PRIMARY KEY (id);


--
-- Name: tenant_game_math_settings tenant_game_math_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_game_math_settings
    ADD CONSTRAINT tenant_game_math_settings_pkey PRIMARY KEY (id);


--
-- Name: tenant_game_math_stats tenant_game_math_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_game_math_stats
    ADD CONSTRAINT tenant_game_math_stats_pkey PRIMARY KEY (id);


--
-- Name: tenant_game_sessions tenant_game_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_game_sessions
    ADD CONSTRAINT tenant_game_sessions_pkey PRIMARY KEY (id);


--
-- Name: tenant_game_vocabulary_progress tenant_game_vocabulary_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_game_vocabulary_progress
    ADD CONSTRAINT tenant_game_vocabulary_progress_pkey PRIMARY KEY (id);


--
-- Name: tenant_game_vocabulary_settings tenant_game_vocabulary_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_game_vocabulary_settings
    ADD CONSTRAINT tenant_game_vocabulary_settings_pkey PRIMARY KEY (id);


--
-- Name: tenant_game_vocabulary_words tenant_game_vocabulary_words_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_game_vocabulary_words
    ADD CONSTRAINT tenant_game_vocabulary_words_pkey PRIMARY KEY (id);


--
-- Name: tenant_invitations tenant_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_invitations
    ADD CONSTRAINT tenant_invitations_pkey PRIMARY KEY (id);


--
-- Name: tenant_invitations tenant_invitations_tenant_id_email_status_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_invitations
    ADD CONSTRAINT tenant_invitations_tenant_id_email_status_unique UNIQUE (tenant_id, email, status);


--
-- Name: tenant_invitations tenant_invitations_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_invitations
    ADD CONSTRAINT tenant_invitations_token_unique UNIQUE (token);


--
-- Name: tenant_member_links tenant_member_links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_member_links
    ADD CONSTRAINT tenant_member_links_pkey PRIMARY KEY (id);


--
-- Name: tenant_members tenant_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_members
    ADD CONSTRAINT tenant_members_pkey PRIMARY KEY (id);


--
-- Name: tenant_notifications tenant_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_notifications
    ADD CONSTRAINT tenant_notifications_pkey PRIMARY KEY (id);


--
-- Name: tenant_recurring_rules tenant_recurring_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_recurring_rules
    ADD CONSTRAINT tenant_recurring_rules_pkey PRIMARY KEY (id);


--
-- Name: tenant_taggables tenant_taggables_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_taggables
    ADD CONSTRAINT tenant_taggables_pkey PRIMARY KEY (tenant_tag_id, taggable_type, taggable_id);


--
-- Name: tenant_tags tenant_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_tags
    ADD CONSTRAINT tenant_tags_pkey PRIMARY KEY (id);


--
-- Name: tenant_uom tenant_uom_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_uom
    ADD CONSTRAINT tenant_uom_pkey PRIMARY KEY (id);


--
-- Name: tenant_whatsapp_command_contexts tenant_whatsapp_command_contexts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_command_contexts
    ADD CONSTRAINT tenant_whatsapp_command_contexts_pkey PRIMARY KEY (id);


--
-- Name: tenant_whatsapp_contacts tenant_whatsapp_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_contacts
    ADD CONSTRAINT tenant_whatsapp_contacts_pkey PRIMARY KEY (id);


--
-- Name: tenant_whatsapp_contacts tenant_whatsapp_contacts_tenant_id_jid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_contacts
    ADD CONSTRAINT tenant_whatsapp_contacts_tenant_id_jid_unique UNIQUE (tenant_id, jid);


--
-- Name: tenant_whatsapp_intent_items tenant_whatsapp_intent_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_intent_items
    ADD CONSTRAINT tenant_whatsapp_intent_items_pkey PRIMARY KEY (id);


--
-- Name: tenant_whatsapp_intents tenant_whatsapp_intents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_intents
    ADD CONSTRAINT tenant_whatsapp_intents_pkey PRIMARY KEY (id);


--
-- Name: tenant_whatsapp_intents tenant_whatsapp_intents_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_intents
    ADD CONSTRAINT tenant_whatsapp_intents_token_unique UNIQUE (token);


--
-- Name: tenant_whatsapp_media tenant_whatsapp_media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_media
    ADD CONSTRAINT tenant_whatsapp_media_pkey PRIMARY KEY (id);


--
-- Name: tenant_whatsapp_messages tenant_whatsapp_messages_dedupe; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_messages
    ADD CONSTRAINT tenant_whatsapp_messages_dedupe UNIQUE (tenant_id, direction, whatsapp_message_id);


--
-- Name: tenant_whatsapp_messages tenant_whatsapp_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_messages
    ADD CONSTRAINT tenant_whatsapp_messages_pkey PRIMARY KEY (id);


--
-- Name: tenant_whatsapp_notifications tenant_whatsapp_notifications_dedupe; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_notifications
    ADD CONSTRAINT tenant_whatsapp_notifications_dedupe UNIQUE (tenant_id, notification_key);


--
-- Name: tenant_whatsapp_notifications tenant_whatsapp_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_notifications
    ADD CONSTRAINT tenant_whatsapp_notifications_pkey PRIMARY KEY (id);


--
-- Name: tenant_whatsapp_settings tenant_whatsapp_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_settings
    ADD CONSTRAINT tenant_whatsapp_settings_pkey PRIMARY KEY (id);


--
-- Name: tenant_whatsapp_settings tenant_whatsapp_settings_tenant_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_settings
    ADD CONSTRAINT tenant_whatsapp_settings_tenant_id_unique UNIQUE (tenant_id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: tenants tenants_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_slug_unique UNIQUE (slug);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: tenant_game_vocabulary_progress vocabulary_progress_unique_word; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_game_vocabulary_progress
    ADD CONSTRAINT vocabulary_progress_unique_word UNIQUE (tenant_id, member_id, word_id, language);


--
-- Name: tenant_game_vocabulary_settings vocabulary_settings_unique_language; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_game_vocabulary_settings
    ADD CONSTRAINT vocabulary_settings_unique_language UNIQUE (tenant_id, member_id, language);


--
-- Name: wallet_wishes wallet_wishes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_wishes
    ADD CONSTRAINT wallet_wishes_pkey PRIMARY KEY (id);


--
-- Name: activity_logs_tenant_id_action_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activity_logs_tenant_id_action_index ON public.activity_logs USING btree (tenant_id, action);


--
-- Name: activity_logs_tenant_id_occurred_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activity_logs_tenant_id_occurred_at_index ON public.activity_logs USING btree (tenant_id, occurred_at);


--
-- Name: curriculum_entitlements_lookup_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX curriculum_entitlements_lookup_idx ON public.tenant_curriculum_entitlements USING btree (tenant_id, user_id, subject);


--
-- Name: curriculum_units_lookup_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX curriculum_units_lookup_idx ON public.curriculum_units USING btree (tenant_id, subject, grade, semester);


--
-- Name: finance_month_reviews_tenant_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX finance_month_reviews_tenant_status_idx ON public.finance_month_reviews USING btree (tenant_id, status);


--
-- Name: finance_pocket_member_access_member_id_can_use_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX finance_pocket_member_access_member_id_can_use_index ON public.finance_wallet_member_access USING btree (member_id, can_use);


--
-- Name: finance_pockets_default_budget_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX finance_pockets_default_budget_key_idx ON public.finance_wallets USING btree (tenant_id, default_budget_key);


--
-- Name: finance_pockets_tenant_id_owner_member_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX finance_pockets_tenant_id_owner_member_id_index ON public.finance_wallets USING btree (tenant_id, owner_member_id);


--
-- Name: finance_pockets_tenant_id_real_account_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX finance_pockets_tenant_id_real_account_id_index ON public.finance_wallets USING btree (tenant_id, real_account_id);


--
-- Name: finance_pockets_tenant_id_scope_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX finance_pockets_tenant_id_scope_index ON public.finance_wallets USING btree (tenant_id, scope);


--
-- Name: finance_pockets_tenant_purpose_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX finance_pockets_tenant_purpose_idx ON public.finance_wallets USING btree (tenant_id, purpose_type);


--
-- Name: finance_savings_goals_tenant_id_owner_member_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX finance_savings_goals_tenant_id_owner_member_id_index ON public.finance_savings_goals USING btree (tenant_id, owner_member_id);


--
-- Name: finance_savings_goals_tenant_id_pocket_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX finance_savings_goals_tenant_id_pocket_id_index ON public.finance_savings_goals USING btree (tenant_id, wallet_id);


--
-- Name: finance_transactions_source_type_source_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX finance_transactions_source_type_source_id_index ON public.finance_transactions USING btree (source_type, source_id);


--
-- Name: finance_transactions_tenant_id_amount_base_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX finance_transactions_tenant_id_amount_base_index ON public.finance_transactions USING btree (tenant_id, amount_base);


--
-- Name: finance_transactions_tenant_id_bank_account_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX finance_transactions_tenant_id_bank_account_id_index ON public.finance_transactions USING btree (tenant_id, bank_account_id);


--
-- Name: finance_transactions_tenant_id_budget_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX finance_transactions_tenant_id_budget_id_index ON public.finance_transactions USING btree (tenant_id, budget_id);


--
-- Name: finance_transactions_tenant_id_budget_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX finance_transactions_tenant_id_budget_status_index ON public.finance_transactions USING btree (tenant_id, budget_status);


--
-- Name: finance_transactions_tenant_id_category_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX finance_transactions_tenant_id_category_id_index ON public.finance_transactions USING btree (tenant_id, category_id);


--
-- Name: finance_transactions_tenant_id_currency_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX finance_transactions_tenant_id_currency_id_index ON public.finance_transactions USING btree (tenant_id, currency_id);


--
-- Name: finance_transactions_tenant_id_deleted_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX finance_transactions_tenant_id_deleted_at_index ON public.finance_transactions USING btree (tenant_id, deleted_at);


--
-- Name: finance_transactions_tenant_id_is_internal_transfer_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX finance_transactions_tenant_id_is_internal_transfer_index ON public.finance_transactions USING btree (tenant_id, is_internal_transfer);


--
-- Name: finance_transactions_tenant_id_owner_member_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX finance_transactions_tenant_id_owner_member_id_index ON public.finance_transactions USING btree (tenant_id, owner_member_id);


--
-- Name: finance_transactions_tenant_id_pocket_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX finance_transactions_tenant_id_pocket_id_index ON public.finance_transactions USING btree (tenant_id, wallet_id);


--
-- Name: finance_transactions_tenant_id_transaction_date_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX finance_transactions_tenant_id_transaction_date_index ON public.finance_transactions USING btree (tenant_id, transaction_date);


--
-- Name: finance_transactions_tenant_id_transfer_pair_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX finance_transactions_tenant_id_transfer_pair_id_index ON public.finance_transactions USING btree (tenant_id, transfer_pair_id);


--
-- Name: finance_transactions_tenant_id_type_transaction_date_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX finance_transactions_tenant_id_type_transaction_date_index ON public.finance_transactions USING btree (tenant_id, type, transaction_date);


--
-- Name: fpma_member_can_view_pocket_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX fpma_member_can_view_pocket_idx ON public.finance_wallet_member_access USING btree (member_id, can_view, finance_wallet_id);


--
-- Name: game_sessions_lookup_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX game_sessions_lookup_idx ON public.tenant_game_sessions USING btree (tenant_id, member_id, game_slug, finished_at);


--
-- Name: idx_accounts_list_perf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_accounts_list_perf ON public.tenant_bank_accounts USING btree (tenant_id, is_active, scope, name);


--
-- Name: idx_pockets_list_perf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pockets_list_perf ON public.finance_wallets USING btree (tenant_id, is_active, scope, is_system, name);


--
-- Name: idx_trans_account_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trans_account_date ON public.finance_transactions USING btree (tenant_id, bank_account_id, transaction_date);


--
-- Name: idx_trans_owner_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trans_owner_date ON public.finance_transactions USING btree (tenant_id, owner_member_id, transaction_date);


--
-- Name: idx_trans_pocket_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trans_pocket_date ON public.finance_transactions USING btree (tenant_id, wallet_id, transaction_date);


--
-- Name: jobs_queue_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX jobs_queue_index ON public.jobs USING btree (queue);


--
-- Name: model_has_permissions_model_id_model_type_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX model_has_permissions_model_id_model_type_index ON public.model_has_permissions USING btree (model_id, model_type);


--
-- Name: model_has_permissions_team_foreign_key_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX model_has_permissions_team_foreign_key_index ON public.model_has_permissions USING btree (tenant_id);


--
-- Name: model_has_roles_model_id_model_type_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX model_has_roles_model_id_model_type_index ON public.model_has_roles USING btree (model_id, model_type);


--
-- Name: model_has_roles_team_foreign_key_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX model_has_roles_team_foreign_key_index ON public.model_has_roles USING btree (tenant_id);


--
-- Name: personal_access_tokens_tokenable_type_tokenable_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX personal_access_tokens_tokenable_type_tokenable_id_index ON public.personal_access_tokens USING btree (tokenable_type, tokenable_id);


--
-- Name: roles_team_foreign_key_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX roles_team_foreign_key_index ON public.roles USING btree (tenant_id);


--
-- Name: roles_tenant_system_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX roles_tenant_system_idx ON public.roles USING btree (tenant_id, is_system);


--
-- Name: social_accounts_user_id_provider_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX social_accounts_user_id_provider_index ON public.social_accounts USING btree (user_id, provider);


--
-- Name: tbama_member_can_view_account_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tbama_member_can_view_account_idx ON public.tenant_bank_account_member_access USING btree (member_id, can_view, tenant_bank_account_id);


--
-- Name: tbma_member_can_view_budget_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tbma_member_can_view_budget_idx ON public.tenant_budget_member_access USING btree (member_id, can_view, tenant_budget_id);


--
-- Name: telescope_entries_batch_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX telescope_entries_batch_id_index ON public.telescope_entries USING btree (batch_id);


--
-- Name: telescope_entries_created_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX telescope_entries_created_at_index ON public.telescope_entries USING btree (created_at);


--
-- Name: telescope_entries_family_hash_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX telescope_entries_family_hash_index ON public.telescope_entries USING btree (family_hash);


--
-- Name: telescope_entries_tags_tag_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX telescope_entries_tags_tag_index ON public.telescope_entries_tags USING btree (tag);


--
-- Name: telescope_entries_type_should_display_on_index_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX telescope_entries_type_should_display_on_index_index ON public.telescope_entries USING btree (type, should_display_on_index);


--
-- Name: tenant_attachments_tenant_id_attachable_type_attachable_id_inde; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_attachments_tenant_id_attachable_type_attachable_id_inde ON public.tenant_attachments USING btree (tenant_id, attachable_type, attachable_id);


--
-- Name: tenant_attachments_tenant_id_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_attachments_tenant_id_status_index ON public.tenant_attachments USING btree (tenant_id, status);


--
-- Name: tenant_bank_account_member_access_member_id_can_use_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_bank_account_member_access_member_id_can_use_index ON public.tenant_bank_account_member_access USING btree (member_id, can_use);


--
-- Name: tenant_bank_accounts_tenant_id_owner_member_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_bank_accounts_tenant_id_owner_member_id_index ON public.tenant_bank_accounts USING btree (tenant_id, owner_member_id);


--
-- Name: tenant_bank_accounts_tenant_id_scope_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_bank_accounts_tenant_id_scope_index ON public.tenant_bank_accounts USING btree (tenant_id, scope);


--
-- Name: tenant_bank_accounts_tenant_id_type_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_bank_accounts_tenant_id_type_index ON public.tenant_bank_accounts USING btree (tenant_id, type);


--
-- Name: tenant_budget_lines_budget_id_created_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_budget_lines_budget_id_created_at_index ON public.tenant_budget_lines USING btree (budget_id, created_at);


--
-- Name: tenant_budget_lines_finance_transaction_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_budget_lines_finance_transaction_id_index ON public.tenant_budget_lines USING btree (finance_transaction_id);


--
-- Name: tenant_budgets_budget_key_period_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_budgets_budget_key_period_idx ON public.tenant_budgets USING btree (tenant_id, budget_key, period_month);


--
-- Name: tenant_budgets_tenant_id_owner_member_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_budgets_tenant_id_owner_member_id_index ON public.tenant_budgets USING btree (tenant_id, owner_member_id);


--
-- Name: tenant_budgets_tenant_id_period_month_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_budgets_tenant_id_period_month_index ON public.tenant_budgets USING btree (tenant_id, period_month);


--
-- Name: tenant_budgets_tenant_id_pocket_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_budgets_tenant_id_pocket_id_index ON public.tenant_budgets USING btree (tenant_id, wallet_id);


--
-- Name: tenant_budgets_tenant_id_scope_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_budgets_tenant_id_scope_index ON public.tenant_budgets USING btree (tenant_id, scope);


--
-- Name: tenant_categories_tenant_id_module_is_active_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_categories_tenant_id_module_is_active_index ON public.tenant_categories USING btree (tenant_id, module, is_active);


--
-- Name: tenant_categories_tenant_id_parent_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_categories_tenant_id_parent_id_index ON public.tenant_categories USING btree (tenant_id, parent_id);


--
-- Name: tenant_currencies_tenant_id_code_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tenant_currencies_tenant_id_code_unique ON public.tenant_currencies USING btree (tenant_id, code) WHERE (deleted_at IS NULL);


--
-- Name: tenant_currencies_tenant_id_is_active_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_currencies_tenant_id_is_active_index ON public.tenant_currencies USING btree (tenant_id, is_active);


--
-- Name: tenant_invitations_tenant_id_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_invitations_tenant_id_status_index ON public.tenant_invitations USING btree (tenant_id, status);


--
-- Name: tenant_invitations_tenant_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_invitations_tenant_status_idx ON public.tenant_invitations USING btree (tenant_id, status);


--
-- Name: tenant_member_links_tenant_id_member_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_member_links_tenant_id_member_id_index ON public.tenant_member_links USING btree (tenant_id, member_id);


--
-- Name: tenant_members_active_whatsapp_jid_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tenant_members_active_whatsapp_jid_unique ON public.tenant_members USING btree (tenant_id, whatsapp_jid) WHERE ((whatsapp_jid IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: tenant_members_onboarding_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_members_onboarding_idx ON public.tenant_members USING btree (tenant_id, onboarding_status);


--
-- Name: tenant_members_tenant_id_profile_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_members_tenant_id_profile_status_index ON public.tenant_members USING btree (tenant_id, profile_status);


--
-- Name: tenant_members_tenant_id_role_code_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_members_tenant_id_role_code_index ON public.tenant_members USING btree (tenant_id, role_code);


--
-- Name: tenant_members_tenant_jid_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_members_tenant_jid_idx ON public.tenant_members USING btree (tenant_id, whatsapp_jid);


--
-- Name: tenant_members_tenant_onboarding_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_members_tenant_onboarding_idx ON public.tenant_members USING btree (tenant_id, onboarding_status, deleted_at);


--
-- Name: tenant_members_tenant_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_members_tenant_status_idx ON public.tenant_members USING btree (tenant_id, profile_status, deleted_at);


--
-- Name: tenant_members_tenant_user_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_members_tenant_user_status_idx ON public.tenant_members USING btree (tenant_id, user_id, profile_status, deleted_at);


--
-- Name: tenant_members_user_id_active_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tenant_members_user_id_active_unique ON public.tenant_members USING btree (user_id) WHERE ((user_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: tenant_notifications_tenant_id_notification_type_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_notifications_tenant_id_notification_type_index ON public.tenant_notifications USING btree (tenant_id, notification_type);


--
-- Name: tenant_recurring_rules_tenant_id_ruleable_type_ruleable_id_inde; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_recurring_rules_tenant_id_ruleable_type_ruleable_id_inde ON public.tenant_recurring_rules USING btree (tenant_id, ruleable_type, ruleable_id);


--
-- Name: tenant_taggables_taggable_type_taggable_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_taggables_taggable_type_taggable_id_index ON public.tenant_taggables USING btree (taggable_type, taggable_id);


--
-- Name: tenant_tags_tenant_id_is_active_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_tags_tenant_id_is_active_index ON public.tenant_tags USING btree (tenant_id, is_active);


--
-- Name: tenant_tags_tenant_id_name_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tenant_tags_tenant_id_name_unique ON public.tenant_tags USING btree (tenant_id, name) WHERE (deleted_at IS NULL);


--
-- Name: tenant_tags_tenant_id_usage_count_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_tags_tenant_id_usage_count_index ON public.tenant_tags USING btree (tenant_id, usage_count);


--
-- Name: tenant_uom_tenant_id_code_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tenant_uom_tenant_id_code_unique ON public.tenant_uom USING btree (tenant_id, code) WHERE (deleted_at IS NULL);


--
-- Name: tenant_uom_tenant_id_dimension_type_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_uom_tenant_id_dimension_type_index ON public.tenant_uom USING btree (tenant_id, dimension_type);


--
-- Name: tenant_whatsapp_command_contexts_tenant_id_expires_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_whatsapp_command_contexts_tenant_id_expires_at_index ON public.tenant_whatsapp_command_contexts USING btree (tenant_id, expires_at);


--
-- Name: tenant_whatsapp_command_contexts_tenant_id_sender_jid_context_t; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_whatsapp_command_contexts_tenant_id_sender_jid_context_t ON public.tenant_whatsapp_command_contexts USING btree (tenant_id, sender_jid, context_type);


--
-- Name: tenant_whatsapp_contacts_tenant_id_contact_type_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_whatsapp_contacts_tenant_id_contact_type_index ON public.tenant_whatsapp_contacts USING btree (tenant_id, contact_type);


--
-- Name: tenant_whatsapp_contacts_tenant_id_last_message_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_whatsapp_contacts_tenant_id_last_message_at_index ON public.tenant_whatsapp_contacts USING btree (tenant_id, last_message_at);


--
-- Name: tenant_whatsapp_intent_items_intent_id_sort_order_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_whatsapp_intent_items_intent_id_sort_order_index ON public.tenant_whatsapp_intent_items USING btree (intent_id, sort_order);


--
-- Name: tenant_whatsapp_intents_sender_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_whatsapp_intents_sender_status_idx ON public.tenant_whatsapp_intents USING btree (tenant_id, sender_jid, status);


--
-- Name: tenant_whatsapp_intents_tenant_id_member_id_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_whatsapp_intents_tenant_id_member_id_status_index ON public.tenant_whatsapp_intents USING btree (tenant_id, member_id, status);


--
-- Name: tenant_whatsapp_media_tenant_id_consumed_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_whatsapp_media_tenant_id_consumed_at_index ON public.tenant_whatsapp_media USING btree (tenant_id, consumed_at);


--
-- Name: tenant_whatsapp_media_tenant_id_created_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_whatsapp_media_tenant_id_created_at_index ON public.tenant_whatsapp_media USING btree (tenant_id, created_at);


--
-- Name: tenant_whatsapp_messages_chat_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_whatsapp_messages_chat_idx ON public.tenant_whatsapp_messages USING btree (tenant_id, chat_jid, created_at);


--
-- Name: tenant_whatsapp_messages_read_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_whatsapp_messages_read_idx ON public.tenant_whatsapp_messages USING btree (tenant_id, direction, read_at);


--
-- Name: tenant_whatsapp_messages_tenant_id_created_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_whatsapp_messages_tenant_id_created_at_index ON public.tenant_whatsapp_messages USING btree (tenant_id, created_at);


--
-- Name: tenant_whatsapp_notifications_tenant_id_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_whatsapp_notifications_tenant_id_status_index ON public.tenant_whatsapp_notifications USING btree (tenant_id, status);


--
-- Name: tenant_whatsapp_settings_connected_jid_active_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tenant_whatsapp_settings_connected_jid_active_unique ON public.tenant_whatsapp_settings USING btree (connected_jid) WHERE (connected_jid IS NOT NULL);


--
-- Name: tenant_whatsapp_settings_tenant_id_connection_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenant_whatsapp_settings_tenant_id_connection_status_index ON public.tenant_whatsapp_settings USING btree (tenant_id, connection_status);


--
-- Name: tenants_plan_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenants_plan_code_idx ON public.tenants USING btree (plan_code);


--
-- Name: tenants_slug_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tenants_slug_idx ON public.tenants USING btree (slug);


--
-- Name: unique_tenant_category_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_tenant_category_name ON public.tenant_categories USING btree (tenant_id, module, sub_type, name) WHERE (deleted_at IS NULL);


--
-- Name: users_is_superadmin_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_is_superadmin_index ON public.users USING btree (is_superadmin);


--
-- Name: vocabulary_words_lookup_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vocabulary_words_lookup_idx ON public.tenant_game_vocabulary_words USING btree (tenant_id, kategori, hari);


--
-- Name: wallet_wishes_tenant_id_priority_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX wallet_wishes_tenant_id_priority_index ON public.wallet_wishes USING btree (tenant_id, priority);


--
-- Name: wallet_wishes_tenant_id_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX wallet_wishes_tenant_id_status_index ON public.wallet_wishes USING btree (tenant_id, status);


--
-- Name: activity_logs activity_logs_actor_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_actor_member_id_foreign FOREIGN KEY (actor_member_id) REFERENCES public.tenant_members(id) ON DELETE SET NULL;


--
-- Name: activity_logs activity_logs_actor_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_actor_user_id_foreign FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: activity_logs activity_logs_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: curriculum_questions curriculum_questions_curriculum_unit_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.curriculum_questions
    ADD CONSTRAINT curriculum_questions_curriculum_unit_id_foreign FOREIGN KEY (curriculum_unit_id) REFERENCES public.curriculum_units(id) ON DELETE CASCADE;


--
-- Name: curriculum_questions curriculum_questions_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.curriculum_questions
    ADD CONSTRAINT curriculum_questions_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE SET NULL;


--
-- Name: curriculum_units curriculum_units_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.curriculum_units
    ADD CONSTRAINT curriculum_units_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE SET NULL;


--
-- Name: finance_month_reviews finance_month_reviews_closed_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_month_reviews
    ADD CONSTRAINT finance_month_reviews_closed_by_foreign FOREIGN KEY (closed_by) REFERENCES public.tenant_members(id) ON DELETE SET NULL;


--
-- Name: finance_month_reviews finance_month_reviews_started_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_month_reviews
    ADD CONSTRAINT finance_month_reviews_started_by_foreign FOREIGN KEY (started_by) REFERENCES public.tenant_members(id) ON DELETE SET NULL;


--
-- Name: finance_month_reviews finance_month_reviews_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_month_reviews
    ADD CONSTRAINT finance_month_reviews_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: finance_wallet_member_access finance_pocket_member_access_finance_pocket_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_wallet_member_access
    ADD CONSTRAINT finance_pocket_member_access_finance_pocket_id_foreign FOREIGN KEY (finance_wallet_id) REFERENCES public.finance_wallets(id) ON DELETE CASCADE;


--
-- Name: finance_wallet_member_access finance_pocket_member_access_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_wallet_member_access
    ADD CONSTRAINT finance_pocket_member_access_member_id_foreign FOREIGN KEY (member_id) REFERENCES public.tenant_members(id) ON DELETE CASCADE;


--
-- Name: finance_wallets finance_pockets_default_budget_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_wallets
    ADD CONSTRAINT finance_pockets_default_budget_id_foreign FOREIGN KEY (default_budget_id) REFERENCES public.tenant_budgets(id) ON DELETE SET NULL;


--
-- Name: finance_wallets finance_pockets_owner_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_wallets
    ADD CONSTRAINT finance_pockets_owner_member_id_foreign FOREIGN KEY (owner_member_id) REFERENCES public.tenant_members(id) ON DELETE SET NULL;


--
-- Name: finance_wallets finance_pockets_real_account_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_wallets
    ADD CONSTRAINT finance_pockets_real_account_id_foreign FOREIGN KEY (real_account_id) REFERENCES public.tenant_bank_accounts(id) ON DELETE CASCADE;


--
-- Name: finance_wallets finance_pockets_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_wallets
    ADD CONSTRAINT finance_pockets_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: finance_savings_goals finance_savings_goals_owner_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_savings_goals
    ADD CONSTRAINT finance_savings_goals_owner_member_id_foreign FOREIGN KEY (owner_member_id) REFERENCES public.tenant_members(id) ON DELETE SET NULL;


--
-- Name: finance_savings_goals finance_savings_goals_pocket_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_savings_goals
    ADD CONSTRAINT finance_savings_goals_pocket_id_foreign FOREIGN KEY (wallet_id) REFERENCES public.finance_wallets(id) ON DELETE CASCADE;


--
-- Name: finance_savings_goals finance_savings_goals_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_savings_goals
    ADD CONSTRAINT finance_savings_goals_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: finance_transactions finance_transactions_approved_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_transactions
    ADD CONSTRAINT finance_transactions_approved_by_foreign FOREIGN KEY (approved_by) REFERENCES public.tenant_members(id) ON DELETE SET NULL;


--
-- Name: finance_transactions finance_transactions_bank_account_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_transactions
    ADD CONSTRAINT finance_transactions_bank_account_id_foreign FOREIGN KEY (bank_account_id) REFERENCES public.tenant_bank_accounts(id) ON DELETE SET NULL;


--
-- Name: finance_transactions finance_transactions_budget_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_transactions
    ADD CONSTRAINT finance_transactions_budget_id_foreign FOREIGN KEY (budget_id) REFERENCES public.tenant_budgets(id) ON DELETE SET NULL;


--
-- Name: finance_transactions finance_transactions_category_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_transactions
    ADD CONSTRAINT finance_transactions_category_id_foreign FOREIGN KEY (category_id) REFERENCES public.tenant_categories(id) ON DELETE SET NULL;


--
-- Name: finance_transactions finance_transactions_created_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_transactions
    ADD CONSTRAINT finance_transactions_created_by_foreign FOREIGN KEY (created_by) REFERENCES public.tenant_members(id) ON DELETE SET NULL;


--
-- Name: finance_transactions finance_transactions_currency_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_transactions
    ADD CONSTRAINT finance_transactions_currency_id_foreign FOREIGN KEY (currency_id) REFERENCES public.tenant_currencies(id);


--
-- Name: finance_transactions finance_transactions_owner_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_transactions
    ADD CONSTRAINT finance_transactions_owner_member_id_foreign FOREIGN KEY (owner_member_id) REFERENCES public.tenant_members(id) ON DELETE SET NULL;


--
-- Name: finance_transactions finance_transactions_pocket_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_transactions
    ADD CONSTRAINT finance_transactions_pocket_id_foreign FOREIGN KEY (wallet_id) REFERENCES public.finance_wallets(id) ON DELETE SET NULL;


--
-- Name: finance_transactions finance_transactions_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_transactions
    ADD CONSTRAINT finance_transactions_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: finance_transactions finance_transactions_updated_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.finance_transactions
    ADD CONSTRAINT finance_transactions_updated_by_foreign FOREIGN KEY (updated_by) REFERENCES public.tenant_members(id) ON DELETE SET NULL;


--
-- Name: idempotency_keys idempotency_keys_actor_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.idempotency_keys
    ADD CONSTRAINT idempotency_keys_actor_user_id_foreign FOREIGN KEY (actor_user_id) REFERENCES public.users(id);


--
-- Name: idempotency_keys idempotency_keys_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.idempotency_keys
    ADD CONSTRAINT idempotency_keys_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: model_has_permissions model_has_permissions_permission_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_has_permissions
    ADD CONSTRAINT model_has_permissions_permission_id_foreign FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: model_has_roles model_has_roles_role_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.model_has_roles
    ADD CONSTRAINT model_has_roles_role_id_foreign FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: role_has_permissions role_has_permissions_permission_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_has_permissions
    ADD CONSTRAINT role_has_permissions_permission_id_foreign FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_has_permissions role_has_permissions_role_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_has_permissions
    ADD CONSTRAINT role_has_permissions_role_id_foreign FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: social_accounts social_accounts_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.social_accounts
    ADD CONSTRAINT social_accounts_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: telescope_entries_tags telescope_entries_tags_entry_uuid_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.telescope_entries_tags
    ADD CONSTRAINT telescope_entries_tags_entry_uuid_foreign FOREIGN KEY (entry_uuid) REFERENCES public.telescope_entries(uuid) ON DELETE CASCADE;


--
-- Name: tenant_attachments tenant_attachments_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_attachments
    ADD CONSTRAINT tenant_attachments_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_bank_account_member_access tenant_bank_account_member_access_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_bank_account_member_access
    ADD CONSTRAINT tenant_bank_account_member_access_member_id_foreign FOREIGN KEY (member_id) REFERENCES public.tenant_members(id) ON DELETE CASCADE;


--
-- Name: tenant_bank_account_member_access tenant_bank_account_member_access_tenant_bank_account_id_foreig; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_bank_account_member_access
    ADD CONSTRAINT tenant_bank_account_member_access_tenant_bank_account_id_foreig FOREIGN KEY (tenant_bank_account_id) REFERENCES public.tenant_bank_accounts(id) ON DELETE CASCADE;


--
-- Name: tenant_bank_accounts tenant_bank_accounts_owner_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_bank_accounts
    ADD CONSTRAINT tenant_bank_accounts_owner_member_id_foreign FOREIGN KEY (owner_member_id) REFERENCES public.tenant_members(id) ON DELETE SET NULL;


--
-- Name: tenant_bank_accounts tenant_bank_accounts_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_bank_accounts
    ADD CONSTRAINT tenant_bank_accounts_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: tenant_budget_lines tenant_budget_lines_budget_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_budget_lines
    ADD CONSTRAINT tenant_budget_lines_budget_id_foreign FOREIGN KEY (budget_id) REFERENCES public.tenant_budgets(id) ON DELETE CASCADE;


--
-- Name: tenant_budget_lines tenant_budget_lines_finance_transaction_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_budget_lines
    ADD CONSTRAINT tenant_budget_lines_finance_transaction_id_foreign FOREIGN KEY (finance_transaction_id) REFERENCES public.finance_transactions(id) ON DELETE SET NULL;


--
-- Name: tenant_budget_lines tenant_budget_lines_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_budget_lines
    ADD CONSTRAINT tenant_budget_lines_member_id_foreign FOREIGN KEY (member_id) REFERENCES public.tenant_members(id) ON DELETE SET NULL;


--
-- Name: tenant_budget_lines tenant_budget_lines_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_budget_lines
    ADD CONSTRAINT tenant_budget_lines_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: tenant_budget_member_access tenant_budget_member_access_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_budget_member_access
    ADD CONSTRAINT tenant_budget_member_access_member_id_foreign FOREIGN KEY (member_id) REFERENCES public.tenant_members(id) ON DELETE CASCADE;


--
-- Name: tenant_budget_member_access tenant_budget_member_access_tenant_budget_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_budget_member_access
    ADD CONSTRAINT tenant_budget_member_access_tenant_budget_id_foreign FOREIGN KEY (tenant_budget_id) REFERENCES public.tenant_budgets(id) ON DELETE CASCADE;


--
-- Name: tenant_budgets tenant_budgets_owner_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_budgets
    ADD CONSTRAINT tenant_budgets_owner_member_id_foreign FOREIGN KEY (owner_member_id) REFERENCES public.tenant_members(id) ON DELETE SET NULL;


--
-- Name: tenant_budgets tenant_budgets_pocket_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_budgets
    ADD CONSTRAINT tenant_budgets_pocket_id_foreign FOREIGN KEY (wallet_id) REFERENCES public.finance_wallets(id) ON DELETE SET NULL;


--
-- Name: tenant_budgets tenant_budgets_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_budgets
    ADD CONSTRAINT tenant_budgets_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: tenant_categories tenant_categories_parent_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_categories
    ADD CONSTRAINT tenant_categories_parent_id_foreign FOREIGN KEY (parent_id) REFERENCES public.tenant_categories(id) ON DELETE SET NULL;


--
-- Name: tenant_categories tenant_categories_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_categories
    ADD CONSTRAINT tenant_categories_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_currencies tenant_currencies_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_currencies
    ADD CONSTRAINT tenant_currencies_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_curriculum_entitlements tenant_curriculum_entitlements_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_curriculum_entitlements
    ADD CONSTRAINT tenant_curriculum_entitlements_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_curriculum_entitlements tenant_curriculum_entitlements_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_curriculum_entitlements
    ADD CONSTRAINT tenant_curriculum_entitlements_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: tenant_game_curriculum_settings tenant_game_curriculum_settings_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_game_curriculum_settings
    ADD CONSTRAINT tenant_game_curriculum_settings_member_id_foreign FOREIGN KEY (member_id) REFERENCES public.tenant_members(id) ON DELETE CASCADE;


--
-- Name: tenant_game_curriculum_settings tenant_game_curriculum_settings_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_game_curriculum_settings
    ADD CONSTRAINT tenant_game_curriculum_settings_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_game_math_settings tenant_game_math_settings_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_game_math_settings
    ADD CONSTRAINT tenant_game_math_settings_member_id_foreign FOREIGN KEY (member_id) REFERENCES public.tenant_members(id) ON DELETE CASCADE;


--
-- Name: tenant_game_math_settings tenant_game_math_settings_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_game_math_settings
    ADD CONSTRAINT tenant_game_math_settings_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_game_math_stats tenant_game_math_stats_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_game_math_stats
    ADD CONSTRAINT tenant_game_math_stats_member_id_foreign FOREIGN KEY (member_id) REFERENCES public.tenant_members(id) ON DELETE CASCADE;


--
-- Name: tenant_game_math_stats tenant_game_math_stats_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_game_math_stats
    ADD CONSTRAINT tenant_game_math_stats_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_game_sessions tenant_game_sessions_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_game_sessions
    ADD CONSTRAINT tenant_game_sessions_member_id_foreign FOREIGN KEY (member_id) REFERENCES public.tenant_members(id) ON DELETE CASCADE;


--
-- Name: tenant_game_sessions tenant_game_sessions_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_game_sessions
    ADD CONSTRAINT tenant_game_sessions_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_game_vocabulary_progress tenant_game_vocabulary_progress_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_game_vocabulary_progress
    ADD CONSTRAINT tenant_game_vocabulary_progress_member_id_foreign FOREIGN KEY (member_id) REFERENCES public.tenant_members(id) ON DELETE CASCADE;


--
-- Name: tenant_game_vocabulary_progress tenant_game_vocabulary_progress_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_game_vocabulary_progress
    ADD CONSTRAINT tenant_game_vocabulary_progress_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_game_vocabulary_progress tenant_game_vocabulary_progress_word_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_game_vocabulary_progress
    ADD CONSTRAINT tenant_game_vocabulary_progress_word_id_foreign FOREIGN KEY (word_id) REFERENCES public.tenant_game_vocabulary_words(id) ON DELETE CASCADE;


--
-- Name: tenant_game_vocabulary_settings tenant_game_vocabulary_settings_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_game_vocabulary_settings
    ADD CONSTRAINT tenant_game_vocabulary_settings_member_id_foreign FOREIGN KEY (member_id) REFERENCES public.tenant_members(id) ON DELETE CASCADE;


--
-- Name: tenant_game_vocabulary_settings tenant_game_vocabulary_settings_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_game_vocabulary_settings
    ADD CONSTRAINT tenant_game_vocabulary_settings_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_game_vocabulary_words tenant_game_vocabulary_words_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_game_vocabulary_words
    ADD CONSTRAINT tenant_game_vocabulary_words_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE SET NULL;


--
-- Name: tenant_invitations tenant_invitations_invited_by_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_invitations
    ADD CONSTRAINT tenant_invitations_invited_by_user_id_foreign FOREIGN KEY (invited_by_user_id) REFERENCES public.users(id);


--
-- Name: tenant_invitations tenant_invitations_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_invitations
    ADD CONSTRAINT tenant_invitations_member_id_foreign FOREIGN KEY (member_id) REFERENCES public.tenant_members(id);


--
-- Name: tenant_invitations tenant_invitations_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_invitations
    ADD CONSTRAINT tenant_invitations_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: tenant_member_links tenant_member_links_linked_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_member_links
    ADD CONSTRAINT tenant_member_links_linked_member_id_foreign FOREIGN KEY (linked_member_id) REFERENCES public.tenant_members(id);


--
-- Name: tenant_member_links tenant_member_links_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_member_links
    ADD CONSTRAINT tenant_member_links_member_id_foreign FOREIGN KEY (member_id) REFERENCES public.tenant_members(id);


--
-- Name: tenant_member_links tenant_member_links_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_member_links
    ADD CONSTRAINT tenant_member_links_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: tenant_members tenant_members_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_members
    ADD CONSTRAINT tenant_members_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: tenant_members tenant_members_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_members
    ADD CONSTRAINT tenant_members_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: tenant_notifications tenant_notifications_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_notifications
    ADD CONSTRAINT tenant_notifications_member_id_foreign FOREIGN KEY (member_id) REFERENCES public.tenant_members(id);


--
-- Name: tenant_notifications tenant_notifications_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_notifications
    ADD CONSTRAINT tenant_notifications_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);


--
-- Name: tenant_recurring_rules tenant_recurring_rules_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_recurring_rules
    ADD CONSTRAINT tenant_recurring_rules_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_taggables tenant_taggables_tenant_tag_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_taggables
    ADD CONSTRAINT tenant_taggables_tenant_tag_id_foreign FOREIGN KEY (tenant_tag_id) REFERENCES public.tenant_tags(id) ON DELETE CASCADE;


--
-- Name: tenant_tags tenant_tags_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_tags
    ADD CONSTRAINT tenant_tags_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_uom tenant_uom_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_uom
    ADD CONSTRAINT tenant_uom_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_whatsapp_command_contexts tenant_whatsapp_command_contexts_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_command_contexts
    ADD CONSTRAINT tenant_whatsapp_command_contexts_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_whatsapp_contacts tenant_whatsapp_contacts_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_contacts
    ADD CONSTRAINT tenant_whatsapp_contacts_member_id_foreign FOREIGN KEY (member_id) REFERENCES public.tenant_members(id) ON DELETE SET NULL;


--
-- Name: tenant_whatsapp_contacts tenant_whatsapp_contacts_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_contacts
    ADD CONSTRAINT tenant_whatsapp_contacts_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_whatsapp_intent_items tenant_whatsapp_intent_items_intent_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_intent_items
    ADD CONSTRAINT tenant_whatsapp_intent_items_intent_id_foreign FOREIGN KEY (intent_id) REFERENCES public.tenant_whatsapp_intents(id) ON DELETE CASCADE;


--
-- Name: tenant_whatsapp_intents tenant_whatsapp_intents_media_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_intents
    ADD CONSTRAINT tenant_whatsapp_intents_media_id_foreign FOREIGN KEY (media_id) REFERENCES public.tenant_whatsapp_media(id) ON DELETE SET NULL;


--
-- Name: tenant_whatsapp_intents tenant_whatsapp_intents_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_intents
    ADD CONSTRAINT tenant_whatsapp_intents_member_id_foreign FOREIGN KEY (member_id) REFERENCES public.tenant_members(id) ON DELETE SET NULL;


--
-- Name: tenant_whatsapp_intents tenant_whatsapp_intents_source_message_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_intents
    ADD CONSTRAINT tenant_whatsapp_intents_source_message_id_foreign FOREIGN KEY (source_message_id) REFERENCES public.tenant_whatsapp_messages(id) ON DELETE SET NULL;


--
-- Name: tenant_whatsapp_intents tenant_whatsapp_intents_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_intents
    ADD CONSTRAINT tenant_whatsapp_intents_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_whatsapp_media tenant_whatsapp_media_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_media
    ADD CONSTRAINT tenant_whatsapp_media_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_whatsapp_messages tenant_whatsapp_messages_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_messages
    ADD CONSTRAINT tenant_whatsapp_messages_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_whatsapp_notifications tenant_whatsapp_notifications_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_notifications
    ADD CONSTRAINT tenant_whatsapp_notifications_member_id_foreign FOREIGN KEY (member_id) REFERENCES public.tenant_members(id) ON DELETE SET NULL;


--
-- Name: tenant_whatsapp_notifications tenant_whatsapp_notifications_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_notifications
    ADD CONSTRAINT tenant_whatsapp_notifications_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenant_whatsapp_settings tenant_whatsapp_settings_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenant_whatsapp_settings
    ADD CONSTRAINT tenant_whatsapp_settings_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- Name: tenants tenants_owner_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_owner_user_id_foreign FOREIGN KEY (owner_user_id) REFERENCES public.users(id);


--
-- Name: wallet_wishes wallet_wishes_approved_by_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_wishes
    ADD CONSTRAINT wallet_wishes_approved_by_member_id_foreign FOREIGN KEY (approved_by_member_id) REFERENCES public.tenant_members(id) ON DELETE SET NULL;


--
-- Name: wallet_wishes wallet_wishes_goal_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_wishes
    ADD CONSTRAINT wallet_wishes_goal_id_foreign FOREIGN KEY (goal_id) REFERENCES public.finance_savings_goals(id) ON DELETE SET NULL;


--
-- Name: wallet_wishes wallet_wishes_owner_member_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_wishes
    ADD CONSTRAINT wallet_wishes_owner_member_id_foreign FOREIGN KEY (owner_member_id) REFERENCES public.tenant_members(id) ON DELETE SET NULL;


--
-- Name: wallet_wishes wallet_wishes_tenant_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wallet_wishes
    ADD CONSTRAINT wallet_wishes_tenant_id_foreign FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict eZfNB39JFfYyikRcVizuNIJcUa4m2qKsIxcXuzjYhCpnmaLyhMg2jaoibHC8XDt

--
-- PostgreSQL database dump
--

\restrict Aal3RmjC1ImAeu7i6Yde3aLrJMSEEtRniQ83DcSo9YOq6Ep3cbzQfKghq5CgGlp

-- Dumped from database version 14.22 (Ubuntu 14.22-0ubuntu0.22.04.1)
-- Dumped by pg_dump version 14.22 (Ubuntu 14.22-0ubuntu0.22.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.migrations (id, migration, batch) FROM stdin;
1	2014_10_12_000000_create_users_table	1
2	2014_10_12_100000_create_password_reset_tokens_table	1
3	2019_08_19_000000_create_failed_jobs_table	1
4	2019_12_14_000001_create_personal_access_tokens_table	1
5	2026_03_27_081924_create_permission_tables	1
6	2026_03_27_100000_create_tenants_table	1
7	2026_03_27_100100_create_tenant_members_table	1
8	2026_03_27_100200_create_tenant_member_links_table	1
9	2026_03_27_100300_create_tenant_invitations_table	1
10	2026_03_27_100400_create_activity_logs_table	1
11	2026_03_27_100500_create_tenant_notifications_table	1
12	2026_03_27_100600_create_idempotency_keys_table	1
13	2026_03_27_110000_add_is_superadmin_to_users_table	1
14	2026_03_27_170000_add_ui_preferences_to_users_table	1
15	2026_03_27_180000_add_profile_fields_to_users_table	1
16	2026_03_27_181000_add_metadata_to_roles_table	1
17	2026_03_27_190000_enforce_single_tenant_membership	1
18	2026_03_28_090000_add_security_fields_to_users_table	1
19	2026_03_28_090100_create_social_accounts_table	1
20	2026_03_28_120000_add_note_to_tenant_invitations_table	1
21	2026_03_28_120100_create_tenant_whatsapp_tables	1
22	2026_03_29_090100_add_whatsapp_jid_and_contacts	1
23	2026_03_29_130000_add_hybrid_member_onboarding_fields	1
24	2026_03_30_010000_add_profile_branding_fields_to_tenants_table	1
25	2026_03_30_011000_backfill_tenant_settings_permissions	1
26	2026_03_31_120000_enforce_unique_connected_jid_on_tenant_whatsapp_settings	1
27	2026_04_01_044508_add_performance_indexes_to_tenant_tables	1
28	2026_04_02_100000_create_tenant_currencies_table	1
29	2026_04_02_100100_create_tenant_uom_table	1
30	2026_04_02_100200_create_tenant_categories_table	1
31	2026_04_02_100300_create_tenant_attachments_table	1
32	2026_04_02_100400_create_tenant_tags_table	1
33	2026_04_02_100500_create_tenant_recurring_rules_table	1
34	2026_04_02_100600_create_finance_transactions_table	1
35	2026_04_02_215233_normalize_master_data_unique_indexes_for_soft_deletes	1
36	2026_04_02_230825_add_is_active_to_tenant_tags	1
37	2026_04_02_233000_fix_tenant_taggables_polymorphic_id	1
38	2026_04_02_233100_fix_tenant_attachments_polymorphic_id	1
39	2026_04_03_090000_create_tenant_bank_accounts_table	1
40	2026_04_03_090100_create_tenant_budgets_table	1
41	2026_04_03_090200_add_finance_v2_fields_to_finance_transactions_table	1
42	2026_04_04_120000_create_tenant_whatsapp_intents_tables	1
43	2026_04_04_150000_add_ai_raw_response_to_tenant_whatsapp_intents_table	1
44	2026_04_05_000000_add_processing_fields_to_tenant_attachments_table	1
45	2026_04_06_010000_create_finance_pockets_table	1
46	2026_04_06_010100_add_pocket_id_to_finance_transactions_table	1
47	2026_04_06_020000_upgrade_wallet_architecture	1
48	2026_04_06_030000_create_wallet_wishes_table	1
49	2026_04_06_030100_drop_target_amount_from_finance_pockets_table	1
50	2026_04_06_040000_add_description_to_tenant_categories_table	1
51	2026_04_06_050000_add_pocket_id_to_tenant_budgets_table	1
52	2026_04_07_010000_add_default_budget_id_to_finance_pockets_table	1
53	2026_04_07_020000_add_budget_lock_enabled_to_finance_pockets_table	1
54	2026_04_07_030000_add_budget_key_to_tenant_budgets_table	1
55	2026_04_07_030100_add_default_budget_key_to_finance_pockets_table	1
56	2026_04_07_040000_create_finance_month_reviews_table	1
57	2026_04_07_050000_add_purpose_type_to_finance_pockets_table	1
58	2026_04_07_205930_add_background_color_to_finance_pockets_table	1
59	2026_04_08_120000_create_finance_goal_activities_table	1
60	2026_04_08_143937_add_can_view_indexes_for_access_control	1
61	2026_04_08_150000_drop_finance_goal_activities_table	1
62	2026_04_08_180000_adjust_activity_logs_foreign_keys	1
63	2026_04_08_210000_normalize_legacy_shared_wallet_types	1
64	2026_04_09_031053_add_performance_indexes_to_finance_tables	2
65	2026_04_06_010000_create_finance_wallets_table	3
66	2026_04_09_170000_migrate_pockets_to_wallets	4
67	2018_08_08_100000_create_telescope_entries_table	5
68	2026_04_15_120000_create_games_and_queue_tables	5
\.


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.migrations_id_seq', 68, true);


--
-- PostgreSQL database dump complete
--

\unrestrict Aal3RmjC1ImAeu7i6Yde3aLrJMSEEtRniQ83DcSo9YOq6Ep3cbzQfKghq5CgGlp

