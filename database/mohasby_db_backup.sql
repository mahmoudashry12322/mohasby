--
-- PostgreSQL database dump
--

\restrict H1UTaNgDjk2MonhpDRkAEsMDoidNltied5VtdfAVD2xauh6vpw3RSLmtHAY4FX9

-- Dumped from database version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)

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

ALTER TABLE IF EXISTS ONLY public.accounts DROP CONSTRAINT IF EXISTS "accounts_companyId_parentCode_fkey";
ALTER TABLE IF EXISTS ONLY public.accounts DROP CONSTRAINT IF EXISTS "accounts_companyId_fkey";
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_companyId_fkey";
ALTER TABLE IF EXISTS ONLY public."StockMovement" DROP CONSTRAINT IF EXISTS "StockMovement_itemId_companyId_fkey";
ALTER TABLE IF EXISTS ONLY public."Session" DROP CONSTRAINT IF EXISTS "Session_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Sequence" DROP CONSTRAINT IF EXISTS "Sequence_companyId_fkey";
ALTER TABLE IF EXISTS ONLY public."Register" DROP CONSTRAINT IF EXISTS "Register_companyId_fkey";
ALTER TABLE IF EXISTS ONLY public."JournalLine" DROP CONSTRAINT IF EXISTS "JournalLine_entryId_companyId_fkey";
ALTER TABLE IF EXISTS ONLY public."JournalLine" DROP CONSTRAINT IF EXISTS "JournalLine_companyId_accountCode_fkey";
ALTER TABLE IF EXISTS ONLY public."JournalEntry" DROP CONSTRAINT IF EXISTS "JournalEntry_companyId_fkey";
ALTER TABLE IF EXISTS ONLY public."FiscalPeriod" DROP CONSTRAINT IF EXISTS "FiscalPeriod_companyId_fkey";
ALTER TABLE IF EXISTS ONLY public."AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_companyId_fkey";
DROP TRIGGER IF EXISTS journal_line_balance ON public."JournalLine";
DROP TRIGGER IF EXISTS journal_header_balance ON public."JournalEntry";
DROP INDEX IF EXISTS public."accounts_companyId_parentCode_idx";
DROP INDEX IF EXISTS public."accounts_companyId_level_idx";
DROP INDEX IF EXISTS public."accounts_companyId_code_key";
DROP INDEX IF EXISTS public."accounts_companyId_accountClass_idx";
DROP INDEX IF EXISTS public."User_username_key";
DROP INDEX IF EXISTS public."User_email_key";
DROP INDEX IF EXISTS public."User_companyId_idx";
DROP INDEX IF EXISTS public."StockMovement_companyId_requestKey_key";
DROP INDEX IF EXISTS public."StockMovement_companyId_itemId_warehouse_date_idx";
DROP INDEX IF EXISTS public."Session_expiresAt_idx";
DROP INDEX IF EXISTS public."Register_id_companyId_key";
DROP INDEX IF EXISTS public."Register_companyId_kind_isActive_idx";
DROP INDEX IF EXISTS public."Register_companyId_kind_code_key";
DROP INDEX IF EXISTS public."JournalLine_companyId_party_idx";
DROP INDEX IF EXISTS public."JournalLine_companyId_costCenter_idx";
DROP INDEX IF EXISTS public."JournalLine_companyId_accountCode_idx";
DROP INDEX IF EXISTS public."JournalEntry_reversalOf_key";
DROP INDEX IF EXISTS public."JournalEntry_id_companyId_key";
DROP INDEX IF EXISTS public."JournalEntry_companyId_status_date_idx";
DROP INDEX IF EXISTS public."JournalEntry_companyId_requestKey_key";
DROP INDEX IF EXISTS public."JournalEntry_companyId_number_key";
DROP INDEX IF EXISTS public."InventoryClose_companyId_date_key";
DROP INDEX IF EXISTS public."FiscalPeriod_companyId_name_key";
DROP INDEX IF EXISTS public."AuditLog_companyId_createdAt_idx";
ALTER TABLE IF EXISTS ONLY public.companies DROP CONSTRAINT IF EXISTS companies_pkey;
ALTER TABLE IF EXISTS ONLY public.accounts DROP CONSTRAINT IF EXISTS accounts_pkey;
ALTER TABLE IF EXISTS ONLY public._prisma_migrations DROP CONSTRAINT IF EXISTS _prisma_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE IF EXISTS ONLY public."StockMovement" DROP CONSTRAINT IF EXISTS "StockMovement_pkey";
ALTER TABLE IF EXISTS ONLY public."Session" DROP CONSTRAINT IF EXISTS "Session_pkey";
ALTER TABLE IF EXISTS ONLY public."Sequence" DROP CONSTRAINT IF EXISTS "Sequence_pkey";
ALTER TABLE IF EXISTS ONLY public."Register" DROP CONSTRAINT IF EXISTS "Register_pkey";
ALTER TABLE IF EXISTS ONLY public."LoginAttempt" DROP CONSTRAINT IF EXISTS "LoginAttempt_pkey";
ALTER TABLE IF EXISTS ONLY public."JournalLine" DROP CONSTRAINT IF EXISTS "JournalLine_pkey";
ALTER TABLE IF EXISTS ONLY public."JournalEntry" DROP CONSTRAINT IF EXISTS "JournalEntry_pkey";
ALTER TABLE IF EXISTS ONLY public."InventoryClose" DROP CONSTRAINT IF EXISTS "InventoryClose_pkey";
ALTER TABLE IF EXISTS ONLY public."FiscalPeriod" DROP CONSTRAINT IF EXISTS "FiscalPeriod_pkey";
ALTER TABLE IF EXISTS ONLY public."AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_pkey";
ALTER TABLE IF EXISTS public.companies ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.accounts ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE IF EXISTS public.companies_id_seq;
DROP TABLE IF EXISTS public.companies;
DROP SEQUENCE IF EXISTS public.accounts_id_seq;
DROP TABLE IF EXISTS public.accounts;
DROP TABLE IF EXISTS public._prisma_migrations;
DROP TABLE IF EXISTS public."User";
DROP TABLE IF EXISTS public."StockMovement";
DROP TABLE IF EXISTS public."Session";
DROP TABLE IF EXISTS public."Sequence";
DROP TABLE IF EXISTS public."Register";
DROP TABLE IF EXISTS public."LoginAttempt";
DROP TABLE IF EXISTS public."JournalLine";
DROP TABLE IF EXISTS public."JournalEntry";
DROP TABLE IF EXISTS public."InventoryClose";
DROP TABLE IF EXISTS public."FiscalPeriod";
DROP TABLE IF EXISTS public."AuditLog";
DROP FUNCTION IF EXISTS public.check_posted_entry_balance();
--
-- Name: check_posted_entry_balance(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.check_posted_entry_balance() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE target_id text; target_status text; debit_total numeric; credit_total numeric; line_count integer;
BEGIN
  IF TG_TABLE_NAME = 'JournalEntry' THEN
    target_id := NEW.id;
  ELSE
    IF TG_OP = 'DELETE' THEN target_id := OLD."entryId";
    ELSE target_id := NEW."entryId"; END IF;
  END IF;
  SELECT status INTO target_status FROM "JournalEntry" WHERE id = target_id;
  IF target_status = 'POSTED' THEN
    SELECT COALESCE(SUM(debit),0), COALESCE(SUM(credit),0), COUNT(*) INTO debit_total,credit_total,line_count FROM "JournalLine" WHERE "entryId" = target_id;
    IF debit_total <> credit_total OR debit_total <= 0 OR line_count < 2 THEN
      RAISE EXCEPTION 'Posted journal must balance and have at least two positive lines';
    END IF;
  END IF;
  RETURN NULL;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "companyId" integer NOT NULL,
    "userId" text NOT NULL,
    action text NOT NULL,
    "entityId" text NOT NULL,
    detail jsonb DEFAULT '{}'::jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: FiscalPeriod; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."FiscalPeriod" (
    id text NOT NULL,
    "companyId" integer NOT NULL,
    name text NOT NULL,
    start date NOT NULL,
    "end" date NOT NULL,
    "isClosed" boolean DEFAULT false NOT NULL,
    CONSTRAINT period_valid_dates CHECK ((start <= "end"))
);


--
-- Name: InventoryClose; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."InventoryClose" (
    id text NOT NULL,
    "companyId" integer NOT NULL,
    date date NOT NULL,
    snapshots jsonb NOT NULL,
    "entryId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: JournalEntry; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."JournalEntry" (
    id text NOT NULL,
    "companyId" integer NOT NULL,
    number integer NOT NULL,
    date date NOT NULL,
    description text NOT NULL,
    kind text DEFAULT 'GENERAL'::text NOT NULL,
    document text DEFAULT ''::text NOT NULL,
    reference text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'DRAFT'::text NOT NULL,
    "createdBy" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "postedAt" timestamp(3) without time zone,
    "postedBy" text,
    "reversalOf" text,
    "requestKey" text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT entry_valid_status CHECK ((status = ANY (ARRAY['DRAFT'::text, 'POSTED'::text, 'VOID'::text])))
);


--
-- Name: JournalLine; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."JournalLine" (
    id text NOT NULL,
    "entryId" text NOT NULL,
    "companyId" integer NOT NULL,
    "accountCode" text NOT NULL,
    debit numeric(18,2) DEFAULT 0 NOT NULL,
    credit numeric(18,2) DEFAULT 0 NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    party text DEFAULT ''::text NOT NULL,
    "costCenter" text DEFAULT ''::text NOT NULL,
    "costType" text DEFAULT ''::text NOT NULL,
    "costItem" text DEFAULT ''::text NOT NULL,
    season text DEFAULT ''::text NOT NULL,
    farm text DEFAULT ''::text NOT NULL,
    pivot text DEFAULT ''::text NOT NULL,
    "cashFlow" text DEFAULT ''::text NOT NULL,
    CONSTRAINT journal_line_positive_one_side CHECK ((((debit > (0)::numeric) AND (credit = (0)::numeric)) OR ((credit > (0)::numeric) AND (debit = (0)::numeric))))
);


--
-- Name: LoginAttempt; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LoginAttempt" (
    key text NOT NULL,
    count integer DEFAULT 1 NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Register; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Register" (
    id text NOT NULL,
    "companyId" integer NOT NULL,
    kind text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Sequence; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Sequence" (
    "companyId" integer NOT NULL,
    key text NOT NULL,
    value integer DEFAULT 0 NOT NULL
);


--
-- Name: Session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Session" (
    "tokenHash" text NOT NULL,
    "userId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: StockMovement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."StockMovement" (
    id text NOT NULL,
    "companyId" integer NOT NULL,
    "itemId" text NOT NULL,
    warehouse text NOT NULL,
    date date NOT NULL,
    direction integer NOT NULL,
    quantity numeric(18,3) NOT NULL,
    "unitCost" numeric(18,6) NOT NULL,
    value numeric(18,2) NOT NULL,
    kind text NOT NULL,
    reference text NOT NULL,
    "entryId" text,
    "requestKey" text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT stock_positive_quantity CHECK (((quantity > (0)::numeric) AND ("unitCost" >= (0)::numeric) AND (value >= (0)::numeric) AND (direction = ANY (ARRAY['-1'::integer, 1]))))
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    "companyId" integer NOT NULL,
    email text,
    name text NOT NULL,
    "passwordHash" text NOT NULL,
    role text DEFAULT 'accountant'::text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    username text,
    permissions jsonb DEFAULT '[]'::jsonb NOT NULL,
    CONSTRAINT user_valid_role CHECK ((role = ANY (ARRAY['admin'::text, 'accountant'::text, 'auditor'::text])))
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id integer NOT NULL,
    "companyId" integer NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    "nameEn" text,
    "accountClass" text NOT NULL,
    "mainGroup" text,
    "subGroup" text,
    nature text NOT NULL,
    "statementType" text NOT NULL,
    level integer NOT NULL,
    "parentCode" text,
    "isGroup" boolean DEFAULT false NOT NULL,
    "isSystem" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    balance numeric(15,2) DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "cashFlow" text
);


--
-- Name: accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.accounts_id_seq OWNED BY public.accounts.id;


--
-- Name: companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.companies (
    id integer NOT NULL,
    name text DEFAULT 'الشركة الافتراضية'::text NOT NULL,
    "taxNumber" text,
    "commercialReg" text,
    currency text DEFAULT 'EGP'::text NOT NULL,
    "isDefault" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "closedThrough" date
);


--
-- Name: companies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.companies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: companies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.companies_id_seq OWNED BY public.companies.id;


--
-- Name: accounts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts ALTER COLUMN id SET DEFAULT nextval('public.accounts_id_seq'::regclass);


--
-- Name: companies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies ALTER COLUMN id SET DEFAULT nextval('public.companies_id_seq'::regclass);


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AuditLog" (id, "companyId", "userId", action, "entityId", detail, "createdAt") FROM stdin;
cmuwt16yk0045ki5ljotddijx	3	cmuwt13mj0001kiqug37q0fwg	ENTRY_CREATED	cmuwt16y10040ki5lt22fch05	{}	2026-10-06 14:59:22.364
cmuwt175x0047ki5lde65p4mj	3	cmuwt13mj0001kiqug37q0fwg	ENTRY_POSTED	cmuwt16y10040ki5lt22fch05	{}	2026-10-06 14:59:22.629
cmuwt17az004eki5ls7klfgvw	3	cmuwt13mj0001kiqug37q0fwg	ENTRY_CREATED_POSTED	cmuwt17ap0049ki5l3w6szkp3	{}	2026-10-06 14:59:22.811
cmuwt17bd004gki5lddkg3y59	3	cmuwt13mj0001kiqug37q0fwg	ENTRY_REVERSED	cmuwt16y10040ki5lt22fch05	{"reversalId": "cmuwt17ap0049ki5l3w6szkp3"}	2026-10-06 14:59:22.825
cmuwt17f5004kki5lwovwo6vi	3	cmuwt13mj0001kiqug37q0fwg	REGISTER_SAVED	cmuwt17f0004iki5lpu5vqlpz	{"code": "W_QA_MAIN", "kind": "warehouses"}	2026-10-06 14:59:22.961
cmuwt17gv004oki5l9j59ek1n	3	cmuwt13mj0001kiqug37q0fwg	REGISTER_SAVED	cmuwt17gs004mki5ldgzwhpy8	{"code": "SUPP_QA", "kind": "parties"}	2026-10-06 14:59:23.024
cmuwt17ib004ski5lqgx6zuiu	3	cmuwt13mj0001kiqug37q0fwg	REGISTER_SAVED	cmuwt17i8004qki5lkuig740t	{"code": "CUST_QA", "kind": "parties"}	2026-10-06 14:59:23.076
cmuwt17ka004wki5lc5qzp9ye	3	cmuwt13mj0001kiqug37q0fwg	REGISTER_SAVED	cmuwt17k6004uki5ligwyyf0z	{"code": "ITEM_QA_ALPHA", "kind": "items"}	2026-10-06 14:59:23.146
cmuwt17m50050ki5lcwtrc691	3	cmuwt13mj0001kiqug37q0fwg	PERIOD_CREATED	cmuwt17m0004yki5lpds6x0ul	{}	2026-10-06 14:59:23.213
cmuwt17os0057ki5lpku5uvq8	3	cmuwt13mj0001kiqug37q0fwg	ENTRY_CREATED_POSTED	cmuwt17ok0052ki5lo2tl7h8i	{}	2026-10-06 14:59:23.308
cmuwt17pi005bki5lwkau1e4m	3	cmuwt13mj0001kiqug37q0fwg	STOCK_POSTED	cmuwt17ow0059ki5l8b150ar6	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": "cmuwt17ok0052ki5lo2tl7h8i"}	2026-10-06 14:59:23.335
cmuwt17sl005iki5licx528f6	3	cmuwt13mj0001kiqug37q0fwg	ENTRY_CREATED_POSTED	cmuwt17se005dki5lydn1mu4w	{}	2026-10-06 14:59:23.445
cmuwt17t4005mki5l8qbm47ap	3	cmuwt13mj0001kiqug37q0fwg	STOCK_POSTED	cmuwt17so005kki5lhotykprw	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": "cmuwt17se005dki5lydn1mu4w"}	2026-10-06 14:59:23.464
cmuwt17th005oki5luhfz9pe9	3	cmuwt13mj0001kiqug37q0fwg	DOCUMENT_POSTED	cmuwt17so005kki5lhotykprw	{"entryId": "cmuwt17se005dki5lydn1mu4w"}	2026-10-06 14:59:23.478
cmuwt17wd005ski5ldi8oq79z	3	cmuwt13mj0001kiqug37q0fwg	STOCK_POSTED	cmuwt17w3005qki5lw1s18laq	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": null}	2026-10-06 14:59:23.581
cmuwt17xj005zki5layd6rfqq	3	cmuwt13mj0001kiqug37q0fwg	ENTRY_CREATED_POSTED	cmuwt17xd005uki5l7qb6eaa1	{}	2026-10-06 14:59:23.623
cmuwt17xt0061ki5ll2h0o3g0	3	cmuwt13mj0001kiqug37q0fwg	DOCUMENT_POSTED	cmuwt17w3005qki5lw1s18laq	{"entryId": "cmuwt17xd005uki5l7qb6eaa1"}	2026-10-06 14:59:23.634
cmuwt182p0068ki5lqx3hhuuz	3	cmuwt13mj0001kiqug37q0fwg	ENTRY_CREATED_POSTED	cmuwt182i0063ki5lp1ph0b8c	{}	2026-10-06 14:59:23.809
cmuwt182z006bki5lh70dje9f	3	cmuwt13mj0001kiqug37q0fwg	INVENTORY_CLOSED	cmuwt182s0069ki5lef0f2p1q	{"date": "2026-01-31T00:00:00.000Z", "entryId": "cmuwt182i0063ki5lp1ph0b8c"}	2026-10-06 14:59:23.819
cmuwt1835006dki5ltx53wroz	3	cmuwt13mj0001kiqug37q0fwg	PERIOD_CLOSED	cmuwt17m0004yki5lpds6x0ul	{}	2026-10-06 14:59:23.825
cmuwt18c1006kki5l7ogyxpxh	3	cmuwt13mj0001kiqug37q0fwg	ENTRY_CREATED_POSTED	cmuwt18bv006fki5l679nnfs8	{}	2026-10-06 14:59:24.145
cmuwt18cf006oki5lncujl4wo	3	cmuwt13mj0001kiqug37q0fwg	STOCK_POSTED	cmuwt18c4006mki5l7jm4wun1	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": "cmuwt18bv006fki5l679nnfs8"}	2026-10-06 14:59:24.159
cmuwt18co006qki5l22d36jl4	3	cmuwt13mj0001kiqug37q0fwg	DOCUMENT_POSTED	cmuwt18c4006mki5l7jm4wun1	{"entryId": "cmuwt18bv006fki5l679nnfs8"}	2026-10-06 14:59:24.169
cmuwt18qc006xki5lzrktv03o	3	cmuwt13mj0001kiqug37q0fwg	ENTRY_CREATED_POSTED	cmuwt18q6006ski5lftqachod	{}	2026-10-06 14:59:24.66
cmuwt18qo0071ki5lf3ldq8ka	3	cmuwt13mj0001kiqug37q0fwg	STOCK_POSTED	cmuwt18qf006zki5l7zvs51qc	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": "cmuwt18q6006ski5lftqachod"}	2026-10-06 14:59:24.672
cmuwt18qz0073ki5l5urqwpeb	3	cmuwt13mj0001kiqug37q0fwg	DOCUMENT_POSTED	cmuwt18qf006zki5l7zvs51qc	{"entryId": "cmuwt18q6006ski5lftqachod"}	2026-10-06 14:59:24.684
cmuwt191s0077ki5lvnh0j6g3	3	cmuwt13mj0001kiqug37q0fwg	STOCK_POSTED	cmuwt190t0075ki5lx9c93ryp	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": null}	2026-10-06 14:59:25.072
cmuwt192w007eki5ltvxwfbvr	3	cmuwt13mj0001kiqug37q0fwg	ENTRY_CREATED_POSTED	cmuwt192l0079ki5lyhpnzkvn	{}	2026-10-06 14:59:25.111
cmuwt193r007gki5l02aiigjw	3	cmuwt13mj0001kiqug37q0fwg	DOCUMENT_POSTED	cmuwt190t0075ki5lx9c93ryp	{"entryId": "cmuwt192l0079ki5lyhpnzkvn"}	2026-10-06 14:59:25.144
cmuwt19cu007kki5lvwkncbq4	3	cmuwt13mj0001kiqug37q0fwg	STOCK_POSTED	cmuwt19cf007iki5lxj890sg4	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": null}	2026-10-06 14:59:25.47
cmuwt19j4007oki5lohh59nvh	3	cmuwt13mj0001kiqug37q0fwg	STOCK_POSTED	cmuwt19it007mki5l36dmx65m	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": null}	2026-10-06 14:59:25.696
cmuwt19ly007ski5l6sraz10r	3	cmuwt13mj0001kiqug37q0fwg	REGISTER_SAVED	cmuwt19lu007qki5lvmhpmhtz	{"code": "CC_MFG", "kind": "cost-centers"}	2026-10-06 14:59:25.798
cmuwt19nh007wki5loewywko0	3	cmuwt13mj0001kiqug37q0fwg	REGISTER_SAVED	cmuwt19ne007uki5lc5nkphin	{"code": "CC_ANIMAL", "kind": "cost-centers"}	2026-10-06 14:59:25.853
cmuwt19p30080ki5lksh5jqpr	3	cmuwt13mj0001kiqug37q0fwg	REGISTER_SAVED	cmuwt19p0007yki5lg689nzjn	{"code": "CC_FARMING", "kind": "cost-centers"}	2026-10-06 14:59:25.911
cmuwt19qg0084ki5la0t76fdj	3	cmuwt13mj0001kiqug37q0fwg	REGISTER_SAVED	cmuwt19qd0082ki5liei2cwnb	{"code": "CC_EXPORT", "kind": "cost-centers"}	2026-10-06 14:59:25.961
cmuwt19rz0088ki5lhng17fnw	3	cmuwt13mj0001kiqug37q0fwg	REGISTER_SAVED	cmuwt19rw0086ki5lmzk54cj9	{"code": "CC_IMPORT", "kind": "cost-centers"}	2026-10-06 14:59:26.015
cmuwt19u2008gki5lsgapsjeb	3	cmuwt13mj0001kiqug37q0fwg	ENTRY_CREATED	cmuwt19tw008aki5langdb7ss	{}	2026-10-06 14:59:26.09
cmuwt19vs008iki5l1lwnhqcj	3	cmuwt13mj0001kiqug37q0fwg	ENTRY_POSTED	cmuwt19tw008aki5langdb7ss	{}	2026-10-06 14:59:26.152
cmuwt19xo008mki5lctmhql43	3	cmuwt13mj0001kiqug37q0fwg	COST_INPUTS_SAVED	cmuwt19xk008kki5lsis6va1t	{}	2026-10-06 14:59:26.22
cmuwt1a21008uki5lu29u5571	3	cmuwt13mj0001kiqug37q0fwg	ENTRY_CREATED	cmuwt1a1t008oki5lvymb7neb	{}	2026-10-06 14:59:26.377
cmuwt1a3y008wki5laa7dbrgg	3	cmuwt13mj0001kiqug37q0fwg	ENTRY_POSTED	cmuwt1a1t008oki5lvymb7neb	{}	2026-10-06 14:59:26.447
cmuwt1a5a0090ki5lz5lqnp34	3	cmuwt13mj0001kiqug37q0fwg	COST_INPUTS_SAVED	cmuwt1a56008yki5ln4v2y5xa	{}	2026-10-06 14:59:26.494
cmuwt1a9i0097ki5l1wagj7fr	3	cmuwt13mj0001kiqug37q0fwg	ENTRY_CREATED	cmuwt1a9b0092ki5lxoelmfpy	{}	2026-10-06 14:59:26.647
cmuwt1abk0099ki5l6it85tyz	3	cmuwt13mj0001kiqug37q0fwg	ENTRY_POSTED	cmuwt1a9b0092ki5lxoelmfpy	{}	2026-10-06 14:59:26.72
cmuwt1acx009dki5ltnujv9id	3	cmuwt13mj0001kiqug37q0fwg	COST_INPUTS_SAVED	cmuwt1acv009bki5lhzcypiob	{}	2026-10-06 14:59:26.769
cmuwt1ah8009kki5l41dyasv0	3	cmuwt13mj0001kiqug37q0fwg	ENTRY_CREATED	cmuwt1ah2009fki5lvqvlstoz	{}	2026-10-06 14:59:26.924
cmuwt1aj3009mki5l9z59c80w	3	cmuwt13mj0001kiqug37q0fwg	ENTRY_POSTED	cmuwt1ah2009fki5lvqvlstoz	{}	2026-10-06 14:59:26.991
cmuwt1akz009qki5ljprvinyu	3	cmuwt13mj0001kiqug37q0fwg	COST_INPUTS_SAVED	cmuwt1akw009oki5lqa49owd4	{}	2026-10-06 14:59:27.059
cmuwt1ap3009xki5l345usepq	3	cmuwt13mj0001kiqug37q0fwg	ENTRY_CREATED	cmuwt1aoy009ski5l28nzxeu1	{}	2026-10-06 14:59:27.207
cmuwt1aqr009zki5l2txpen08	3	cmuwt13mj0001kiqug37q0fwg	ENTRY_POSTED	cmuwt1aoy009ski5l28nzxeu1	{}	2026-10-06 14:59:27.267
cmuwt1as800a3ki5lj5cequg0	3	cmuwt13mj0001kiqug37q0fwg	COST_INPUTS_SAVED	cmuwt1as500a1ki5l2e6zckmr	{}	2026-10-06 14:59:27.32
cmuwt89tq00anki5lp05z7qs4	4	cmuwt88510001kis7wf5d9848	ENTRY_CREATED	cmuwt89te00aiki5lh4hyshag	{}	2026-10-06 15:04:52.671
cmuwt8a0r00apki5lxn71htv3	4	cmuwt88510001kis7wf5d9848	ENTRY_POSTED	cmuwt89te00aiki5lh4hyshag	{}	2026-10-06 15:04:52.923
cmuwt8a4m00awki5lrip5pm2y	4	cmuwt88510001kis7wf5d9848	ENTRY_CREATED_POSTED	cmuwt8a4g00arki5lt9txrrtk	{}	2026-10-06 15:04:53.062
cmuwt8a4u00ayki5l5kh3em4i	4	cmuwt88510001kis7wf5d9848	ENTRY_REVERSED	cmuwt89te00aiki5lh4hyshag	{"reversalId": "cmuwt8a4g00arki5lt9txrrtk"}	2026-10-06 15:04:53.071
cmuwt8a8w00b2ki5llmahgieh	4	cmuwt88510001kis7wf5d9848	REGISTER_SAVED	cmuwt8a8q00b0ki5lyr5xmssh	{"code": "W_QA_MAIN", "kind": "warehouses"}	2026-10-06 15:04:53.217
cmuwt8aah00b6ki5lc7u4xlvh	4	cmuwt88510001kis7wf5d9848	REGISTER_SAVED	cmuwt8aae00b4ki5lr953i6e4	{"code": "SUPP_QA", "kind": "parties"}	2026-10-06 15:04:53.274
cmuwt8acl00baki5l8iiu6hp4	4	cmuwt88510001kis7wf5d9848	REGISTER_SAVED	cmuwt8ach00b8ki5lzd303dpl	{"code": "CUST_QA", "kind": "parties"}	2026-10-06 15:04:53.35
cmuwt8aeg00beki5ltplkg02h	4	cmuwt88510001kis7wf5d9848	REGISTER_SAVED	cmuwt8aec00bcki5lrave7mlo	{"code": "ITEM_QA_ALPHA", "kind": "items"}	2026-10-06 15:04:53.416
cmuwt8afu00biki5lpqi87xz8	4	cmuwt88510001kis7wf5d9848	PERIOD_CREATED	cmuwt8afr00bgki5l05kjg0z8	{}	2026-10-06 15:04:53.467
cmuwt8aia00bpki5lyue7fk32	4	cmuwt88510001kis7wf5d9848	ENTRY_CREATED_POSTED	cmuwt8ai400bkki5l2efpok1g	{}	2026-10-06 15:04:53.555
cmuwt8aiu00btki5lf4kbgxsd	4	cmuwt88510001kis7wf5d9848	STOCK_POSTED	cmuwt8aid00brki5ly9kfvpan	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": "cmuwt8ai400bkki5l2efpok1g"}	2026-10-06 15:04:53.574
cmuwt8alu00c0ki5lbguqn0qq	4	cmuwt88510001kis7wf5d9848	ENTRY_CREATED_POSTED	cmuwt8aln00bvki5lte5z8jgz	{}	2026-10-06 15:04:53.682
cmuwt8ame00c4ki5lcevg13bm	4	cmuwt88510001kis7wf5d9848	STOCK_POSTED	cmuwt8aly00c2ki5l64amn7lo	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": "cmuwt8aln00bvki5lte5z8jgz"}	2026-10-06 15:04:53.702
cmuwt8amy00c6ki5lxoppzubl	4	cmuwt88510001kis7wf5d9848	DOCUMENT_POSTED	cmuwt8aly00c2ki5l64amn7lo	{"entryId": "cmuwt8aln00bvki5lte5z8jgz"}	2026-10-06 15:04:53.723
cmuwt8apt00caki5lv2x0cftf	4	cmuwt88510001kis7wf5d9848	STOCK_POSTED	cmuwt8aph00c8ki5ldl5gxw3h	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": null}	2026-10-06 15:04:53.826
cmuwt8aqk00chki5l18slav82	4	cmuwt88510001kis7wf5d9848	ENTRY_CREATED_POSTED	cmuwt8aqe00ccki5l63e7asa6	{}	2026-10-06 15:04:53.852
cmuwt8aqv00cjki5lzq9im2v4	4	cmuwt88510001kis7wf5d9848	DOCUMENT_POSTED	cmuwt8aph00c8ki5ldl5gxw3h	{"entryId": "cmuwt8aqe00ccki5l63e7asa6"}	2026-10-06 15:04:53.863
cmuwt8awc00cqki5lj8rxwqj1	4	cmuwt88510001kis7wf5d9848	ENTRY_CREATED_POSTED	cmuwt8aw700clki5l92wfa4sc	{}	2026-10-06 15:04:54.061
cmuwt8awq00ctki5l1ivehodq	4	cmuwt88510001kis7wf5d9848	INVENTORY_CLOSED	cmuwt8awe00crki5l0uxzkl2c	{"date": "2026-01-31T00:00:00.000Z", "entryId": "cmuwt8aw700clki5l92wfa4sc"}	2026-10-06 15:04:54.074
cmuwt8awz00cvki5lo6vbyftz	4	cmuwt88510001kis7wf5d9848	PERIOD_CLOSED	cmuwt8afr00bgki5l05kjg0z8	{}	2026-10-06 15:04:54.084
cmuwt8b4h00d2ki5l8btirvz4	4	cmuwt88510001kis7wf5d9848	ENTRY_CREATED_POSTED	cmuwt8b4a00cxki5lzatlp6bb	{}	2026-10-06 15:04:54.353
cmuwt8b4y00d6ki5lmbix3jns	4	cmuwt88510001kis7wf5d9848	STOCK_POSTED	cmuwt8b4m00d4ki5lion48odg	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": "cmuwt8b4a00cxki5lzatlp6bb"}	2026-10-06 15:04:54.371
cmuwt8b5700d8ki5l6m4gksw2	4	cmuwt88510001kis7wf5d9848	DOCUMENT_POSTED	cmuwt8b4m00d4ki5lion48odg	{"entryId": "cmuwt8b4a00cxki5lzatlp6bb"}	2026-10-06 15:04:54.38
cmuwt8bjt00dfki5lcinfok4g	4	cmuwt88510001kis7wf5d9848	ENTRY_CREATED_POSTED	cmuwt8bjm00daki5l46cwhf05	{}	2026-10-06 15:04:54.906
cmuwt8bk700djki5l9orfaauz	4	cmuwt88510001kis7wf5d9848	STOCK_POSTED	cmuwt8bjx00dhki5lvi10uuu4	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": "cmuwt8bjm00daki5l46cwhf05"}	2026-10-06 15:04:54.919
cmuwt8bki00dlki5l4vrhfhxc	4	cmuwt88510001kis7wf5d9848	DOCUMENT_POSTED	cmuwt8bjx00dhki5lvi10uuu4	{"entryId": "cmuwt8bjm00daki5l46cwhf05"}	2026-10-06 15:04:54.93
cmuwt8bza00dpki5l71rrj8sg	4	cmuwt88510001kis7wf5d9848	STOCK_POSTED	cmuwt8byx00dnki5lkklun423	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": null}	2026-10-06 15:04:55.463
cmuwt8c0600dwki5l2j7uj8fz	4	cmuwt88510001kis7wf5d9848	ENTRY_CREATED_POSTED	cmuwt8bzz00drki5lelu2fbe0	{}	2026-10-06 15:04:55.495
cmuwt8c0j00dyki5lpe92vbjq	4	cmuwt88510001kis7wf5d9848	DOCUMENT_POSTED	cmuwt8byx00dnki5lkklun423	{"entryId": "cmuwt8bzz00drki5lelu2fbe0"}	2026-10-06 15:04:55.507
cmuwt8c7m00e2ki5ljfu71pio	4	cmuwt88510001kis7wf5d9848	STOCK_POSTED	cmuwt8c7d00e0ki5lyw4hjsvo	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": null}	2026-10-06 15:04:55.762
cmuwt8cd000e6ki5lvp1idq36	4	cmuwt88510001kis7wf5d9848	STOCK_POSTED	cmuwt8ccq00e4ki5l84wo8y3d	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": null}	2026-10-06 15:04:55.956
cmuwrar2l0006ki5lxh469fj3	2	cmuwqcrgn0001ki7yhg5tm3kh	ENTRY_CREATED	cmuwrar260001ki5ll6kzh8vl	{}	2026-10-06 14:10:49.101
cmuwrardr0008ki5lgxpexzbo	2	cmuwqcrgn0001ki7yhg5tm3kh	ENTRY_POSTED	cmuwrar260001ki5ll6kzh8vl	{}	2026-10-06 14:10:49.503
cmuwrariq000fki5ldipwahos	2	cmuwqcrgn0001ki7yhg5tm3kh	ENTRY_CREATED_POSTED	cmuwrarib000aki5lojrj5a5a	{}	2026-10-06 14:10:49.682
cmuwrarj9000hki5l0hpbsm5w	2	cmuwqcrgn0001ki7yhg5tm3kh	ENTRY_REVERSED	cmuwrar260001ki5ll6kzh8vl	{"reversalId": "cmuwrarib000aki5lojrj5a5a"}	2026-10-06 14:10:49.699
cmuwrarp5000lki5lssc2xwh8	2	cmuwqcrgn0001ki7yhg5tm3kh	REGISTER_SAVED	cmuwrarp0000jki5l40587sc9	{"code": "W_QA_MAIN", "kind": "warehouses"}	2026-10-06 14:10:49.913
cmuwrarrc000pki5leoxuczzm	2	cmuwqcrgn0001ki7yhg5tm3kh	REGISTER_SAVED	cmuwrarr7000nki5lump3oy4v	{"code": "SUPP_QA", "kind": "parties"}	2026-10-06 14:10:49.993
cmuwrartv000tki5lcgkk0089	2	cmuwqcrgn0001ki7yhg5tm3kh	REGISTER_SAVED	cmuwrartr000rki5lsgq1favy	{"code": "CUST_QA", "kind": "parties"}	2026-10-06 14:10:50.084
cmuwrarwd000xki5lq04pl5as	2	cmuwqcrgn0001ki7yhg5tm3kh	REGISTER_SAVED	cmuwrarw4000vki5ly1957qgi	{"code": "ITEM_QA_ALPHA", "kind": "items"}	2026-10-06 14:10:50.173
cmuwraryx0011ki5l5lsx9ih1	2	cmuwqcrgn0001ki7yhg5tm3kh	PERIOD_CREATED	cmuwraryu000zki5lf2x5l3m8	{}	2026-10-06 14:10:50.266
cmuwras3c0018ki5la80zs8q7	2	cmuwqcrgn0001ki7yhg5tm3kh	ENTRY_CREATED_POSTED	cmuwras360013ki5lnz5rbehq	{}	2026-10-06 14:10:50.425
cmuwras3y001cki5lyno0e6ci	2	cmuwqcrgn0001ki7yhg5tm3kh	STOCK_POSTED	cmuwras3g001aki5lsdxo5v4r	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": "cmuwras360013ki5lnz5rbehq"}	2026-10-06 14:10:50.447
cmuwras7b001jki5lak77tpjg	2	cmuwqcrgn0001ki7yhg5tm3kh	ENTRY_CREATED_POSTED	cmuwras75001eki5ltiazhypv	{}	2026-10-06 14:10:50.567
cmuwras7o001nki5l7kgg4s7z	2	cmuwqcrgn0001ki7yhg5tm3kh	STOCK_POSTED	cmuwras7e001lki5lm6n07rbu	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": "cmuwras75001eki5ltiazhypv"}	2026-10-06 14:10:50.58
cmuwras82001pki5lsc6gkq2o	2	cmuwqcrgn0001ki7yhg5tm3kh	DOCUMENT_POSTED	cmuwras7e001lki5lm6n07rbu	{"entryId": "cmuwras75001eki5ltiazhypv"}	2026-10-06 14:10:50.594
cmuwrasbc001tki5lvbpjgwdt	2	cmuwqcrgn0001ki7yhg5tm3kh	STOCK_POSTED	cmuwrasb0001rki5lx8x9gjx9	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": null}	2026-10-06 14:10:50.712
cmuwrascg0020ki5l7tys9vco	2	cmuwqcrgn0001ki7yhg5tm3kh	ENTRY_CREATED_POSTED	cmuwrasc7001vki5l5tkg0n85	{}	2026-10-06 14:10:50.752
cmuwrascw0022ki5l5yk84r7t	2	cmuwqcrgn0001ki7yhg5tm3kh	DOCUMENT_POSTED	cmuwrasb0001rki5lx8x9gjx9	{"entryId": "cmuwrasc7001vki5l5tkg0n85"}	2026-10-06 14:10:50.769
cmuwrasio0029ki5l7zpcb195	2	cmuwqcrgn0001ki7yhg5tm3kh	ENTRY_CREATED_POSTED	cmuwrasig0024ki5l8ai4sgli	{}	2026-10-06 14:10:50.976
cmuwrasj0002cki5ldcvh7vdd	2	cmuwqcrgn0001ki7yhg5tm3kh	INVENTORY_CLOSED	cmuwrasis002aki5lnpmw9y4z	{"date": "2026-01-31T00:00:00.000Z", "entryId": "cmuwrasig0024ki5l8ai4sgli"}	2026-10-06 14:10:50.989
cmuwrasj7002eki5lybtvjyv6	2	cmuwqcrgn0001ki7yhg5tm3kh	PERIOD_CLOSED	cmuwraryu000zki5lf2x5l3m8	{}	2026-10-06 14:10:50.995
cmuwrasre002lki5lyo7pn72l	2	cmuwqcrgn0001ki7yhg5tm3kh	ENTRY_CREATED_POSTED	cmuwrasr8002gki5lnh1dkcrw	{}	2026-10-06 14:10:51.29
cmuwrasrt002pki5lk5ii96vz	2	cmuwqcrgn0001ki7yhg5tm3kh	STOCK_POSTED	cmuwrasrh002nki5lh1jorvow	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": "cmuwrasr8002gki5lnh1dkcrw"}	2026-10-06 14:10:51.305
cmuwrass0002rki5lk19wl0lf	2	cmuwqcrgn0001ki7yhg5tm3kh	DOCUMENT_POSTED	cmuwrasrh002nki5lh1jorvow	{"entryId": "cmuwrasr8002gki5lnh1dkcrw"}	2026-10-06 14:10:51.312
cmuwrat0t002yki5lq610mmrw	2	cmuwqcrgn0001ki7yhg5tm3kh	ENTRY_CREATED_POSTED	cmuwrat0m002tki5ldccowhjt	{}	2026-10-06 14:10:51.63
cmuwrat190032ki5l3lk7dvot	2	cmuwqcrgn0001ki7yhg5tm3kh	STOCK_POSTED	cmuwrat0x0030ki5la5mgfrht	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": "cmuwrat0m002tki5ldccowhjt"}	2026-10-06 14:10:51.645
cmuwrat1k0034ki5lifvhraxt	2	cmuwqcrgn0001ki7yhg5tm3kh	DOCUMENT_POSTED	cmuwrat0x0030ki5la5mgfrht	{"entryId": "cmuwrat0m002tki5ldccowhjt"}	2026-10-06 14:10:51.656
cmuwrat480038ki5l2ru1kt52	2	cmuwqcrgn0001ki7yhg5tm3kh	STOCK_POSTED	cmuwrat3x0036ki5lx1x6ejol	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": null}	2026-10-06 14:10:51.753
cmuwrat56003fki5llctzoyjd	2	cmuwqcrgn0001ki7yhg5tm3kh	ENTRY_CREATED_POSTED	cmuwrat4x003aki5lle3rq003	{}	2026-10-06 14:10:51.787
cmuwrat5m003hki5louhdy4tk	2	cmuwqcrgn0001ki7yhg5tm3kh	DOCUMENT_POSTED	cmuwrat3x0036ki5lx1x6ejol	{"entryId": "cmuwrat4x003aki5lle3rq003"}	2026-10-06 14:10:51.803
cmuwrat8b003lki5lltekjgh9	2	cmuwqcrgn0001ki7yhg5tm3kh	STOCK_POSTED	cmuwrat82003jki5l4dqtdfdu	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": null}	2026-10-06 14:10:51.899
cmuwratan003pki5lvmbypkf9	2	cmuwqcrgn0001ki7yhg5tm3kh	STOCK_POSTED	cmuwratac003nki5l9xdowtf2	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": null}	2026-10-06 14:10:51.983
cmuwraxrx003wki5l6p1iuk6g	2	cmuwqcrgn0001ki7yhg5tm3kh	ENTRY_CREATED	cmuwraxre003rki5lwavikn7c	{}	2026-10-06 14:10:57.789
cmuwray1g003yki5lf4rg748e	2	cmuwqcrgn0001ki7yhg5tm3kh	ENTRY_POSTED	cmuwraxre003rki5lwavikn7c	{}	2026-10-06 14:10:58.132
cmuwt1gem00aaki5lymksj23d	3	cmuwt13mj0001kiqug37q0fwg	ENTRY_CREATED	cmuwt1ge100a5ki5l2hopaj4g	{}	2026-10-06 14:59:34.607
cmuwt1gox00acki5l82hbp2ho	3	cmuwt13mj0001kiqug37q0fwg	ENTRY_POSTED	cmuwt1ge100a5ki5l2hopaj4g	{}	2026-10-06 14:59:34.977
cmuwt1o0100agki5llawfnmry	3	cmuwt13mj0001kiqug37q0fwg	REGISTER_SAVED	cmuwt1nzl00aeki5l6nfveva4	{"code": "CC_UI_6935", "kind": "cost-centers"}	2026-10-06 14:59:44.45
cmuwt8cfz00eaki5lpnmeo7se	4	cmuwt88510001kis7wf5d9848	REGISTER_SAVED	cmuwt8cfv00e8ki5lkrhel434	{"code": "CC_MFG", "kind": "cost-centers"}	2026-10-06 15:04:56.063
cmuwt8ch600eeki5l1ytbcbz6	4	cmuwt88510001kis7wf5d9848	REGISTER_SAVED	cmuwt8ch200ecki5l8vf0kkin	{"code": "CC_ANIMAL", "kind": "cost-centers"}	2026-10-06 15:04:56.107
cmuwt8cji00eiki5l781cjdu9	4	cmuwt88510001kis7wf5d9848	REGISTER_SAVED	cmuwt8cii00egki5lqlx2gau5	{"code": "CC_FARMING", "kind": "cost-centers"}	2026-10-06 15:04:56.191
cmuwt8cl600emki5lmwtw8w5p	4	cmuwt88510001kis7wf5d9848	REGISTER_SAVED	cmuwt8cl400ekki5l1d3p6gpv	{"code": "CC_EXPORT", "kind": "cost-centers"}	2026-10-06 15:04:56.251
cmuwt8cmq00eqki5llurghvn3	4	cmuwt88510001kis7wf5d9848	REGISTER_SAVED	cmuwt8cmn00eoki5l00j8pbbg	{"code": "CC_IMPORT", "kind": "cost-centers"}	2026-10-06 15:04:56.307
cmuwt8coz00eyki5ljz5jrnug	4	cmuwt88510001kis7wf5d9848	ENTRY_CREATED	cmuwt8cot00eski5lbmvy3lol	{}	2026-10-06 15:04:56.387
cmuwt8cqo00f0ki5l3xhejgi0	4	cmuwt88510001kis7wf5d9848	ENTRY_POSTED	cmuwt8cot00eski5lbmvy3lol	{}	2026-10-06 15:04:56.448
cmuwt8cs100f4ki5ldyydb0ys	4	cmuwt88510001kis7wf5d9848	COST_INPUTS_SAVED	cmuwt8crx00f2ki5lvu3d2638	{}	2026-10-06 15:04:56.498
cmuwt8cvp00fcki5ljme2mckl	4	cmuwt88510001kis7wf5d9848	ENTRY_CREATED	cmuwt8cvj00f6ki5lst28gw4k	{}	2026-10-06 15:04:56.629
cmuwt8cxj00feki5lg7daak12	4	cmuwt88510001kis7wf5d9848	ENTRY_POSTED	cmuwt8cvj00f6ki5lst28gw4k	{}	2026-10-06 15:04:56.695
cmuwt8cyz00fiki5lfoq8yh2n	4	cmuwt88510001kis7wf5d9848	COST_INPUTS_SAVED	cmuwt8cyw00fgki5ljbiqp1yu	{}	2026-10-06 15:04:56.748
cmuwt8d3000fpki5l7wr1zpq2	4	cmuwt88510001kis7wf5d9848	ENTRY_CREATED	cmuwt8d2v00fkki5lzjmo18ae	{}	2026-10-06 15:04:56.893
cmuwt8d4u00frki5lc3fk6rem	4	cmuwt88510001kis7wf5d9848	ENTRY_POSTED	cmuwt8d2v00fkki5lzjmo18ae	{}	2026-10-06 15:04:56.958
cmuwt8d6k00fvki5l3uopf07e	4	cmuwt88510001kis7wf5d9848	COST_INPUTS_SAVED	cmuwt8d6g00ftki5lniwr3nga	{}	2026-10-06 15:04:57.02
cmuwt8dbi00g2ki5lsyeok1ur	4	cmuwt88510001kis7wf5d9848	ENTRY_CREATED	cmuwt8dbb00fxki5l5tjx9e15	{}	2026-10-06 15:04:57.198
cmuwt8ddf00g4ki5l5znw0bbe	4	cmuwt88510001kis7wf5d9848	ENTRY_POSTED	cmuwt8dbb00fxki5l5tjx9e15	{}	2026-10-06 15:04:57.267
cmuwt8dfe00g8ki5l4z03j51t	4	cmuwt88510001kis7wf5d9848	COST_INPUTS_SAVED	cmuwt8dfa00g6ki5lzp1aod45	{}	2026-10-06 15:04:57.338
cmuwt8dja00gfki5la91pm6b1	4	cmuwt88510001kis7wf5d9848	ENTRY_CREATED	cmuwt8dj400gaki5l7f2n4n7b	{}	2026-10-06 15:04:57.478
cmuwt8dlb00ghki5lwg1vdgn2	4	cmuwt88510001kis7wf5d9848	ENTRY_POSTED	cmuwt8dj400gaki5l7f2n4n7b	{}	2026-10-06 15:04:57.551
cmuwt8dmt00glki5li6l0lqn2	4	cmuwt88510001kis7wf5d9848	COST_INPUTS_SAVED	cmuwt8dmq00gjki5l8xt11li9	{}	2026-10-06 15:04:57.605
cmuwt8k1l00gski5ldu4job8a	4	cmuwt88510001kis7wf5d9848	ENTRY_CREATED	cmuwt8k1200gnki5lzeodi9g0	{}	2026-10-06 15:05:05.913
cmuwt8kit00guki5lt0sfneow	4	cmuwt88510001kis7wf5d9848	ENTRY_POSTED	cmuwt8k1200gnki5lzeodi9g0	{}	2026-10-06 15:05:06.533
cmuwt8qxz00gyki5l2es7pjwj	4	cmuwt88510001kis7wf5d9848	COST_INPUTS_SAVED	cmuwt8qxh00gwki5l6cqg2zfq	{}	2026-10-06 15:05:14.855
cmuwt8s8c00h2ki5lkoqtmsm6	4	cmuwt88510001kis7wf5d9848	REGISTER_SAVED	cmuwt8s8700h0ki5lo9mo20qp	{"code": "CC_UI_9455", "kind": "cost-centers"}	2026-10-06 15:05:16.524
cmuwtbp1i00h6ki5l7nlsa5g9	1	cmuwok27k0001ki1rehhhla33	REGISTER_SAVED	cmuwtbp0w00h4ki5lt3hr2uq0	{"code": "CC_TEST_1950", "kind": "cost-centers"}	2026-10-06 15:07:32.358
cmuwtc51u00haki5lvmnu9oq6	1	cmuwok27k0001ki1rehhhla33	REGISTER_SAVED	cmuwtc51o00h8ki5lri6n40k2	{"code": "CC_TEST_2838", "kind": "cost-centers"}	2026-10-06 15:07:53.106
cmuwtekga00heki5lko3ovp9u	1	cmuwok27k0001ki1rehhhla33	REGISTER_SAVED	cmuwtekg600hcki5loervctj5	{"code": "CC_PLAY_1", "kind": "cost-centers"}	2026-10-06 15:09:46.379
cmuwtfugb00hlki5lncvxv71x	5	cmuwtfsow0001kikpsl4btz0e	ENTRY_CREATED	cmuwtfug100hgki5lvt2p4dio	{}	2026-10-06 15:10:45.996
cmuwtfunl00hnki5l0uoj4oy3	5	cmuwtfsow0001kikpsl4btz0e	ENTRY_POSTED	cmuwtfug100hgki5lvt2p4dio	{}	2026-10-06 15:10:46.258
cmuwtfusi00huki5lnkvrhvol	5	cmuwtfsow0001kikpsl4btz0e	ENTRY_CREATED_POSTED	cmuwtfus900hpki5lhyfp9mwm	{}	2026-10-06 15:10:46.434
cmuwtfust00hwki5lo6pjihst	5	cmuwtfsow0001kikpsl4btz0e	ENTRY_REVERSED	cmuwtfug100hgki5lvt2p4dio	{"reversalId": "cmuwtfus900hpki5lhyfp9mwm"}	2026-10-06 15:10:46.445
cmuwtfux500i0ki5lkavyk57n	5	cmuwtfsow0001kikpsl4btz0e	REGISTER_SAVED	cmuwtfuwx00hyki5l8x4xxpte	{"code": "W_QA_MAIN", "kind": "warehouses"}	2026-10-06 15:10:46.601
cmuwtfuzi00i4ki5lwpwpbfyn	5	cmuwtfsow0001kikpsl4btz0e	REGISTER_SAVED	cmuwtfuz900i2ki5l490t8zjm	{"code": "SUPP_QA", "kind": "parties"}	2026-10-06 15:10:46.686
cmuwtfv1400i8ki5l58s06xv9	5	cmuwtfsow0001kikpsl4btz0e	REGISTER_SAVED	cmuwtfv1100i6ki5l5spmquwv	{"code": "CUST_QA", "kind": "parties"}	2026-10-06 15:10:46.744
cmuwtfv2q00icki5l3l1w0oi9	5	cmuwtfsow0001kikpsl4btz0e	REGISTER_SAVED	cmuwtfv2n00iaki5lu8onv5dm	{"code": "ITEM_QA_ALPHA", "kind": "items"}	2026-10-06 15:10:46.802
cmuwtfv3y00igki5lt82x8f4w	5	cmuwtfsow0001kikpsl4btz0e	PERIOD_CREATED	cmuwtfv3u00ieki5lsgjgfdjc	{}	2026-10-06 15:10:46.846
cmuwtfv6p00inki5lv8ad98uq	5	cmuwtfsow0001kikpsl4btz0e	ENTRY_CREATED_POSTED	cmuwtfv6h00iiki5l0e1qqgav	{}	2026-10-06 15:10:46.945
cmuwtfv7f00irki5lo70nlhw6	5	cmuwtfsow0001kikpsl4btz0e	STOCK_POSTED	cmuwtfv6v00ipki5lx2g8obuu	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": "cmuwtfv6h00iiki5l0e1qqgav"}	2026-10-06 15:10:46.971
cmuwtfvbk00iyki5l6izr270y	5	cmuwtfsow0001kikpsl4btz0e	ENTRY_CREATED_POSTED	cmuwtfvbd00itki5l4nxr3q9q	{}	2026-10-06 15:10:47.121
cmuwtfvc900j2ki5lv1ip7okv	5	cmuwtfsow0001kikpsl4btz0e	STOCK_POSTED	cmuwtfvbo00j0ki5lo48cn1m1	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": "cmuwtfvbd00itki5l4nxr3q9q"}	2026-10-06 15:10:47.145
cmuwtfvcl00j4ki5lp98xqjjz	5	cmuwtfsow0001kikpsl4btz0e	DOCUMENT_POSTED	cmuwtfvbo00j0ki5lo48cn1m1	{"entryId": "cmuwtfvbd00itki5l4nxr3q9q"}	2026-10-06 15:10:47.157
cmuwtfvf800j8ki5l42iibh1c	5	cmuwtfsow0001kikpsl4btz0e	STOCK_POSTED	cmuwtfvew00j6ki5lssx1uopc	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": null}	2026-10-06 15:10:47.252
cmuwtfvg200jfki5l5lzzu9oh	5	cmuwtfsow0001kikpsl4btz0e	ENTRY_CREATED_POSTED	cmuwtfvfv00jaki5lvs0b92rg	{}	2026-10-06 15:10:47.283
cmuwtfvgf00jhki5l224nq853	5	cmuwtfsow0001kikpsl4btz0e	DOCUMENT_POSTED	cmuwtfvew00j6ki5lssx1uopc	{"entryId": "cmuwtfvfv00jaki5lvs0b92rg"}	2026-10-06 15:10:47.295
cmuwtfvkj00joki5lwkgm8vpx	5	cmuwtfsow0001kikpsl4btz0e	ENTRY_CREATED_POSTED	cmuwtfvkc00jjki5lmpv2nzrn	{}	2026-10-06 15:10:47.444
cmuwtfvku00jrki5lw8ylspx7	5	cmuwtfsow0001kikpsl4btz0e	INVENTORY_CLOSED	cmuwtfvkn00jpki5layofkqqi	{"date": "2026-01-31T00:00:00.000Z", "entryId": "cmuwtfvkc00jjki5lmpv2nzrn"}	2026-10-06 15:10:47.454
cmuwtfvl100jtki5lfliz5wm8	5	cmuwtfsow0001kikpsl4btz0e	PERIOD_CLOSED	cmuwtfv3u00ieki5lsgjgfdjc	{}	2026-10-06 15:10:47.461
cmuwtfvse00k0ki5llmdx4mcx	5	cmuwtfsow0001kikpsl4btz0e	ENTRY_CREATED_POSTED	cmuwtfvs600jvki5lu1l4fce0	{}	2026-10-06 15:10:47.727
cmuwtfvsy00k4ki5ljusnr4jx	5	cmuwtfsow0001kikpsl4btz0e	STOCK_POSTED	cmuwtfvsh00k2ki5lu7b4z29r	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": "cmuwtfvs600jvki5lu1l4fce0"}	2026-10-06 15:10:47.746
cmuwtfvtb00k6ki5lfgigdf18	5	cmuwtfsow0001kikpsl4btz0e	DOCUMENT_POSTED	cmuwtfvsh00k2ki5lu7b4z29r	{"entryId": "cmuwtfvs600jvki5lu1l4fce0"}	2026-10-06 15:10:47.759
cmuwtfw8400kdki5lajr8dz5a	5	cmuwtfsow0001kikpsl4btz0e	ENTRY_CREATED_POSTED	cmuwtfw7s00k8ki5lvz0edxal	{}	2026-10-06 15:10:48.292
cmuwtfw8n00khki5l9amrzbp4	5	cmuwtfsow0001kikpsl4btz0e	STOCK_POSTED	cmuwtfw8800kfki5l8mlo2cnv	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": "cmuwtfw7s00k8ki5lvz0edxal"}	2026-10-06 15:10:48.311
cmuwtfw9200kjki5lhhky3jen	5	cmuwtfsow0001kikpsl4btz0e	DOCUMENT_POSTED	cmuwtfw8800kfki5l8mlo2cnv	{"entryId": "cmuwtfw7s00k8ki5lvz0edxal"}	2026-10-06 15:10:48.327
cmuwtfwjv00knki5l1o15bbdn	5	cmuwtfsow0001kikpsl4btz0e	STOCK_POSTED	cmuwtfwjf00klki5lr1e151vr	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": null}	2026-10-06 15:10:48.716
cmuwtfwkp00kuki5l5redq4as	5	cmuwtfsow0001kikpsl4btz0e	ENTRY_CREATED_POSTED	cmuwtfwkj00kpki5l9hczi4uc	{}	2026-10-06 15:10:48.745
cmuwtfwl100kwki5lu5jei4wl	5	cmuwtfsow0001kikpsl4btz0e	DOCUMENT_POSTED	cmuwtfwjf00klki5lr1e151vr	{"entryId": "cmuwtfwkj00kpki5l9hczi4uc"}	2026-10-06 15:10:48.757
cmuwtfwre00l0ki5lets1ml16	5	cmuwtfsow0001kikpsl4btz0e	STOCK_POSTED	cmuwtfwr000kyki5l4ci9teo5	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": null}	2026-10-06 15:10:48.987
cmuwtfwwe00l4ki5lc4b4gybv	5	cmuwtfsow0001kikpsl4btz0e	STOCK_POSTED	cmuwtfww400l2ki5l6g6s22lb	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": null}	2026-10-06 15:10:49.166
cmuwtfwzt00l8ki5l73sjrkyg	5	cmuwtfsow0001kikpsl4btz0e	REGISTER_SAVED	cmuwtfwzn00l6ki5lcxv3r8rr	{"code": "CC_MFG", "kind": "cost-centers"}	2026-10-06 15:10:49.289
cmuwtfx1k00lcki5lhrzaz72h	5	cmuwtfsow0001kikpsl4btz0e	REGISTER_SAVED	cmuwtfx1f00laki5la16d0bx9	{"code": "CC_ANIMAL", "kind": "cost-centers"}	2026-10-06 15:10:49.352
cmuwtfx3g00lgki5lswzl6dwc	5	cmuwtfsow0001kikpsl4btz0e	REGISTER_SAVED	cmuwtfx3700leki5ldlybtkdd	{"code": "CC_FARMING", "kind": "cost-centers"}	2026-10-06 15:10:49.42
cmuwtfx4o00lkki5lvj5hc2t1	5	cmuwtfsow0001kikpsl4btz0e	REGISTER_SAVED	cmuwtfx4l00liki5lll2xlj91	{"code": "CC_EXPORT", "kind": "cost-centers"}	2026-10-06 15:10:49.464
cmuwtfx5v00loki5lkpavftyg	5	cmuwtfsow0001kikpsl4btz0e	REGISTER_SAVED	cmuwtfx5s00lmki5lr5zc0vte	{"code": "CC_IMPORT", "kind": "cost-centers"}	2026-10-06 15:10:49.507
cmuwtfx8500lwki5lepbly6v7	5	cmuwtfsow0001kikpsl4btz0e	ENTRY_CREATED	cmuwtfx7v00lqki5l1xrjink7	{}	2026-10-06 15:10:49.589
cmuwtfxa400lyki5lhrbus355	5	cmuwtfsow0001kikpsl4btz0e	ENTRY_POSTED	cmuwtfx7v00lqki5l1xrjink7	{}	2026-10-06 15:10:49.661
cmuwtfxbo00m2ki5lahhc80lo	5	cmuwtfsow0001kikpsl4btz0e	COST_INPUTS_SAVED	cmuwtfxbi00m0ki5lq815hojk	{}	2026-10-06 15:10:49.716
cmuwtfxfn00maki5lkr2b1v0o	5	cmuwtfsow0001kikpsl4btz0e	ENTRY_CREATED	cmuwtfxfh00m4ki5ltzluq82l	{}	2026-10-06 15:10:49.859
cmuwtfxhk00mcki5ltyjy6tae	5	cmuwtfsow0001kikpsl4btz0e	ENTRY_POSTED	cmuwtfxfh00m4ki5ltzluq82l	{}	2026-10-06 15:10:49.928
cmuwtfxj800mgki5ligkhp20w	5	cmuwtfsow0001kikpsl4btz0e	COST_INPUTS_SAVED	cmuwtfxj500meki5lim2geu85	{}	2026-10-06 15:10:49.988
cmuwtfxnr00mnki5lscy3lxt6	5	cmuwtfsow0001kikpsl4btz0e	ENTRY_CREATED	cmuwtfxnl00miki5ltmu5atar	{}	2026-10-06 15:10:50.151
cmuwtfxpt00mpki5lrgre5kcc	5	cmuwtfsow0001kikpsl4btz0e	ENTRY_POSTED	cmuwtfxnl00miki5ltmu5atar	{}	2026-10-06 15:10:50.225
cmuwtfxrk00mtki5lgdvgrrgj	5	cmuwtfsow0001kikpsl4btz0e	COST_INPUTS_SAVED	cmuwtfxrf00mrki5lhxbtl9sh	{}	2026-10-06 15:10:50.289
cmuwtfxwe00n0ki5lr8oqt3vv	5	cmuwtfsow0001kikpsl4btz0e	ENTRY_CREATED	cmuwtfxw800mvki5ljau2ehix	{}	2026-10-06 15:10:50.462
cmuwtfxz900n2ki5lm3to8sm3	5	cmuwtfsow0001kikpsl4btz0e	ENTRY_POSTED	cmuwtfxw800mvki5ljau2ehix	{}	2026-10-06 15:10:50.565
cmuwtfy0r00n6ki5lzg3n0e9m	5	cmuwtfsow0001kikpsl4btz0e	COST_INPUTS_SAVED	cmuwtfy0n00n4ki5lhol9vt1p	{}	2026-10-06 15:10:50.619
cmuwtfy4s00ndki5li0qd8kzk	5	cmuwtfsow0001kikpsl4btz0e	ENTRY_CREATED	cmuwtfy4l00n8ki5ldckra65n	{}	2026-10-06 15:10:50.764
cmuwtfy6e00nfki5lg3n4er74	5	cmuwtfsow0001kikpsl4btz0e	ENTRY_POSTED	cmuwtfy4l00n8ki5ldckra65n	{}	2026-10-06 15:10:50.823
cmuwtfy7n00njki5l1cmdwo68	5	cmuwtfsow0001kikpsl4btz0e	COST_INPUTS_SAVED	cmuwtfy7k00nhki5l3vsz1628	{}	2026-10-06 15:10:50.867
cmuwtg1um00nqki5lxuikwcxx	5	cmuwtfsow0001kikpsl4btz0e	ENTRY_CREATED	cmuwtg1tn00nlki5lpfpreory	{}	2026-10-06 15:10:55.582
cmuwtg22r00nski5lqj6gb9hh	5	cmuwtfsow0001kikpsl4btz0e	ENTRY_POSTED	cmuwtg1tn00nlki5lpfpreory	{}	2026-10-06 15:10:55.876
cmuwtg8oo00nwki5lb834ge4j	5	cmuwtfsow0001kikpsl4btz0e	COST_INPUTS_SAVED	cmuwtg8oj00nuki5lyj1tli30	{}	2026-10-06 15:11:04.44
cmuwtg9oq00o0ki5lszv1i7a7	5	cmuwtfsow0001kikpsl4btz0e	REGISTER_SAVED	cmuwtg9om00nyki5ltpe5cpz7	{"code": "CC_UI_2846", "kind": "cost-centers"}	2026-10-06 15:11:05.739
cmv0784tb0003kiwy3uxahdm5	1	cmuwok27k0001ki1rehhhla33	REGISTER_SAVED	cmv0784sz0001kiwyxjcah7vq	{"code": "011", "kind": "employees"}	2026-10-08 23:59:59.328
cmv078mhi0007kiwyq2tzz6n8	1	cmuwok27k0001ki1rehhhla33	REGISTER_SAVED	cmv0784sz0001kiwyxjcah7vq	{"code": "011", "kind": "employees"}	2026-10-09 00:00:22.231
cmv6yk1jx0006ki805dnuyv1v	8	cmv6yjnp90001kizs7pidlu0v	ENTRY_CREATED	cmv6yk1i20001ki80zvkk5xqp	{}	2026-10-13 17:31:41.661
cmv6yk22n0008ki809us673h5	8	cmv6yjnp90001kizs7pidlu0v	ENTRY_POSTED	cmv6yk1i20001ki80zvkk5xqp	{}	2026-10-13 17:31:42.335
cmv6ymg1j000fki80owl9nvy1	9	cmv6ym40q0001kiedfd0vt38l	ENTRY_CREATED	cmv6ymg18000aki80fsm8kdhu	{}	2026-10-13 17:33:33.751
cmv6ymgbx000hki807kk1bmpl	9	cmv6ym40q0001kiedfd0vt38l	ENTRY_POSTED	cmv6ymg18000aki80fsm8kdhu	{}	2026-10-13 17:33:34.126
cmv6ymhb0000lki80b8ibqnys	9	cmv6ym40q0001kiedfd0vt38l	REGISTER_SAVED	cmv6ymhai000jki80ujwi7pvz	{"code": "EMP_1791912796789", "kind": "employees"}	2026-10-13 17:33:35.389
cmv6yoopa000ski804fotc0hd	10	cmv6yo6qj0001kiw4wefq3jsw	ENTRY_CREATED	cmv6yoop0000nki80zsmlsgrx	{}	2026-10-13 17:35:18.286
cmv6yopbg000uki80g9mo4bmg	10	cmv6yo6qj0001kiw4wefq3jsw	ENTRY_POSTED	cmv6yoop0000nki80zsmlsgrx	{}	2026-10-13 17:35:19.084
cmv6yoqvs000yki801gzwhhyz	10	cmv6yo6qj0001kiw4wefq3jsw	REGISTER_SAVED	cmv6yoqvm000wki80hwsmu4t5	{"code": "EMP_1791912894001", "kind": "employees"}	2026-10-13 17:35:21.113
cmv6yorhk0012ki80s0g92kxb	10	cmv6yo6qj0001kiw4wefq3jsw	REGISTER_SAVED	cmv6yoqvm000wki80hwsmu4t5	{"code": "EMP_1791912894001", "kind": "employees"}	2026-10-13 17:35:21.897
cmv6yorvb0019ki801iba651b	10	cmv6yo6qj0001kiw4wefq3jsw	ENTRY_CREATED_POSTED	cmv6yoruz0014ki80kghc1b0w	{}	2026-10-13 17:35:22.392
cmv6yorwm001dki80vxp4vok4	10	cmv6yo6qj0001kiw4wefq3jsw	STOCK_POSTED	cmv6yorve001bki80bxrmbc1z	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": "cmv6yoruz0014ki80kghc1b0w"}	2026-10-13 17:35:22.438
cmv6yossr001hki80h33ni1jw	10	cmv6yo6qj0001kiw4wefq3jsw	COST_INPUTS_SAVED	cmv6yossj001fki80o7gq7wrk	{}	2026-10-13 17:35:23.596
cmvaftyot0003kic8pa4gr647	19	cmv77bo3o0003kio3j3za86nt	REGISTER_SAVED	cmvaftynx0001kic8yz0hfzfr	{"code": "TRAIN-W01", "kind": "warehouses", "name": "مهزن التدريب", "actorName": "محمود عشري", "actorRole": "admin", "actorUsername": "mahmoud_training"}	2026-10-16 03:58:36.51
cmvaj170q0006kixh0w7v6x2i	19	cmv77bo3o0003kio3j3za86nt	ENTRY_CREATED_POSTED	cmvaj16ys0001kixh47scsg1f	{"actorName": "محمود عشري", "actorRole": "admin", "actorUsername": "mahmoud_training"}	2026-10-16 05:28:12.747
cmvaj1721000akixhstvhueol	19	cmv77bo3o0003kio3j3za86nt	STOCK_POSTED	cmvaj171d0008kixhnhwsn4of	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": "cmvaj16ys0001kixh47scsg1f", "actorName": "محمود عشري", "actorRole": "admin", "actorUsername": "mahmoud_training"}	2026-10-16 05:28:12.793
cmv8gx6uk0001kiyuy39j25i8	19	cmv77bo3o0003kio3j3za86nt	USER_UPDATED	cmv8cq58t0001kio67wg0j48m	{"role": "accountant", "isActive": true, "actorName": "محمود عشري", "actorRole": "admin", "targetName": "Mahmoud Mansour", "actorUsername": "mahmoud_training", "passwordReset": false, "targetUsername": "mahmoud", "permissionsCount": 0}	2026-10-14 18:53:34.316
cmv8zu3on000jkiyu3w9zoh8d	19	cmv77bo3o0003kio3j3za86nt	ENTRY_CREATED_POSTED	cmv8zu3oa000ekiyuxap4d0b3	{"actorName": "محمود عشري", "actorRole": "admin", "actorUsername": "mahmoud_training"}	2026-10-15 03:43:02.952
cmv8zu3ox000lkiyu9cc4wmck	19	cmv77bo3o0003kio3j3za86nt	ENTRY_REVERSED	cmv8zq8i60005kiyu2ct6oo32	{"actorName": "محمود عشري", "actorRole": "admin", "reversalId": "cmv8zu3oa000ekiyuxap4d0b3", "actorUsername": "mahmoud_training"}	2026-10-15 03:43:02.961
cmv909c9b000skiyuhx09bao3	19	cmv77bo3o0003kio3j3za86nt	ENTRY_CREATED	cmv909c8u000nkiyu7bg8ohrb	{"actorName": "محمود عشري", "actorRole": "admin", "actorUsername": "mahmoud_training"}	2026-10-15 03:54:53.904
cmvage7to0007kic8h67vq4q4	19	cmv77bo3o0003kio3j3za86nt	REGISTER_SAVED	cmvage7ta0005kic8udpmd7lj	{"code": "tran01", "kind": "items", "name": "صنف تدريب", "actorName": "محمود عشري", "actorRole": "admin", "actorUsername": "mahmoud_training"}	2026-10-16 04:14:21.468
cmvao067x0003kidhnmu88d8e	19	cmv77bo3o0003kio3j3za86nt	STOCK_POSTED	cmvao065t0001kidh2yiaw8wb	{"method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": null, "actorName": "محمود عشري", "actorRole": "admin", "actorUsername": "mahmoud_training"}	2026-10-16 07:47:23.134
cmv8zo9680003kiyuvs9s8z9y	19	cmv77bo3o0003kio3j3za86nt	USER_UPDATED	cmv8cq58t0001kio67wg0j48m	{"role": "accountant", "isActive": true, "actorName": "محمود عشري", "actorRole": "admin", "targetName": "Mahmoud Mansour", "actorUsername": "mahmoud_training", "passwordReset": false, "targetUsername": "mahmoud", "permissionsCount": 2}	2026-10-15 03:38:30.126
cmv77p37u0003kitjtxyysn10	19	cmv77bo3o0003kio3j3za86nt	REGISTER_SAVED	cmv77p37l0001kitj3ira4t9l	{"code": "TRAIN-C01", "kind": "parties", "name": "عميل التدريب", "actorName": "محمود عشري", "actorRole": "admin", "actorUsername": "mahmoud_training"}	2026-10-13 21:47:33.643
cmv77s11o0007kitjrm6ol8yp	19	cmv77bo3o0003kio3j3za86nt	REGISTER_SAVED	cmv77p37l0001kitj3ira4t9l	{"code": "TRAIN-C01", "kind": "parties", "name": "عميل التدريب", "actorName": "محمود عشري", "actorRole": "admin", "actorUsername": "mahmoud_training"}	2026-10-13 21:49:50.796
cmv77uhrg000bkitjjyg5xwsn	19	cmv77bo3o0003kio3j3za86nt	REGISTER_SAVED	cmv77uhp90009kitja9ycsihh	{"code": "TRAIN-S01", "kind": "parties", "name": "مورد التدريب", "actorName": "محمود عشري", "actorRole": "admin", "actorUsername": "mahmoud_training"}	2026-10-13 21:51:45.773
cmv77v6gl000fkitj6zgllz8q	19	cmv77bo3o0003kio3j3za86nt	REGISTER_SAVED	cmv77p37l0001kitj3ira4t9l	{"code": "TRAIN-C01", "kind": "parties", "name": "عميل التدريب", "actorName": "محمود عشري", "actorRole": "admin", "actorUsername": "mahmoud_training"}	2026-10-13 21:52:17.782
cmv7874ra0003kib8x3vkocm6	19	cmv77bo3o0003kio3j3za86nt	REGISTER_SAVED	cmv77uhp90009kitja9ycsihh	{"code": "TRAIN-S01", "kind": "parties", "name": "مورد التدريب", "actorName": "محمود عشري", "actorRole": "admin", "actorUsername": "mahmoud_training"}	2026-10-13 22:01:35.446
cmv78fy8d000akib8dqbdmcmh	19	cmv77bo3o0003kio3j3za86nt	ENTRY_CREATED	cmv78fy7e0005kib8r90dk547	{"actorName": "محمود عشري", "actorRole": "admin", "actorUsername": "mahmoud_training"}	2026-10-13 22:08:26.894
cmv78mj57000ckib8ntzjl2jt	19	cmv77bo3o0003kio3j3za86nt	ENTRY_POSTED	cmv78fy7e0005kib8r90dk547	{"actorName": "محمود عشري", "actorRole": "admin", "actorUsername": "mahmoud_training"}	2026-10-13 22:13:33.931
cmv78ukiy000jkib8o9ir11zs	19	cmv77bo3o0003kio3j3za86nt	ENTRY_CREATED	cmv78ukfv000ekib8yimklmwq	{"actorName": "محمود عشري", "actorRole": "admin", "actorUsername": "mahmoud_training"}	2026-10-13 22:19:48.97
cmv78v3u50001kireyh7o90p0	19	cmv77bo3o0003kio3j3za86nt	ENTRY_POSTED	cmv78ukfv000ekib8yimklmwq	{"actorName": "محمود عشري", "actorRole": "admin", "actorUsername": "mahmoud_training"}	2026-10-13 22:20:13.997
cmv792zf80006kixqyfudc81v	19	cmv77bo3o0003kio3j3za86nt	ENTRY_CREATED	cmv792zbh0001kixqzhtrq19c	{"actorName": "محمود عشري", "actorRole": "admin", "actorUsername": "mahmoud_training"}	2026-10-13 22:26:21.524
cmv909r7w000ukiyuhxj53hlq	19	cmv77bo3o0003kio3j3za86nt	ENTRY_VOIDED	cmv909c8u000nkiyu7bg8ohrb	{"actorName": "محمود عشري", "actorRole": "admin", "actorUsername": "mahmoud_training"}	2026-10-15 03:55:13.292
cmv90cxth0007kidaxue5xojs	51	cmv90cxpl0000kida58ojzj9e	ENTRY_CREATED	cmv90cxt10002kidacpjay6x2	{"actorName": "cmv90cxpl0000kida58ojzj9e", "actorRole": "admin", "actorUsername": ""}	2026-10-15 03:57:41.814
cmv90cxva0009kida10ivg2sg	51	cmv90cxpl0000kida58ojzj9e	ENTRY_POSTED	cmv90cxt10002kidacpjay6x2	{"actorName": "cmv90cxpl0000kida58ojzj9e", "actorRole": "admin", "actorUsername": ""}	2026-10-15 03:57:41.879
cmv90cy51000gkidaum57g8x3	51	cmv90cxpl0000kida58ojzj9e	ENTRY_CREATED	cmv90cy4j000bkida5kwywvfy	{"actorName": "cmv90cxpl0000kida58ojzj9e", "actorRole": "admin", "actorUsername": ""}	2026-10-15 03:57:42.229
cmv90cy7l000ikidaldk14uju	51	cmv90cxpl0000kida58ojzj9e	ENTRY_POSTED	cmv90cy4j000bkida5kwywvfy	{"actorName": "cmv90cxpl0000kida58ojzj9e", "actorRole": "admin", "actorUsername": ""}	2026-10-15 03:57:42.321
cmvapx1g30003kib788su71x4	19	cmv77bo3o0003kio3j3za86nt	REGISTER_SAVED	cmvapx1fs0001kib7yp8ea06c	{"code": "TRAIN-W02", "kind": "warehouses", "name": "مخزن اختبار فارغ", "actorName": "محمود عشري", "actorRole": "admin", "actorUsername": "mahmoud_training"}	2026-10-16 08:40:56.212
cmv7935y50008kixq2ftgomqv	19	cmv77bo3o0003kio3j3za86nt	ENTRY_POSTED	cmv792zbh0001kixqzhtrq19c	{"actorName": "محمود عشري", "actorRole": "admin", "actorUsername": "mahmoud_training"}	2026-10-13 22:26:29.982
cmv79hlxz0006kiksbg8tlkch	19	cmv77bo3o0003kio3j3za86nt	ENTRY_CREATED	cmv79hlxf0001kiksk03xhf4v	{"actorName": "محمود عشري", "actorRole": "admin", "actorUsername": "mahmoud_training"}	2026-10-13 22:37:43.895
cmv79hozm0008kiksf3x7d855	19	cmv77bo3o0003kio3j3za86nt	ENTRY_POSTED	cmv79hlxf0001kiksk03xhf4v	{"actorName": "محمود عشري", "actorRole": "admin", "actorUsername": "mahmoud_training"}	2026-10-13 22:37:47.842
cmv79u90h000fkiksiqu8zhi4	19	cmv77bo3o0003kio3j3za86nt	ENTRY_CREATED	cmv79u8zz000akikstgvar3nm	{"actorName": "محمود عشري", "actorRole": "admin", "actorUsername": "mahmoud_training"}	2026-10-13 22:47:33.666
cmv79ub7n000hkiksdusqbxow	19	cmv77bo3o0003kio3j3za86nt	ENTRY_POSTED	cmv79u8zz000akikstgvar3nm	{"actorName": "محمود عشري", "actorRole": "admin", "actorUsername": "mahmoud_training"}	2026-10-13 22:47:36.515
cmv7d1wzg000okikshdvvocee	19	cmv77bo3o0003kio3j3za86nt	ENTRY_CREATED	cmv7d1wyb000jkiksrk0385dg	{"actorName": "محمود عشري", "actorRole": "admin", "actorUsername": "mahmoud_training"}	2026-10-14 00:17:30.172
cmv7d2gp4000qkiks61oq7qy9	19	cmv77bo3o0003kio3j3za86nt	ENTRY_POSTED	cmv7d1wyb000jkiksrk0385dg	{"actorName": "محمود عشري", "actorRole": "admin", "actorUsername": "mahmoud_training"}	2026-10-14 00:17:55.72
cmv7krrn4000xkikstq0xm035	19	cmv77bo3o0003kio3j3za86nt	ENTRY_CREATED	cmv7krrmn000skiksf8gx036w	{"actorName": "محمود عشري", "actorRole": "admin", "actorUsername": "mahmoud_training"}	2026-10-14 03:53:33.616
cmv7krufq000zkiksvusbvjzn	19	cmv77bo3o0003kio3j3za86nt	ENTRY_POSTED	cmv7krrmn000skiksf8gx036w	{"actorName": "محمود عشري", "actorRole": "admin", "actorUsername": "mahmoud_training"}	2026-10-14 03:53:37.239
cmv7llwao0016kikspo7k3bxy	19	cmv77bo3o0003kio3j3za86nt	ENTRY_CREATED	cmv7llwaa0011kikszh5hzn1a	{"actorName": "محمود عشري", "actorRole": "admin", "actorUsername": "mahmoud_training"}	2026-10-14 04:16:59.329
cmv7lm0pl0018kiks6zu5klug	19	cmv77bo3o0003kio3j3za86nt	ENTRY_POSTED	cmv7llwaa0011kikszh5hzn1a	{"actorName": "محمود عشري", "actorRole": "admin", "actorUsername": "mahmoud_training"}	2026-10-14 04:17:05.049
cmv8zq8jm000akiyurhuc37px	19	cmv8cq58t0001kio67wg0j48m	ENTRY_CREATED	cmv8zq8i60005kiyu2ct6oo32	{"actorName": "Mahmoud Mansour", "actorRole": "accountant", "actorUsername": "mahmoud"}	2026-10-15 03:40:02.627
cmvb970im000ekib70dif8xec	19	cmv77bo3o0003kio3j3za86nt	ENTRY_CREATED	cmvb970i00009kib7kuh4kf6s	{"actorName": "محمود عشري", "actorRole": "admin", "actorUsername": "mahmoud_training"}	2026-10-16 17:40:34.27
cmv8zrelr000ckiyu4ql5pjbt	19	cmv77bo3o0003kio3j3za86nt	ENTRY_POSTED	cmv8zq8i60005kiyu2ct6oo32	{"actorName": "محمود عشري", "actorRole": "admin", "actorUsername": "mahmoud_training"}	2026-10-15 03:40:57.136
cmvb97d2g000gkib75oomi5jy	19	cmv77bo3o0003kio3j3za86nt	ENTRY_POSTED	cmvb970i00009kib7kuh4kf6s	{"actorName": "محمود عشري", "actorRole": "admin", "actorUsername": "mahmoud_training"}	2026-10-16 17:40:50.537
cmv8cq5970003kio6doadv59z	19	cmv77bo3o0003kio3j3za86nt	USER_CREATED	cmv8cq58t0001kio67wg0j48m	{"role": "accountant", "actorName": "محمود عشري", "actorRole": "admin", "createdName": "Mahmoud Mansour", "actorUsername": "mahmoud_training", "createdUsername": "mahnmoud", "permissionsCount": 1}	2026-10-14 16:56:07.195
cmvapyyut0007kib740ci1336	19	cmv77bo3o0003kio3j3za86nt	STOCK_POSTED	cmvapyyua0005kib7sz1fff31	{"date": "2026-10-16", "kind": "ISSUE", "unit": "kg", "itemId": "cmvage7ta0005kic8udpmd7lj", "method": "PERIODIC_WEIGHTED_AVERAGE", "entryId": null, "itemCode": "tran01", "itemName": "صنف تدريب", "quantity": "10", "actorName": "محمود عشري", "actorRole": "admin", "reference": "", "warehouse": "TRAIN-W01", "movementId": "cmvapyyua0005kib7sz1fff31", "actorUsername": "mahmoud_training", "warehouseName": "مهزن التدريب", "valuationMethod": "متوسط تكلفة الفترة", "hasImmediateEntry": false}	2026-10-16 08:42:26.165
cmvb9bkh2000ikib7x0lbd1i0	19	cmv77bo3o0003kio3j3za86nt	USER_UPDATED	cmv8cq58t0001kio67wg0j48m	{"role": "accountant", "isActive": true, "actorName": "محمود عشري", "actorRole": "admin", "targetName": "Mahmoud Mansour", "actorUsername": "mahmoud_training", "passwordReset": false, "targetUsername": "mahmoud", "permissionsCount": 6}	2026-10-16 17:44:06.758
cmvb9d6up000kkib7x4b8rjt4	19	cmv77bo3o0003kio3j3za86nt	USER_UPDATED	cmv8cq58t0001kio67wg0j48m	{"role": "accountant", "isActive": true, "actorName": "محمود عشري", "actorRole": "admin", "targetName": "Mahmoud Mansour", "actorUsername": "mahmoud_training", "passwordReset": false, "targetUsername": "mahmoud", "permissionsCount": 12}	2026-10-16 17:45:22.416
cmvb9ez7n000rkib7np9v258l	19	cmv8cq58t0001kio67wg0j48m	ENTRY_CREATED	cmvb9ez65000mkib7ll1tny2y	{"actorName": "Mahmoud Mansour", "actorRole": "accountant", "actorUsername": "mahmoud"}	2026-10-16 17:46:45.828
cmvb9f18w000tkib7kigsvzkj	19	cmv8cq58t0001kio67wg0j48m	ENTRY_POSTED	cmvb9ez65000mkib7ll1tny2y	{"actorName": "Mahmoud Mansour", "actorRole": "accountant", "actorUsername": "mahmoud"}	2026-10-16 17:46:48.464
\.


--
-- Data for Name: FiscalPeriod; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."FiscalPeriod" (id, "companyId", name, start, "end", "isClosed") FROM stdin;
cmuwraryu000zki5lf2x5l3m8	2	يناير 2026	2026-01-01	2026-01-31	t
cmuwt17m0004yki5lpds6x0ul	3	يناير 2026	2026-01-01	2026-01-31	t
cmuwt8afr00bgki5l05kjg0z8	4	يناير 2026	2026-01-01	2026-01-31	t
cmuwtfv3u00ieki5lsgjgfdjc	5	يناير 2026	2026-01-01	2026-01-31	t
cmv77bo0b0001kio3x851wgy6	19	السنة المالية 2026	2026-01-01	2026-12-31	f
\.


--
-- Data for Name: InventoryClose; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."InventoryClose" (id, "companyId", date, snapshots, "entryId", "createdAt") FROM stdin;
cmuwrasis002aki5lnpmw9y4z	2	2026-01-31	[{"code": "ITEM_QA_ALPHA", "name": "صنف اختبار QA الأساسي", "value": "2250.00", "itemId": "cmuwrarw4000vki5ly1957qgi", "quantity": "150.000", "warehouse": "W_QA_MAIN", "averageCost": "15.000000"}]	cmuwrasig0024ki5l8ai4sgli	2026-10-06 14:10:50.98
cmuwt182s0069ki5lef0f2p1q	3	2026-01-31	[{"code": "ITEM_QA_ALPHA", "name": "صنف اختبار QA الأساسي", "value": "2250.00", "itemId": "cmuwt17k6004uki5ligwyyf0z", "quantity": "150.000", "warehouse": "W_QA_MAIN", "averageCost": "15.000000"}]	cmuwt182i0063ki5lp1ph0b8c	2026-10-06 14:59:23.812
cmuwt8awe00crki5l0uxzkl2c	4	2026-01-31	[{"code": "ITEM_QA_ALPHA", "name": "صنف اختبار QA الأساسي", "value": "2250.00", "itemId": "cmuwt8aec00bcki5lrave7mlo", "quantity": "150.000", "warehouse": "W_QA_MAIN", "averageCost": "15.000000"}]	cmuwt8aw700clki5l92wfa4sc	2026-10-06 15:04:54.063
cmuwtfvkn00jpki5layofkqqi	5	2026-01-31	[{"code": "ITEM_QA_ALPHA", "name": "صنف اختبار QA الأساسي", "value": "2250.00", "itemId": "cmuwtfv2n00iaki5lu8onv5dm", "quantity": "150.000", "warehouse": "W_QA_MAIN", "averageCost": "15.000000"}]	cmuwtfvkc00jjki5lmpv2nzrn	2026-10-06 15:10:47.447
\.


--
-- Data for Name: JournalEntry; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."JournalEntry" (id, "companyId", number, date, description, kind, document, reference, status, "createdBy", "createdAt", "postedAt", "postedBy", "reversalOf", "requestKey", metadata) FROM stdin;
cmuwt16y10040ki5lt22fch05	3	1	2026-01-05	قيد تجريبي للاختبار مسودة	GENERAL			POSTED	cmuwt13mj0001kiqug37q0fwg	2026-10-06 14:59:22.345	2026-10-06 14:59:22.619	cmuwt13mj0001kiqug37q0fwg	\N	qa-draft-entry-001	{"requestHash": "852b98a035ec539475f4f584fb6c2078be43fb23642ab243bf96f53c812a2ea0"}
cmuwt17ap0049ki5l3w6szkp3	3	2	2026-01-06	عكس قيد 1	GENERAL			POSTED	cmuwt13mj0001kiqug37q0fwg	2026-10-06 14:59:22.802	2026-10-06 14:59:22.799	cmuwt13mj0001kiqug37q0fwg	cmuwt16y10040ki5lt22fch05	reversal:cmuwt16y10040ki5lt22fch05	{"requestHash": "794908cd2b8b6e65f9e522d4184488641c3911273ebc1c4b9e862391e74c346c"}
cmuwt17ok0052ki5lo2tl7h8i	3	3	2026-01-01	رصيد مخزون افتتاحي ورأس مال	OPENING	OPENING	إذن افتتاحي	POSTED	cmuwt13mj0001kiqug37q0fwg	2026-10-06 14:59:23.3	2026-10-06 14:59:23.298	cmuwt13mj0001kiqug37q0fwg	\N	stock:qa-stock-opening-doc-1	{"requestHash": "2b03c1e920d0b7637bf1cdc9e21d8fd4267ebbd19aa60da5f728f93c48828fe5"}
cmuwt17se005dki5lydn1mu4w	3	4	2026-01-10	فاتورة شراء آجل 100 كجم	STOCK	PURCHASE		POSTED	cmuwt13mj0001kiqug37q0fwg	2026-10-06 14:59:23.439	2026-10-06 14:59:23.436	cmuwt13mj0001kiqug37q0fwg	\N	stock:qa-purchase-doc-1	{"requestHash": "691a0a7362a53ed8938a936208ec861b9b1378bb483ae8fbe71bb47b06df76cc"}
cmuwt17xd005uki5l7qb6eaa1	3	5	2026-01-15	فاتورة بيع نقدي 50 كجم	GENERAL	SALE		POSTED	cmuwt13mj0001kiqug37q0fwg	2026-10-06 14:59:23.617	2026-10-06 14:59:23.615	cmuwt13mj0001kiqug37q0fwg	\N	sale:qa-sale-doc-1	{"requestHash": "eff08a7646c9bc186a352266a1d074d11dc5c55ee3290f89fea591360b1b5847"}
cmuwt182i0063ki5lp1ph0b8c	3	6	2026-01-31	تسوية مخزون آخر الفترة بالمتوسط المرجح	ADJUSTMENT	INVENTORY_CLOSE		POSTED	cmuwt13mj0001kiqug37q0fwg	2026-10-06 14:59:23.802	2026-10-06 14:59:23.8	cmuwt13mj0001kiqug37q0fwg	\N	inventory-close:2026-01-31T00:00:00.000Z	{"requestHash": "2b6b2ee329a26e3bcf12b613a66606b359fb694b6f090ec0c30b05bc99025b3f"}
cmuwt18bv006fki5l679nnfs8	3	7	2026-02-05	شراء فبراير 50 كجم	STOCK	PURCHASE		POSTED	cmuwt13mj0001kiqug37q0fwg	2026-10-06 14:59:24.14	2026-10-06 14:59:24.137	cmuwt13mj0001kiqug37q0fwg	\N	stock:qa-feb-purchase-1	{"requestHash": "28ecfee6e6d6ac30c1f823c58a91133b8ddbd6ab5d92c33a734866c190540383"}
cmuwt18q6006ski5lftqachod	3	8	2026-02-12	مرتجع مشتريات 10 كجم	STOCK	PURCHASE_RETURN		POSTED	cmuwt13mj0001kiqug37q0fwg	2026-10-06 14:59:24.654	2026-10-06 14:59:24.653	cmuwt13mj0001kiqug37q0fwg	\N	stock:qa-purch-return-1	{"requestHash": "fe5da51dd9420b849075e4fff44663c07e67c6c2eb0a00ba938a2038584ea52c"}
cmuwt192l0079ki5lyhpnzkvn	3	9	2026-02-14	مرتجع مبيعات 5 كجم نقداً	GENERAL	SALE_RETURN		POSTED	cmuwt13mj0001kiqug37q0fwg	2026-10-06 14:59:25.102	2026-10-06 14:59:25.099	cmuwt13mj0001kiqug37q0fwg	\N	sale:qa-sale-return-1	{"requestHash": "e0aa193fe2b8949547391ba3468705b0d505eb9746bee9c5993eaa49a0d3edfd"}
cmuwt19tw008aki5langdb7ss	3	10	2026-02-15	تكاليف خامات وأجور تصنيع فعلية	GENERAL			POSTED	cmuwt13mj0001kiqug37q0fwg	2026-10-06 14:59:26.084	2026-10-06 14:59:26.148	cmuwt13mj0001kiqug37q0fwg	\N	qa-cost-mfg-entry-1	{"requestHash": "993c6b51bc6bd6c3f08b9b6053de6337af3a50ef0134cc065ccd410981b54978"}
cmuwt1a1t008oki5lvymb7neb	3	11	2026-02-15	تكاليف أعلاف ورعاية بيطرية لقطيع التسمين	GENERAL			POSTED	cmuwt13mj0001kiqug37q0fwg	2026-10-06 14:59:26.37	2026-10-06 14:59:26.442	cmuwt13mj0001kiqug37q0fwg	\N	qa-cost-animal-entry-1	{"requestHash": "58cee7fdd9d09bb2ad21fab75e2ff7910fec41ad35fada126f1d0dc7e8ec7809"}
cmuwt1a9b0092ki5lxoelmfpy	3	12	2026-02-15	تكاليف تشغيل جرار زراعي لمحصول بطاطس	GENERAL			POSTED	cmuwt13mj0001kiqug37q0fwg	2026-10-06 14:59:26.64	2026-10-06 14:59:26.715	cmuwt13mj0001kiqug37q0fwg	\N	qa-cost-farming-entry-1	{"requestHash": "bcdd38cda290fd390417b2c38d26210d10dce06bc34c46ca7f1c25ab1e762bcd"}
cmuwt1ah2009fki5lvqvlstoz	3	13	2026-02-15	تكاليف نولون وشحن طلبية تصدير	GENERAL			POSTED	cmuwt13mj0001kiqug37q0fwg	2026-10-06 14:59:26.919	2026-10-06 14:59:26.986	cmuwt13mj0001kiqug37q0fwg	\N	qa-cost-export-entry-1	{"requestHash": "3f71ad49d0eb2edc9a59bcd6e12df597abca5474a8f5384aaaa8f60d28639865"}
cmuwt1aoy009ski5l28nzxeu1	3	14	2026-02-15	مصاريف توثيق ومناولة ميناء لشحنة استيراد	GENERAL			POSTED	cmuwt13mj0001kiqug37q0fwg	2026-10-06 14:59:27.202	2026-10-06 14:59:27.262	cmuwt13mj0001kiqug37q0fwg	\N	qa-cost-import-entry-1	{"requestHash": "1214ca0e166686828eec0b12b6f6566a579b0ae50d217d2f8f83b7ad165765e0"}
cmuwt89te00aiki5lh4hyshag	4	1	2026-01-05	قيد تجريبي للاختبار مسودة	GENERAL			POSTED	cmuwt88510001kis7wf5d9848	2026-10-06 15:04:52.659	2026-10-06 15:04:52.919	cmuwt88510001kis7wf5d9848	\N	qa-draft-entry-001	{"requestHash": "852b98a035ec539475f4f584fb6c2078be43fb23642ab243bf96f53c812a2ea0"}
cmuwt8a4g00arki5lt9txrrtk	4	2	2026-01-06	عكس قيد 1	GENERAL			POSTED	cmuwt88510001kis7wf5d9848	2026-10-06 15:04:53.056	2026-10-06 15:04:53.055	cmuwt88510001kis7wf5d9848	cmuwt89te00aiki5lh4hyshag	reversal:cmuwt89te00aiki5lh4hyshag	{"requestHash": "4bbcdefd66cac8ad0fc61508edfaeee03851626a66af1a50732f1861f9ce2aa2"}
cmuwt8ai400bkki5l2efpok1g	4	3	2026-01-01	رصيد مخزون افتتاحي ورأس مال	OPENING	OPENING	إذن افتتاحي	POSTED	cmuwt88510001kis7wf5d9848	2026-10-06 15:04:53.548	2026-10-06 15:04:53.547	cmuwt88510001kis7wf5d9848	\N	stock:qa-stock-opening-doc-1	{"requestHash": "2b03c1e920d0b7637bf1cdc9e21d8fd4267ebbd19aa60da5f728f93c48828fe5"}
cmuwt8aln00bvki5lte5z8jgz	4	4	2026-01-10	فاتورة شراء آجل 100 كجم	STOCK	PURCHASE		POSTED	cmuwt88510001kis7wf5d9848	2026-10-06 15:04:53.676	2026-10-06 15:04:53.674	cmuwt88510001kis7wf5d9848	\N	stock:qa-purchase-doc-1	{"requestHash": "691a0a7362a53ed8938a936208ec861b9b1378bb483ae8fbe71bb47b06df76cc"}
cmuwt8aqe00ccki5l63e7asa6	4	5	2026-01-15	فاتورة بيع نقدي 50 كجم	GENERAL	SALE		POSTED	cmuwt88510001kis7wf5d9848	2026-10-06 15:04:53.846	2026-10-06 15:04:53.845	cmuwt88510001kis7wf5d9848	\N	sale:qa-sale-doc-1	{"requestHash": "eff08a7646c9bc186a352266a1d074d11dc5c55ee3290f89fea591360b1b5847"}
cmuwt8aw700clki5l92wfa4sc	4	6	2026-01-31	تسوية مخزون آخر الفترة بالمتوسط المرجح	ADJUSTMENT	INVENTORY_CLOSE		POSTED	cmuwt88510001kis7wf5d9848	2026-10-06 15:04:54.056	2026-10-06 15:04:54.054	cmuwt88510001kis7wf5d9848	\N	inventory-close:2026-01-31T00:00:00.000Z	{"requestHash": "2b6b2ee329a26e3bcf12b613a66606b359fb694b6f090ec0c30b05bc99025b3f"}
cmuwt8b4a00cxki5lzatlp6bb	4	7	2026-02-05	شراء فبراير 50 كجم	STOCK	PURCHASE		POSTED	cmuwt88510001kis7wf5d9848	2026-10-06 15:04:54.347	2026-10-06 15:04:54.345	cmuwt88510001kis7wf5d9848	\N	stock:qa-feb-purchase-1	{"requestHash": "28ecfee6e6d6ac30c1f823c58a91133b8ddbd6ab5d92c33a734866c190540383"}
cmuwt8bjm00daki5l46cwhf05	4	8	2026-02-12	مرتجع مشتريات 10 كجم	STOCK	PURCHASE_RETURN		POSTED	cmuwt88510001kis7wf5d9848	2026-10-06 15:04:54.898	2026-10-06 15:04:54.897	cmuwt88510001kis7wf5d9848	\N	stock:qa-purch-return-1	{"requestHash": "fe5da51dd9420b849075e4fff44663c07e67c6c2eb0a00ba938a2038584ea52c"}
cmuwtfug100hgki5lvt2p4dio	5	1	2026-01-05	قيد تجريبي للاختبار مسودة	GENERAL			POSTED	cmuwtfsow0001kikpsl4btz0e	2026-10-06 15:10:45.985	2026-10-06 15:10:46.252	cmuwtfsow0001kikpsl4btz0e	\N	qa-draft-entry-001	{"requestHash": "852b98a035ec539475f4f584fb6c2078be43fb23642ab243bf96f53c812a2ea0"}
cmuwt1ge100a5ki5l2hopaj4g	3	15	2026-02-15	قيد اختبار القبول التفاعلي من المتصفح	GENERAL			POSTED	cmuwt13mj0001kiqug37q0fwg	2026-10-06 14:59:34.585	2026-10-06 14:59:34.966	cmuwt13mj0001kiqug37q0fwg	\N	60c013c9-d0f4-4a92-bf6b-2d018465da7b	{"requestHash": "7f95c22d2c28062480a48908957dd012c248d8bcb476e1779ec0fc12388cc018"}
cmuwrar260001ki5ll6kzh8vl	2	26	2026-01-05	قيد تجريبي للاختبار مسودة	GENERAL			POSTED	cmuwqcrgn0001ki7yhg5tm3kh	2026-10-06 14:10:49.087	2026-10-06 14:10:49.496	cmuwqcrgn0001ki7yhg5tm3kh	\N	qa-draft-entry-001	{"requestHash": "852b98a035ec539475f4f584fb6c2078be43fb23642ab243bf96f53c812a2ea0"}
cmuwt8bzz00drki5lelu2fbe0	4	9	2026-02-14	مرتجع مبيعات 5 كجم نقداً	GENERAL	SALE_RETURN		POSTED	cmuwt88510001kis7wf5d9848	2026-10-06 15:04:55.487	2026-10-06 15:04:55.485	cmuwt88510001kis7wf5d9848	\N	sale:qa-sale-return-1	{"requestHash": "e0aa193fe2b8949547391ba3468705b0d505eb9746bee9c5993eaa49a0d3edfd"}
cmuwrarib000aki5lojrj5a5a	2	27	2026-01-06	عكس قيد 26	GENERAL			POSTED	cmuwqcrgn0001ki7yhg5tm3kh	2026-10-06 14:10:49.667	2026-10-06 14:10:49.664	cmuwqcrgn0001ki7yhg5tm3kh	cmuwrar260001ki5ll6kzh8vl	reversal:cmuwrar260001ki5ll6kzh8vl	{"requestHash": "83bfdd09088ab3312602216f6f74ca4977b103ed56c355a231dea11e48b43ecd"}
cmuwras360013ki5lnz5rbehq	2	28	2026-01-01	رصيد مخزون افتتاحي ورأس مال	OPENING	OPENING	إذن افتتاحي	POSTED	cmuwqcrgn0001ki7yhg5tm3kh	2026-10-06 14:10:50.419	2026-10-06 14:10:50.417	cmuwqcrgn0001ki7yhg5tm3kh	\N	stock:qa-stock-opening-doc-1	{"requestHash": "2b03c1e920d0b7637bf1cdc9e21d8fd4267ebbd19aa60da5f728f93c48828fe5"}
cmuwras75001eki5ltiazhypv	2	29	2026-01-10	فاتورة شراء آجل 100 كجم	STOCK	PURCHASE		POSTED	cmuwqcrgn0001ki7yhg5tm3kh	2026-10-06 14:10:50.562	2026-10-06 14:10:50.56	cmuwqcrgn0001ki7yhg5tm3kh	\N	stock:qa-purchase-doc-1	{"requestHash": "691a0a7362a53ed8938a936208ec861b9b1378bb483ae8fbe71bb47b06df76cc"}
cmuwrasc7001vki5l5tkg0n85	2	30	2026-01-15	فاتورة بيع نقدي 50 كجم	GENERAL	SALE		POSTED	cmuwqcrgn0001ki7yhg5tm3kh	2026-10-06 14:10:50.743	2026-10-06 14:10:50.741	cmuwqcrgn0001ki7yhg5tm3kh	\N	sale:qa-sale-doc-1	{"requestHash": "eff08a7646c9bc186a352266a1d074d11dc5c55ee3290f89fea591360b1b5847"}
cmuwrasig0024ki5l8ai4sgli	2	31	2026-01-31	تسوية مخزون آخر الفترة بالمتوسط المرجح	ADJUSTMENT	INVENTORY_CLOSE		POSTED	cmuwqcrgn0001ki7yhg5tm3kh	2026-10-06 14:10:50.968	2026-10-06 14:10:50.967	cmuwqcrgn0001ki7yhg5tm3kh	\N	inventory-close:2026-01-31T00:00:00.000Z	{"requestHash": "2b6b2ee329a26e3bcf12b613a66606b359fb694b6f090ec0c30b05bc99025b3f"}
cmuwrasr8002gki5lnh1dkcrw	2	32	2026-02-05	شراء فبراير 50 كجم	STOCK	PURCHASE		POSTED	cmuwqcrgn0001ki7yhg5tm3kh	2026-10-06 14:10:51.284	2026-10-06 14:10:51.282	cmuwqcrgn0001ki7yhg5tm3kh	\N	stock:qa-feb-purchase-1	{"requestHash": "28ecfee6e6d6ac30c1f823c58a91133b8ddbd6ab5d92c33a734866c190540383"}
cmuwrat0m002tki5ldccowhjt	2	33	2026-02-12	مرتجع مشتريات 10 كجم	STOCK	PURCHASE_RETURN		POSTED	cmuwqcrgn0001ki7yhg5tm3kh	2026-10-06 14:10:51.622	2026-10-06 14:10:51.621	cmuwqcrgn0001ki7yhg5tm3kh	\N	stock:qa-purch-return-1	{"requestHash": "fe5da51dd9420b849075e4fff44663c07e67c6c2eb0a00ba938a2038584ea52c"}
cmuwrat4x003aki5lle3rq003	2	34	2026-02-14	مرتجع مبيعات 5 كجم نقداً	GENERAL	SALE_RETURN		POSTED	cmuwqcrgn0001ki7yhg5tm3kh	2026-10-06 14:10:51.778	2026-10-06 14:10:51.775	cmuwqcrgn0001ki7yhg5tm3kh	\N	sale:qa-sale-return-1	{"requestHash": "e0aa193fe2b8949547391ba3468705b0d505eb9746bee9c5993eaa49a0d3edfd"}
cmuwraxre003rki5lwavikn7c	2	35	2026-02-15	قيد اختبار القبول من متصفح الويب	GENERAL			POSTED	cmuwqcrgn0001ki7yhg5tm3kh	2026-10-06 14:10:57.768	2026-10-06 14:10:58.126	cmuwqcrgn0001ki7yhg5tm3kh	\N	ace3bbde-49fb-4a4f-82ea-7244d338656b	{"requestHash": "b70322e716314e818fccccab15f4753d7ba423594e2dc3038a4294b8ce38fa33"}
cmuwt8cot00eski5lbmvy3lol	4	10	2026-02-15	تكاليف خامات وأجور تصنيع فعلية	GENERAL			POSTED	cmuwt88510001kis7wf5d9848	2026-10-06 15:04:56.381	2026-10-06 15:04:56.445	cmuwt88510001kis7wf5d9848	\N	qa-cost-mfg-entry-1	{"requestHash": "993c6b51bc6bd6c3f08b9b6053de6337af3a50ef0134cc065ccd410981b54978"}
cmuwt8cvj00f6ki5lst28gw4k	4	11	2026-02-15	تكاليف أعلاف ورعاية بيطرية لقطيع التسمين	GENERAL			POSTED	cmuwt88510001kis7wf5d9848	2026-10-06 15:04:56.623	2026-10-06 15:04:56.691	cmuwt88510001kis7wf5d9848	\N	qa-cost-animal-entry-1	{"requestHash": "58cee7fdd9d09bb2ad21fab75e2ff7910fec41ad35fada126f1d0dc7e8ec7809"}
cmuwt8d2v00fkki5lzjmo18ae	4	12	2026-02-15	تكاليف تشغيل جرار زراعي لمحصول بطاطس	GENERAL			POSTED	cmuwt88510001kis7wf5d9848	2026-10-06 15:04:56.887	2026-10-06 15:04:56.954	cmuwt88510001kis7wf5d9848	\N	qa-cost-farming-entry-1	{"requestHash": "bcdd38cda290fd390417b2c38d26210d10dce06bc34c46ca7f1c25ab1e762bcd"}
cmuwt8dbb00fxki5l5tjx9e15	4	13	2026-02-15	تكاليف نولون وشحن طلبية تصدير	GENERAL			POSTED	cmuwt88510001kis7wf5d9848	2026-10-06 15:04:57.192	2026-10-06 15:04:57.26	cmuwt88510001kis7wf5d9848	\N	qa-cost-export-entry-1	{"requestHash": "3f71ad49d0eb2edc9a59bcd6e12df597abca5474a8f5384aaaa8f60d28639865"}
cmuwt8dj400gaki5l7f2n4n7b	4	14	2026-02-15	مصاريف توثيق ومناولة ميناء لشحنة استيراد	GENERAL			POSTED	cmuwt88510001kis7wf5d9848	2026-10-06 15:04:57.472	2026-10-06 15:04:57.546	cmuwt88510001kis7wf5d9848	\N	qa-cost-import-entry-1	{"requestHash": "1214ca0e166686828eec0b12b6f6566a579b0ae50d217d2f8f83b7ad165765e0"}
cmuwt8k1200gnki5lzeodi9g0	4	15	2026-02-15	قيد اختبار القبول التفاعلي من المتصفح	GENERAL			POSTED	cmuwt88510001kis7wf5d9848	2026-10-06 15:05:05.895	2026-10-06 15:05:06.519	cmuwt88510001kis7wf5d9848	\N	5a004b2c-b070-4540-8cca-9dc9de54072f	{"requestHash": "0ce62fcfcb20f94d8462f06e25c829335b2132a268ab8ea29cd7592dc20406f7"}
cmuwtfus900hpki5lhyfp9mwm	5	2	2026-01-06	عكس قيد 1	GENERAL			POSTED	cmuwtfsow0001kikpsl4btz0e	2026-10-06 15:10:46.426	2026-10-06 15:10:46.423	cmuwtfsow0001kikpsl4btz0e	cmuwtfug100hgki5lvt2p4dio	reversal:cmuwtfug100hgki5lvt2p4dio	{"requestHash": "34265363bb5ef735dd6a7f0b57a9bf03703d976838641d63221327611e489d1d"}
cmuwtfv6h00iiki5l0e1qqgav	5	3	2026-01-01	رصيد مخزون افتتاحي ورأس مال	OPENING	OPENING	إذن افتتاحي	POSTED	cmuwtfsow0001kikpsl4btz0e	2026-10-06 15:10:46.938	2026-10-06 15:10:46.935	cmuwtfsow0001kikpsl4btz0e	\N	stock:qa-stock-opening-doc-1	{"requestHash": "2b03c1e920d0b7637bf1cdc9e21d8fd4267ebbd19aa60da5f728f93c48828fe5"}
cmuwtfvbd00itki5l4nxr3q9q	5	4	2026-01-10	فاتورة شراء آجل 100 كجم	STOCK	PURCHASE		POSTED	cmuwtfsow0001kikpsl4btz0e	2026-10-06 15:10:47.113	2026-10-06 15:10:47.111	cmuwtfsow0001kikpsl4btz0e	\N	stock:qa-purchase-doc-1	{"requestHash": "691a0a7362a53ed8938a936208ec861b9b1378bb483ae8fbe71bb47b06df76cc"}
cmuwtfvfv00jaki5lvs0b92rg	5	5	2026-01-15	فاتورة بيع نقدي 50 كجم	GENERAL	SALE		POSTED	cmuwtfsow0001kikpsl4btz0e	2026-10-06 15:10:47.275	2026-10-06 15:10:47.274	cmuwtfsow0001kikpsl4btz0e	\N	sale:qa-sale-doc-1	{"requestHash": "eff08a7646c9bc186a352266a1d074d11dc5c55ee3290f89fea591360b1b5847"}
cmuwtfvkc00jjki5lmpv2nzrn	5	6	2026-01-31	تسوية مخزون آخر الفترة بالمتوسط المرجح	ADJUSTMENT	INVENTORY_CLOSE		POSTED	cmuwtfsow0001kikpsl4btz0e	2026-10-06 15:10:47.437	2026-10-06 15:10:47.435	cmuwtfsow0001kikpsl4btz0e	\N	inventory-close:2026-01-31T00:00:00.000Z	{"requestHash": "2b6b2ee329a26e3bcf12b613a66606b359fb694b6f090ec0c30b05bc99025b3f"}
cmv8cs87e000vkiowoqo4oc8r	30	8888	2026-10-14	قيد تجريبي للاختبار	GENERAL			DRAFT	cmv8cs6n70001kiowykw4fksk	2026-10-14 16:57:44.33	\N	\N	\N	test-audit-req-8888	{}
cmuwtfvs600jvki5lu1l4fce0	5	7	2026-02-05	شراء فبراير 50 كجم	STOCK	PURCHASE		POSTED	cmuwtfsow0001kikpsl4btz0e	2026-10-06 15:10:47.718	2026-10-06 15:10:47.716	cmuwtfsow0001kikpsl4btz0e	\N	stock:qa-feb-purchase-1	{"requestHash": "28ecfee6e6d6ac30c1f823c58a91133b8ddbd6ab5d92c33a734866c190540383"}
cmuwtfw7s00k8ki5lvz0edxal	5	8	2026-02-12	مرتجع مشتريات 10 كجم	STOCK	PURCHASE_RETURN		POSTED	cmuwtfsow0001kikpsl4btz0e	2026-10-06 15:10:48.28	2026-10-06 15:10:48.278	cmuwtfsow0001kikpsl4btz0e	\N	stock:qa-purch-return-1	{"requestHash": "fe5da51dd9420b849075e4fff44663c07e67c6c2eb0a00ba938a2038584ea52c"}
cmuwtfwkj00kpki5l9hczi4uc	5	9	2026-02-14	مرتجع مبيعات 5 كجم نقداً	GENERAL	SALE_RETURN		POSTED	cmuwtfsow0001kikpsl4btz0e	2026-10-06 15:10:48.739	2026-10-06 15:10:48.737	cmuwtfsow0001kikpsl4btz0e	\N	sale:qa-sale-return-1	{"requestHash": "e0aa193fe2b8949547391ba3468705b0d505eb9746bee9c5993eaa49a0d3edfd"}
cmvb970i00009kib7kuh4kf6s	19	13	2026-10-16	ايضاف قيد	GENERAL			POSTED	cmv77bo3o0003kio3j3za86nt	2026-10-16 17:40:34.248	2026-10-16 17:40:50.53	cmv77bo3o0003kio3j3za86nt	\N	0b92184a-3460-4806-8f56-a42784dfa212	{"requestHash": "b43c71d33eb14faab490ed06959bc16949e234612676c55c8ed1f71bf3c6bef2"}
cmuwtfx7v00lqki5l1xrjink7	5	10	2026-02-15	تكاليف خامات وأجور تصنيع فعلية	GENERAL			POSTED	cmuwtfsow0001kikpsl4btz0e	2026-10-06 15:10:49.579	2026-10-06 15:10:49.655	cmuwtfsow0001kikpsl4btz0e	\N	qa-cost-mfg-entry-1	{"requestHash": "993c6b51bc6bd6c3f08b9b6053de6337af3a50ef0134cc065ccd410981b54978"}
cmuwtfxfh00m4ki5ltzluq82l	5	11	2026-02-15	تكاليف أعلاف ورعاية بيطرية لقطيع التسمين	GENERAL			POSTED	cmuwtfsow0001kikpsl4btz0e	2026-10-06 15:10:49.853	2026-10-06 15:10:49.922	cmuwtfsow0001kikpsl4btz0e	\N	qa-cost-animal-entry-1	{"requestHash": "58cee7fdd9d09bb2ad21fab75e2ff7910fec41ad35fada126f1d0dc7e8ec7809"}
cmuwtfxnl00miki5ltmu5atar	5	12	2026-02-15	تكاليف تشغيل جرار زراعي لمحصول بطاطس	GENERAL			POSTED	cmuwtfsow0001kikpsl4btz0e	2026-10-06 15:10:50.146	2026-10-06 15:10:50.216	cmuwtfsow0001kikpsl4btz0e	\N	qa-cost-farming-entry-1	{"requestHash": "bcdd38cda290fd390417b2c38d26210d10dce06bc34c46ca7f1c25ab1e762bcd"}
cmuwtfxw800mvki5ljau2ehix	5	13	2026-02-15	تكاليف نولون وشحن طلبية تصدير	GENERAL			POSTED	cmuwtfsow0001kikpsl4btz0e	2026-10-06 15:10:50.456	2026-10-06 15:10:50.557	cmuwtfsow0001kikpsl4btz0e	\N	qa-cost-export-entry-1	{"requestHash": "3f71ad49d0eb2edc9a59bcd6e12df597abca5474a8f5384aaaa8f60d28639865"}
cmuwtfy4l00n8ki5ldckra65n	5	14	2026-02-15	مصاريف توثيق ومناولة ميناء لشحنة استيراد	GENERAL			POSTED	cmuwtfsow0001kikpsl4btz0e	2026-10-06 15:10:50.757	2026-10-06 15:10:50.818	cmuwtfsow0001kikpsl4btz0e	\N	qa-cost-import-entry-1	{"requestHash": "1214ca0e166686828eec0b12b6f6566a579b0ae50d217d2f8f83b7ad165765e0"}
cmuwtg1tn00nlki5lpfpreory	5	15	2026-02-15	قيد اختبار القبول التفاعلي من المتصفح	GENERAL			POSTED	cmuwtfsow0001kikpsl4btz0e	2026-10-06 15:10:55.547	2026-10-06 15:10:55.87	cmuwtfsow0001kikpsl4btz0e	\N	d7643acd-fcd3-4ab2-956a-510b8828e51e	{"requestHash": "911316b431a283dfe053527eefe2a98c704e1ccdfd340e6d5b7622a374f4163a"}
cmv6yk1i20001ki80zvkk5xqp	8	1	2026-01-20	قيد متزن للاعتماد والترحيل	GENERAL			POSTED	cmv6yjnp90001kizs7pidlu0v	2026-10-13 17:31:41.594	2026-10-13 17:31:42.329	cmv6yjnp90001kizs7pidlu0v	\N	53960fd3-aafa-41ae-815d-4502ffb881b0	{"requestHash": "939f2e7045f560446979f0d321bf47e32baf5db01c1ffd361098364ad04aeb31"}
cmv6ymg18000aki80fsm8kdhu	9	1	2026-01-20	قيد متزن للاعتماد والترحيل	GENERAL			POSTED	cmv6ym40q0001kiedfd0vt38l	2026-10-13 17:33:33.74	2026-10-13 17:33:34.122	cmv6ym40q0001kiedfd0vt38l	\N	a31fc273-b6ab-4ed8-a666-4224d1e3f331	{"requestHash": "658bb682945a1ff37656613fa4d2e5de2fed259e92b10968ae197db7fbcb7edd"}
cmv6yoop0000nki80zsmlsgrx	10	1	2026-01-20	قيد متزن للاعتماد والترحيل	GENERAL			POSTED	cmv6yo6qj0001kiw4wefq3jsw	2026-10-13 17:35:18.276	2026-10-13 17:35:19.076	cmv6yo6qj0001kiw4wefq3jsw	\N	b60c56ee-9658-4708-96ec-a6adfc645fc9	{"requestHash": "33afcaed06b7d15bfac392b67148d14d133dd5570804ea6a109942d5b6abf1cd"}
cmv6yoruz0014ki80kghc1b0w	10	2	2026-01-22	إذن إضافة تجريبي لشركة الاختبار المعزولة	STOCK	RECEIPT		POSTED	cmv6yo6qj0001kiw4wefq3jsw	2026-10-13 17:35:22.38	2026-10-13 17:35:22.378	cmv6yo6qj0001kiw4wefq3jsw	\N	stock:qa-stock-1791912894001	{"requestHash": "b97af1d5fdf58662d4d4c3f3cadb14a23fcbec931f6fdf38368812d8ea0b6fee"}
cmv78fy7e0005kib8r90dk547	19	1	2026-10-13	رأس مال بداية التدريب	OPENING		TRAIN-01	POSTED	cmv77bo3o0003kio3j3za86nt	2026-10-13 22:08:26.858	2026-10-13 22:13:33.921	cmv77bo3o0003kio3j3za86nt	\N	292b59d0-aa4d-4941-af9e-69be21c951b5	{"requestHash": "73f5bb787da9ab76e8ab7bd1fb2c9b2c54e44c76075d1dcaf321720b5d82fc9e"}
cmv78ukfv000ekib8yimklmwq	19	2	2026-10-13	إيراد خدمة نقدًا — تدريب	GENERAL			POSTED	cmv77bo3o0003kio3j3za86nt	2026-10-13 22:19:48.859	2026-10-13 22:20:13.909	cmv77bo3o0003kio3j3za86nt	\N	b8154acd-1375-4681-84a6-88c7ab15c563	{"requestHash": "71fc3d63d59d1032e4c95880d419cce480beb433b5cc018ee94abcca04202d69"}
cmv792zbh0001kixqzhtrq19c	19	3	2026-10-13	دفع ايجار	GENERAL			POSTED	cmv77bo3o0003kio3j3za86nt	2026-10-13 22:26:21.389	2026-10-13 22:26:29.975	cmv77bo3o0003kio3j3za86nt	\N	6d612184-6852-47ac-8417-b8c84af07990	{"requestHash": "92533fbf9482afbb488dc80de8f0e6a32e0e5b1ec380887e80d42789265abe19"}
cmv79hlxf0001kiksk03xhf4v	19	4	2026-10-13	خدمة لعميل التدريب بالأجل	GENERAL			POSTED	cmv77bo3o0003kio3j3za86nt	2026-10-13 22:37:43.875	2026-10-13 22:37:47.833	cmv77bo3o0003kio3j3za86nt	\N	ca4da643-51d7-459a-a120-3e18d2deff16	{"requestHash": "cbf4210845c18e2d9a58d3312e78906f92ffadf2a00494cf1e86f77878cff743"}
cmv79u8zz000akikstgvar3nm	19	5	2026-10-13	تسديد جزء من المديونيه	GENERAL			POSTED	cmv77bo3o0003kio3j3za86nt	2026-10-13 22:47:33.648	2026-10-13 22:47:36.508	cmv77bo3o0003kio3j3za86nt	\N	377666d2-2452-46ca-8444-3d02e8adb6b5	{"requestHash": "4666489eb14f00bdf874f0aebdc62b3d30bacbe5933963f1dd6f8dcdbb8686d1"}
cmv7d1wyb000jkiksrk0385dg	19	6	2026-10-14	فاتورة كهرباء مستحقه	GENERAL			POSTED	cmv77bo3o0003kio3j3za86nt	2026-10-14 00:17:30.132	2026-10-14 00:17:55.714	cmv77bo3o0003kio3j3za86nt	\N	b599d49e-5947-4375-9f0e-2b4a124b8ea0	{"requestHash": "f4e6af6dd12014b56f15923fb2fd978d079e35c256968fc840d5e8162e438b1f"}
cmv7krrmn000skiksf8gx036w	19	7	2026-10-14	تسديد مال للمورد	GENERAL			POSTED	cmv77bo3o0003kio3j3za86nt	2026-10-14 03:53:33.599	2026-10-14 03:53:37.233	cmv77bo3o0003kio3j3za86nt	\N	27dbcb4d-7053-4c48-8049-5fd257d35fd4	{"requestHash": "5a28a3bebfff0664671d30ca5114589f7f01ed78bb00c1d9d3dd82bac2c48e86"}
cmvb9ez65000mkib7ll1tny2y	19	14	2026-10-16	اضافة قيد محاسب	GENERAL			POSTED	cmv8cq58t0001kio67wg0j48m	2026-10-16 17:46:45.774	2026-10-16 17:46:48.454	cmv8cq58t0001kio67wg0j48m	\N	da75f386-52f7-4655-b1c7-c8f1c6670c71	{"requestHash": "0de6cdd7afa47b0fac0cd513a838c679c7dad620b2f0cf91722b58b7bdc9394f"}
cmv7llwaa0011kikszh5hzn1a	19	8	2026-10-14	تصحيح حساب الإيجار في القيد رقم 3	GENERAL			POSTED	cmv77bo3o0003kio3j3za86nt	2026-10-14 04:16:59.314	2026-10-14 04:17:05.037	cmv77bo3o0003kio3j3za86nt	\N	65a043cc-bf41-4bb6-88e9-072509f29faf	{"requestHash": "5a4cf2c196704274349a911c0a0e073bc9964a00d6625fa3f74ac57ab12bf8f7"}
cmv8zq8i60005kiyu2ct6oo32	19	9	2026-10-15	اختبار إنشاء موظف واعتماد مدير.	GENERAL			POSTED	cmv8cq58t0001kio67wg0j48m	2026-10-15 03:40:02.575	2026-10-15 03:40:57.128	cmv77bo3o0003kio3j3za86nt	\N	93aa2ec5-ab3a-45c3-99b3-a3bdfb2c4a0c	{"requestHash": "52627990d28d2d043cfedb92ef177899a85e5023184acafddd2678ec4ff3ca3c"}
cmv8zu3oa000ekiyuxap4d0b3	19	10	2026-10-15	عكس قيد 9	GENERAL			POSTED	cmv77bo3o0003kio3j3za86nt	2026-10-15 03:43:02.938	2026-10-15 03:43:02.937	cmv77bo3o0003kio3j3za86nt	cmv8zq8i60005kiyu2ct6oo32	reversal:cmv8zq8i60005kiyu2ct6oo32	{"requestHash": "75c3cd11185a38e831da0d6e60c87b0b0bd7ac02a225a7c160a75f8464bedd26"}
cmv909c8u000nkiyu7bg8ohrb	19	11	2026-10-15	اختبار	GENERAL			VOID	cmv77bo3o0003kio3j3za86nt	2026-10-15 03:54:53.886	\N	\N	\N	9c8defdc-c7e7-42e1-9c76-adcb13321c6e	{"requestHash": "8657ecf36373ffedc5bc12e7e571c318eb737b1088bde72ecca9801837b9c559"}
cmv90cxt10002kidacpjay6x2	51	1	2026-10-15	مبيعات نقدية أصلية	GENERAL			POSTED	cmv90cxpl0000kida58ojzj9e	2026-10-15 03:57:41.797	2026-10-15 03:57:41.868	cmv90cxpl0000kida58ojzj9e	\N	req-orig-1792036661733	{"requestHash": "c2a6da82cbfaa09264779cdd8109fb53a51fec00e5793c98b198499203abbfec"}
cmv90cy4j000bkida5kwywvfy	51	2	2026-10-15	قيد فحص التزامن	GENERAL			POSTED	cmv90cxpl0000kida58ojzj9e	2026-10-15 03:57:42.211	2026-10-15 03:57:42.302	cmv90cxpl0000kida58ojzj9e	\N	req-conc-1792036662142	{"requestHash": "9dcd4fafeb07d61f417d1a14243c93f43730d1a0c599067670c1fbcee343296a"}
cmv90du4m0002kifyzse28vkf	52	1	2026-10-15	مبيعات نقدية أصلية	GENERAL			POSTED	cmv90du210000kifyidoaf4dt	2026-10-15 03:58:23.687	2026-10-15 03:58:23.757	cmv90du210000kifyidoaf4dt	\N	req-orig-1792036703631	{"requestHash": "de71f9ce0b2d350fcae961c1b4487a6e1f94af2f57ca1b12db99b98174158506"}
cmv90du9p000bkifyc5hedz0h	52	2	2026-10-15	عكس قيد 1	GENERAL			POSTED	cmv90du210000kifyidoaf4dt	2026-10-15 03:58:23.869	2026-10-15 03:58:23.867	cmv90du210000kifyidoaf4dt	cmv90du4m0002kifyzse28vkf	reversal:cmv90du4m0002kifyzse28vkf	{"requestHash": "ea3e4102fce77059dd4cb4c64e8ddf731355e59948c56a001bcb116ba4dc7bb6"}
cmv90dueb000kkifye8tja66u	52	3	2026-10-15	قيد فحص التزامن	GENERAL			POSTED	cmv90du210000kifyidoaf4dt	2026-10-15 03:58:24.035	2026-10-15 03:58:24.065	cmv90du210000kifyidoaf4dt	\N	req-conc-1792036704004	{"requestHash": "626e955a58fa6fab5f0440c99e51e941f4e5f68a7401f9deb91d42a2bedabf84"}
cmv90duhp000tkifyzawlt1l3	52	4	2026-10-15	عكس قيد 3	GENERAL			POSTED	cmv90du210000kifyidoaf4dt	2026-10-15 03:58:24.157	2026-10-15 03:58:24.155	cmv90du210000kifyidoaf4dt	cmv90dueb000kkifye8tja66u	reversal:cmv90dueb000kkifye8tja66u	{"requestHash": "45fd708ee0588074cc284cacef229778f3abb2fb3ab970f87b1daee2f296a512"}
cmv90elvs0002kiklan91f9oj	54	1	2026-10-15	مبيعات نقدية أصلية	GENERAL			POSTED	cmv90elsv0000kikl5bpdtgeo	2026-10-15 03:58:59.657	2026-10-15 03:58:59.705	cmv90elsv0000kikl5bpdtgeo	\N	req-orig-1792036739592	{"requestHash": "ea7bb4b03fc304856ddccfa09477b9d1ddcfd39bf5fb84b81a145d68c7108ef5"}
cmvaj16ys0001kixh47scsg1f	19	12	2026-10-16	اضاغة تدريب	STOCK	RECEIPT		POSTED	cmv77bo3o0003kio3j3za86nt	2026-10-16 05:28:12.675	2026-10-16 05:28:12.669	cmv77bo3o0003kio3j3za86nt	\N	stock:17cfaf9e-c24a-42f1-a486-f81fbd97bda4	{"requestHash": "abc50baca8a29459cf6543e06822d25b124a910241de960cc00dc02b73d1a968"}
cmv90elzq000bkikl82htfi52	54	2	2026-10-15	عكس قيد 1	GENERAL			POSTED	cmv90elsv0000kikl5bpdtgeo	2026-10-15 03:58:59.798	2026-10-15 03:58:59.796	cmv90elsv0000kikl5bpdtgeo	cmv90elvs0002kiklan91f9oj	reversal:cmv90elvs0002kiklan91f9oj	{"requestHash": "c461ebd490af13883022b303390310be5ff5a89e67009b649918dc1b6f88e0ca"}
cmvapbnfb000bkiqe5s0728a9	67	1	2026-10-10	توريد بضاعة للمخزن الرئيسي	STOCK	RECEIPT	REC-100	POSTED	cmvapbn4u0000kiqev4ikb8rl	2026-10-16 08:24:18.264	2026-10-16 08:24:18.26	cmvapbn4u0000kiqev4ikb8rl	\N	stock:req-rec-001	{"requestHash": "077e9e20034fe38f8b3828ef727ae5846d155a844ea09136981e852066f7a511"}
cmv90em51000kkikl8ntmtqgg	54	3	2026-10-15	قيد فحص التزامن	GENERAL			POSTED	cmv90elsv0000kikl5bpdtgeo	2026-10-15 03:58:59.989	2026-10-15 03:59:00.038	cmv90elsv0000kikl5bpdtgeo	\N	req-conc-1792036739962	{"requestHash": "ee5a4f4ff03a063b6a4b6c4b6e8e869a39728a2e9c82c938e3b3a637f33d053f"}
cmv90em96000tkikltn6pciu3	54	4	2026-10-15	عكس قيد 3	GENERAL			POSTED	cmv90elsv0000kikl5bpdtgeo	2026-10-15 03:59:00.138	2026-10-15 03:59:00.136	cmv90elsv0000kikl5bpdtgeo	cmv90em51000kkikl8ntmtqgg	reversal:cmv90em51000kkikl8ntmtqgg	{"requestHash": "a9f233b25d84f587c4faef2b97a9ff1fced5e823225387c8badcb5ea26e6c922"}
cmv90ewqj0002kin2tzyynfs0	55	1	2026-10-15	مبيعات نقدية أصلية	GENERAL			POSTED	cmv90ewo80000kin281wflsiw	2026-10-15 03:59:13.723	2026-10-15 03:59:13.773	cmv90ewo80000kin281wflsiw	\N	req-orig-1792036753675	{"requestHash": "00198f9b7071df69c7c54cdfbbb194f18e97e2eb6d921b2b58900c330ea80bb4"}
cmv90ewum000bkin2113xbx6f	55	2	2026-10-15	عكس قيد 1	GENERAL			POSTED	cmv90ewo80000kin281wflsiw	2026-10-15 03:59:13.87	2026-10-15 03:59:13.869	cmv90ewo80000kin281wflsiw	cmv90ewqj0002kin2tzyynfs0	reversal:cmv90ewqj0002kin2tzyynfs0	{"requestHash": "1e380e6a49cfdb33f4227feafaf1bfd43b42f6744ec61d5b20ae7a78ba4b8ca8"}
cmv90ewza000kkin2oppnuv6x	55	3	2026-10-15	قيد فحص التزامن	GENERAL			POSTED	cmv90ewo80000kin281wflsiw	2026-10-15 03:59:14.038	2026-10-15 03:59:14.079	cmv90ewo80000kin281wflsiw	\N	req-conc-1792036754006	{"requestHash": "d68479636aa1a86dab8b574e91d2a59fb7368fb3fe597ecfa883c8e6f7db9c81"}
cmv90ex2s000tkin2dv854hu6	55	4	2026-10-15	عكس قيد 3	GENERAL			POSTED	cmv90ewo80000kin281wflsiw	2026-10-15 03:59:14.165	2026-10-15 03:59:14.162	cmv90ewo80000kin281wflsiw	cmv90ewza000kkin2oppnuv6x	reversal:cmv90ewza000kkin2oppnuv6x	{"requestHash": "e595cd8d82f3dba7f3116c983969bdf59fc67cf67022c63982e84631287c1150"}
\.


--
-- Data for Name: JournalLine; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."JournalLine" (id, "entryId", "companyId", "accountCode", debit, credit, description, party, "costCenter", "costType", "costItem", season, farm, pivot, "cashFlow") FROM stdin;
cmuwrar270003ki5l0f59osxy	cmuwrar260001ki5ll6kzh8vl	2	120101	750.00	0.00									
cmuwrar270004ki5lptzroz8v	cmuwrar260001ki5ll6kzh8vl	2	31	0.00	750.00									
cmuwrarib000cki5l44rlpxjw	cmuwrarib000aki5lojrj5a5a	2	120101	0.00	750.00									
cmuwrarib000dki5lv82wminb	cmuwrarib000aki5lojrj5a5a	2	31	750.00	0.00									
cmuwras360015ki5lfehx028d	cmuwras360013ki5lnz5rbehq	2	120401	1000.00	0.00									
cmuwras360016ki5lfzmmzir9	cmuwras360013ki5lnz5rbehq	2	31	0.00	1000.00									
cmuwras76001gki5lbhyd7dev	cmuwras75001eki5ltiazhypv	2	5101	2000.00	0.00									
cmuwras76001hki5lydge4r7i	cmuwras75001eki5ltiazhypv	2	210101	0.00	2000.00		SUPP_QA							
cmuwrasc7001xki5lj3k2erfu	cmuwrasc7001vki5l5tkg0n85	2	120101	1500.00	0.00		CUST_QA							
cmuwrasc7001yki5l7ymrd2bd	cmuwrasc7001vki5l5tkg0n85	2	4101	0.00	1500.00									
cmuwrasig0026ki5lid7oevje	cmuwrasig0024ki5l8ai4sgli	2	120401	1250.00	0.00									
cmuwrasig0027ki5lkqeyfcy0	cmuwrasig0024ki5l8ai4sgli	2	5106	0.00	1250.00									
cmuwrasr8002iki5lgberulg6	cmuwrasr8002gki5lnh1dkcrw	2	5101	1250.00	0.00									
cmuwrasr8002jki5l16p0lupx	cmuwrasr8002gki5lnh1dkcrw	2	210101	0.00	1250.00		SUPP_QA							
cmuwrat0m002vki5lvz4ku3j6	cmuwrat0m002tki5ldccowhjt	2	5101	0.00	250.00									
cmuwrat0m002wki5li1kuahi0	cmuwrat0m002tki5ldccowhjt	2	210101	250.00	0.00		SUPP_QA							
cmuwrat4x003cki5lqdzxie8f	cmuwrat4x003aki5lle3rq003	2	120101	0.00	150.00		CUST_QA							
cmuwrat4x003dki5l1rxf0ftd	cmuwrat4x003aki5lle3rq003	2	4101	150.00	0.00									
cmuwraxre003tki5ldih8ij1n	cmuwraxre003rki5lwavikn7c	2	120101	100.00	0.00									
cmuwraxre003uki5li2ugf5b6	cmuwraxre003rki5lwavikn7c	2	31	0.00	100.00									
cmuwt16y10042ki5lar9g5klc	cmuwt16y10040ki5lt22fch05	3	120101	750.00	0.00									
cmuwt16y10043ki5l35ivdgtb	cmuwt16y10040ki5lt22fch05	3	31	0.00	750.00									
cmuwt17aq004bki5lnnoln7bo	cmuwt17ap0049ki5l3w6szkp3	3	120101	0.00	750.00									
cmuwt17aq004cki5l9fe1yol1	cmuwt17ap0049ki5l3w6szkp3	3	31	750.00	0.00									
cmuwt17ok0054ki5l2o8gok5d	cmuwt17ok0052ki5lo2tl7h8i	3	120401	1000.00	0.00									
cmuwt17ok0055ki5levejf26g	cmuwt17ok0052ki5lo2tl7h8i	3	31	0.00	1000.00									
cmuwt17sf005fki5lcfzi9u2g	cmuwt17se005dki5lydn1mu4w	3	5101	2000.00	0.00									
cmuwt17sf005gki5lx6vnw2s6	cmuwt17se005dki5lydn1mu4w	3	210101	0.00	2000.00		SUPP_QA							
cmuwt17xd005wki5lvv9dwnoe	cmuwt17xd005uki5l7qb6eaa1	3	120101	1500.00	0.00		CUST_QA							
cmuwt17xd005xki5l21e9z2xc	cmuwt17xd005uki5l7qb6eaa1	3	4101	0.00	1500.00									
cmuwt182i0065ki5lfwm5sntz	cmuwt182i0063ki5lp1ph0b8c	3	120401	1250.00	0.00									
cmuwt182i0066ki5ljaetae75	cmuwt182i0063ki5lp1ph0b8c	3	5106	0.00	1250.00									
cmuwt18bv006hki5lep06w859	cmuwt18bv006fki5l679nnfs8	3	5101	1250.00	0.00									
cmuwt18bv006iki5l3tzhvcmf	cmuwt18bv006fki5l679nnfs8	3	210101	0.00	1250.00		SUPP_QA							
cmuwt18q6006uki5le4ah6tx6	cmuwt18q6006ski5lftqachod	3	5101	0.00	250.00									
cmuwt18q6006vki5lgb7dxw1h	cmuwt18q6006ski5lftqachod	3	210101	250.00	0.00		SUPP_QA							
cmuwt192m007bki5luk3c3sv4	cmuwt192l0079ki5lyhpnzkvn	3	120101	0.00	150.00		CUST_QA							
cmuwt192m007cki5l154mqh24	cmuwt192l0079ki5lyhpnzkvn	3	4101	150.00	0.00									
cmuwt19tw008cki5l2j9k02o7	cmuwt19tw008aki5langdb7ss	3	5101	1000.00	0.00			CC_MFG	MANUFACTURING	تكلفة المواد الخام الأساسية (لحوم، توابل، إضافات غذائية)				
cmuwt19tw008dki5l5fg5f4qm	cmuwt19tw008aki5langdb7ss	3	5101	500.00	0.00			CC_MFG	MANUFACTURING	أجور عمال خطوط الإنتاج والتشغيل المباشر				
cmuwt19tw008eki5llaka2188	cmuwt19tw008aki5langdb7ss	3	120101	0.00	1500.00									
cmuwt1a1t008qki5l78k84vo8	cmuwt1a1t008oki5lvymb7neb	3	5101	2000.00	0.00			CC_ANIMAL	ANIMAL	شراء أو استئجار الأرض				
cmuwt1a1t008rki5lkxuobza3	cmuwt1a1t008oki5lvymb7neb	3	5101	300.00	0.00			CC_ANIMAL	ANIMAL	الرعاية البيطرية والتحصينات				
cmuwt1a1t008ski5lkk78u2h3	cmuwt1a1t008oki5lvymb7neb	3	120101	0.00	2300.00									
cmuwt1a9c0094ki5lpmgrva8y	cmuwt1a9b0092ki5lxoelmfpy	3	5101	800.00	0.00			CC_FARMING	FARMING	جرار زراعى	S1	F1	P1	
cmuwt1a9c0095ki5lsfoqtfkb	cmuwt1a9b0092ki5lxoelmfpy	3	120101	0.00	800.00									
cmuwt1ah3009hki5l3wtk2c2l	cmuwt1ah2009fki5lvqvlstoz	3	5101	600.00	0.00			CC_EXPORT	EXPORT	رسوم موازين				
cmuwt1ah3009iki5llvn9e0kx	cmuwt1ah2009fki5lvqvlstoz	3	120101	0.00	600.00									
cmuwt1aoy009uki5lpit2dghg	cmuwt1aoy009ski5l28nzxeu1	3	5101	1200.00	0.00			CC_IMPORT	IMPORT	مصروفات تصديق فاتورة و شهادة منشا و مناولة ميناء				
cmuwt1aoy009vki5lzzvw9spc	cmuwt1aoy009ski5l28nzxeu1	3	120101	0.00	1200.00									
cmuwt1ge100a7ki5lg3wp4n23	cmuwt1ge100a5ki5l2hopaj4g	3	120101	100.00	0.00									
cmuwt1ge100a8ki5l2z75fs5s	cmuwt1ge100a5ki5l2hopaj4g	3	31	0.00	100.00									
cmuwt89te00akki5l3h71xnqo	cmuwt89te00aiki5lh4hyshag	4	120101	750.00	0.00									
cmuwt89tf00alki5l2m66y0wr	cmuwt89te00aiki5lh4hyshag	4	31	0.00	750.00									
cmuwt8a4g00atki5lucc2g82y	cmuwt8a4g00arki5lt9txrrtk	4	120101	0.00	750.00									
cmuwt8a4g00auki5l6m9v0v9p	cmuwt8a4g00arki5lt9txrrtk	4	31	750.00	0.00									
cmuwt8ai400bmki5lqmxtlasu	cmuwt8ai400bkki5l2efpok1g	4	120401	1000.00	0.00									
cmuwt8ai400bnki5l00w6ss5h	cmuwt8ai400bkki5l2efpok1g	4	31	0.00	1000.00									
cmuwt8alo00bxki5l28lkffez	cmuwt8aln00bvki5lte5z8jgz	4	5101	2000.00	0.00									
cmuwt8alo00byki5lmiuixc6r	cmuwt8aln00bvki5lte5z8jgz	4	210101	0.00	2000.00		SUPP_QA							
cmuwt8aqe00ceki5lqzmudybu	cmuwt8aqe00ccki5l63e7asa6	4	120101	1500.00	0.00		CUST_QA							
cmuwt8aqe00cfki5l92o87qx2	cmuwt8aqe00ccki5l63e7asa6	4	4101	0.00	1500.00									
cmuwt8aw800cnki5lnkysl12j	cmuwt8aw700clki5l92wfa4sc	4	120401	1250.00	0.00									
cmuwt8aw800coki5ltppjjln4	cmuwt8aw700clki5l92wfa4sc	4	5106	0.00	1250.00									
cmuwt8b4b00czki5ldv2m1l8v	cmuwt8b4a00cxki5lzatlp6bb	4	5101	1250.00	0.00									
cmuwt8b4b00d0ki5ln7g5nb9f	cmuwt8b4a00cxki5lzatlp6bb	4	210101	0.00	1250.00		SUPP_QA							
cmuwt8bjm00dcki5l1flfz8uu	cmuwt8bjm00daki5l46cwhf05	4	5101	0.00	250.00									
cmuwt8bjm00ddki5lrzb3xgnl	cmuwt8bjm00daki5l46cwhf05	4	210101	250.00	0.00		SUPP_QA							
cmuwt8bzz00dtki5lg25sghlb	cmuwt8bzz00drki5lelu2fbe0	4	120101	0.00	150.00		CUST_QA							
cmuwt8bzz00duki5lss6dl1tg	cmuwt8bzz00drki5lelu2fbe0	4	4101	150.00	0.00									
cmuwt8cot00euki5laquprkzn	cmuwt8cot00eski5lbmvy3lol	4	5101	1000.00	0.00			CC_MFG	MANUFACTURING	تكلفة المواد الخام الأساسية (لحوم، توابل، إضافات غذائية)				
cmuwt8cot00evki5la8voc25v	cmuwt8cot00eski5lbmvy3lol	4	5101	500.00	0.00			CC_MFG	MANUFACTURING	أجور عمال خطوط الإنتاج والتشغيل المباشر				
cmuwt8cot00ewki5lqciiu4iz	cmuwt8cot00eski5lbmvy3lol	4	120101	0.00	1500.00									
cmuwt8cvj00f8ki5lb343v193	cmuwt8cvj00f6ki5lst28gw4k	4	5101	2000.00	0.00			CC_ANIMAL	ANIMAL	شراء أو استئجار الأرض				
cmuwt8cvj00f9ki5l719jmzrp	cmuwt8cvj00f6ki5lst28gw4k	4	5101	300.00	0.00			CC_ANIMAL	ANIMAL	الرعاية البيطرية والتحصينات				
cmuwt8cvj00faki5l5f51ysfs	cmuwt8cvj00f6ki5lst28gw4k	4	120101	0.00	2300.00									
cmuwt8d2v00fmki5lojhqe457	cmuwt8d2v00fkki5lzjmo18ae	4	5101	800.00	0.00			CC_FARMING	FARMING	جرار زراعى	S1	F1	P1	
cmuwt8d2v00fnki5lrnmnhzq7	cmuwt8d2v00fkki5lzjmo18ae	4	120101	0.00	800.00									
cmuwt8dbc00fzki5lxfmxii0o	cmuwt8dbb00fxki5l5tjx9e15	4	5101	600.00	0.00			CC_EXPORT	EXPORT	رسوم موازين				
cmuwt8dbc00g0ki5lunba78up	cmuwt8dbb00fxki5l5tjx9e15	4	120101	0.00	600.00									
cmuwt8dj400gcki5lx72nfu3y	cmuwt8dj400gaki5l7f2n4n7b	4	5101	1200.00	0.00			CC_IMPORT	IMPORT	مصروفات تصديق فاتورة و شهادة منشا و مناولة ميناء				
cmuwt8dj400gdki5lqojh74ym	cmuwt8dj400gaki5l7f2n4n7b	4	120101	0.00	1200.00									
cmuwt8k1300gpki5ln1ne84ex	cmuwt8k1200gnki5lzeodi9g0	4	120101	100.00	0.00									
cmuwt8k1300gqki5lx1sh23lt	cmuwt8k1200gnki5lzeodi9g0	4	31	0.00	100.00									
cmuwtfug100hiki5ls8eh52by	cmuwtfug100hgki5lvt2p4dio	5	120101	750.00	0.00									
cmuwtfug100hjki5lxdh7kr6o	cmuwtfug100hgki5lvt2p4dio	5	31	0.00	750.00									
cmuwtfus900hrki5lxuoi739f	cmuwtfus900hpki5lhyfp9mwm	5	120101	0.00	750.00									
cmuwtfus900hski5lxixhjyw6	cmuwtfus900hpki5lhyfp9mwm	5	31	750.00	0.00									
cmuwtfv6i00ikki5lbeeqaypw	cmuwtfv6h00iiki5l0e1qqgav	5	120401	1000.00	0.00									
cmuwtfv6i00ilki5l6h496hed	cmuwtfv6h00iiki5l0e1qqgav	5	31	0.00	1000.00									
cmuwtfvbd00ivki5l17yuhsvl	cmuwtfvbd00itki5l4nxr3q9q	5	5101	2000.00	0.00									
cmuwtfvbd00iwki5l2o4nggms	cmuwtfvbd00itki5l4nxr3q9q	5	210101	0.00	2000.00		SUPP_QA							
cmuwtfvfv00jcki5lbh7udzkj	cmuwtfvfv00jaki5lvs0b92rg	5	120101	1500.00	0.00		CUST_QA							
cmuwtfvfv00jdki5l4h51evk1	cmuwtfvfv00jaki5lvs0b92rg	5	4101	0.00	1500.00									
cmuwtfvkc00jlki5lh4d9z9li	cmuwtfvkc00jjki5lmpv2nzrn	5	120401	1250.00	0.00									
cmuwtfvkc00jmki5l0nfhychq	cmuwtfvkc00jjki5lmpv2nzrn	5	5106	0.00	1250.00									
cmuwtfvs600jxki5lyepb60e8	cmuwtfvs600jvki5lu1l4fce0	5	5101	1250.00	0.00									
cmuwtfvs700jyki5ll7yior45	cmuwtfvs600jvki5lu1l4fce0	5	210101	0.00	1250.00		SUPP_QA							
cmuwtfw7s00kaki5lt285ph33	cmuwtfw7s00k8ki5lvz0edxal	5	5101	0.00	250.00									
cmuwtfw7s00kbki5lype760gv	cmuwtfw7s00k8ki5lvz0edxal	5	210101	250.00	0.00		SUPP_QA							
cmuwtfwkj00krki5lqbkz6oq6	cmuwtfwkj00kpki5l9hczi4uc	5	120101	0.00	150.00		CUST_QA							
cmuwtfwkj00kski5l8gbr7fmk	cmuwtfwkj00kpki5l9hczi4uc	5	4101	150.00	0.00									
cmuwtfx7w00lski5l6guxe7bv	cmuwtfx7v00lqki5l1xrjink7	5	5101	1000.00	0.00			CC_MFG	MANUFACTURING	تكلفة المواد الخام الأساسية (لحوم، توابل، إضافات غذائية)				
cmuwtfx7w00ltki5llid31sf2	cmuwtfx7v00lqki5l1xrjink7	5	5101	500.00	0.00			CC_MFG	MANUFACTURING	أجور عمال خطوط الإنتاج والتشغيل المباشر				
cmuwtfx7w00luki5lxdf3p7mh	cmuwtfx7v00lqki5l1xrjink7	5	120101	0.00	1500.00									
cmuwtfxfh00m6ki5la9tph3vm	cmuwtfxfh00m4ki5ltzluq82l	5	5101	2000.00	0.00			CC_ANIMAL	ANIMAL	شراء أو استئجار الأرض				
cmuwtfxfh00m7ki5l7o7afa3x	cmuwtfxfh00m4ki5ltzluq82l	5	5101	300.00	0.00			CC_ANIMAL	ANIMAL	الرعاية البيطرية والتحصينات				
cmuwtfxfh00m8ki5lv8u2s4l5	cmuwtfxfh00m4ki5ltzluq82l	5	120101	0.00	2300.00									
cmuwtfxnl00mkki5lfk9j9us1	cmuwtfxnl00miki5ltmu5atar	5	5101	800.00	0.00			CC_FARMING	FARMING	جرار زراعى	S1	F1	P1	
cmuwtfxnl00mlki5lngscs7r1	cmuwtfxnl00miki5ltmu5atar	5	120101	0.00	800.00									
cmuwtfxw800mxki5l5f46zuz6	cmuwtfxw800mvki5ljau2ehix	5	5101	600.00	0.00			CC_EXPORT	EXPORT	رسوم موازين				
cmuwtfxw800myki5l9y0e97vk	cmuwtfxw800mvki5ljau2ehix	5	120101	0.00	600.00									
cmuwtfy4l00naki5ld3wonu3e	cmuwtfy4l00n8ki5ldckra65n	5	5101	1200.00	0.00			CC_IMPORT	IMPORT	مصروفات تصديق فاتورة و شهادة منشا و مناولة ميناء				
cmuwtfy4l00nbki5lnb8kja39	cmuwtfy4l00n8ki5ldckra65n	5	120101	0.00	1200.00									
cmuwtg1tn00nnki5li662jdwr	cmuwtg1tn00nlki5lpfpreory	5	120101	100.00	0.00									
cmuwtg1tn00noki5lunib6p50	cmuwtg1tn00nlki5lpfpreory	5	31	0.00	100.00									
cmv6yk1i20003ki80j7nbg5kc	cmv6yk1i20001ki80zvkk5xqp	8	1101	1200.00	0.00									
cmv6yk1i20004ki80atqk98n8	cmv6yk1i20001ki80zvkk5xqp	8	1102	0.00	1200.00									
cmv6ymg18000cki80kweda0dx	cmv6ymg18000aki80fsm8kdhu	9	1101	1200.00	0.00									
cmv6ymg18000dki80cpe0mpj1	cmv6ymg18000aki80fsm8kdhu	9	1102	0.00	1200.00									
cmv6yoop0000pki80zggmm05x	cmv6yoop0000nki80zsmlsgrx	10	1101	1200.00	0.00									
cmv6yoop0000qki805dk12hpo	cmv6yoop0000nki80zsmlsgrx	10	1102	0.00	1200.00									
cmv6yoruz0016ki80dnmbod8l	cmv6yoruz0014ki80kghc1b0w	10	1102	250.00	0.00									
cmv6yoruz0017ki80wua7wi5u	cmv6yoruz0014ki80kghc1b0w	10	1101	0.00	250.00									
cmv78fy7e0007kib8fmpz7xqt	cmv78fy7e0005kib8r90dk547	19	120101	10000.00	0.00									
cmv78fy7e0008kib8utfhgmwl	cmv78fy7e0005kib8r90dk547	19	31	0.00	10000.00									
cmv78ukfz000gkib8yu75v2uf	cmv78ukfv000ekib8yimklmwq	19	120101	2000.00	0.00									
cmv78ukfz000hkib89c5au29o	cmv78ukfv000ekib8yimklmwq	19	4102	0.00	2000.00									
cmv792zbh0003kixqlt66zc4f	cmv792zbh0001kixqzhtrq19c	19	210302	500.00	0.00									
cmv792zbh0004kixqdperzd67	cmv792zbh0001kixqzhtrq19c	19	120101	0.00	500.00									
cmv79hlxf0003kiks7g1x7gpw	cmv79hlxf0001kiksk03xhf4v	19	120501	1500.00	0.00		TRAIN-C01							
cmv79hlxf0004kiks06u9s6mj	cmv79hlxf0001kiksk03xhf4v	19	4102	0.00	1500.00									
cmv79u900000ckikslbag2oru	cmv79u8zz000akikstgvar3nm	19	120101	1000.00	0.00									
cmv79u900000dkiks23v2gj20	cmv79u8zz000akikstgvar3nm	19	120501	0.00	1000.00		TRAIN-C01							
cmv7d1wyc000lkiks9t0dlz7i	cmv7d1wyb000jkiksrk0385dg	19	5303	300.00	0.00									
cmv7d1wyc000mkiks3dfen80i	cmv7d1wyb000jkiksrk0385dg	19	210101	0.00	300.00		TRAIN-S01							
cmv7krrmn000ukiks6urnty79	cmv7krrmn000skiksf8gx036w	19	120101	0.00	200.00									
cmv7krrmn000vkiks62wgfygf	cmv7krrmn000skiksf8gx036w	19	210101	200.00	0.00		TRAIN-S01							
cmv7llwaa0013kikswfgctysp	cmv7llwaa0011kikszh5hzn1a	19	210302	0.00	500.00									
cmv7llwaa0014kiks0oqfmmhv	cmv7llwaa0011kikszh5hzn1a	19	5302	500.00	0.00									
cmv8zq8i60007kiyu870wgbye	cmv8zq8i60005kiyu2ct6oo32	19	120101	100.00	0.00									
cmv8zq8i60008kiyu6l3zcxcs	cmv8zq8i60005kiyu2ct6oo32	19	4102	0.00	100.00									
cmv8zu3oa000gkiyupfzlbpzw	cmv8zu3oa000ekiyuxap4d0b3	19	120101	0.00	100.00									
cmv8zu3oa000hkiyug7190v7n	cmv8zu3oa000ekiyuxap4d0b3	19	4102	100.00	0.00									
cmv909c8v000pkiyut17h7rzl	cmv909c8u000nkiyu7bg8ohrb	19	120101	0.00	50.00									
cmv909c8v000qkiyu1uslw12s	cmv909c8u000nkiyu7bg8ohrb	19	5302	50.00	0.00									
cmv90cxt20004kidah9jyn594	cmv90cxt10002kidacpjay6x2	51	101	5000.00	0.00									
cmv90cxt20005kidas9uy6fjm	cmv90cxt10002kidacpjay6x2	51	401	0.00	5000.00									
cmv90cy4j000dkida46lovx7c	cmv90cy4j000bkida5kwywvfy	51	101	3000.00	0.00									
cmv90cy4k000ekidahhxwz7qp	cmv90cy4j000bkida5kwywvfy	51	401	0.00	3000.00									
cmv90du4n0004kifyx87oscuj	cmv90du4m0002kifyzse28vkf	52	101	5000.00	0.00									
cmv90du4n0005kifyji70o7g3	cmv90du4m0002kifyzse28vkf	52	401	0.00	5000.00									
cmv90du9p000dkifykdsda7k0	cmv90du9p000bkifyc5hedz0h	52	101	0.00	5000.00									
cmv90du9p000ekifyw9b24bs5	cmv90du9p000bkifyc5hedz0h	52	401	5000.00	0.00									
cmv90dueb000mkifyx7gcccu5	cmv90dueb000kkifye8tja66u	52	101	3000.00	0.00									
cmv90dueb000nkifyphgoepjh	cmv90dueb000kkifye8tja66u	52	401	0.00	3000.00									
cmv90duhp000vkify0jt3s96a	cmv90duhp000tkifyzawlt1l3	52	101	0.00	3000.00									
cmv90duhp000wkifyq6dcrbv1	cmv90duhp000tkifyzawlt1l3	52	401	3000.00	0.00									
cmv90elvt0004kikli0b73tyf	cmv90elvs0002kiklan91f9oj	54	101	5000.00	0.00									
cmv90elvt0005kikl5z9ruxhk	cmv90elvs0002kiklan91f9oj	54	401	0.00	5000.00									
cmv90elzq000dkiklvgdwho6e	cmv90elzq000bkikl82htfi52	54	101	0.00	5000.00									
cmv90elzq000ekiklh1y85z80	cmv90elzq000bkikl82htfi52	54	401	5000.00	0.00									
cmv90em51000mkiklkzxdqft5	cmv90em51000kkikl8ntmtqgg	54	101	3000.00	0.00									
cmv90em51000nkikld44ux55u	cmv90em51000kkikl8ntmtqgg	54	401	0.00	3000.00									
cmv90em96000vkiklpd81rmir	cmv90em96000tkikltn6pciu3	54	101	0.00	3000.00									
cmv90em96000wkiklkk2nomxv	cmv90em96000tkikltn6pciu3	54	401	3000.00	0.00									
cmv90ewqj0004kin2b8t1wit9	cmv90ewqj0002kin2tzyynfs0	55	101	5000.00	0.00									
cmv90ewqj0005kin2cxvdwqcn	cmv90ewqj0002kin2tzyynfs0	55	401	0.00	5000.00									
cmv90ewum000dkin2tul7f6sj	cmv90ewum000bkin2113xbx6f	55	101	0.00	5000.00									
cmv90ewum000ekin2t4b6yexo	cmv90ewum000bkin2113xbx6f	55	401	5000.00	0.00									
cmv90ewza000mkin2l2xmya3z	cmv90ewza000kkin2oppnuv6x	55	101	3000.00	0.00									
cmv90ewza000nkin2vwsmu2zq	cmv90ewza000kkin2oppnuv6x	55	401	0.00	3000.00									
cmv90ex2t000vkin24mvqwhpx	cmv90ex2s000tkin2dv854hu6	55	101	0.00	3000.00									
cmv90ex2t000wkin2fijrgs14	cmv90ex2s000tkin2dv854hu6	55	401	3000.00	0.00									
cmvapbnfc000dkiqe6gje3d0s	cmvapbnfb000bkiqe5s0728a9	67	501	2000.00	0.00									
cmvapbnfc000ekiqewuhkfhuv	cmvapbnfb000bkiqe5s0728a9	67	201	0.00	2000.00									
cmvaj16ys0003kixhnbgofbps	cmvaj16ys0001kixh47scsg1f	19	5101	2000.00	0.00									
cmvaj16ys0004kixh492lcpq4	cmvaj16ys0001kixh47scsg1f	19	210101	0.00	2000.00									
cmvb970i1000bkib7kcvdi94a	cmvb970i00009kib7kuh4kf6s	19	120101	0.00	300.00									
cmvb970i1000ckib7dqo3k9sh	cmvb970i00009kib7kuh4kf6s	19	120603	300.00	0.00									
cmvb9ez66000okib7fwh0gvxw	cmvb9ez65000mkib7ll1tny2y	19	120101	0.00	1000.00									
cmvb9ez66000pkib7lsh2xyr0	cmvb9ez65000mkib7ll1tny2y	19	210302	1000.00	0.00									
\.


--
-- Data for Name: LoginAttempt; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LoginAttempt" (key, count, "expiresAt") FROM stdin;
6e065bd56bb849bd0d418fe9c61ca70246ee5214d81712f3d96d72b8402be985	1	2026-10-17 06:12:51.876
\.


--
-- Data for Name: Register; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Register" (id, "companyId", kind, code, name, data, "isActive", version, "createdAt", "updatedAt") FROM stdin;
cmuwrarp0000jki5l40587sc9	2	warehouses	W_QA_MAIN	مخزن QA الرئيسي	{"type": "WAREHOUSE", "parent": "", "address": ""}	t	1	2026-10-06 14:10:49.908	2026-10-06 14:10:49.908
cmuwrarr7000nki5lump3oy4v	2	parties	SUPP_QA	مورد تجريبي QA	{"type": "SUPPLIER", "phone": "", "share": "0", "address": "", "taxNumber": "", "accountCode": "210101"}	t	1	2026-10-06 14:10:49.988	2026-10-06 14:10:49.988
cmuwrartr000rki5lsgq1favy	2	parties	CUST_QA	عميل تجريبي QA	{"type": "CUSTOMER", "phone": "", "share": "0", "address": "", "taxNumber": "", "accountCode": "120101"}	t	1	2026-10-06 14:10:50.079	2026-10-06 14:10:50.079
cmuwrarw4000vki5ly1957qgi	2	items	ITEM_QA_ALPHA	صنف اختبار QA الأساسي	{"unit": "kg", "category": "خام", "salesAccount": "4101", "expenseAccount": "5106", "purchaseAccount": "5101", "inventoryAccount": "120401"}	t	1	2026-10-06 14:10:50.164	2026-10-06 14:10:50.164
cmuwt17f0004iki5lpu5vqlpz	3	warehouses	W_QA_MAIN	مخزن QA الرئيسي	{"type": "WAREHOUSE", "parent": "", "address": ""}	t	1	2026-10-06 14:59:22.956	2026-10-06 14:59:22.956
cmuwt17gs004mki5ldgzwhpy8	3	parties	SUPP_QA	مورد تجريبي QA	{"type": "SUPPLIER", "phone": "", "share": "0", "address": "", "taxNumber": "", "accountCode": "210101"}	t	1	2026-10-06 14:59:23.02	2026-10-06 14:59:23.02
cmuwt17i8004qki5lkuig740t	3	parties	CUST_QA	عميل تجريبي QA	{"type": "CUSTOMER", "phone": "", "share": "0", "address": "", "taxNumber": "", "accountCode": "120101"}	t	1	2026-10-06 14:59:23.072	2026-10-06 14:59:23.072
cmuwt17k6004uki5ligwyyf0z	3	items	ITEM_QA_ALPHA	صنف اختبار QA الأساسي	{"unit": "kg", "category": "خام", "salesAccount": "4101", "expenseAccount": "5106", "purchaseAccount": "5101", "inventoryAccount": "120401"}	t	1	2026-10-06 14:59:23.143	2026-10-06 14:59:23.143
cmuwt19lu007qki5lvmhpmhtz	3	cost-centers	CC_MFG	مركز تصنيع تجريبي	{"farm": "", "type": "MANUFACTURING", "pivot": "", "parent": "", "season": ""}	t	1	2026-10-06 14:59:25.794	2026-10-06 14:59:25.794
cmuwt19ne007uki5lc5nkphin	3	cost-centers	CC_ANIMAL	مركز إنتاج حيواني تجريبي	{"farm": "", "type": "ANIMAL", "pivot": "", "parent": "", "season": ""}	t	1	2026-10-06 14:59:25.85	2026-10-06 14:59:25.85
cmuwt19p0007yki5lg689nzjn	3	cost-centers	CC_FARMING	مركز زراعي تجريبي	{"farm": "F1", "type": "FARMING", "pivot": "P1", "parent": "", "season": "S1"}	t	1	2026-10-06 14:59:25.908	2026-10-06 14:59:25.908
cmuwt19qd0082ki5liei2cwnb	3	cost-centers	CC_EXPORT	مركز تصدير تجريبي	{"farm": "", "type": "EXPORT", "pivot": "", "parent": "", "season": ""}	t	1	2026-10-06 14:59:25.958	2026-10-06 14:59:25.958
cmuwt19rw0086ki5lmzk54cj9	3	cost-centers	CC_IMPORT	مركز استيراد تجريبي	{"farm": "", "type": "IMPORT", "pivot": "", "parent": "", "season": ""}	t	1	2026-10-06 14:59:26.012	2026-10-06 14:59:26.012
cmuwt19xk008kki5lsis6va1t	3	cost-inputs	MANUFACTURING:CC_MFG:2026-01-01:2026-02-28	تكاليف التصنيع	{"C32": "100", "C34": "0.2"}	t	1	2026-10-06 14:59:26.216	2026-10-06 14:59:26.216
cmuwt1a56008yki5ln4v2y5xa	3	cost-inputs	ANIMAL:CC_ANIMAL:2026-01-01:2026-02-28	تكاليف انتاج حيوانى	{"C30": "10"}	t	1	2026-10-06 14:59:26.49	2026-10-06 14:59:26.49
cmuwt1acv009bki5lhzcypiob	3	cost-inputs	FARMING:CC_FARMING:2026-01-01:2026-02-28	تكاليف الزراعات	{"C126": "100"}	t	1	2026-10-06 14:59:26.767	2026-10-06 14:59:26.767
cmuwt1akw009oki5lqa49owd4	3	cost-inputs	EXPORT:CC_EXPORT:2026-01-01:2026-02-28	تكاليف التصدير	{"C61": "50"}	t	1	2026-10-06 14:59:27.056	2026-10-06 14:59:27.056
cmuwt1as500a1ki5l2e6zckmr	3	cost-inputs	IMPORT:CC_IMPORT:2026-01-01:2026-02-28	تكاليف الاستيراد	{"C35": "100", "C38": "50"}	t	1	2026-10-06 14:59:27.317	2026-10-06 14:59:27.317
cmuwt1nzl00aeki5l6nfveva4	3	cost-centers	CC_UI_6935	مركز تكلفة تجريبي من واجهة الويب	{"farm": "", "type": "FARMING", "pivot": "", "parent": "", "season": ""}	t	1	2026-10-06 14:59:44.434	2026-10-06 14:59:44.434
cmuwt8a8q00b0ki5lyr5xmssh	4	warehouses	W_QA_MAIN	مخزن QA الرئيسي	{"type": "WAREHOUSE", "parent": "", "address": ""}	t	1	2026-10-06 15:04:53.211	2026-10-06 15:04:53.211
cmuwt8aae00b4ki5lr953i6e4	4	parties	SUPP_QA	مورد تجريبي QA	{"type": "SUPPLIER", "phone": "", "share": "0", "address": "", "taxNumber": "", "accountCode": "210101"}	t	1	2026-10-06 15:04:53.27	2026-10-06 15:04:53.27
cmuwt8ach00b8ki5lzd303dpl	4	parties	CUST_QA	عميل تجريبي QA	{"type": "CUSTOMER", "phone": "", "share": "0", "address": "", "taxNumber": "", "accountCode": "120101"}	t	1	2026-10-06 15:04:53.345	2026-10-06 15:04:53.345
cmuwt8aec00bcki5lrave7mlo	4	items	ITEM_QA_ALPHA	صنف اختبار QA الأساسي	{"unit": "kg", "category": "خام", "salesAccount": "4101", "expenseAccount": "5106", "purchaseAccount": "5101", "inventoryAccount": "120401"}	t	1	2026-10-06 15:04:53.412	2026-10-06 15:04:53.412
cmuwt8cfv00e8ki5lkrhel434	4	cost-centers	CC_MFG	مركز تصنيع تجريبي	{"farm": "", "type": "MANUFACTURING", "pivot": "", "parent": "", "season": ""}	t	1	2026-10-06 15:04:56.06	2026-10-06 15:04:56.06
cmuwt8ch200ecki5l8vf0kkin	4	cost-centers	CC_ANIMAL	مركز إنتاج حيواني تجريبي	{"farm": "", "type": "ANIMAL", "pivot": "", "parent": "", "season": ""}	t	1	2026-10-06 15:04:56.103	2026-10-06 15:04:56.103
cmuwt8cii00egki5lqlx2gau5	4	cost-centers	CC_FARMING	مركز زراعي تجريبي	{"farm": "F1", "type": "FARMING", "pivot": "P1", "parent": "", "season": "S1"}	t	1	2026-10-06 15:04:56.155	2026-10-06 15:04:56.155
cmuwt8cl400ekki5l1d3p6gpv	4	cost-centers	CC_EXPORT	مركز تصدير تجريبي	{"farm": "", "type": "EXPORT", "pivot": "", "parent": "", "season": ""}	t	1	2026-10-06 15:04:56.248	2026-10-06 15:04:56.248
cmuwt8cmn00eoki5l00j8pbbg	4	cost-centers	CC_IMPORT	مركز استيراد تجريبي	{"farm": "", "type": "IMPORT", "pivot": "", "parent": "", "season": ""}	t	1	2026-10-06 15:04:56.303	2026-10-06 15:04:56.303
cmuwt8crx00f2ki5lvu3d2638	4	cost-inputs	MANUFACTURING:CC_MFG:2026-01-01:2026-02-28	تكاليف التصنيع	{"C32": "100", "C34": "0.2"}	t	1	2026-10-06 15:04:56.493	2026-10-06 15:04:56.493
cmuwt8cyw00fgki5ljbiqp1yu	4	cost-inputs	ANIMAL:CC_ANIMAL:2026-01-01:2026-02-28	تكاليف انتاج حيوانى	{"C30": "10"}	t	1	2026-10-06 15:04:56.744	2026-10-06 15:04:56.744
cmuwt8d6g00ftki5lniwr3nga	4	cost-inputs	FARMING:CC_FARMING:2026-01-01:2026-02-28	تكاليف الزراعات	{"C126": "100"}	t	1	2026-10-06 15:04:57.017	2026-10-06 15:04:57.017
cmuwt8dfa00g6ki5lzp1aod45	4	cost-inputs	EXPORT:CC_EXPORT:2026-01-01:2026-02-28	تكاليف التصدير	{"C61": "50", "D41": "0", "D42": "0", "E19": "0", "E20": "0"}	t	1	2026-10-06 15:04:57.334	2026-10-06 15:04:57.334
cmuwt8dmq00gjki5l8xt11li9	4	cost-inputs	IMPORT:CC_IMPORT:2026-01-01:2026-02-28	تكاليف الاستيراد	{"C12": "0", "C16": "0", "C35": "100", "C38": "50"}	t	1	2026-10-06 15:04:57.602	2026-10-06 15:04:57.602
cmuwt8qxh00gwki5l6cqg2zfq	4	cost-inputs	MANUFACTURING:CC_MFG:1900-01-01:9999-12-31	تكاليف التصنيع	{}	t	1	2026-10-06 15:05:14.837	2026-10-06 15:05:14.837
cmuwt8s8700h0ki5lo9mo20qp	4	cost-centers	CC_UI_9455	مركز تكلفة تجريبي من واجهة الويب	{"farm": "", "type": "MANUFACTURING", "pivot": "", "parent": "", "season": ""}	t	1	2026-10-06 15:05:16.519	2026-10-06 15:05:16.519
cmuwtc51o00h8ki5lri6n40k2	1	cost-centers	CC_TEST_2838	مركز تجريبي	{"farm": "", "type": "MANUFACTURING", "pivot": "", "parent": "", "season": ""}	t	1	2026-10-06 15:07:53.1	2026-10-06 15:07:53.1
cmuwtfuwx00hyki5l8x4xxpte	5	warehouses	W_QA_MAIN	مخزن QA الرئيسي	{"type": "WAREHOUSE", "parent": "", "address": ""}	t	1	2026-10-06 15:10:46.593	2026-10-06 15:10:46.593
cmuwtfuz900i2ki5l490t8zjm	5	parties	SUPP_QA	مورد تجريبي QA	{"type": "SUPPLIER", "phone": "", "share": "0", "address": "", "taxNumber": "", "accountCode": "210101"}	t	1	2026-10-06 15:10:46.678	2026-10-06 15:10:46.678
cmuwtfv1100i6ki5l5spmquwv	5	parties	CUST_QA	عميل تجريبي QA	{"type": "CUSTOMER", "phone": "", "share": "0", "address": "", "taxNumber": "", "accountCode": "120101"}	t	1	2026-10-06 15:10:46.741	2026-10-06 15:10:46.741
cmuwtfv2n00iaki5lu8onv5dm	5	items	ITEM_QA_ALPHA	صنف اختبار QA الأساسي	{"unit": "kg", "category": "خام", "salesAccount": "4101", "expenseAccount": "5106", "purchaseAccount": "5101", "inventoryAccount": "120401"}	t	1	2026-10-06 15:10:46.799	2026-10-06 15:10:46.799
cmuwtfwzn00l6ki5lcxv3r8rr	5	cost-centers	CC_MFG	مركز تصنيع تجريبي	{"farm": "", "type": "MANUFACTURING", "pivot": "", "parent": "", "season": ""}	t	1	2026-10-06 15:10:49.283	2026-10-06 15:10:49.283
cmuwtfx1f00laki5la16d0bx9	5	cost-centers	CC_ANIMAL	مركز إنتاج حيواني تجريبي	{"farm": "", "type": "ANIMAL", "pivot": "", "parent": "", "season": ""}	t	1	2026-10-06 15:10:49.347	2026-10-06 15:10:49.347
cmuwtfx3700leki5ldlybtkdd	5	cost-centers	CC_FARMING	مركز زراعي تجريبي	{"farm": "F1", "type": "FARMING", "pivot": "P1", "parent": "", "season": "S1"}	t	1	2026-10-06 15:10:49.412	2026-10-06 15:10:49.412
cmuwtfx4l00liki5lll2xlj91	5	cost-centers	CC_EXPORT	مركز تصدير تجريبي	{"farm": "", "type": "EXPORT", "pivot": "", "parent": "", "season": ""}	t	1	2026-10-06 15:10:49.461	2026-10-06 15:10:49.461
cmuwtfx5s00lmki5lr5zc0vte	5	cost-centers	CC_IMPORT	مركز استيراد تجريبي	{"farm": "", "type": "IMPORT", "pivot": "", "parent": "", "season": ""}	t	1	2026-10-06 15:10:49.504	2026-10-06 15:10:49.504
cmuwtfxbi00m0ki5lq815hojk	5	cost-inputs	MANUFACTURING:CC_MFG:2026-01-01:2026-02-28	تكاليف التصنيع	{"C32": "100", "C34": "0.2"}	t	1	2026-10-06 15:10:49.711	2026-10-06 15:10:49.711
cmuwtfxj500meki5lim2geu85	5	cost-inputs	ANIMAL:CC_ANIMAL:2026-01-01:2026-02-28	تكاليف انتاج حيوانى	{"C30": "10"}	t	1	2026-10-06 15:10:49.985	2026-10-06 15:10:49.985
cmuwtfxrf00mrki5lhxbtl9sh	5	cost-inputs	FARMING:CC_FARMING:2026-01-01:2026-02-28	تكاليف الزراعات	{"C126": "100"}	t	1	2026-10-06 15:10:50.283	2026-10-06 15:10:50.283
cmuwtfy0n00n4ki5lhol9vt1p	5	cost-inputs	EXPORT:CC_EXPORT:2026-01-01:2026-02-28	تكاليف التصدير	{"C61": "50", "D41": "0", "D42": "0", "E19": "0", "E20": "0"}	t	1	2026-10-06 15:10:50.615	2026-10-06 15:10:50.615
cmuwtfy7k00nhki5l3vsz1628	5	cost-inputs	IMPORT:CC_IMPORT:2026-01-01:2026-02-28	تكاليف الاستيراد	{"C12": "0", "C16": "0", "C35": "100", "C38": "50"}	t	1	2026-10-06 15:10:50.864	2026-10-06 15:10:50.864
cmuwtg8oj00nuki5lyj1tli30	5	cost-inputs	MANUFACTURING:CC_MFG:1900-01-01:9999-12-31	تكاليف التصنيع	{}	t	1	2026-10-06 15:11:04.435	2026-10-06 15:11:04.435
cmuwtg9om00nyki5ltpe5cpz7	5	cost-centers	CC_UI_2846	مركز تكلفة تجريبي من واجهة الويب	{"farm": "", "type": "MANUFACTURING", "pivot": "", "parent": "", "season": ""}	t	1	2026-10-06 15:11:05.734	2026-10-06 15:11:05.734
cmv0784sz0001kiwyxjcah7vq	1	employees	011	احمد	{"job": "مهندس", "notes": "", "phone": "01211563104", "address": "مصر", "startDate": "2026-10-10", "basicSalary": "0200000", "advanceAccount": "", "expenseAccount": "", "payableAccount": "", "insuranceAccount": ""}	t	2	2026-10-08 23:59:59.315	2026-10-09 00:00:22.224
cmv6ymhai000jki80ujwi7pvz	9	employees	EMP_1791912796789	مهندس فحص الجودة	{"job": "محاسب", "notes": "", "phone": "", "address": "", "startDate": "2025-01-01", "basicSalary": "6000", "advanceAccount": "1101", "expenseAccount": "1102", "payableAccount": "1103", "insuranceAccount": "1104"}	t	1	2026-10-13 17:33:35.37	2026-10-13 17:33:35.37
cmv6yoqvm000wki80hwsmu4t5	10	employees	EMP_1791912894001	مهندس فحص الجودة	{"job": "محاسب", "notes": "", "phone": "", "address": "", "startDate": "2025-01-01", "basicSalary": "7500", "advanceAccount": "1101", "expenseAccount": "1102", "payableAccount": "1103", "insuranceAccount": "1104"}	t	2	2026-10-13 17:35:21.106	2026-10-13 17:35:21.893
cmv6yormn0003kiw4scghsp5i	10	items	ITEM_1791912894001	صنف اختبار معزول	{"unit": "kg", "category": "خام", "salesAccount": "1104", "expenseAccount": "1103", "purchaseAccount": "1102", "inventoryAccount": "1101"}	t	1	2026-10-13 17:35:22.077	2026-10-13 17:35:22.077
cmv6yormw0005kiw4d37lz6c6	10	warehouses	WH_1791912894001	مخزن اختبار معزول	{"type": "WAREHOUSE"}	t	1	2026-10-13 17:35:22.088	2026-10-13 17:35:22.088
cmv6yorzl0007kiw4t02nih7f	10	cost-centers	CC_1791912894001	مركز تصنيع تجريبي	{"type": "MANUFACTURING"}	t	1	2026-10-13 17:35:22.545	2026-10-13 17:35:22.545
cmv6yossj001fki80o7gq7wrk	10	cost-inputs-final	MANUFACTURING:CC_1791912894001:1900-01-01:9999-12-31	تكاليف التصنيع	{"C33": "50", "C35": "25"}	t	1	2026-10-13 17:35:23.587	2026-10-13 17:35:23.587
cmv77uhp90009kitja9ycsihh	19	parties	TRAIN-S01	مورد التدريب	{"type": "SUPPLIER", "phone": "01099583525", "share": "0", "address": "بريم", "taxNumber": "", "accountCode": "210101"}	t	2	2026-10-13 21:51:45.693	2026-10-13 22:01:35.429
cmv77p37l0001kitj3ira4t9l	19	parties	TRAIN-C01	عميل التدريب	{"type": "CUSTOMER", "phone": "01211563104", "share": "0", "address": "كوم حماده", "taxNumber": "", "accountCode": "120501"}	t	3	2026-10-13 21:47:33.633	2026-10-13 21:52:17.774
cmvaftynx0001kic8yz0hfzfr	19	warehouses	TRAIN-W01	مهزن التدريب	{"type": "WAREHOUSE", "parent": "", "address": ""}	t	1	2026-10-16 03:58:36.465	2026-10-16 03:58:36.465
cmvage7ta0005kic8udpmd7lj	19	items	tran01	صنف تدريب	{"unit": "kg", "category": "", "salesAccount": "4101", "expenseAccount": "5106", "purchaseAccount": "5101", "inventoryAccount": "120401"}	t	1	2026-10-16 04:14:21.454	2026-10-16 04:14:21.454
cmvapbn6o0003kiqeka9gc1i1	67	warehouses	WH-MAIN	المخزن الرئيسي	{"type": "STANDARD"}	t	1	2026-10-16 08:24:17.952	2026-10-16 08:24:17.952
cmvapbn780005kiqetmrwtgz0	67	warehouses	WH-BRANCH	مخزن الفرع	{"type": "STANDARD"}	t	1	2026-10-16 08:24:17.972	2026-10-16 08:24:17.972
cmvapbn7g0007kiqef1w4nmhz	67	warehouses	WH-EMPTY	مخزن فارغ	{"type": "STANDARD"}	t	1	2026-10-16 08:24:17.98	2026-10-16 08:24:17.98
cmvapbn7y0009kiqemaxb679b	67	items	ITM-01	سماد مركب نتروجيني	{"unit": "kg", "purchaseAccount": "501", "inventoryAccount": "105"}	t	1	2026-10-16 08:24:17.998	2026-10-16 08:24:17.998
cmvapx1fs0001kib7yp8ea06c	19	warehouses	TRAIN-W02	مخزن اختبار فارغ	{"type": "WAREHOUSE", "parent": "", "address": ""}	t	1	2026-10-16 08:40:56.201	2026-10-16 08:40:56.201
\.


--
-- Data for Name: Sequence; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Sequence" ("companyId", key, value) FROM stdin;
67	journal	1
5	journal	15
8	journal	1
9	journal	1
10	journal	2
19	journal	14
51	journal	2
2	journal	35
52	journal	4
54	journal	4
55	journal	4
3	journal	15
56	journal	4
4	journal	15
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Session" ("tokenHash", "userId", "expiresAt") FROM stdin;
655e0d33568fc01d2f2bc289b375d266faf073be6993d4a17895c970abc76a9b	cmuwok27k0001ki1rehhhla33	2026-10-07 13:23:18.706
4d2e08613f7179dcf6a8dcd3d53595549ec316a17b39c7fff0fe60f2c705f27b	cmuwok27k0001ki1rehhhla33	2026-11-05 13:29:16.386
6c568b28bfcf0fa2ef0064b7f23b8c8c272acaa966325f99fcf58c7bcf2c1418	cmvapbn4u0000kiqev4ikb8rl	2026-10-17 08:24:17.934
7b35e468bb22691d11a8cf409510a61cb8c98c940d1d0458b9c3ba13daf852e5	cmvapbn4u0001kiqe7m78d14h	2026-10-17 08:24:17.945
958b4981e02f2ba477fdf2570370d48a38237650fe890138688a68938da6ab5a	cmuwt13mj0001kiqug37q0fwg	2026-10-07 14:59:21.581
f6c617277e38bc40f2eef1a4980991eaa5223ebac3d0e513eb61a024bfcc796f	cmuwt13mo0003kiqu3v3qm68o	2026-10-07 14:59:21.774
2c69953583a07235a19ab9272df22d48e43f86ea08bf18bbb007d7f7f4c45ef9	cmuwt13mt0005kiqubmjtxeht	2026-10-07 14:59:21.933
4fafc00ef4024e3feccfae2ca3e6204e46a2d8f0de2ec11d526c7f7b20206d92	cmuwt88510001kis7wf5d9848	2026-10-07 15:04:51.983
d51928dce494d1503da78448a0a417f6e1aafd2db368ea1a772540113a1d474a	cmuwt88570003kis73fwqpwus	2026-10-07 15:04:52.126
7fa8cadf057e26523650d3c9518fb9431b838c4405dcfd128d8fcbdb74e83372	cmuwt885c0005kis75uh41xrp	2026-10-07 15:04:52.273
27a520d9ec871be11dfda5e20b53ebabb13d3b487a18bb9ee94dea6402c91dea	cmuwtfsow0001kikpsl4btz0e	2026-10-07 15:10:45.322
bd35ce06a198226edd1c4c6bbbd1eb5076f9bf55018a2b0466bd05c360ecc34b	cmuwtfsp60003kikpnuslajvz	2026-10-07 15:10:45.513
dc6ce64c4f5f6e70a44ff7e87a7e212fc2345458504a15e0445ad6fd76c9ddf6	cmuwtfspc0005kikpms6k84uq	2026-10-07 15:10:45.652
68d18ef71c2d561ba66b866cba02925487cfeb1f76c04a193fdb35a87a8bd157	cmuwok27k0001ki1rehhhla33	2026-11-07 01:41:59.26
1963239fdc2ba455d3e589e87e0e59fd13e5869e1d5ee26e98f60817062eb0c0	cmuwok27k0001ki1rehhhla33	2026-11-07 01:42:28.987
430260aa825b5640ceebfec2ecca1490bb9e3eef1d0fd0fa4bdc62b1acf83791	cmuwok27k0001ki1rehhhla33	2026-11-07 01:48:58.913
d74deb60001289c55d12a9dddc3804904fddeec7e803666ef688856a3788c905	cmuwok27k0001ki1rehhhla33	2026-11-07 01:49:43.465
4a53584fd9cb2e287723111dbff7aa206e3918ab72f6400ea981c894835a3c96	cmuwok27k0001ki1rehhhla33	2026-11-07 23:50:05.914
e30a338a9a5688ad7acc451117474279e70bd000ca10fa9a0edf5119080abc0e	cmuwok27k0001ki1rehhhla33	2026-11-10 03:02:15.795
033bd77a3409a7c56c9bf07ec688c4fd83135e3cc14f1d6b32c88f7e31de42af	cmuwok27k0001ki1rehhhla33	2026-11-11 07:56:31.056
545b3e8f26b162b69d559db7d439e794c93d256d28b357da33c2f737ca239503	cmv8cq58t0001kio67wg0j48m	2026-10-15 18:48:36.564
b8a161d13122c2a8a8bede61e102be13a17ad46a73b2c6f8ae2642c1f09606c3	cmv77bo3o0003kio3j3za86nt	2026-10-15 18:49:04.217
d32307c4792d99dec0758e741bc7973fc1ace77df679f9bdc3abcdc904196d09	cmuwok27k0001ki1rehhhla33	2026-11-11 08:03:52.728
7426a2f1b4180bbff4b299158a265746a5e2e71bd1b76bfce59f3a1a1705576d	cmuwok27k0001ki1rehhhla33	2026-11-11 14:22:49.742
f1a570ca52d4ff5f259531fb86480ad2fa638fafff7b6602f0e9bb3720c7cf44	cmuwok27k0001ki1rehhhla33	2026-11-11 18:40:23.889
c1654d93aaabb64e0625a793208b1728528178b9b6b997dd36e1e9d987575e1a	cmv6ybun40001ki9e901g0jcd	2026-11-12 17:27:15.291
2e14ec11d81c20f557dd6404f96fa38838c401647b202a3d20c422332e96e9d1	cmv6yier10001kiqux1dw4n6b	2026-11-12 17:30:29.348
a2313cb75ac28db7a9cbefc78d48ae5b4bb4de53dddbce7eff3f7370e1faaa2d	cmv6yjnp90001kizs7pidlu0v	2026-11-12 17:31:26.272
09a1c49f47097a46138b2bc10f5b9bd11501e5d4ffffb35beab83d459fbdc41f	cmv6ym40q0001kiedfd0vt38l	2026-11-12 17:33:21.564
2dd7530da5ead08e37dc8fcfdf1d38f07b72b78b93fbcb98ce7fd56f40a081a2	cmv6ym40q0001kiedfd0vt38l	2026-11-12 17:34:06.493
eab42129a6576298b22129e2107a6e5bd3a7e1528324d9b9412a4d7eb8e711aa	cmv6yo6qj0001kiw4wefq3jsw	2026-11-12 17:34:57.961
81105fcfc86f90b85d704fa89d5c282e1bf3e0de6daef56df58d4b1ad3eed04f	cmv77bo3o0003kio3j3za86nt	2026-11-13 20:51:11.607
ef3268007a5a4f9e4283818874b3e05e764b1c201b994d489f984fec1de94940	cmv8cq58t0001kio67wg0j48m	2026-11-14 03:37:08.298
05aa5b1725cca00ade7d40e5400f4603f416983c89fdc5bd0150183f5f2adff3	cmuwqcrgn0001ki7yhg5tm3kh	2026-10-14 18:30:05.695
cedbf59da39e5664a371bf831a4e0fa3fe598f0acc688325112226738fe00b8d	cmuwqcrgn0001ki7yhg5tm3kh	2026-11-12 18:30:59.395
f3a48c2f472e787d0c876411dbcdc247c64166fc3b3223c6c23f6e98aa6867fc	cmuwqcrh00005ki7y9sbyqvzc	2026-11-12 18:31:12.368
ec877b001c1ffdb55673f7767718e1cc6a0b2ce1f34f6ede86fa6642da751581	cmuwqcrgn0001ki7yhg5tm3kh	2026-11-12 18:33:09.925
f438b60ad640ba0ed0dd0878d14f404b3530a1f1cb169e28b841e59bad60a3e5	cmuwqcrh00005ki7y9sbyqvzc	2026-11-12 18:33:22.027
63c4ba3a1b4f5a313468f47d5e98b15c97405f09997ed98943322d99174e3330	cmuwqcrgn0001ki7yhg5tm3kh	2026-11-12 18:34:12.758
dcb36f3f7a68124c0b57294a13f015be231741b15c54541ad873c3225682d4f0	cmuwqcrh00005ki7y9sbyqvzc	2026-11-12 18:34:26.976
c9a944283019e7f5ba1edbadb6e77fb99756d135ec9fba05ed2883e8bf9ea91d	cmv77bo3o0003kio3j3za86nt	2026-10-14 21:37:15.892
d02f7df589fe8947a9a29e04357a824fe36fbaa43e6705494df5fd40cc2b5d29	cmv77bo3o0003kio3j3za86nt	2026-11-12 21:59:08.968
f4b89763bbf33a50b41b4cfbc14d1d1eb004418f3f9199b9809358c83a56edb4	cmv77bo3o0003kio3j3za86nt	2026-11-12 21:59:38.586
76a1c157e59694b87d71519c15179e3d968c434b1686c84b3ba99a275a4f5ebd	cmv77bo3o0003kio3j3za86nt	2026-11-12 22:00:28.118
55d67279d3526cc24adff72ecd2e12ab211a85d3551ca73f5927a32c99e4fc3a	cmv77bo3o0003kio3j3za86nt	2026-11-12 22:20:34.529
35f941dbd886aa639c24a9619e28eb5fcf6c64141fcffd56f1e5822774197771	cmv77bo3o0003kio3j3za86nt	2026-11-12 22:23:49.854
40498218feee717ecf3ddb974345263b938041190687ee0a4d1af82e874e306b	cmv77bo3o0003kio3j3za86nt	2026-11-12 22:27:06.902
325360863076452a802dbb600c94d3e78acb2a3e75e6b97d4b06b91ceee2059c	cmv77bo3o0003kio3j3za86nt	2026-11-12 22:33:38.655
2a54ab630920b562913e5b01873e81069f05712b304d5763c8d028d9c7e42e04	cmv77bo3o0003kio3j3za86nt	2026-10-14 05:49:22.668
6ca0c5a0819fcd71ad7db8ca3262bc0b437ad1f241e11904911a997bb4730a44	cmv77bo3o0003kio3j3za86nt	2026-10-14 05:51:11.906
89cb29ff5d41bfb190893af15a7ffd642da40f1101c445f52f4875f16ab98e6f	cmuwok27k0001ki1rehhhla33	2026-11-13 06:56:10.166
2cdf16bc3c9fce7ce87387b8e6dd97d8632311a74489ef91b8958c677a9b1f6f	cmuwok27k0001ki1rehhhla33	2026-11-13 13:26:23.304
3a33722b9a250ca3c820f696045d29ed8767dccc275d1c2a3e7cc88e54bcbed1	cmv90cxpl0000kida58ojzj9e	2026-10-16 03:57:41.696
9a62406ab5a2f63054001e80f683b2716a51d19b7b2bf302dd43988b07ef7131	cmv90elsv0000kikl5bpdtgeo	2026-10-16 03:58:59.568
4cdd3ea1c46020d607877762cbb774a78b3e4b9d92a626f29d1b62f927a80123	cmv90ewo80000kin281wflsiw	2026-10-16 03:59:13.659
123df004da0d8cc3170e51dbf28d7fed60921c7d069fffe4c857ab8a1ec58edc	cmv8cq58t0001kio67wg0j48m	2026-10-15 17:36:26.214
df0e09e82c2a66b627d88fb27ad745bd69696b76928be9c78ce5a790667da017	cmv8cq58t0001kio67wg0j48m	2026-10-15 17:38:33.262
b840dd6ea6caad7cbc945a8fc727f5b670829150e72213bf66af0c9cb7fe45ae	cmv8cq58t0001kio67wg0j48m	2026-10-15 17:41:03.033
3242afa393f278277d3cc2305d0d03ff1bb4fc251744d6eb087ab613df875f80	cmv8cq58t0001kio67wg0j48m	2026-11-15 17:44:42.856
ef9e2d0fb62a8a4c3789b3ca1f6318fb6191193e295cfe31d42b8677a1a3c578	cmv8cq58t0001kio67wg0j48m	2026-11-16 05:57:51.995
\.


--
-- Data for Name: StockMovement; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."StockMovement" (id, "companyId", "itemId", warehouse, date, direction, quantity, "unitCost", value, kind, reference, "entryId", "requestKey", metadata, "createdAt") FROM stdin;
cmuwrasrh002nki5lh1jorvow	2	cmuwrarw4000vki5ly1957qgi	W_QA_MAIN	2026-02-05	1	50.000	25.000000	1250.00	RECEIPT		cmuwrasr8002gki5lnh1dkcrw	qa-feb-purchase-1	{"notes": "", "party": "SUPP_QA", "truck": "", "amount": "1250.00", "costItem": "", "shipment": "", "costCenter": "", "description": "شراء فبراير 50 كجم", "documentType": "PURCHASE", "pricePerTonne": "25000", "stockRequestHash": "7c3c315625fef8254ca7f28ba276a0ff23a431c6aeba8a145aef00781da48e03", "documentRequestHash": "e88e47481d76ad5ebd1519449b484b4a520e0ad416dc3446683a3d23fd0b24d0"}	2026-10-06 14:10:51.294
cmuwrat0x0030ki5la5mgfrht	2	cmuwrarw4000vki5ly1957qgi	W_QA_MAIN	2026-02-12	-1	10.000	25.000000	250.00	RETURN_OUT		cmuwrat0m002tki5ldccowhjt	qa-purch-return-1	{"notes": "", "party": "SUPP_QA", "truck": "", "amount": "250.00", "costItem": "", "shipment": "", "costCenter": "", "description": "مرتجع مشتريات 10 كجم", "documentType": "PURCHASE_RETURN", "pricePerTonne": "25000", "stockRequestHash": "7e77963bed49855d90398840e5ff7cec5a5ce717b087f2dfbf556e29b91966ed", "documentRequestHash": "a7678f203149a5f2b2eb249536480633de47588602c67a1f22b51ee94184dcdf"}	2026-10-06 14:10:51.634
cmuwras3g001aki5lsdxo5v4r	2	cmuwrarw4000vki5ly1957qgi	W_QA_MAIN	2026-01-01	1	100.000	10.000000	1000.00	OPENING	إذن افتتاحي	cmuwras360013ki5lnz5rbehq	qa-stock-opening-doc-1	{"costItem": "", "costCenter": "", "pricePerTonne": "10000", "stockRequestHash": "bf19087cf08097a3279995130426f136762336bb6ffb8f2bb3b7765133e6aad0"}	2026-10-06 14:10:50.429
cmuwras7e001lki5lm6n07rbu	2	cmuwrarw4000vki5ly1957qgi	W_QA_MAIN	2026-01-10	1	100.000	20.000000	2000.00	RECEIPT		cmuwras75001eki5ltiazhypv	qa-purchase-doc-1	{"notes": "", "party": "SUPP_QA", "truck": "", "amount": "2000.00", "costItem": "", "shipment": "", "costCenter": "", "description": "فاتورة شراء آجل 100 كجم", "documentType": "PURCHASE", "pricePerTonne": "20000", "stockRequestHash": "e292ecce0b9cbce41851d370f5db7a742d36ac0b812de04690261a3bae03723c", "documentRequestHash": "797d70baf4a1e912fcb6bbe07693d964af6fac1b4a7ef434717fdcae9b0fb322"}	2026-10-06 14:10:50.571
cmuwrasb0001rki5lx8x9gjx9	2	cmuwrarw4000vki5ly1957qgi	W_QA_MAIN	2026-01-15	-1	50.000	0.000000	0.00	ISSUE		cmuwrasc7001vki5l5tkg0n85	qa-sale-doc-1	{"notes": "", "party": "CUST_QA", "truck": "", "amount": "1500.00", "costItem": "", "shipment": "", "costCenter": "", "description": "فاتورة بيع نقدي 50 كجم", "documentType": "SALE", "pricePerTonne": "30000", "stockRequestHash": "00e93c4779c1a9d92fa0cd60102d7f14f30a094b8596dcd708f3b779cbb69755", "documentRequestHash": "5a7c2d46d679f3b872164f651ef95c2542bfa3635a0f5e090d9181e3709bae00"}	2026-10-06 14:10:50.7
cmuwrat3x0036ki5lx1x6ejol	2	cmuwrarw4000vki5ly1957qgi	W_QA_MAIN	2026-02-14	1	5.000	0.000000	0.00	RETURN_IN		cmuwrat4x003aki5lle3rq003	qa-sale-return-1	{"notes": "", "party": "CUST_QA", "truck": "", "amount": "150.00", "costItem": "", "shipment": "", "costCenter": "", "description": "مرتجع مبيعات 5 كجم نقداً", "documentType": "SALE_RETURN", "pricePerTonne": "30000", "stockRequestHash": "6ccc061acd73d38d4c01084af93b263af19109489a4b096ec587ea70f501f939", "documentRequestHash": "70a5dd5e2a2f603bd65220298d93ae5edf46193be53e93daa69df610cebdb530"}	2026-10-06 14:10:51.742
cmuwrat82003jki5l4dqtdfdu	2	cmuwrarw4000vki5ly1957qgi	W_QA_MAIN	2026-02-16	-1	5.000	0.000000	0.00	WASTE		\N	qa-waste-movement-1	{"costItem": "", "costCenter": "", "pricePerTonne": "0", "stockRequestHash": "dedf73164a3ff223af8d85a02af702be3759d675b48d1927b004e81741e4ce93"}	2026-10-06 14:10:51.89
cmuwratac003nki5l9xdowtf2	2	cmuwrarw4000vki5ly1957qgi	W_QA_MAIN	2026-02-18	1	2.000	0.000000	0.00	COUNT_GAIN		\N	qa-count-gain-1	{"costItem": "", "costCenter": "", "pricePerTonne": "0", "stockRequestHash": "7e9ad98191ccf7f995729043d0d38c68885c50159da19ad4a249fd7b98e5df6c"}	2026-10-06 14:10:51.972
cmuwt17ow0059ki5l8b150ar6	3	cmuwt17k6004uki5ligwyyf0z	W_QA_MAIN	2026-01-01	1	100.000	10.000000	1000.00	OPENING	إذن افتتاحي	cmuwt17ok0052ki5lo2tl7h8i	qa-stock-opening-doc-1	{"costItem": "", "costCenter": "", "pricePerTonne": "10000", "stockRequestHash": "15ed4df23b31760171c6f28fad3f90ac642efaedba5a64d8ad615ceebd5ec543"}	2026-10-06 14:59:23.312
cmuwt17so005kki5lhotykprw	3	cmuwt17k6004uki5ligwyyf0z	W_QA_MAIN	2026-01-10	1	100.000	20.000000	2000.00	RECEIPT		cmuwt17se005dki5lydn1mu4w	qa-purchase-doc-1	{"notes": "", "party": "SUPP_QA", "truck": "", "amount": "2000.00", "costItem": "", "shipment": "", "costCenter": "", "description": "فاتورة شراء آجل 100 كجم", "documentType": "PURCHASE", "pricePerTonne": "20000", "stockRequestHash": "b1044c624231258f7983fea9fdcacf788c0dd0ac96b298eb3cc9ef36cbacad9f", "documentRequestHash": "39dd96f7a2e786efcf35f595c601d88a57930bcfda4d13ede1cfc80697d65600"}	2026-10-06 14:59:23.448
cmuwt17w3005qki5lw1s18laq	3	cmuwt17k6004uki5ligwyyf0z	W_QA_MAIN	2026-01-15	-1	50.000	0.000000	0.00	ISSUE		cmuwt17xd005uki5l7qb6eaa1	qa-sale-doc-1	{"notes": "", "party": "CUST_QA", "truck": "", "amount": "1500.00", "costItem": "", "shipment": "", "costCenter": "", "description": "فاتورة بيع نقدي 50 كجم", "documentType": "SALE", "pricePerTonne": "30000", "stockRequestHash": "081f5ff79d9435de6a13d7233b4dd33f2b97d9dfb6542a5792348e4696ecb39f", "documentRequestHash": "7615c84885856d5edad854f4d8776d3287b011e827e09496fd6cd373b84224fc"}	2026-10-06 14:59:23.571
cmuwt18c4006mki5l7jm4wun1	3	cmuwt17k6004uki5ligwyyf0z	W_QA_MAIN	2026-02-05	1	50.000	25.000000	1250.00	RECEIPT		cmuwt18bv006fki5l679nnfs8	qa-feb-purchase-1	{"notes": "", "party": "SUPP_QA", "truck": "", "amount": "1250.00", "costItem": "", "shipment": "", "costCenter": "", "description": "شراء فبراير 50 كجم", "documentType": "PURCHASE", "pricePerTonne": "25000", "stockRequestHash": "cc4f1dac0cddb3604fa7e632f2c19788b017609a60bab20f43224aed106985a6", "documentRequestHash": "36333c69e60db3e28bad3998e90564ce1ed7302854c8639dcb99039b0027f115"}	2026-10-06 14:59:24.148
cmuwt18qf006zki5l7zvs51qc	3	cmuwt17k6004uki5ligwyyf0z	W_QA_MAIN	2026-02-12	-1	10.000	25.000000	250.00	RETURN_OUT		cmuwt18q6006ski5lftqachod	qa-purch-return-1	{"notes": "", "party": "SUPP_QA", "truck": "", "amount": "250.00", "costItem": "", "shipment": "", "costCenter": "", "description": "مرتجع مشتريات 10 كجم", "documentType": "PURCHASE_RETURN", "pricePerTonne": "25000", "stockRequestHash": "45c36fb3e7a534723bc7994c3450e9ceb6b88429d246f4630b2289a249d8b157", "documentRequestHash": "342e8a4a324de78771ac63593a533a111baf776bc7c616fc12666406d83febc2"}	2026-10-06 14:59:24.663
cmuwt190t0075ki5lx9c93ryp	3	cmuwt17k6004uki5ligwyyf0z	W_QA_MAIN	2026-02-14	1	5.000	0.000000	0.00	RETURN_IN		cmuwt192l0079ki5lyhpnzkvn	qa-sale-return-1	{"notes": "", "party": "CUST_QA", "truck": "", "amount": "150.00", "costItem": "", "shipment": "", "costCenter": "", "description": "مرتجع مبيعات 5 كجم نقداً", "documentType": "SALE_RETURN", "pricePerTonne": "30000", "stockRequestHash": "14569a9d163b0c97351a4213d109d68ba62b79a20f2c6d708268a8b9774a8426", "documentRequestHash": "9de93cdc4bb0bdf3cc96d74bf8722196d2e5223682a21f6817122f6f2449607d"}	2026-10-06 14:59:25.037
cmuwt19cf007iki5lxj890sg4	3	cmuwt17k6004uki5ligwyyf0z	W_QA_MAIN	2026-02-16	-1	5.000	0.000000	0.00	WASTE		\N	qa-waste-movement-1	{"costItem": "", "costCenter": "", "pricePerTonne": "0", "stockRequestHash": "e6e69aa54253709a848debf20d5f730991affd61f7337c240968ead5bea13ac1"}	2026-10-06 14:59:25.455
cmuwt19it007mki5l36dmx65m	3	cmuwt17k6004uki5ligwyyf0z	W_QA_MAIN	2026-02-18	1	2.000	0.000000	0.00	COUNT_GAIN		\N	qa-count-gain-1	{"costItem": "", "costCenter": "", "pricePerTonne": "0", "stockRequestHash": "cab435b8980edc81233f1309ff97c5ce73d74ab2436be940ec821d657315847f"}	2026-10-06 14:59:25.686
cmuwt8aid00brki5ly9kfvpan	4	cmuwt8aec00bcki5lrave7mlo	W_QA_MAIN	2026-01-01	1	100.000	10.000000	1000.00	OPENING	إذن افتتاحي	cmuwt8ai400bkki5l2efpok1g	qa-stock-opening-doc-1	{"costItem": "", "costCenter": "", "pricePerTonne": "10000", "stockRequestHash": "e953499a8ee08a545a3412f3c745b58cb34f7aec3c05e04d740360acf3064583"}	2026-10-06 15:04:53.557
cmuwt8aly00c2ki5l64amn7lo	4	cmuwt8aec00bcki5lrave7mlo	W_QA_MAIN	2026-01-10	1	100.000	20.000000	2000.00	RECEIPT		cmuwt8aln00bvki5lte5z8jgz	qa-purchase-doc-1	{"notes": "", "party": "SUPP_QA", "truck": "", "amount": "2000.00", "costItem": "", "shipment": "", "costCenter": "", "description": "فاتورة شراء آجل 100 كجم", "documentType": "PURCHASE", "pricePerTonne": "20000", "stockRequestHash": "d6ebb0d41cad04a45a0a45f17c638126a4e5f435bc20cdb2b2c2a8e2518d8e33", "documentRequestHash": "0758dd21141dbe79c73eebcbba1d5c407c9c6a6a9a4a74f23ab1a255ce0bc7a4"}	2026-10-06 15:04:53.686
cmuwt8aph00c8ki5ldl5gxw3h	4	cmuwt8aec00bcki5lrave7mlo	W_QA_MAIN	2026-01-15	-1	50.000	0.000000	0.00	ISSUE		cmuwt8aqe00ccki5l63e7asa6	qa-sale-doc-1	{"notes": "", "party": "CUST_QA", "truck": "", "amount": "1500.00", "costItem": "", "shipment": "", "costCenter": "", "description": "فاتورة بيع نقدي 50 كجم", "documentType": "SALE", "pricePerTonne": "30000", "stockRequestHash": "668e941e8617c35420e5cbd15c642db771c960aa6df1d91d0c201dd3035a017f", "documentRequestHash": "ebc44940541b9108d93268a169c277c670e0db431ebeeee37cebbec420c6ed8b"}	2026-10-06 15:04:53.813
cmuwt8b4m00d4ki5lion48odg	4	cmuwt8aec00bcki5lrave7mlo	W_QA_MAIN	2026-02-05	1	50.000	25.000000	1250.00	RECEIPT		cmuwt8b4a00cxki5lzatlp6bb	qa-feb-purchase-1	{"notes": "", "party": "SUPP_QA", "truck": "", "amount": "1250.00", "costItem": "", "shipment": "", "costCenter": "", "description": "شراء فبراير 50 كجم", "documentType": "PURCHASE", "pricePerTonne": "25000", "stockRequestHash": "9531980dcb2a280126352acb2df1d13d59d667cb86f7327633591594bece9719", "documentRequestHash": "ed27d1ac7faa0d70728c99aa6c877de1dcf81fed33b1efd06117ea6870f7ee7a"}	2026-10-06 15:04:54.359
cmuwt8bjx00dhki5lvi10uuu4	4	cmuwt8aec00bcki5lrave7mlo	W_QA_MAIN	2026-02-12	-1	10.000	25.000000	250.00	RETURN_OUT		cmuwt8bjm00daki5l46cwhf05	qa-purch-return-1	{"notes": "", "party": "SUPP_QA", "truck": "", "amount": "250.00", "costItem": "", "shipment": "", "costCenter": "", "description": "مرتجع مشتريات 10 كجم", "documentType": "PURCHASE_RETURN", "pricePerTonne": "25000", "stockRequestHash": "d8e6adbcbf3e5ac9e87186f89c514deeab4d4b398b2e5e473c770cfb0b196cb3", "documentRequestHash": "78332b9aad1af67f1507f3854ea2216e341fe13436ad59f816a1e38aff28386f"}	2026-10-06 15:04:54.909
cmuwt8byx00dnki5lkklun423	4	cmuwt8aec00bcki5lrave7mlo	W_QA_MAIN	2026-02-14	1	5.000	0.000000	0.00	RETURN_IN		cmuwt8bzz00drki5lelu2fbe0	qa-sale-return-1	{"notes": "", "party": "CUST_QA", "truck": "", "amount": "150.00", "costItem": "", "shipment": "", "costCenter": "", "description": "مرتجع مبيعات 5 كجم نقداً", "documentType": "SALE_RETURN", "pricePerTonne": "30000", "stockRequestHash": "d674259253ea2968cdb12f4173153000d504dabfc73d52d1dc8806e1ac2dbd09", "documentRequestHash": "bf725229f60f51e7ce26e92316f1831d617e075c278362670dcbe4d8959e47a2"}	2026-10-06 15:04:55.449
cmuwt8c7d00e0ki5lyw4hjsvo	4	cmuwt8aec00bcki5lrave7mlo	W_QA_MAIN	2026-02-16	-1	5.000	0.000000	0.00	WASTE		\N	qa-waste-movement-1	{"costItem": "", "costCenter": "", "pricePerTonne": "0", "stockRequestHash": "f6f09818366151a1862c809697a882186b1c4a76acf1d4308ffab9f16fb49f2f"}	2026-10-06 15:04:55.754
cmuwt8ccq00e4ki5l84wo8y3d	4	cmuwt8aec00bcki5lrave7mlo	W_QA_MAIN	2026-02-18	1	2.000	0.000000	0.00	COUNT_GAIN		\N	qa-count-gain-1	{"costItem": "", "costCenter": "", "pricePerTonne": "0", "stockRequestHash": "284fdf0da2db60c1bed63a67c02cf2c07917f3ee2f3fa6c3b7a6bb1f5cfeead5"}	2026-10-06 15:04:55.946
cmuwtfv6v00ipki5lx2g8obuu	5	cmuwtfv2n00iaki5lu8onv5dm	W_QA_MAIN	2026-01-01	1	100.000	10.000000	1000.00	OPENING	إذن افتتاحي	cmuwtfv6h00iiki5l0e1qqgav	qa-stock-opening-doc-1	{"costItem": "", "costCenter": "", "pricePerTonne": "10000", "stockRequestHash": "331578f66ed0a8fa2157157c77e15760ac70d2075f03b635f749a0eb6ea15dca"}	2026-10-06 15:10:46.951
cmuwtfvbo00j0ki5lo48cn1m1	5	cmuwtfv2n00iaki5lu8onv5dm	W_QA_MAIN	2026-01-10	1	100.000	20.000000	2000.00	RECEIPT		cmuwtfvbd00itki5l4nxr3q9q	qa-purchase-doc-1	{"notes": "", "party": "SUPP_QA", "truck": "", "amount": "2000.00", "costItem": "", "shipment": "", "costCenter": "", "description": "فاتورة شراء آجل 100 كجم", "documentType": "PURCHASE", "pricePerTonne": "20000", "stockRequestHash": "2c17f649173e1d3d5c84c7b06ae7b5fca112b5f2487e6c9e19e3ee68d4e3c618", "documentRequestHash": "ec044fa57ec8fa9d586524774b714dbe25327fbb863ce09f4bc7ee4adba9cb59"}	2026-10-06 15:10:47.124
cmuwtfvew00j6ki5lssx1uopc	5	cmuwtfv2n00iaki5lu8onv5dm	W_QA_MAIN	2026-01-15	-1	50.000	0.000000	0.00	ISSUE		cmuwtfvfv00jaki5lvs0b92rg	qa-sale-doc-1	{"notes": "", "party": "CUST_QA", "truck": "", "amount": "1500.00", "costItem": "", "shipment": "", "costCenter": "", "description": "فاتورة بيع نقدي 50 كجم", "documentType": "SALE", "pricePerTonne": "30000", "stockRequestHash": "5d288091e4bbbbc384cae6d802ec6eea95c60f7ae7888267c710dde2a5a2b14d", "documentRequestHash": "b27523b072b5f65da0af96feab2a6ce93d8dada25e190444e802919dcd7681d5"}	2026-10-06 15:10:47.24
cmuwtfvsh00k2ki5lu7b4z29r	5	cmuwtfv2n00iaki5lu8onv5dm	W_QA_MAIN	2026-02-05	1	50.000	25.000000	1250.00	RECEIPT		cmuwtfvs600jvki5lu1l4fce0	qa-feb-purchase-1	{"notes": "", "party": "SUPP_QA", "truck": "", "amount": "1250.00", "costItem": "", "shipment": "", "costCenter": "", "description": "شراء فبراير 50 كجم", "documentType": "PURCHASE", "pricePerTonne": "25000", "stockRequestHash": "ba39a6182f72df3594a8ae58816eddc55f96c8ccc91650dcf9bffb16830beca0", "documentRequestHash": "5f37a39599a5bb649cc9639286bab24c4352f5bdef4782086207820724e980c0"}	2026-10-06 15:10:47.73
cmuwtfw8800kfki5l8mlo2cnv	5	cmuwtfv2n00iaki5lu8onv5dm	W_QA_MAIN	2026-02-12	-1	10.000	25.000000	250.00	RETURN_OUT		cmuwtfw7s00k8ki5lvz0edxal	qa-purch-return-1	{"notes": "", "party": "SUPP_QA", "truck": "", "amount": "250.00", "costItem": "", "shipment": "", "costCenter": "", "description": "مرتجع مشتريات 10 كجم", "documentType": "PURCHASE_RETURN", "pricePerTonne": "25000", "stockRequestHash": "6c72c954ff5dae148802c09c99ae15dd09c264fbbe490fe570413f7d3514f918", "documentRequestHash": "85e45c8082e25d5515774964105c83565da1584e4aadfc355dea3a6cef56777a"}	2026-10-06 15:10:48.296
cmuwtfwjf00klki5lr1e151vr	5	cmuwtfv2n00iaki5lu8onv5dm	W_QA_MAIN	2026-02-14	1	5.000	0.000000	0.00	RETURN_IN		cmuwtfwkj00kpki5l9hczi4uc	qa-sale-return-1	{"notes": "", "party": "CUST_QA", "truck": "", "amount": "150.00", "costItem": "", "shipment": "", "costCenter": "", "description": "مرتجع مبيعات 5 كجم نقداً", "documentType": "SALE_RETURN", "pricePerTonne": "30000", "stockRequestHash": "b96bd0b259cd840ae0e11883212aeb563be08087ed0d57500773ddd012082bff", "documentRequestHash": "587d87f6df2f7c054aa3242e72c02c4e4662c82c355ff8caa951b373c3158a49"}	2026-10-06 15:10:48.699
cmuwtfwr000kyki5l4ci9teo5	5	cmuwtfv2n00iaki5lu8onv5dm	W_QA_MAIN	2026-02-16	-1	5.000	0.000000	0.00	WASTE		\N	qa-waste-movement-1	{"costItem": "", "costCenter": "", "pricePerTonne": "0", "stockRequestHash": "1a335f3710fd0b48bcd3ddd254f7a4716e642f9c8a5c6dc3d9f6a37af6db6a51"}	2026-10-06 15:10:48.972
cmuwtfww400l2ki5l6g6s22lb	5	cmuwtfv2n00iaki5lu8onv5dm	W_QA_MAIN	2026-02-18	1	2.000	0.000000	0.00	COUNT_GAIN		\N	qa-count-gain-1	{"costItem": "", "costCenter": "", "pricePerTonne": "0", "stockRequestHash": "b7b1328f900f70a27c1b5f32463f4257ed145f3a824a31f87385fc5efff9e15f"}	2026-10-06 15:10:49.156
cmv6yorve001bki80bxrmbc1z	10	cmv6yormn0003kiw4scghsp5i	WH_1791912894001	2026-01-22	1	25.000	10.000000	250.00	RECEIPT		cmv6yoruz0014ki80kghc1b0w	qa-stock-1791912894001	{"costItem": "", "costCenter": "", "stockWeigh": {"bags": "1", "tare": "5", "weight": "30"}, "description": "إذن إضافة تجريبي لشركة الاختبار المعزولة", "pricePerTonne": "10000", "stockRequestHash": "d047aae319bf5375905e434780b4dbd3956c4cfa9f22c311f978f16cf72fa200"}	2026-10-13 17:35:22.395
cmvaj171d0008kixhnhwsn4of	19	cmvage7ta0005kic8udpmd7lj	TRAIN-W01	2026-10-16	1	100.000	20.000000	2000.00	RECEIPT		cmvaj16ys0001kixh47scsg1f	17cfaf9e-c24a-42f1-a486-f81fbd97bda4	{"costItem": "", "logistics": {"farm": "", "color": "", "notes": "", "pivot": "", "truck": "", "shipment": ""}, "costCenter": "", "description": "اضاغة تدريب", "pricePerTonne": "20000", "stockRequestHash": "b9480d0a2dac69959a5bc23b2fb3ebb6134c9df007af081195979d2e0fd98a90"}	2026-10-16 05:28:12.769
cmvao065t0001kidh2yiaw8wb	19	cmvage7ta0005kic8udpmd7lj	TRAIN-W01	2026-10-16	-1	30.000	0.000000	0.00	ISSUE		\N	bac17ca1-bbad-447d-861c-50a27bbfc036	{"costItem": "", "logistics": {"farm": "", "color": "", "notes": "", "pivot": "", "truck": "", "shipment": ""}, "costCenter": "", "description": "رف 30 كيلو لاختبار حركة المخزون", "pricePerTonne": "0", "stockRequestHash": "7f02838c34fa0975fbbd56d3ea9076b8d9f9b110401d664ea1889b43cde1a9ee"}	2026-10-16 07:47:23.058
cmvapyyua0005kib7sz1fff31	19	cmvage7ta0005kic8udpmd7lj	TRAIN-W01	2026-10-16	-1	10.000	0.000000	0.00	ISSUE		\N	e475c312-6123-4681-ac5f-72ed2acfa624	{"costItem": "", "logistics": {"farm": "", "color": "", "notes": "", "pivot": "", "truck": "", "shipment": ""}, "costCenter": "", "description": "ختبار الصرف بعد تحسين اختيار المخزن", "pricePerTonne": "0", "stockRequestHash": "e5537a6952b779184838b5c5a077a436dac13b524cd18cbbb6e3d91d92fbe286"}	2026-10-16 08:42:26.146
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, "companyId", email, name, "passwordHash", role, "isActive", "createdAt", username, permissions) FROM stdin;
cmv8cq58t0001kio67wg0j48m	19	\N	Mahmoud Mansour	facd7db926d53eab110f2b680aafab29:0e36474f28668d671699849799a601e12f4929cd0680819c7524e4acc9ebc708a6e76627707330900b64f7d579bb3b381060d01449f5057e697685cbad6910ce	accountant	t	2026-10-14 16:56:07.18	mahmoud	["stock.view", "stock.movement", "items.manage", "items.view", "warehouses.manage", "warehouses.view", "journal.create", "journal.view", "journal.post", "journal.reverse", "journal.void", "journal.edit"]
cmuwqcrgn0001ki7yhg5tm3kh	2	qa-admin@example.test	مدير اختبار QA	86a03ae67c47c82fa6e5e680bf165798:56f23d5fd17faafb8e228ae1a79b9c6ca2a0312f0ab0cc8cd976ebb2ee063270c1416502788b25ec123148d38e0754e461211e760e1fa01d54811e8b5c810a68	admin	t	2026-10-06 13:44:23.303	qa-admin	[]
cmuwqcrh00005ki7y9sbyqvzc	2	qa-auditor@example.test	مراجع اختبار QA	bca366092c99d6d66b065ef4b446f518:f7629dcbd52e05c4e6dadd4592c9d76b12e745ed5b588e82ecf5b50b9c380566e46e101361b037eb2d8035759b7c6372990789c53343a1d98a0ab0e59e3e18da	auditor	t	2026-10-06 13:44:23.317	qa-auditor	["accounts.view", "journal.view", "documents.view", "stock.view", "customers.view", "suppliers.view", "partners.view", "items.view", "warehouses.view", "cost_centers.view", "cost_items.view", "farms.view", "banks.view", "account_lists.view", "lookup_lists.view", "employees.view", "payroll.view", "assets.view", "depreciation.view", "costs.view", "equity.view", "reports.general_ledger", "reports.subsidiary_ledger", "reports.account_statement", "reports.trial_balance", "reports.income_statement", "reports.balance_sheet", "reports.cash_flow", "reports.sales_purchases", "reports.cost_centers", "reports.outstanding_balances", "reports.daily", "reports.bank_treasury"]
cmv90elsv0000kikl5bpdtgeo	54	admin_1792036739405@test.local	مدير الاختبار	test_hash	admin	t	2026-10-15 03:58:59.551	\N	[]
cmuwok27k0001ki1rehhhla33	1	admin@mohasby.mahmoudashry.site	مدير النظام	0d9bf436779af4b4640d8dde68ff3abd:28e7b1dafb9fe6be75e038859d474e477b8cbf4b514ebe8994341f9007dedef81e8067e2b94d0292fb36f493ff3963368b86b150a1aa9411e7a5824deb310038	admin	t	2026-10-06 12:54:04.592	admin	[]
cmuwt13mj0001kiqug37q0fwg	3	qa-admin-1791298756935@example.test	مدير اختبار QA (1791298756935)	13e6c9e0a1921f062abbfc876dc1f360:f812bfcf206f1cdaf120d8fa6c755cec88d118f072e88dc95b2d2d6064e2c8aed730bb2e964220a222657deb77e2a38eafd64157505c6465636ac25af7d3ae1f	admin	t	2026-10-06 14:59:18.043	qa-admin-1791298756935	[]
cmv90cxpl0000kida58ojzj9e	51	admin_1792036661493@test.local	مدير الاختبار	test_hash	admin	t	2026-10-15 03:57:41.673	\N	[]
cmuwt88510001kis7wf5d9848	4	qa-admin-1791299089455@example.test	مدير اختبار QA (1791299089455)	b254cae9c95c32b09bb637bc18dc9209:53d802a63adbfe668baee8bc1e044418e4c18d458e2b361d947a97d1a63eb72567edf527bb2fc43ea6d1e963fcb288d8f2d3e15d1d52adff3b4e9b1e92fe9027	admin	t	2026-10-06 15:04:50.486	qa-admin-1791299089455	[]
cmv90ewo80000kin281wflsiw	55	admin_1792036753506@test.local	مدير الاختبار	test_hash	admin	t	2026-10-15 03:59:13.641	\N	[]
cmuwtfsow0001kikpsl4btz0e	5	qa-admin-1791299442846@example.test	مدير اختبار QA (1791299442846)	e5ee9c7985382e58adba4193a7caa359:186b21cddf6f73ac60f4e07fc56df4424ed218c465d51aa0f3390d6d7b95ca2692eca0cbfe8a39f090b4e8c031d5f76dd013adcaa979e8123d9d2d4e68423e44	admin	t	2026-10-06 15:10:43.712	qa-admin-1791299442846	[]
cmv6ybun40001ki9e901g0jcd	6	qa-accept-1791912317830@example.test	مدير اختبار القبول 1791912317830	2c14decaf83159200b8ee930290a5f19:46a9b417be5b90d1108662180e0288545809c4fcec57ecd7b9fadd29e7d8337e8a491645d40de4bee16679cbcfc8e8ab863e6403157eef46065e165724dea36b	admin	t	2026-10-13 17:25:19.456	qa-accept-1791912317830	[]
cmv6yier10001kiqux1dw4n6b	7	qa-accept-1791912624046@example.test	مدير اختبار القبول 1791912624046	ac5b348ec5bcd4f4b91370754622baf7:cda88d5f86b9bc904eb9c5dfed5e674c9556a3cba3f1b88dc476a90abf9b2dc3f2ec92dd01360aee38bc40a2c6cb038a28b4b9a32390e09b9116663d50be71e5	admin	t	2026-10-13 17:30:25.453	qa-accept-1791912624046	[]
cmv6yjnp90001kizs7pidlu0v	8	qa-accept-1791912682444@example.test	مدير اختبار القبول 1791912682444	7b2594aef3167439d386b0da8a235679:a4f6782be81620ba9031db8630b37fe30ea3a4edb817c9bd54229b0ba67283d0e219da43ab954e7f5b151ff239640e5f01993f7ca6641c44d99fb2e30ef5ea3c	admin	t	2026-10-13 17:31:23.709	qa-accept-1791912682444	[]
cmv6ym40q0001kiedfd0vt38l	9	qa-accept-1791912796789@example.test	مدير اختبار القبول 1791912796789	38234c22f4f94b519c5b19b6734efd77:9fe0a6ad076cde8feb2f48406f6740e0a142a1d6a04fbe973c1dd9c94f2a84671374c53f46541f188937f5e8ec7f860ff1ba0c86f5edbb2414429ae7495a3180	admin	t	2026-10-13 17:33:18.171	qa-accept-1791912796789	[]
cmv6yo6qj0001kiw4wefq3jsw	10	qa-accept-1791912894001@example.test	مدير اختبار القبول 1791912894001	41b980141ff9ef676d70ba4149ce66cf:ae310fa4bbf2a3bdb5c553ae74ae99c9678c011e9debffd91e254efcd7f164438c8988e94804354205915c2a4bd68e9446e373ec8c7e0383b0dee259b99f35b0	admin	t	2026-10-13 17:34:55.003	qa-accept-1791912894001	[]
cmuwqcrgt0003ki7yxz26r8mg	2	qa-accountant@example.test	محاسب اختبار QA	70e28b5b38ec0b08d2116c5dedb4f096:c4dadd72d15814de91e0b434a4e9f9cd7e92011f635c3cd6ac5477d9e509740f9d27c37353141c69100b98b72a4457fbc542fb097d86986ef7f8bb507167277b	accountant	t	2026-10-06 13:44:23.309	qa-accountant	["accounts.view", "accounts.create", "accounts.edit", "journal.view", "journal.create", "journal.edit", "journal.post", "journal.void", "journal.reverse", "documents.view", "documents.create", "documents.post", "stock.view", "stock.movement", "customers.view", "customers.manage", "suppliers.view", "suppliers.manage", "partners.view", "partners.manage", "items.view", "items.manage", "warehouses.view", "warehouses.manage", "cost_centers.view", "cost_centers.manage", "cost_items.view", "cost_items.manage", "farms.view", "farms.manage", "banks.view", "banks.manage", "account_lists.view", "account_lists.manage", "lookup_lists.view", "lookup_lists.manage", "employees.view", "employees.manage", "payroll.view", "payroll.post", "assets.view", "assets.manage", "depreciation.calculate", "depreciation.view", "costs.view", "costs.manage", "equity.view", "equity.distribute", "reports.general_ledger", "reports.subsidiary_ledger", "reports.account_statement", "reports.trial_balance", "reports.income_statement", "reports.balance_sheet", "reports.cash_flow", "reports.sales_purchases", "reports.cost_centers", "reports.outstanding_balances", "reports.daily", "reports.bank_treasury"]
cmuwt13mo0003kiqu3v3qm68o	3	qa-accountant-1791298756935@example.test	محاسب اختبار QA (1791298756935)	13e6c9e0a1921f062abbfc876dc1f360:f812bfcf206f1cdaf120d8fa6c755cec88d118f072e88dc95b2d2d6064e2c8aed730bb2e964220a222657deb77e2a38eafd64157505c6465636ac25af7d3ae1f	accountant	t	2026-10-06 14:59:18.049	qa-accountant-1791298756935	["accounts.view", "accounts.create", "accounts.edit", "journal.view", "journal.create", "journal.edit", "journal.post", "journal.void", "journal.reverse", "documents.view", "documents.create", "documents.post", "stock.view", "stock.movement", "customers.view", "customers.manage", "suppliers.view", "suppliers.manage", "partners.view", "partners.manage", "items.view", "items.manage", "warehouses.view", "warehouses.manage", "cost_centers.view", "cost_centers.manage", "cost_items.view", "cost_items.manage", "farms.view", "farms.manage", "banks.view", "banks.manage", "account_lists.view", "account_lists.manage", "lookup_lists.view", "lookup_lists.manage", "employees.view", "employees.manage", "payroll.view", "payroll.post", "assets.view", "assets.manage", "depreciation.calculate", "depreciation.view", "costs.view", "costs.manage", "equity.view", "equity.distribute", "reports.general_ledger", "reports.subsidiary_ledger", "reports.account_statement", "reports.trial_balance", "reports.income_statement", "reports.balance_sheet", "reports.cash_flow", "reports.sales_purchases", "reports.cost_centers", "reports.outstanding_balances", "reports.daily", "reports.bank_treasury"]
cmuwt88570003kis73fwqpwus	4	qa-accountant-1791299089455@example.test	محاسب اختبار QA (1791299089455)	b254cae9c95c32b09bb637bc18dc9209:53d802a63adbfe668baee8bc1e044418e4c18d458e2b361d947a97d1a63eb72567edf527bb2fc43ea6d1e963fcb288d8f2d3e15d1d52adff3b4e9b1e92fe9027	accountant	t	2026-10-06 15:04:50.492	qa-accountant-1791299089455	["accounts.view", "accounts.create", "accounts.edit", "journal.view", "journal.create", "journal.edit", "journal.post", "journal.void", "journal.reverse", "documents.view", "documents.create", "documents.post", "stock.view", "stock.movement", "customers.view", "customers.manage", "suppliers.view", "suppliers.manage", "partners.view", "partners.manage", "items.view", "items.manage", "warehouses.view", "warehouses.manage", "cost_centers.view", "cost_centers.manage", "cost_items.view", "cost_items.manage", "farms.view", "farms.manage", "banks.view", "banks.manage", "account_lists.view", "account_lists.manage", "lookup_lists.view", "lookup_lists.manage", "employees.view", "employees.manage", "payroll.view", "payroll.post", "assets.view", "assets.manage", "depreciation.calculate", "depreciation.view", "costs.view", "costs.manage", "equity.view", "equity.distribute", "reports.general_ledger", "reports.subsidiary_ledger", "reports.account_statement", "reports.trial_balance", "reports.income_statement", "reports.balance_sheet", "reports.cash_flow", "reports.sales_purchases", "reports.cost_centers", "reports.outstanding_balances", "reports.daily", "reports.bank_treasury"]
cmuwtfsp60003kikpnuslajvz	5	qa-accountant-1791299442846@example.test	محاسب اختبار QA (1791299442846)	e5ee9c7985382e58adba4193a7caa359:186b21cddf6f73ac60f4e07fc56df4424ed218c465d51aa0f3390d6d7b95ca2692eca0cbfe8a39f090b4e8c031d5f76dd013adcaa979e8123d9d2d4e68423e44	accountant	t	2026-10-06 15:10:43.722	qa-accountant-1791299442846	["accounts.view", "accounts.create", "accounts.edit", "journal.view", "journal.create", "journal.edit", "journal.post", "journal.void", "journal.reverse", "documents.view", "documents.create", "documents.post", "stock.view", "stock.movement", "customers.view", "customers.manage", "suppliers.view", "suppliers.manage", "partners.view", "partners.manage", "items.view", "items.manage", "warehouses.view", "warehouses.manage", "cost_centers.view", "cost_centers.manage", "cost_items.view", "cost_items.manage", "farms.view", "farms.manage", "banks.view", "banks.manage", "account_lists.view", "account_lists.manage", "lookup_lists.view", "lookup_lists.manage", "employees.view", "employees.manage", "payroll.view", "payroll.post", "assets.view", "assets.manage", "depreciation.calculate", "depreciation.view", "costs.view", "costs.manage", "equity.view", "equity.distribute", "reports.general_ledger", "reports.subsidiary_ledger", "reports.account_statement", "reports.trial_balance", "reports.income_statement", "reports.balance_sheet", "reports.cash_flow", "reports.sales_purchases", "reports.cost_centers", "reports.outstanding_balances", "reports.daily", "reports.bank_treasury"]
cmuwt13mt0005kiqubmjtxeht	3	qa-auditor-1791298756935@example.test	مراجع اختبار QA (1791298756935)	13e6c9e0a1921f062abbfc876dc1f360:f812bfcf206f1cdaf120d8fa6c755cec88d118f072e88dc95b2d2d6064e2c8aed730bb2e964220a222657deb77e2a38eafd64157505c6465636ac25af7d3ae1f	auditor	t	2026-10-06 14:59:18.053	qa-auditor-1791298756935	["accounts.view", "journal.view", "documents.view", "stock.view", "customers.view", "suppliers.view", "partners.view", "items.view", "warehouses.view", "cost_centers.view", "cost_items.view", "farms.view", "banks.view", "account_lists.view", "lookup_lists.view", "employees.view", "payroll.view", "assets.view", "depreciation.view", "costs.view", "equity.view", "reports.general_ledger", "reports.subsidiary_ledger", "reports.account_statement", "reports.trial_balance", "reports.income_statement", "reports.balance_sheet", "reports.cash_flow", "reports.sales_purchases", "reports.cost_centers", "reports.outstanding_balances", "reports.daily", "reports.bank_treasury"]
cmuwt885c0005kis75uh41xrp	4	qa-auditor-1791299089455@example.test	مراجع اختبار QA (1791299089455)	b254cae9c95c32b09bb637bc18dc9209:53d802a63adbfe668baee8bc1e044418e4c18d458e2b361d947a97d1a63eb72567edf527bb2fc43ea6d1e963fcb288d8f2d3e15d1d52adff3b4e9b1e92fe9027	auditor	t	2026-10-06 15:04:50.497	qa-auditor-1791299089455	["accounts.view", "journal.view", "documents.view", "stock.view", "customers.view", "suppliers.view", "partners.view", "items.view", "warehouses.view", "cost_centers.view", "cost_items.view", "farms.view", "banks.view", "account_lists.view", "lookup_lists.view", "employees.view", "payroll.view", "assets.view", "depreciation.view", "costs.view", "equity.view", "reports.general_ledger", "reports.subsidiary_ledger", "reports.account_statement", "reports.trial_balance", "reports.income_statement", "reports.balance_sheet", "reports.cash_flow", "reports.sales_purchases", "reports.cost_centers", "reports.outstanding_balances", "reports.daily", "reports.bank_treasury"]
cmuwtfspc0005kikpms6k84uq	5	qa-auditor-1791299442846@example.test	مراجع اختبار QA (1791299442846)	e5ee9c7985382e58adba4193a7caa359:186b21cddf6f73ac60f4e07fc56df4424ed218c465d51aa0f3390d6d7b95ca2692eca0cbfe8a39f090b4e8c031d5f76dd013adcaa979e8123d9d2d4e68423e44	auditor	t	2026-10-06 15:10:43.728	qa-auditor-1791299442846	["accounts.view", "journal.view", "documents.view", "stock.view", "customers.view", "suppliers.view", "partners.view", "items.view", "warehouses.view", "cost_centers.view", "cost_items.view", "farms.view", "banks.view", "account_lists.view", "lookup_lists.view", "employees.view", "payroll.view", "assets.view", "depreciation.view", "costs.view", "equity.view", "reports.general_ledger", "reports.subsidiary_ledger", "reports.account_statement", "reports.trial_balance", "reports.income_statement", "reports.balance_sheet", "reports.cash_flow", "reports.sales_purchases", "reports.cost_centers", "reports.outstanding_balances", "reports.daily", "reports.bank_treasury"]
cmv90du210000kifyidoaf4dt	52	admin_1792036703456@test.local	مدير الاختبار	test_hash	admin	t	2026-10-15 03:58:23.593	\N	[]
cmv90e8520000kiicaqh1nqqa	53	admin_1792036721708@test.local	مدير الاختبار	test_hash	admin	t	2026-10-15 03:58:41.846	\N	[]
cmvap8mha0000kii26t4wfyru	65	admin_1792138916850@stocktest.local	مدير المخزون المالي	test_hash	admin	t	2026-10-16 08:21:57.07	\N	[]
cmv77bo3o0003kio3j3za86nt	19	mahmoud.training@mohasby.site	محمود عشري	8557af88871d6c7ddd240a4400d31e49:f0e4c61ae1f8119dc3bb81b1ae9f153002fd3e6e807d561fce717b24cc5df8181dce9a402f22a859d912e471f91e47e0687ed848d4a0c240caa7a6db6b1d6a2e	admin	t	2026-10-13 21:37:07.524	mahmoud_training	[]
cmvap8mha0001kii2rlza44tr	65	keeper_1792138916850@stocktest.local	أمين مستودع بدون تكلفة	test_hash	accountant	t	2026-10-16 08:21:57.07	\N	[]
cmvapbn4u0000kiqev4ikb8rl	67	admin_1792139057677@stocktest.local	مدير المخزون المالي	test_hash	admin	t	2026-10-16 08:24:17.883	\N	[]
cmvapbn4u0001kiqe7m78d14h	67	keeper_1792139057677@stocktest.local	أمين مستودع بدون تكلفة	test_hash	accountant	t	2026-10-16 08:24:17.883	\N	["stock.view", "stock.movement"]
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
0b127bee-79de-46b1-a15d-7fe7cf4296e2	a70c9c1b74d5603679d4690ccfc550f8a25edc016a8468d03b5e0bcdcb3190a7	2026-10-06 14:53:31.118495+02	20261005000000_baseline		\N	2026-10-06 14:53:31.118495+02	0
3fcba8f3-88b7-41bc-b350-615f89bf13fe	babb457eaf3514eb1b3a50a6e4122acc7f3d9e1b2974af82d38b437e2edb6ab6	2026-10-06 14:53:39.088481+02	20261005150000_accounting_engine	\N	\N	2026-10-06 14:53:38.857678+02	1
50c7afb8-cb05-4775-9ddc-503422b0ca50	c7d4e4e21bee6192bbdbc8cfd31df2e5cae808b5f8b3b3e3c89fe4f185aa89e9	2026-10-06 14:53:39.137637+02	20261005200000_constraints	\N	\N	2026-10-06 14:53:39.091207+02	1
43f2712a-fb76-47b4-8e75-cf0d2fb8b02f	a50f746f70cd19eb51a2afed4f9da6fd068faa6e2c5fd9901135521d087e6be9	2026-10-13 19:49:31.391765+02	20261013200000_user_permissions_and_username	\N	\N	2026-10-13 19:49:31.285003+02	1
\.


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accounts (id, "companyId", code, name, "nameEn", "accountClass", "mainGroup", "subGroup", nature, "statementType", level, "parentCode", "isGroup", "isSystem", "isActive", balance, "createdAt", "updatedAt", "cashFlow") FROM stdin;
1	1	1	الأصول	Assets	الأصول	\N	\N	مدين	قائمة المركز المالي	1	\N	t	t	t	0.00	2026-09-20 21:42:07.175	2026-09-20 21:42:07.175	\N
2	1	2	الخصوم	Liabilities	الخصوم	\N	\N	دائن	قائمة المركز المالي	1	\N	t	t	t	0.00	2026-09-20 21:42:07.19	2026-09-20 21:42:07.19	\N
3	1	3	حقوق الملكية	Equity	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	1	\N	t	t	t	0.00	2026-09-20 21:42:07.196	2026-09-20 21:42:07.196	\N
4	1	4	الإيرادات	Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	1	\N	t	t	t	0.00	2026-09-20 21:42:07.201	2026-09-20 21:42:07.201	\N
5	1	5	المصروفات	Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	1	\N	t	t	t	0.00	2026-09-20 21:42:07.211	2026-09-20 21:42:07.211	\N
6	1	11	الأصول الثابتة	Fixed Assets	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	2	1	t	t	t	0.00	2026-09-20 21:42:07.216	2026-09-20 21:42:07.216	\N
7	1	12	الأصول المتداولة	Current Assets	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	2	1	t	t	t	0.00	2026-09-20 21:42:07.226	2026-09-20 21:42:07.226	\N
8	1	21	الخصوم المتداولة	Current Liabilities	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	2	2	t	t	t	0.00	2026-09-20 21:42:07.233	2026-09-20 21:42:07.233	\N
9	1	22	الخصوم طويلة الأجل	Long-term Liabilities	الخصوم	الخصوم طويلة الأجل	\N	دائن	قائمة المركز المالي	2	2	t	t	t	0.00	2026-09-20 21:42:07.238	2026-09-20 21:42:07.238	\N
10	1	31	رأس المال	Capital	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	f	t	t	0.00	2026-09-20 21:42:07.246	2026-09-20 21:42:07.246	\N
11	1	32	جاري الشركاء / صاحب المنشأة	Partners' Current Accounts	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	t	t	t	0.00	2026-09-20 21:42:07.252	2026-09-20 21:42:07.252	\N
12	1	33	الاحتياطيات	Reserves	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	t	t	t	0.00	2026-09-20 21:42:07.261	2026-09-20 21:42:07.261	\N
13	1	34	الأرباح المحتجزة / المرحلة	Retained Earnings	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	f	t	t	0.00	2026-09-20 21:42:07.267	2026-09-20 21:42:07.267	\N
14	1	35	أرباح (خسائر) العام الحالي	Current Year Profit / Loss	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	f	t	t	0.00	2026-09-20 21:42:07.274	2026-09-20 21:42:07.274	\N
15	1	41	إيرادات النشاط الرئيسي	Operating Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	2	4	t	t	t	0.00	2026-09-20 21:42:07.285	2026-09-20 21:42:07.285	\N
16	1	42	إيرادات أخرى متنوعة	Other Revenues	الإيرادات	\N	\N	دائن	قائمة الدخل	2	4	t	t	t	0.00	2026-09-20 21:42:07.293	2026-09-20 21:42:07.293	\N
17	1	51	تكلفة النشاط والمبيعات	Cost of Goods Sold (COGS)	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-09-20 21:42:07.299	2026-09-20 21:42:07.299	\N
18	1	52	مصاريف البيع والتسويق	Selling & Marketing Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-09-20 21:42:07.304	2026-09-20 21:42:07.304	\N
19	1	53	مصروفات إدارية وعمومية	General & Administrative Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-09-20 21:42:07.31	2026-09-20 21:42:07.31	\N
20	1	54	مصروفات التشغيل والإنتاج	Operating & Production Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-09-20 21:42:07.316	2026-09-20 21:42:07.316	\N
21	1	1101	الأراضي	Lands	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-09-20 21:42:07.322	2026-09-20 21:42:07.322	\N
22	1	1102	المباني والإنشاءات	Buildings	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-09-20 21:42:07.327	2026-09-20 21:42:07.327	\N
23	1	1103	الآلات والمعدات	Machinery & Equipment	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-09-20 21:42:07.332	2026-09-20 21:42:07.332	\N
24	1	1104	السيارات ووسائل النقل	Vehicles	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-09-20 21:42:07.336	2026-09-20 21:42:07.336	\N
25	1	1105	الأثاث والتجهيزات المكتبية	Furniture & Fixtures	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-09-20 21:42:07.342	2026-09-20 21:42:07.342	\N
26	1	1106	أجهزة الكمبيوتر والبرمجيات	Computers & IT Equipment	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-09-20 21:42:07.35	2026-09-20 21:42:07.35	\N
27	1	1107	الديكورات والتركيبات	Decorations & Installations	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-09-20 21:42:07.356	2026-09-20 21:42:07.356	\N
28	1	1108	ماكينات ومعدات تشغيل	Operating Machines	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-09-20 21:42:07.367	2026-09-20 21:42:07.367	\N
29	1	1109	مجمع إهلاك الأصول الثابتة	Accumulated Depreciation	الأصول	الأصول الثابتة	\N	دائن	قائمة المركز المالي	3	11	f	t	t	0.00	2026-09-20 21:42:07.372	2026-09-20 21:42:07.372	\N
30	1	1201	النقدية وما في حكمها	Cash & Cash Equivalents	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-09-20 21:42:07.38	2026-09-20 21:42:07.38	\N
31	1	1202	البنوك والمحافظ المالية	Banks & E-Wallets	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-09-20 21:42:07.385	2026-09-20 21:42:07.385	\N
32	1	1203	أوراق القبض (شيكات تحت التحصيل)	Notes Receivable	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	3	12	f	t	t	0.00	2026-09-20 21:42:07.39	2026-09-20 21:42:07.39	\N
33	1	1204	المخزون السلعي	Inventory	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-09-20 21:42:07.395	2026-09-20 21:42:07.395	\N
34	1	1205	العملاء (حساب المراقبة)	Accounts Receivable (Control)	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-09-20 21:42:07.4	2026-09-20 21:42:07.4	\N
35	1	1206	أرصدة مدينة أخرى	Other Debit Balances	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-09-20 21:42:07.405	2026-09-20 21:42:07.405	\N
36	1	2101	الموردين (حساب المراقبة)	Accounts Payable (Control)	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	3	21	t	t	t	0.00	2026-09-20 21:42:07.411	2026-09-20 21:42:07.411	\N
37	1	2102	أوراق الدفع (شيكات تحت الصرف)	Notes Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	f	t	t	0.00	2026-09-20 21:42:07.417	2026-09-20 21:42:07.417	\N
38	1	2103	مصروفات مستحقة	Accrued Expenses	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	t	t	t	0.00	2026-09-20 21:42:07.422	2026-09-20 21:42:07.422	\N
39	1	2104	أرصدة دائنة أخرى والضرائب	Other Creditors & Taxes	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	t	t	t	0.00	2026-09-20 21:42:07.427	2026-09-20 21:42:07.427	\N
40	1	2105	قروض وتسهيلات قصيرة الأجل	Short-term Loans	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	f	t	t	0.00	2026-09-20 21:42:07.436	2026-09-20 21:42:07.436	\N
41	1	2201	قروض بنكية طويلة الأجل	Long-term Bank Loans	الخصوم	الخصوم طويلة الأجل	\N	دائن	قائمة المركز المالي	3	22	f	t	t	0.00	2026-09-20 21:42:07.443	2026-09-20 21:42:07.443	\N
42	1	3201	جاري الشريك الرئيسي	Main Partner Current Account	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	3	32	f	t	t	0.00	2026-09-20 21:42:07.453	2026-09-20 21:42:07.453	\N
43	1	3301	الاحتياطي القانوني	Legal Reserve	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	3	33	f	t	t	0.00	2026-09-20 21:42:07.458	2026-09-20 21:42:07.458	\N
44	1	3302	الاحتياطي العام	General Reserve	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	3	33	f	t	t	0.00	2026-09-20 21:42:07.463	2026-09-20 21:42:07.463	\N
45	1	4101	إيراد المبيعات	Sales Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	3	41	f	t	t	0.00	2026-09-20 21:42:07.468	2026-09-20 21:42:07.468	\N
46	1	4102	إيراد تقديم خدمات	Services Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	3	41	f	t	t	0.00	2026-09-20 21:42:07.473	2026-09-20 21:42:07.473	\N
47	1	4103	مردودات ومسموحات المبيعات	Sales Returns & Allowances	الإيرادات	\N	\N	مدين	قائمة الدخل	3	41	f	t	t	0.00	2026-09-20 21:42:07.478	2026-09-20 21:42:07.478	\N
48	1	4104	الخصم المسموح به	Sales Discounts Allowed	الإيرادات	\N	\N	مدين	قائمة الدخل	3	41	f	t	t	0.00	2026-09-20 21:42:07.485	2026-09-20 21:42:07.485	\N
49	1	4201	أرباح بيع أصول ثابتة	Gain on Sale of Assets	الإيرادات	\N	\N	دائن	قائمة الدخل	3	42	f	t	t	0.00	2026-09-20 21:42:07.491	2026-09-20 21:42:07.491	\N
50	1	4202	إيرادات استثمارات وفوائد بنكية	Interest & Investment Income	الإيرادات	\N	\N	دائن	قائمة الدخل	3	42	f	t	t	0.00	2026-09-20 21:42:07.497	2026-09-20 21:42:07.497	\N
51	1	4203	إيرادات عرضية ومتنوعة	Miscellaneous Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	3	42	f	t	t	0.00	2026-09-20 21:42:07.504	2026-09-20 21:42:07.504	\N
52	1	5101	المشتريات	Purchases	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-09-20 21:42:07.509	2026-09-20 21:42:07.509	\N
53	1	5102	مصاريف نقل وشحن المشتريات (نولون)	Freight-In Purchases	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-09-20 21:42:07.517	2026-09-20 21:42:07.517	\N
54	1	5103	جمارك ورسوم استيراد	Customs & Import Duties	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-09-20 21:42:07.524	2026-09-20 21:42:07.524	\N
55	1	5104	مردودات ومسموحات المشتريات	Purchases Returns & Allowances	المصروفات	\N	\N	دائن	قائمة الدخل	3	51	f	t	t	0.00	2026-09-20 21:42:07.53	2026-09-20 21:42:07.53	\N
56	1	5105	الخصم المكتسب	Purchases Discounts Received	المصروفات	\N	\N	دائن	قائمة الدخل	3	51	f	t	t	0.00	2026-09-20 21:42:07.536	2026-09-20 21:42:07.536	\N
57	1	5201	حملات الدعاية والتسويق الرقمي	Marketing & Digital Ads	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-09-20 21:42:07.543	2026-09-20 21:42:07.543	\N
58	1	5202	رواتب وعمولات فريق المبيعات	Sales Salaries & Commissions	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-09-20 21:42:07.548	2026-09-20 21:42:07.548	\N
59	1	5203	مصاريف شحن وتوصيل المبيعات	Delivery & Shipping Out	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-09-20 21:42:07.551	2026-09-20 21:42:07.551	\N
60	1	5204	مواد تعبئة وتغليف	Packaging Materials	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-09-20 21:42:07.555	2026-09-20 21:42:07.555	\N
61	1	5205	إيجار معارض ومنافذ بيع	Showroom Rent	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-09-20 21:42:07.56	2026-09-20 21:42:07.56	\N
62	1	5301	الأجور والرواتب الإدارية	Administrative Salaries	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-09-20 21:42:07.565	2026-09-20 21:42:07.565	\N
63	1	5302	إيجار المقرات الإدارية	Office Rent	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-09-20 21:42:07.57	2026-09-20 21:42:07.57	\N
64	1	5303	كهرباء ومياه وغاز	Utilities (Electricity & Water)	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-09-20 21:42:07.576	2026-09-20 21:42:07.576	\N
65	1	5304	تليفونات وإنترنت واشتراكات رقمية	Telephone & Internet	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-09-20 21:42:07.582	2026-09-20 21:42:07.582	\N
66	1	5305	أدوات مكتبية ومطبوعات ورقية	Stationery & Printing	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-09-20 21:42:07.587	2026-09-20 21:42:07.587	\N
67	1	5306	مصروفات ضيافة وبوفيه ونظافة	Hospitality & Cleaning	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-09-20 21:42:07.592	2026-09-20 21:42:07.592	\N
68	1	5307	مصروفات وعمولات بنكية	Bank Charges & Fees	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-09-20 21:42:07.596	2026-09-20 21:42:07.596	\N
69	1	5308	اشتراك برامج وحلول سحابية	Software & Cloud Subscriptions	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-09-20 21:42:07.6	2026-09-20 21:42:07.6	\N
70	1	5309	استشارات قانونية ومحاسبية وتدقيق	Legal & Accounting Consultations	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-09-20 21:42:07.605	2026-09-20 21:42:07.605	\N
71	1	5310	إصلاحات وصيانة دورية عامة	Repairs & Maintenance	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-09-20 21:42:07.61	2026-09-20 21:42:07.61	\N
72	1	5311	انتقالات وسفريات ومحروقات سيارات	Transportation & Fuel	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-09-20 21:42:07.616	2026-09-20 21:42:07.616	\N
73	1	5312	تأمينات اجتماعية - حصة المنشأة	Company Social Insurance	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-09-20 21:42:07.624	2026-09-20 21:42:07.624	\N
74	1	5313	قسط إهلاك الأصول الثابتة	Depreciation Expense	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-09-20 21:42:07.63	2026-09-20 21:42:07.63	\N
75	1	5314	ديون معدومة	Bad Debts	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-09-20 21:42:07.635	2026-09-20 21:42:07.635	\N
76	1	5315	رسوم وغرامات حكومية وتراخيص	Government Licenses & Fees	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-09-20 21:42:07.639	2026-09-20 21:42:07.639	\N
77	1	5316	مصروفات إدارية ونثرية متنوعة	Miscellaneous Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-09-20 21:42:07.644	2026-09-20 21:42:07.644	\N
78	1	5401	أجور ومرتبات عمال التشغيل والإنتاج	Factory Labor Wages	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-09-20 21:42:07.648	2026-09-20 21:42:07.648	\N
79	1	5402	إيجار المصنع والورش ومواقع التشغيل	Factory & Workshop Rent	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-09-20 21:42:07.654	2026-09-20 21:42:07.654	\N
80	1	5403	كهرباء وقوى محركة للمصنع والآلات	Industrial Power & Electricity	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-09-20 21:42:07.658	2026-09-20 21:42:07.658	\N
81	1	5404	زيوت ووقود وصيانة آلات الإنتاج	Machine Oil, Fuel & Maintenance	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-09-20 21:42:07.663	2026-09-20 21:42:07.663	\N
82	1	5405	تشغيل وتصنيع خارجي لدى الغير	Subcontracting & External Processing	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-09-20 21:42:07.669	2026-09-20 21:42:07.669	\N
83	1	5406	مهمات وأدوات أمن صناعي وسلامة	Safety & Industrial Supplies	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-09-20 21:42:07.674	2026-09-20 21:42:07.674	\N
84	1	120101	الخزينة الرئيسية	Main Safe	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	4	1201	f	t	t	0.00	2026-09-20 21:42:07.679	2026-09-20 21:42:07.679	\N
85	1	120102	الخزينة الفرعية	Sub Safe	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	4	1201	f	t	t	0.00	2026-09-20 21:42:07.687	2026-09-20 21:42:07.687	\N
86	1	120103	عهد نقدية مؤقتة	Petty Cash	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	4	1201	f	t	t	0.00	2026-09-20 21:42:07.693	2026-09-20 21:42:07.693	\N
87	1	120201	الحسابات الجارية بالبنوك	Bank Current Accounts	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-09-20 21:42:07.699	2026-09-20 21:42:07.699	\N
88	1	120202	حسابات التوفير والودائع	Savings & Deposits	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-09-20 21:42:07.704	2026-09-20 21:42:07.704	\N
89	1	120203	المحافظ الإلكترونية والمدفوعات الرقمية	Digital Wallets & Cash	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-09-20 21:42:07.71	2026-09-20 21:42:07.71	\N
90	1	120204	حساب الهيئة القومية للبريد	Postal Account	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-09-20 21:42:07.716	2026-09-20 21:42:07.716	\N
91	1	120401	مخزون بضاعة تامة الصنع	Finished Goods Inventory	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	4	1204	f	t	t	0.00	2026-09-20 21:42:07.719	2026-09-20 21:42:07.719	\N
92	1	120402	مخزون خامات ومواد أولية	Raw Materials Inventory	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	4	1204	f	t	t	0.00	2026-09-20 21:42:07.725	2026-09-20 21:42:07.725	\N
93	1	120403	مخزون مهمات وقطع غيار	Spare Parts & Supplies	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	4	1204	f	t	t	0.00	2026-09-20 21:42:07.73	2026-09-20 21:42:07.73	\N
94	1	120501	عملاء محليون	Local Customers	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	4	1205	f	t	t	0.00	2026-09-20 21:42:07.734	2026-09-20 21:42:07.734	\N
95	1	120502	عملاء تصدير وخارجيون	Foreign Customers	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	4	1205	f	t	t	0.00	2026-09-20 21:42:07.739	2026-09-20 21:42:07.739	\N
96	1	120503	مبيعات نقدية (عميل نقدي)	Cash Customers	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	4	1205	f	t	t	0.00	2026-09-20 21:42:07.743	2026-09-20 21:42:07.743	\N
97	1	120601	إيراد مستحق	Accrued Revenues	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-09-20 21:42:07.748	2026-09-20 21:42:07.748	\N
98	1	120602	مصروف مدفوع مقدماً	Prepaid Expenses	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-09-20 21:42:07.753	2026-09-20 21:42:07.753	\N
99	1	120603	تأمينات لدى الغير	Deposits with Others	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-09-20 21:42:07.758	2026-09-20 21:42:07.758	\N
100	1	120604	سلف وذمم الموظفين	Employee Advances	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-09-20 21:42:07.763	2026-09-20 21:42:07.763	\N
101	1	120605	مدينون متنوعون	Miscellaneous Debtors	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-09-20 21:42:07.768	2026-09-20 21:42:07.768	\N
102	1	210101	موردون محليون	Local Suppliers	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	4	2101	f	t	t	0.00	2026-09-20 21:42:07.772	2026-09-20 21:42:07.772	\N
103	1	210102	موردون خارجيون	Foreign Suppliers	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	4	2101	f	t	t	0.00	2026-09-20 21:42:07.777	2026-09-20 21:42:07.777	\N
104	1	210103	مشتريات نقدية (مورد نقدي)	Cash Purchases (Cash Supplier)	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	4	2101	f	t	t	0.00	2026-09-20 21:42:07.782	2026-09-20 21:42:07.782	\N
105	1	210301	مرتبات وأجور مستحقة	Accrued Salaries	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2103	f	t	t	0.00	2026-09-20 21:42:07.789	2026-09-20 21:42:07.789	\N
106	1	210302	إيجارات مستحقة	Accrued Rent	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2103	f	t	t	0.00	2026-09-20 21:42:07.793	2026-09-20 21:42:07.793	\N
107	1	210401	مصلحة الضرائب - ضريبة القيمة المضافة	VAT Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-09-20 21:42:07.798	2026-09-20 21:42:07.798	\N
108	1	210402	مصلحة الضرائب - كسب العمل	Payroll Tax Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-09-20 21:42:07.805	2026-09-20 21:42:07.805	\N
109	1	210403	الهيئة القومية للتأمينات الاجتماعية	Social Insurance Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-09-20 21:42:07.81	2026-09-20 21:42:07.81	\N
110	1	210404	دائنون متنوعون	Miscellaneous Creditors	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-09-20 21:42:07.814	2026-09-20 21:42:07.814	\N
224	3	2	الخصوم	Liabilities	الخصوم	\N	\N	دائن	قائمة المركز المالي	1	\N	t	t	t	0.00	2026-10-06 14:59:17.313	2026-10-06 14:59:17.313	\N
225	3	3	حقوق الملكية	Equity	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	1	\N	t	t	t	0.00	2026-10-06 14:59:17.324	2026-10-06 14:59:17.324	\N
226	3	4	الإيرادات	Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	1	\N	t	t	t	0.00	2026-10-06 14:59:17.329	2026-10-06 14:59:17.329	\N
112	1	5106	تغير مخزون آخر الفترة	Periodic Inventory Change	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-06 12:53:54.036	2026-10-06 12:53:54.036	\N
227	3	5	المصروفات	Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	1	\N	t	t	t	0.00	2026-10-06 14:59:17.333	2026-10-06 14:59:17.333	\N
228	3	1	الأصول	Assets	الأصول	\N	\N	مدين	قائمة المركز المالي	1	\N	t	t	t	0.00	2026-10-06 14:59:17.338	2026-10-06 14:59:17.338	\N
229	3	33	الاحتياطيات	Reserves	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	t	t	t	0.00	2026-10-06 14:59:17.343	2026-10-06 14:59:17.343	\N
230	3	34	الأرباح المحتجزة / المرحلة	Retained Earnings	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	f	t	t	0.00	2026-10-06 14:59:17.349	2026-10-06 14:59:17.349	\N
231	3	35	أرباح (خسائر) العام الحالي	Current Year Profit / Loss	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	f	t	t	0.00	2026-10-06 14:59:17.354	2026-10-06 14:59:17.354	\N
232	3	41	إيرادات النشاط الرئيسي	Operating Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	2	4	t	t	t	0.00	2026-10-06 14:59:17.378	2026-10-06 14:59:17.378	\N
335	4	2	الخصوم	Liabilities	الخصوم	\N	\N	دائن	قائمة المركز المالي	1	\N	t	t	t	0.00	2026-10-06 15:04:49.647	2026-10-06 15:04:49.647	\N
336	4	3	حقوق الملكية	Equity	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	1	\N	t	t	t	0.00	2026-10-06 15:04:49.654	2026-10-06 15:04:49.654	\N
337	4	4	الإيرادات	Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	1	\N	t	t	t	0.00	2026-10-06 15:04:49.659	2026-10-06 15:04:49.659	\N
338	4	5	المصروفات	Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	1	\N	t	t	t	0.00	2026-10-06 15:04:49.665	2026-10-06 15:04:49.665	\N
339	4	1	الأصول	Assets	الأصول	\N	\N	مدين	قائمة المركز المالي	1	\N	t	t	t	0.00	2026-10-06 15:04:49.671	2026-10-06 15:04:49.671	\N
340	4	33	الاحتياطيات	Reserves	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	t	t	t	0.00	2026-10-06 15:04:49.676	2026-10-06 15:04:49.676	\N
341	4	34	الأرباح المحتجزة / المرحلة	Retained Earnings	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	f	t	t	0.00	2026-10-06 15:04:49.685	2026-10-06 15:04:49.685	\N
342	4	35	أرباح (خسائر) العام الحالي	Current Year Profit / Loss	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	f	t	t	0.00	2026-10-06 15:04:49.692	2026-10-06 15:04:49.692	\N
343	4	41	إيرادات النشاط الرئيسي	Operating Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	2	4	t	t	t	0.00	2026-10-06 15:04:49.697	2026-10-06 15:04:49.697	\N
344	4	42	إيرادات أخرى متنوعة	Other Revenues	الإيرادات	\N	\N	دائن	قائمة الدخل	2	4	t	t	t	0.00	2026-10-06 15:04:49.703	2026-10-06 15:04:49.703	\N
345	4	51	تكلفة النشاط والمبيعات	Cost of Goods Sold (COGS)	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-06 15:04:49.708	2026-10-06 15:04:49.708	\N
346	4	52	مصاريف البيع والتسويق	Selling & Marketing Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-06 15:04:49.712	2026-10-06 15:04:49.712	\N
347	4	53	مصروفات إدارية وعمومية	General & Administrative Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-06 15:04:49.719	2026-10-06 15:04:49.719	\N
348	4	54	مصروفات التشغيل والإنتاج	Operating & Production Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-06 15:04:49.723	2026-10-06 15:04:49.723	\N
349	4	12	الأصول المتداولة	Current Assets	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	2	1	t	t	t	0.00	2026-10-06 15:04:49.728	2026-10-06 15:04:49.728	\N
350	4	11	الأصول الثابتة	Fixed Assets	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	2	1	t	t	t	0.00	2026-10-06 15:04:49.734	2026-10-06 15:04:49.734	\N
351	4	21	الخصوم المتداولة	Current Liabilities	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	2	2	t	t	t	0.00	2026-10-06 15:04:49.738	2026-10-06 15:04:49.738	\N
352	4	22	الخصوم طويلة الأجل	Long-term Liabilities	الخصوم	الخصوم طويلة الأجل	\N	دائن	قائمة المركز المالي	2	2	t	t	t	0.00	2026-10-06 15:04:49.744	2026-10-06 15:04:49.744	\N
353	4	31	رأس المال	Capital	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	f	t	t	0.00	2026-10-06 15:04:49.749	2026-10-06 15:04:49.749	\N
354	4	32	جاري الشركاء / صاحب المنشأة	Partners' Current Accounts	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	t	t	t	0.00	2026-10-06 15:04:49.754	2026-10-06 15:04:49.754	\N
355	4	2105	قروض وتسهيلات قصيرة الأجل	Short-term Loans	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	f	t	t	0.00	2026-10-06 15:04:49.759	2026-10-06 15:04:49.759	\N
356	4	2201	قروض بنكية طويلة الأجل	Long-term Bank Loans	الخصوم	الخصوم طويلة الأجل	\N	دائن	قائمة المركز المالي	3	22	f	t	t	0.00	2026-10-06 15:04:49.765	2026-10-06 15:04:49.765	\N
357	4	3201	جاري الشريك الرئيسي	Main Partner Current Account	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	3	32	f	t	t	0.00	2026-10-06 15:04:49.771	2026-10-06 15:04:49.771	\N
358	4	3301	الاحتياطي القانوني	Legal Reserve	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	3	33	f	t	t	0.00	2026-10-06 15:04:49.777	2026-10-06 15:04:49.777	\N
359	4	3302	الاحتياطي العام	General Reserve	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	3	33	f	t	t	0.00	2026-10-06 15:04:49.781	2026-10-06 15:04:49.781	\N
360	4	4101	إيراد المبيعات	Sales Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	3	41	f	t	t	0.00	2026-10-06 15:04:49.786	2026-10-06 15:04:49.786	\N
361	4	4102	إيراد تقديم خدمات	Services Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	3	41	f	t	t	0.00	2026-10-06 15:04:49.791	2026-10-06 15:04:49.791	\N
362	4	4103	مردودات ومسموحات المبيعات	Sales Returns & Allowances	الإيرادات	\N	\N	مدين	قائمة الدخل	3	41	f	t	t	0.00	2026-10-06 15:04:49.797	2026-10-06 15:04:49.797	\N
363	4	4104	الخصم المسموح به	Sales Discounts Allowed	الإيرادات	\N	\N	مدين	قائمة الدخل	3	41	f	t	t	0.00	2026-10-06 15:04:49.803	2026-10-06 15:04:49.803	\N
364	4	4201	أرباح بيع أصول ثابتة	Gain on Sale of Assets	الإيرادات	\N	\N	دائن	قائمة الدخل	3	42	f	t	t	0.00	2026-10-06 15:04:49.81	2026-10-06 15:04:49.81	\N
365	4	4202	إيرادات استثمارات وفوائد بنكية	Interest & Investment Income	الإيرادات	\N	\N	دائن	قائمة الدخل	3	42	f	t	t	0.00	2026-10-06 15:04:49.815	2026-10-06 15:04:49.815	\N
116	2	5	المصروفات	Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	1	\N	t	t	t	0.00	2026-10-06 13:44:22.295	2026-10-06 14:10:45.762	\N
366	4	4203	إيرادات عرضية ومتنوعة	Miscellaneous Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	3	42	f	t	t	0.00	2026-10-06 15:04:49.819	2026-10-06 15:04:49.819	\N
233	3	42	إيرادات أخرى متنوعة	Other Revenues	الإيرادات	\N	\N	دائن	قائمة الدخل	2	4	t	t	t	0.00	2026-10-06 14:59:17.384	2026-10-06 14:59:17.384	\N
234	3	51	تكلفة النشاط والمبيعات	Cost of Goods Sold (COGS)	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-06 14:59:17.422	2026-10-06 14:59:17.422	\N
235	3	52	مصاريف البيع والتسويق	Selling & Marketing Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-06 14:59:17.427	2026-10-06 14:59:17.427	\N
236	3	53	مصروفات إدارية وعمومية	General & Administrative Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-06 14:59:17.435	2026-10-06 14:59:17.435	\N
237	3	54	مصروفات التشغيل والإنتاج	Operating & Production Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-06 14:59:17.441	2026-10-06 14:59:17.441	\N
238	3	12	الأصول المتداولة	Current Assets	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	2	1	t	t	t	0.00	2026-10-06 14:59:17.445	2026-10-06 14:59:17.445	\N
239	3	11	الأصول الثابتة	Fixed Assets	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	2	1	t	t	t	0.00	2026-10-06 14:59:17.45	2026-10-06 14:59:17.45	\N
240	3	21	الخصوم المتداولة	Current Liabilities	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	2	2	t	t	t	0.00	2026-10-06 14:59:17.455	2026-10-06 14:59:17.455	\N
241	3	22	الخصوم طويلة الأجل	Long-term Liabilities	الخصوم	الخصوم طويلة الأجل	\N	دائن	قائمة المركز المالي	2	2	t	t	t	0.00	2026-10-06 14:59:17.459	2026-10-06 14:59:17.459	\N
242	3	31	رأس المال	Capital	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	f	t	t	0.00	2026-10-06 14:59:17.462	2026-10-06 14:59:17.462	\N
243	3	32	جاري الشركاء / صاحب المنشأة	Partners' Current Accounts	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	t	t	t	0.00	2026-10-06 14:59:17.467	2026-10-06 14:59:17.467	\N
244	3	2105	قروض وتسهيلات قصيرة الأجل	Short-term Loans	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	f	t	t	0.00	2026-10-06 14:59:17.471	2026-10-06 14:59:17.471	\N
245	3	2201	قروض بنكية طويلة الأجل	Long-term Bank Loans	الخصوم	الخصوم طويلة الأجل	\N	دائن	قائمة المركز المالي	3	22	f	t	t	0.00	2026-10-06 14:59:17.478	2026-10-06 14:59:17.478	\N
246	3	3201	جاري الشريك الرئيسي	Main Partner Current Account	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	3	32	f	t	t	0.00	2026-10-06 14:59:17.483	2026-10-06 14:59:17.483	\N
247	3	3301	الاحتياطي القانوني	Legal Reserve	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	3	33	f	t	t	0.00	2026-10-06 14:59:17.488	2026-10-06 14:59:17.488	\N
248	3	3302	الاحتياطي العام	General Reserve	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	3	33	f	t	t	0.00	2026-10-06 14:59:17.495	2026-10-06 14:59:17.495	\N
249	3	4101	إيراد المبيعات	Sales Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	3	41	f	t	t	0.00	2026-10-06 14:59:17.5	2026-10-06 14:59:17.5	\N
250	3	4102	إيراد تقديم خدمات	Services Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	3	41	f	t	t	0.00	2026-10-06 14:59:17.505	2026-10-06 14:59:17.505	\N
251	3	4103	مردودات ومسموحات المبيعات	Sales Returns & Allowances	الإيرادات	\N	\N	مدين	قائمة الدخل	3	41	f	t	t	0.00	2026-10-06 14:59:17.513	2026-10-06 14:59:17.513	\N
252	3	4104	الخصم المسموح به	Sales Discounts Allowed	الإيرادات	\N	\N	مدين	قائمة الدخل	3	41	f	t	t	0.00	2026-10-06 14:59:17.518	2026-10-06 14:59:17.518	\N
253	3	4201	أرباح بيع أصول ثابتة	Gain on Sale of Assets	الإيرادات	\N	\N	دائن	قائمة الدخل	3	42	f	t	t	0.00	2026-10-06 14:59:17.525	2026-10-06 14:59:17.525	\N
254	3	4202	إيرادات استثمارات وفوائد بنكية	Interest & Investment Income	الإيرادات	\N	\N	دائن	قائمة الدخل	3	42	f	t	t	0.00	2026-10-06 14:59:17.531	2026-10-06 14:59:17.531	\N
255	3	4203	إيرادات عرضية ومتنوعة	Miscellaneous Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	3	42	f	t	t	0.00	2026-10-06 14:59:17.537	2026-10-06 14:59:17.537	\N
256	3	5101	المشتريات	Purchases	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-06 14:59:17.542	2026-10-06 14:59:17.542	\N
257	3	5102	مصاريف نقل وشحن المشتريات (نولون)	Freight-In Purchases	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-06 14:59:17.547	2026-10-06 14:59:17.547	\N
258	3	5103	جمارك ورسوم استيراد	Customs & Import Duties	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-06 14:59:17.552	2026-10-06 14:59:17.552	\N
259	3	5104	مردودات ومسموحات المشتريات	Purchases Returns & Allowances	المصروفات	\N	\N	دائن	قائمة الدخل	3	51	f	t	t	0.00	2026-10-06 14:59:17.557	2026-10-06 14:59:17.557	\N
260	3	5105	الخصم المكتسب	Purchases Discounts Received	المصروفات	\N	\N	دائن	قائمة الدخل	3	51	f	t	t	0.00	2026-10-06 14:59:17.562	2026-10-06 14:59:17.562	\N
261	3	5201	حملات الدعاية والتسويق الرقمي	Marketing & Digital Ads	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-06 14:59:17.566	2026-10-06 14:59:17.566	\N
262	3	5202	رواتب وعمولات فريق المبيعات	Sales Salaries & Commissions	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-06 14:59:17.572	2026-10-06 14:59:17.572	\N
263	3	5203	مصاريف شحن وتوصيل المبيعات	Delivery & Shipping Out	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-06 14:59:17.576	2026-10-06 14:59:17.576	\N
264	3	5204	مواد تعبئة وتغليف	Packaging Materials	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-06 14:59:17.581	2026-10-06 14:59:17.581	\N
265	3	5205	إيجار معارض ومنافذ بيع	Showroom Rent	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-06 14:59:17.587	2026-10-06 14:59:17.587	\N
266	3	5301	الأجور والرواتب الإدارية	Administrative Salaries	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 14:59:17.594	2026-10-06 14:59:17.594	\N
267	3	5302	إيجار المقرات الإدارية	Office Rent	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 14:59:17.599	2026-10-06 14:59:17.599	\N
268	3	5303	كهرباء ومياه وغاز	Utilities (Electricity & Water)	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 14:59:17.603	2026-10-06 14:59:17.603	\N
117	2	1	الأصول	Assets	الأصول	\N	\N	مدين	قائمة المركز المالي	1	\N	t	t	t	0.00	2026-10-06 13:44:22.302	2026-10-06 14:10:45.762	\N
269	3	5304	تليفونات وإنترنت واشتراكات رقمية	Telephone & Internet	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 14:59:17.607	2026-10-06 14:59:17.607	\N
270	3	5305	أدوات مكتبية ومطبوعات ورقية	Stationery & Printing	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 14:59:17.612	2026-10-06 14:59:17.612	\N
271	3	5306	مصروفات ضيافة وبوفيه ونظافة	Hospitality & Cleaning	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 14:59:17.617	2026-10-06 14:59:17.617	\N
272	3	5307	مصروفات وعمولات بنكية	Bank Charges & Fees	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 14:59:17.621	2026-10-06 14:59:17.621	\N
273	3	5309	استشارات قانونية ومحاسبية وتدقيق	Legal & Accounting Consultations	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 14:59:17.625	2026-10-06 14:59:17.625	\N
274	3	5310	إصلاحات وصيانة دورية عامة	Repairs & Maintenance	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 14:59:17.629	2026-10-06 14:59:17.629	\N
275	3	5311	انتقالات وسفريات ومحروقات سيارات	Transportation & Fuel	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 14:59:17.632	2026-10-06 14:59:17.632	\N
276	3	5312	تأمينات اجتماعية - حصة المنشأة	Company Social Insurance	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 14:59:17.636	2026-10-06 14:59:17.636	\N
277	3	5313	قسط إهلاك الأصول الثابتة	Depreciation Expense	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 14:59:17.639	2026-10-06 14:59:17.639	\N
278	3	5314	ديون معدومة	Bad Debts	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 14:59:17.643	2026-10-06 14:59:17.643	\N
279	3	5315	رسوم وغرامات حكومية وتراخيص	Government Licenses & Fees	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 14:59:17.647	2026-10-06 14:59:17.647	\N
280	3	5316	مصروفات إدارية ونثرية متنوعة	Miscellaneous Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 14:59:17.652	2026-10-06 14:59:17.652	\N
281	3	5401	أجور ومرتبات عمال التشغيل والإنتاج	Factory Labor Wages	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-06 14:59:17.656	2026-10-06 14:59:17.656	\N
282	3	5402	إيجار المصنع والورش ومواقع التشغيل	Factory & Workshop Rent	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-06 14:59:17.66	2026-10-06 14:59:17.66	\N
283	3	5403	كهرباء وقوى محركة للمصنع والآلات	Industrial Power & Electricity	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-06 14:59:17.664	2026-10-06 14:59:17.664	\N
284	3	5404	زيوت ووقود وصيانة آلات الإنتاج	Machine Oil, Fuel & Maintenance	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-06 14:59:17.669	2026-10-06 14:59:17.669	\N
285	3	5405	تشغيل وتصنيع خارجي لدى الغير	Subcontracting & External Processing	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-06 14:59:17.675	2026-10-06 14:59:17.675	\N
286	3	5406	مهمات وأدوات أمن صناعي وسلامة	Safety & Industrial Supplies	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-06 14:59:17.679	2026-10-06 14:59:17.679	\N
287	3	5308	اشتراك برامج وحلول سحابية	Software & Cloud Subscriptions	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 14:59:17.684	2026-10-06 14:59:17.684	\N
288	3	1101	الأراضي	Lands	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 14:59:17.688	2026-10-06 14:59:17.688	\N
289	3	1102	المباني والإنشاءات	Buildings	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 14:59:17.692	2026-10-06 14:59:17.692	\N
290	3	1103	الآلات والمعدات	Machinery & Equipment	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 14:59:17.696	2026-10-06 14:59:17.696	\N
291	3	1104	السيارات ووسائل النقل	Vehicles	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 14:59:17.701	2026-10-06 14:59:17.701	\N
292	3	1105	الأثاث والتجهيزات المكتبية	Furniture & Fixtures	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 14:59:17.707	2026-10-06 14:59:17.707	\N
293	3	1106	أجهزة الكمبيوتر والبرمجيات	Computers & IT Equipment	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 14:59:17.711	2026-10-06 14:59:17.711	\N
294	3	1107	الديكورات والتركيبات	Decorations & Installations	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 14:59:17.717	2026-10-06 14:59:17.717	\N
295	3	1108	ماكينات ومعدات تشغيل	Operating Machines	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 14:59:17.723	2026-10-06 14:59:17.723	\N
296	3	1109	مجمع إهلاك الأصول الثابتة	Accumulated Depreciation	الأصول	الأصول الثابتة	\N	دائن	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 14:59:17.729	2026-10-06 14:59:17.729	\N
297	3	1201	النقدية وما في حكمها	Cash & Cash Equivalents	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-06 14:59:17.734	2026-10-06 14:59:17.734	\N
298	3	1202	البنوك والمحافظ المالية	Banks & E-Wallets	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-06 14:59:17.738	2026-10-06 14:59:17.738	\N
299	3	1203	أوراق القبض (شيكات تحت التحصيل)	Notes Receivable	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	3	12	f	t	t	0.00	2026-10-06 14:59:17.742	2026-10-06 14:59:17.742	\N
300	3	1204	المخزون السلعي	Inventory	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-06 14:59:17.745	2026-10-06 14:59:17.745	\N
301	3	1205	العملاء (حساب المراقبة)	Accounts Receivable (Control)	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-06 14:59:17.748	2026-10-06 14:59:17.748	\N
113	2	2	الخصوم	Liabilities	الخصوم	\N	\N	دائن	قائمة المركز المالي	1	\N	t	t	t	0.00	2026-10-06 13:44:22.27	2026-10-06 14:10:45.762	\N
118	2	33	الاحتياطيات	Reserves	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	t	t	t	0.00	2026-10-06 13:44:22.31	2026-10-06 14:10:45.762	\N
119	2	34	الأرباح المحتجزة / المرحلة	Retained Earnings	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	f	t	t	0.00	2026-10-06 13:44:22.318	2026-10-06 14:10:45.762	\N
120	2	35	أرباح (خسائر) العام الحالي	Current Year Profit / Loss	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	f	t	t	0.00	2026-10-06 13:44:22.327	2026-10-06 14:10:45.762	\N
302	3	1206	أرصدة مدينة أخرى	Other Debit Balances	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-06 14:59:17.751	2026-10-06 14:59:17.751	\N
303	3	2101	الموردين (حساب المراقبة)	Accounts Payable (Control)	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	3	21	t	t	t	0.00	2026-10-06 14:59:17.755	2026-10-06 14:59:17.755	\N
367	4	5101	المشتريات	Purchases	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-06 15:04:49.826	2026-10-06 15:04:49.826	\N
304	3	2102	أوراق الدفع (شيكات تحت الصرف)	Notes Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	f	t	t	0.00	2026-10-06 14:59:17.759	2026-10-06 14:59:17.759	\N
305	3	2103	مصروفات مستحقة	Accrued Expenses	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	t	t	t	0.00	2026-10-06 14:59:17.762	2026-10-06 14:59:17.762	\N
121	2	41	إيرادات النشاط الرئيسي	Operating Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	2	4	t	t	t	0.00	2026-10-06 13:44:22.337	2026-10-06 14:10:45.762	\N
122	2	42	إيرادات أخرى متنوعة	Other Revenues	الإيرادات	\N	\N	دائن	قائمة الدخل	2	4	t	t	t	0.00	2026-10-06 13:44:22.343	2026-10-06 14:10:45.762	\N
123	2	51	تكلفة النشاط والمبيعات	Cost of Goods Sold (COGS)	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-06 13:44:22.35	2026-10-06 14:10:45.762	\N
124	2	52	مصاريف البيع والتسويق	Selling & Marketing Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-06 13:44:22.358	2026-10-06 14:10:45.762	\N
125	2	53	مصروفات إدارية وعمومية	General & Administrative Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-06 13:44:22.365	2026-10-06 14:10:45.762	\N
126	2	54	مصروفات التشغيل والإنتاج	Operating & Production Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-06 13:44:22.371	2026-10-06 14:10:45.762	\N
127	2	12	الأصول المتداولة	Current Assets	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	2	1	t	t	t	0.00	2026-10-06 13:44:22.378	2026-10-06 14:10:45.762	\N
128	2	11	الأصول الثابتة	Fixed Assets	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	2	1	t	t	t	0.00	2026-10-06 13:44:22.386	2026-10-06 14:10:45.762	\N
129	2	21	الخصوم المتداولة	Current Liabilities	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	2	2	t	t	t	0.00	2026-10-06 13:44:22.393	2026-10-06 14:10:45.762	\N
130	2	22	الخصوم طويلة الأجل	Long-term Liabilities	الخصوم	الخصوم طويلة الأجل	\N	دائن	قائمة المركز المالي	2	2	t	t	t	0.00	2026-10-06 13:44:22.399	2026-10-06 14:10:45.762	\N
131	2	31	رأس المال	Capital	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	f	t	t	0.00	2026-10-06 13:44:22.408	2026-10-06 14:10:45.762	\N
132	2	32	جاري الشركاء / صاحب المنشأة	Partners' Current Accounts	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	t	t	t	0.00	2026-10-06 13:44:22.415	2026-10-06 14:10:45.762	\N
133	2	2105	قروض وتسهيلات قصيرة الأجل	Short-term Loans	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	f	t	t	0.00	2026-10-06 13:44:22.422	2026-10-06 14:10:45.762	\N
134	2	2201	قروض بنكية طويلة الأجل	Long-term Bank Loans	الخصوم	الخصوم طويلة الأجل	\N	دائن	قائمة المركز المالي	3	22	f	t	t	0.00	2026-10-06 13:44:22.428	2026-10-06 14:10:45.762	\N
135	2	3201	جاري الشريك الرئيسي	Main Partner Current Account	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	3	32	f	t	t	0.00	2026-10-06 13:44:22.435	2026-10-06 14:10:45.762	\N
136	2	3301	الاحتياطي القانوني	Legal Reserve	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	3	33	f	t	t	0.00	2026-10-06 13:44:22.44	2026-10-06 14:10:45.762	\N
137	2	3302	الاحتياطي العام	General Reserve	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	3	33	f	t	t	0.00	2026-10-06 13:44:22.446	2026-10-06 14:10:45.762	\N
138	2	4101	إيراد المبيعات	Sales Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	3	41	f	t	t	0.00	2026-10-06 13:44:22.454	2026-10-06 14:10:45.762	\N
139	2	4102	إيراد تقديم خدمات	Services Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	3	41	f	t	t	0.00	2026-10-06 13:44:22.461	2026-10-06 14:10:45.762	\N
140	2	4103	مردودات ومسموحات المبيعات	Sales Returns & Allowances	الإيرادات	\N	\N	مدين	قائمة الدخل	3	41	f	t	t	0.00	2026-10-06 13:44:22.469	2026-10-06 14:10:45.762	\N
141	2	4104	الخصم المسموح به	Sales Discounts Allowed	الإيرادات	\N	\N	مدين	قائمة الدخل	3	41	f	t	t	0.00	2026-10-06 13:44:22.477	2026-10-06 14:10:45.762	\N
142	2	4201	أرباح بيع أصول ثابتة	Gain on Sale of Assets	الإيرادات	\N	\N	دائن	قائمة الدخل	3	42	f	t	t	0.00	2026-10-06 13:44:22.484	2026-10-06 14:10:45.762	\N
143	2	4202	إيرادات استثمارات وفوائد بنكية	Interest & Investment Income	الإيرادات	\N	\N	دائن	قائمة الدخل	3	42	f	t	t	0.00	2026-10-06 13:44:22.493	2026-10-06 14:10:45.762	\N
144	2	4203	إيرادات عرضية ومتنوعة	Miscellaneous Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	3	42	f	t	t	0.00	2026-10-06 13:44:22.502	2026-10-06 14:10:45.762	\N
145	2	5101	المشتريات	Purchases	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-06 13:44:22.51	2026-10-06 14:10:45.762	\N
146	2	5102	مصاريف نقل وشحن المشتريات (نولون)	Freight-In Purchases	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-06 13:44:22.519	2026-10-06 14:10:45.762	\N
148	2	5104	مردودات ومسموحات المشتريات	Purchases Returns & Allowances	المصروفات	\N	\N	دائن	قائمة الدخل	3	51	f	t	t	0.00	2026-10-06 13:44:22.537	2026-10-06 14:10:45.762	\N
149	2	5105	الخصم المكتسب	Purchases Discounts Received	المصروفات	\N	\N	دائن	قائمة الدخل	3	51	f	t	t	0.00	2026-10-06 13:44:22.544	2026-10-06 14:10:45.762	\N
150	2	5201	حملات الدعاية والتسويق الرقمي	Marketing & Digital Ads	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-06 13:44:22.556	2026-10-06 14:10:45.762	\N
151	2	5202	رواتب وعمولات فريق المبيعات	Sales Salaries & Commissions	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-06 13:44:22.565	2026-10-06 14:10:45.762	\N
152	2	5203	مصاريف شحن وتوصيل المبيعات	Delivery & Shipping Out	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-06 13:44:22.571	2026-10-06 14:10:45.762	\N
153	2	5204	مواد تعبئة وتغليف	Packaging Materials	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-06 13:44:22.58	2026-10-06 14:10:45.762	\N
154	2	5205	إيجار معارض ومنافذ بيع	Showroom Rent	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-06 13:44:22.586	2026-10-06 14:10:45.762	\N
155	2	5301	الأجور والرواتب الإدارية	Administrative Salaries	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 13:44:22.594	2026-10-06 14:10:45.762	\N
156	2	5302	إيجار المقرات الإدارية	Office Rent	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 13:44:22.601	2026-10-06 14:10:45.762	\N
157	2	5303	كهرباء ومياه وغاز	Utilities (Electricity & Water)	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 13:44:22.609	2026-10-06 14:10:45.762	\N
158	2	5304	تليفونات وإنترنت واشتراكات رقمية	Telephone & Internet	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 13:44:22.616	2026-10-06 14:10:45.762	\N
159	2	5305	أدوات مكتبية ومطبوعات ورقية	Stationery & Printing	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 13:44:22.623	2026-10-06 14:10:45.762	\N
160	2	5306	مصروفات ضيافة وبوفيه ونظافة	Hospitality & Cleaning	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 13:44:22.63	2026-10-06 14:10:45.762	\N
161	2	5307	مصروفات وعمولات بنكية	Bank Charges & Fees	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 13:44:22.638	2026-10-06 14:10:45.762	\N
162	2	5309	استشارات قانونية ومحاسبية وتدقيق	Legal & Accounting Consultations	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 13:44:22.644	2026-10-06 14:10:45.762	\N
163	2	5310	إصلاحات وصيانة دورية عامة	Repairs & Maintenance	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 13:44:22.651	2026-10-06 14:10:45.762	\N
164	2	5311	انتقالات وسفريات ومحروقات سيارات	Transportation & Fuel	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 13:44:22.66	2026-10-06 14:10:45.762	\N
165	2	5312	تأمينات اجتماعية - حصة المنشأة	Company Social Insurance	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 13:44:22.668	2026-10-06 14:10:45.762	\N
166	2	5313	قسط إهلاك الأصول الثابتة	Depreciation Expense	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 13:44:22.678	2026-10-06 14:10:45.762	\N
167	2	5314	ديون معدومة	Bad Debts	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 13:44:22.685	2026-10-06 14:10:45.762	\N
168	2	5315	رسوم وغرامات حكومية وتراخيص	Government Licenses & Fees	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 13:44:22.694	2026-10-06 14:10:45.762	\N
169	2	5316	مصروفات إدارية ونثرية متنوعة	Miscellaneous Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 13:44:22.701	2026-10-06 14:10:45.762	\N
170	2	5401	أجور ومرتبات عمال التشغيل والإنتاج	Factory Labor Wages	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-06 13:44:22.707	2026-10-06 14:10:45.762	\N
171	2	5402	إيجار المصنع والورش ومواقع التشغيل	Factory & Workshop Rent	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-06 13:44:22.713	2026-10-06 14:10:45.762	\N
172	2	5403	كهرباء وقوى محركة للمصنع والآلات	Industrial Power & Electricity	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-06 13:44:22.718	2026-10-06 14:10:45.762	\N
173	2	5404	زيوت ووقود وصيانة آلات الإنتاج	Machine Oil, Fuel & Maintenance	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-06 13:44:22.726	2026-10-06 14:10:45.762	\N
174	2	5405	تشغيل وتصنيع خارجي لدى الغير	Subcontracting & External Processing	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-06 13:44:22.733	2026-10-06 14:10:45.762	\N
175	2	5406	مهمات وأدوات أمن صناعي وسلامة	Safety & Industrial Supplies	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-06 13:44:22.745	2026-10-06 14:10:45.762	\N
176	2	5308	اشتراك برامج وحلول سحابية	Software & Cloud Subscriptions	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 13:44:22.752	2026-10-06 14:10:45.762	\N
177	2	1101	الأراضي	Lands	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 13:44:22.759	2026-10-06 14:10:45.762	\N
178	2	1102	المباني والإنشاءات	Buildings	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 13:44:22.767	2026-10-06 14:10:45.762	\N
179	2	1103	الآلات والمعدات	Machinery & Equipment	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 13:44:22.777	2026-10-06 14:10:45.762	\N
180	2	1104	السيارات ووسائل النقل	Vehicles	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 13:44:22.785	2026-10-06 14:10:45.762	\N
181	2	1105	الأثاث والتجهيزات المكتبية	Furniture & Fixtures	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 13:44:22.793	2026-10-06 14:10:45.762	\N
182	2	1106	أجهزة الكمبيوتر والبرمجيات	Computers & IT Equipment	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 13:44:22.801	2026-10-06 14:10:45.762	\N
183	2	1107	الديكورات والتركيبات	Decorations & Installations	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 13:44:22.812	2026-10-06 14:10:45.762	\N
184	2	1108	ماكينات ومعدات تشغيل	Operating Machines	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 13:44:22.819	2026-10-06 14:10:45.762	\N
185	2	1109	مجمع إهلاك الأصول الثابتة	Accumulated Depreciation	الأصول	الأصول الثابتة	\N	دائن	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 13:44:22.831	2026-10-06 14:10:45.762	\N
186	2	1201	النقدية وما في حكمها	Cash & Cash Equivalents	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-06 13:44:22.837	2026-10-06 14:10:45.762	\N
187	2	1202	البنوك والمحافظ المالية	Banks & E-Wallets	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-06 13:44:22.843	2026-10-06 14:10:45.762	\N
188	2	1203	أوراق القبض (شيكات تحت التحصيل)	Notes Receivable	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	3	12	f	t	t	0.00	2026-10-06 13:44:22.853	2026-10-06 14:10:45.762	\N
189	2	1204	المخزون السلعي	Inventory	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-06 13:44:22.862	2026-10-06 14:10:45.762	\N
190	2	1205	العملاء (حساب المراقبة)	Accounts Receivable (Control)	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-06 13:44:22.87	2026-10-06 14:10:45.762	\N
191	2	1206	أرصدة مدينة أخرى	Other Debit Balances	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-06 13:44:22.876	2026-10-06 14:10:45.762	\N
192	2	2101	الموردين (حساب المراقبة)	Accounts Payable (Control)	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	3	21	t	t	t	0.00	2026-10-06 13:44:22.886	2026-10-06 14:10:45.762	\N
193	2	2102	أوراق الدفع (شيكات تحت الصرف)	Notes Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	f	t	t	0.00	2026-10-06 13:44:22.892	2026-10-06 14:10:45.762	\N
194	2	2103	مصروفات مستحقة	Accrued Expenses	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	t	t	t	0.00	2026-10-06 13:44:22.898	2026-10-06 14:10:45.762	\N
195	2	2104	أرصدة دائنة أخرى والضرائب	Other Creditors & Taxes	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	t	t	t	0.00	2026-10-06 13:44:22.907	2026-10-06 14:10:45.762	\N
196	2	5106	تغير مخزون آخر الفترة	Periodic Inventory Change	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-06 13:44:22.914	2026-10-06 14:10:45.762	\N
197	2	120102	الخزينة الفرعية	Sub Safe	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	4	1201	f	t	t	0.00	2026-10-06 13:44:22.922	2026-10-06 14:10:45.762	\N
198	2	120103	عهد نقدية مؤقتة	Petty Cash	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	4	1201	f	t	t	0.00	2026-10-06 13:44:22.93	2026-10-06 14:10:45.762	\N
199	2	120201	الحسابات الجارية بالبنوك	Bank Current Accounts	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-06 13:44:22.936	2026-10-06 14:10:45.762	\N
200	2	120202	حسابات التوفير والودائع	Savings & Deposits	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-06 13:44:22.943	2026-10-06 14:10:45.762	\N
201	2	120203	المحافظ الإلكترونية والمدفوعات الرقمية	Digital Wallets & Cash	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-06 13:44:22.95	2026-10-06 14:10:45.762	\N
202	2	120204	حساب الهيئة القومية للبريد	Postal Account	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-06 13:44:22.956	2026-10-06 14:10:45.762	\N
203	2	120401	مخزون بضاعة تامة الصنع	Finished Goods Inventory	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	4	1204	f	t	t	0.00	2026-10-06 13:44:22.962	2026-10-06 14:10:45.762	\N
204	2	120402	مخزون خامات ومواد أولية	Raw Materials Inventory	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	4	1204	f	t	t	0.00	2026-10-06 13:44:22.969	2026-10-06 14:10:45.762	\N
205	2	120403	مخزون مهمات وقطع غيار	Spare Parts & Supplies	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	4	1204	f	t	t	0.00	2026-10-06 13:44:22.979	2026-10-06 14:10:45.762	\N
206	2	120501	عملاء محليون	Local Customers	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	4	1205	f	t	t	0.00	2026-10-06 13:44:22.991	2026-10-06 14:10:45.762	\N
207	2	120502	عملاء تصدير وخارجيون	Foreign Customers	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	4	1205	f	t	t	0.00	2026-10-06 13:44:23.001	2026-10-06 14:10:45.762	\N
208	2	120503	مبيعات نقدية (عميل نقدي)	Cash Customers	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	4	1205	f	t	t	0.00	2026-10-06 13:44:23.011	2026-10-06 14:10:45.762	\N
209	2	120601	إيراد مستحق	Accrued Revenues	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-06 13:44:23.02	2026-10-06 14:10:45.762	\N
210	2	120602	مصروف مدفوع مقدماً	Prepaid Expenses	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-06 13:44:23.026	2026-10-06 14:10:45.762	\N
211	2	120603	تأمينات لدى الغير	Deposits with Others	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-06 13:44:23.033	2026-10-06 14:10:45.762	\N
212	2	120604	سلف وذمم الموظفين	Employee Advances	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-06 13:44:23.061	2026-10-06 14:10:45.762	\N
213	2	120605	مدينون متنوعون	Miscellaneous Debtors	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-06 13:44:23.069	2026-10-06 14:10:45.762	\N
214	2	210101	موردون محليون	Local Suppliers	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	4	2101	f	t	t	0.00	2026-10-06 13:44:23.083	2026-10-06 14:10:45.762	\N
215	2	210102	موردون خارجيون	Foreign Suppliers	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	4	2101	f	t	t	0.00	2026-10-06 13:44:23.094	2026-10-06 14:10:45.762	\N
216	2	210103	مشتريات نقدية (مورد نقدي)	Cash Purchases (Cash Supplier)	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	4	2101	f	t	t	0.00	2026-10-06 13:44:23.106	2026-10-06 14:10:45.762	\N
217	2	210301	مرتبات وأجور مستحقة	Accrued Salaries	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2103	f	t	t	0.00	2026-10-06 13:44:23.116	2026-10-06 14:10:45.762	\N
218	2	210302	إيجارات مستحقة	Accrued Rent	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2103	f	t	t	0.00	2026-10-06 13:44:23.139	2026-10-06 14:10:45.762	\N
219	2	210401	مصلحة الضرائب - ضريبة القيمة المضافة	VAT Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-06 13:44:23.147	2026-10-06 14:10:45.762	\N
220	2	210402	مصلحة الضرائب - كسب العمل	Payroll Tax Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-06 13:44:23.159	2026-10-06 14:10:45.762	\N
221	2	210403	الهيئة القومية للتأمينات الاجتماعية	Social Insurance Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-06 13:44:23.17	2026-10-06 14:10:45.762	\N
147	2	5103	جمارك ورسوم استيراد	Customs & Import Duties	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-06 13:44:22.526	2026-10-06 14:10:45.762	\N
114	2	3	حقوق الملكية	Equity	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	1	\N	t	t	t	0.00	2026-10-06 13:44:22.282	2026-10-06 14:10:45.762	\N
115	2	4	الإيرادات	Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	1	\N	t	t	t	0.00	2026-10-06 13:44:22.288	2026-10-06 14:10:45.762	\N
306	3	2104	أرصدة دائنة أخرى والضرائب	Other Creditors & Taxes	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	t	t	t	0.00	2026-10-06 14:59:17.767	2026-10-06 14:59:17.767	\N
307	3	5106	تغير مخزون آخر الفترة	Periodic Inventory Change	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-06 14:59:17.778	2026-10-06 14:59:17.778	\N
308	3	120102	الخزينة الفرعية	Sub Safe	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	4	1201	f	t	t	0.00	2026-10-06 14:59:17.786	2026-10-06 14:59:17.786	\N
309	3	120103	عهد نقدية مؤقتة	Petty Cash	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	4	1201	f	t	t	0.00	2026-10-06 14:59:17.792	2026-10-06 14:59:17.792	\N
310	3	120201	الحسابات الجارية بالبنوك	Bank Current Accounts	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-06 14:59:17.796	2026-10-06 14:59:17.796	\N
311	3	120202	حسابات التوفير والودائع	Savings & Deposits	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-06 14:59:17.807	2026-10-06 14:59:17.807	\N
222	2	210404	دائنون متنوعون	Miscellaneous Creditors	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-06 13:44:23.178	2026-10-06 14:10:45.762	\N
223	2	120101	الخزينة الرئيسية	Main Safe	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	4	1201	f	t	t	0.00	2026-10-06 13:44:23.186	2026-10-06 14:10:45.762	\N
312	3	120203	المحافظ الإلكترونية والمدفوعات الرقمية	Digital Wallets & Cash	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-06 14:59:17.812	2026-10-06 14:59:17.812	\N
313	3	120204	حساب الهيئة القومية للبريد	Postal Account	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-06 14:59:17.824	2026-10-06 14:59:17.824	\N
314	3	120401	مخزون بضاعة تامة الصنع	Finished Goods Inventory	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	4	1204	f	t	t	0.00	2026-10-06 14:59:17.829	2026-10-06 14:59:17.829	\N
315	3	120402	مخزون خامات ومواد أولية	Raw Materials Inventory	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	4	1204	f	t	t	0.00	2026-10-06 14:59:17.833	2026-10-06 14:59:17.833	\N
316	3	120403	مخزون مهمات وقطع غيار	Spare Parts & Supplies	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	4	1204	f	t	t	0.00	2026-10-06 14:59:17.838	2026-10-06 14:59:17.838	\N
317	3	120501	عملاء محليون	Local Customers	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	4	1205	f	t	t	0.00	2026-10-06 14:59:17.842	2026-10-06 14:59:17.842	\N
318	3	120502	عملاء تصدير وخارجيون	Foreign Customers	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	4	1205	f	t	t	0.00	2026-10-06 14:59:17.847	2026-10-06 14:59:17.847	\N
319	3	120503	مبيعات نقدية (عميل نقدي)	Cash Customers	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	4	1205	f	t	t	0.00	2026-10-06 14:59:17.851	2026-10-06 14:59:17.851	\N
320	3	120601	إيراد مستحق	Accrued Revenues	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-06 14:59:17.856	2026-10-06 14:59:17.856	\N
321	3	120602	مصروف مدفوع مقدماً	Prepaid Expenses	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-06 14:59:17.861	2026-10-06 14:59:17.861	\N
322	3	120603	تأمينات لدى الغير	Deposits with Others	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-06 14:59:17.866	2026-10-06 14:59:17.866	\N
323	3	120604	سلف وذمم الموظفين	Employee Advances	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-06 14:59:17.873	2026-10-06 14:59:17.873	\N
324	3	120605	مدينون متنوعون	Miscellaneous Debtors	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-06 14:59:17.879	2026-10-06 14:59:17.879	\N
325	3	210101	موردون محليون	Local Suppliers	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	4	2101	f	t	t	0.00	2026-10-06 14:59:17.884	2026-10-06 14:59:17.884	\N
326	3	210102	موردون خارجيون	Foreign Suppliers	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	4	2101	f	t	t	0.00	2026-10-06 14:59:17.892	2026-10-06 14:59:17.892	\N
327	3	210103	مشتريات نقدية (مورد نقدي)	Cash Purchases (Cash Supplier)	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	4	2101	f	t	t	0.00	2026-10-06 14:59:17.901	2026-10-06 14:59:17.901	\N
328	3	210301	مرتبات وأجور مستحقة	Accrued Salaries	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2103	f	t	t	0.00	2026-10-06 14:59:17.908	2026-10-06 14:59:17.908	\N
329	3	210302	إيجارات مستحقة	Accrued Rent	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2103	f	t	t	0.00	2026-10-06 14:59:17.914	2026-10-06 14:59:17.914	\N
330	3	210401	مصلحة الضرائب - ضريبة القيمة المضافة	VAT Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-06 14:59:17.918	2026-10-06 14:59:17.918	\N
331	3	210402	مصلحة الضرائب - كسب العمل	Payroll Tax Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-06 14:59:17.922	2026-10-06 14:59:17.922	\N
332	3	210403	الهيئة القومية للتأمينات الاجتماعية	Social Insurance Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-06 14:59:17.928	2026-10-06 14:59:17.928	\N
333	3	210404	دائنون متنوعون	Miscellaneous Creditors	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-06 14:59:17.933	2026-10-06 14:59:17.933	\N
334	3	120101	الخزينة الرئيسية	Main Safe	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	4	1201	f	t	t	0.00	2026-10-06 14:59:17.938	2026-10-06 14:59:17.938	\N
368	4	5102	مصاريف نقل وشحن المشتريات (نولون)	Freight-In Purchases	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-06 15:04:49.832	2026-10-06 15:04:49.832	\N
369	4	5103	جمارك ورسوم استيراد	Customs & Import Duties	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-06 15:04:49.837	2026-10-06 15:04:49.837	\N
370	4	5104	مردودات ومسموحات المشتريات	Purchases Returns & Allowances	المصروفات	\N	\N	دائن	قائمة الدخل	3	51	f	t	t	0.00	2026-10-06 15:04:49.841	2026-10-06 15:04:49.841	\N
371	4	5105	الخصم المكتسب	Purchases Discounts Received	المصروفات	\N	\N	دائن	قائمة الدخل	3	51	f	t	t	0.00	2026-10-06 15:04:49.845	2026-10-06 15:04:49.845	\N
372	4	5201	حملات الدعاية والتسويق الرقمي	Marketing & Digital Ads	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-06 15:04:49.85	2026-10-06 15:04:49.85	\N
373	4	5202	رواتب وعمولات فريق المبيعات	Sales Salaries & Commissions	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-06 15:04:49.856	2026-10-06 15:04:49.856	\N
374	4	5203	مصاريف شحن وتوصيل المبيعات	Delivery & Shipping Out	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-06 15:04:49.86	2026-10-06 15:04:49.86	\N
375	4	5204	مواد تعبئة وتغليف	Packaging Materials	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-06 15:04:49.865	2026-10-06 15:04:49.865	\N
376	4	5205	إيجار معارض ومنافذ بيع	Showroom Rent	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-06 15:04:49.873	2026-10-06 15:04:49.873	\N
377	4	5301	الأجور والرواتب الإدارية	Administrative Salaries	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 15:04:49.881	2026-10-06 15:04:49.881	\N
378	4	5302	إيجار المقرات الإدارية	Office Rent	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 15:04:49.887	2026-10-06 15:04:49.887	\N
379	4	5303	كهرباء ومياه وغاز	Utilities (Electricity & Water)	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 15:04:49.895	2026-10-06 15:04:49.895	\N
380	4	5304	تليفونات وإنترنت واشتراكات رقمية	Telephone & Internet	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 15:04:49.901	2026-10-06 15:04:49.901	\N
381	4	5305	أدوات مكتبية ومطبوعات ورقية	Stationery & Printing	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 15:04:49.907	2026-10-06 15:04:49.907	\N
382	4	5306	مصروفات ضيافة وبوفيه ونظافة	Hospitality & Cleaning	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 15:04:49.911	2026-10-06 15:04:49.911	\N
383	4	5307	مصروفات وعمولات بنكية	Bank Charges & Fees	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 15:04:49.92	2026-10-06 15:04:49.92	\N
384	4	5309	استشارات قانونية ومحاسبية وتدقيق	Legal & Accounting Consultations	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 15:04:49.928	2026-10-06 15:04:49.928	\N
385	4	5310	إصلاحات وصيانة دورية عامة	Repairs & Maintenance	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 15:04:49.935	2026-10-06 15:04:49.935	\N
386	4	5311	انتقالات وسفريات ومحروقات سيارات	Transportation & Fuel	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 15:04:49.939	2026-10-06 15:04:49.939	\N
387	4	5312	تأمينات اجتماعية - حصة المنشأة	Company Social Insurance	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 15:04:49.946	2026-10-06 15:04:49.946	\N
388	4	5313	قسط إهلاك الأصول الثابتة	Depreciation Expense	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 15:04:49.949	2026-10-06 15:04:49.949	\N
389	4	5314	ديون معدومة	Bad Debts	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 15:04:49.955	2026-10-06 15:04:49.955	\N
390	4	5315	رسوم وغرامات حكومية وتراخيص	Government Licenses & Fees	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 15:04:49.959	2026-10-06 15:04:49.959	\N
391	4	5316	مصروفات إدارية ونثرية متنوعة	Miscellaneous Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 15:04:49.964	2026-10-06 15:04:49.964	\N
392	4	5401	أجور ومرتبات عمال التشغيل والإنتاج	Factory Labor Wages	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-06 15:04:49.968	2026-10-06 15:04:49.968	\N
393	4	5402	إيجار المصنع والورش ومواقع التشغيل	Factory & Workshop Rent	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-06 15:04:49.981	2026-10-06 15:04:49.981	\N
394	4	5403	كهرباء وقوى محركة للمصنع والآلات	Industrial Power & Electricity	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-06 15:04:49.988	2026-10-06 15:04:49.988	\N
395	4	5404	زيوت ووقود وصيانة آلات الإنتاج	Machine Oil, Fuel & Maintenance	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-06 15:04:49.993	2026-10-06 15:04:49.993	\N
396	4	5405	تشغيل وتصنيع خارجي لدى الغير	Subcontracting & External Processing	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-06 15:04:50.003	2026-10-06 15:04:50.003	\N
397	4	5406	مهمات وأدوات أمن صناعي وسلامة	Safety & Industrial Supplies	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-06 15:04:50.008	2026-10-06 15:04:50.008	\N
398	4	5308	اشتراك برامج وحلول سحابية	Software & Cloud Subscriptions	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 15:04:50.017	2026-10-06 15:04:50.017	\N
399	4	1101	الأراضي	Lands	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 15:04:50.026	2026-10-06 15:04:50.026	\N
400	4	1102	المباني والإنشاءات	Buildings	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 15:04:50.036	2026-10-06 15:04:50.036	\N
401	4	1103	الآلات والمعدات	Machinery & Equipment	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 15:04:50.042	2026-10-06 15:04:50.042	\N
402	4	1104	السيارات ووسائل النقل	Vehicles	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 15:04:50.048	2026-10-06 15:04:50.048	\N
403	4	1105	الأثاث والتجهيزات المكتبية	Furniture & Fixtures	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 15:04:50.058	2026-10-06 15:04:50.058	\N
404	4	1106	أجهزة الكمبيوتر والبرمجيات	Computers & IT Equipment	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 15:04:50.066	2026-10-06 15:04:50.066	\N
405	4	1107	الديكورات والتركيبات	Decorations & Installations	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 15:04:50.072	2026-10-06 15:04:50.072	\N
406	4	1108	ماكينات ومعدات تشغيل	Operating Machines	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 15:04:50.077	2026-10-06 15:04:50.077	\N
407	4	1109	مجمع إهلاك الأصول الثابتة	Accumulated Depreciation	الأصول	الأصول الثابتة	\N	دائن	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 15:04:50.082	2026-10-06 15:04:50.082	\N
408	4	1201	النقدية وما في حكمها	Cash & Cash Equivalents	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-06 15:04:50.086	2026-10-06 15:04:50.086	\N
409	4	1202	البنوك والمحافظ المالية	Banks & E-Wallets	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-06 15:04:50.093	2026-10-06 15:04:50.093	\N
410	4	1203	أوراق القبض (شيكات تحت التحصيل)	Notes Receivable	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	3	12	f	t	t	0.00	2026-10-06 15:04:50.1	2026-10-06 15:04:50.1	\N
411	4	1204	المخزون السلعي	Inventory	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-06 15:04:50.105	2026-10-06 15:04:50.105	\N
412	4	1205	العملاء (حساب المراقبة)	Accounts Receivable (Control)	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-06 15:04:50.11	2026-10-06 15:04:50.11	\N
413	4	1206	أرصدة مدينة أخرى	Other Debit Balances	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-06 15:04:50.121	2026-10-06 15:04:50.121	\N
414	4	2101	الموردين (حساب المراقبة)	Accounts Payable (Control)	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	3	21	t	t	t	0.00	2026-10-06 15:04:50.13	2026-10-06 15:04:50.13	\N
415	4	2102	أوراق الدفع (شيكات تحت الصرف)	Notes Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	f	t	t	0.00	2026-10-06 15:04:50.137	2026-10-06 15:04:50.137	\N
416	4	2103	مصروفات مستحقة	Accrued Expenses	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	t	t	t	0.00	2026-10-06 15:04:50.142	2026-10-06 15:04:50.142	\N
417	4	2104	أرصدة دائنة أخرى والضرائب	Other Creditors & Taxes	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	t	t	t	0.00	2026-10-06 15:04:50.147	2026-10-06 15:04:50.147	\N
418	4	5106	تغير مخزون آخر الفترة	Periodic Inventory Change	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-06 15:04:50.157	2026-10-06 15:04:50.157	\N
419	4	120102	الخزينة الفرعية	Sub Safe	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	4	1201	f	t	t	0.00	2026-10-06 15:04:50.165	2026-10-06 15:04:50.165	\N
420	4	120103	عهد نقدية مؤقتة	Petty Cash	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	4	1201	f	t	t	0.00	2026-10-06 15:04:50.17	2026-10-06 15:04:50.17	\N
421	4	120201	الحسابات الجارية بالبنوك	Bank Current Accounts	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-06 15:04:50.175	2026-10-06 15:04:50.175	\N
422	4	120202	حسابات التوفير والودائع	Savings & Deposits	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-06 15:04:50.186	2026-10-06 15:04:50.186	\N
423	4	120203	المحافظ الإلكترونية والمدفوعات الرقمية	Digital Wallets & Cash	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-06 15:04:50.212	2026-10-06 15:04:50.212	\N
424	4	120204	حساب الهيئة القومية للبريد	Postal Account	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-06 15:04:50.223	2026-10-06 15:04:50.223	\N
425	4	120401	مخزون بضاعة تامة الصنع	Finished Goods Inventory	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	4	1204	f	t	t	0.00	2026-10-06 15:04:50.227	2026-10-06 15:04:50.227	\N
426	4	120402	مخزون خامات ومواد أولية	Raw Materials Inventory	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	4	1204	f	t	t	0.00	2026-10-06 15:04:50.232	2026-10-06 15:04:50.232	\N
427	4	120403	مخزون مهمات وقطع غيار	Spare Parts & Supplies	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	4	1204	f	t	t	0.00	2026-10-06 15:04:50.236	2026-10-06 15:04:50.236	\N
428	4	120501	عملاء محليون	Local Customers	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	4	1205	f	t	t	0.00	2026-10-06 15:04:50.24	2026-10-06 15:04:50.24	\N
429	4	120502	عملاء تصدير وخارجيون	Foreign Customers	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	4	1205	f	t	t	0.00	2026-10-06 15:04:50.246	2026-10-06 15:04:50.246	\N
430	4	120503	مبيعات نقدية (عميل نقدي)	Cash Customers	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	4	1205	f	t	t	0.00	2026-10-06 15:04:50.252	2026-10-06 15:04:50.252	\N
431	4	120601	إيراد مستحق	Accrued Revenues	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-06 15:04:50.257	2026-10-06 15:04:50.257	\N
432	4	120602	مصروف مدفوع مقدماً	Prepaid Expenses	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-06 15:04:50.261	2026-10-06 15:04:50.261	\N
433	4	120603	تأمينات لدى الغير	Deposits with Others	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-06 15:04:50.265	2026-10-06 15:04:50.265	\N
434	4	120604	سلف وذمم الموظفين	Employee Advances	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-06 15:04:50.269	2026-10-06 15:04:50.269	\N
435	4	120605	مدينون متنوعون	Miscellaneous Debtors	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-06 15:04:50.274	2026-10-06 15:04:50.274	\N
436	4	210101	موردون محليون	Local Suppliers	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	4	2101	f	t	t	0.00	2026-10-06 15:04:50.278	2026-10-06 15:04:50.278	\N
437	4	210102	موردون خارجيون	Foreign Suppliers	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	4	2101	f	t	t	0.00	2026-10-06 15:04:50.282	2026-10-06 15:04:50.282	\N
438	4	210103	مشتريات نقدية (مورد نقدي)	Cash Purchases (Cash Supplier)	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	4	2101	f	t	t	0.00	2026-10-06 15:04:50.286	2026-10-06 15:04:50.286	\N
439	4	210301	مرتبات وأجور مستحقة	Accrued Salaries	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2103	f	t	t	0.00	2026-10-06 15:04:50.292	2026-10-06 15:04:50.292	\N
440	4	210302	إيجارات مستحقة	Accrued Rent	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2103	f	t	t	0.00	2026-10-06 15:04:50.298	2026-10-06 15:04:50.298	\N
441	4	210401	مصلحة الضرائب - ضريبة القيمة المضافة	VAT Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-06 15:04:50.311	2026-10-06 15:04:50.311	\N
442	4	210402	مصلحة الضرائب - كسب العمل	Payroll Tax Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-06 15:04:50.321	2026-10-06 15:04:50.321	\N
443	4	210403	الهيئة القومية للتأمينات الاجتماعية	Social Insurance Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-06 15:04:50.331	2026-10-06 15:04:50.331	\N
444	4	210404	دائنون متنوعون	Miscellaneous Creditors	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-06 15:04:50.391	2026-10-06 15:04:50.391	\N
445	4	120101	الخزينة الرئيسية	Main Safe	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	4	1201	f	t	t	0.00	2026-10-06 15:04:50.399	2026-10-06 15:04:50.399	\N
446	5	2	الخصوم	Liabilities	الخصوم	\N	\N	دائن	قائمة المركز المالي	1	\N	t	t	t	0.00	2026-10-06 15:10:43.05	2026-10-06 15:10:43.05	\N
447	5	3	حقوق الملكية	Equity	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	1	\N	t	t	t	0.00	2026-10-06 15:10:43.057	2026-10-06 15:10:43.057	\N
448	5	4	الإيرادات	Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	1	\N	t	t	t	0.00	2026-10-06 15:10:43.062	2026-10-06 15:10:43.062	\N
449	5	5	المصروفات	Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	1	\N	t	t	t	0.00	2026-10-06 15:10:43.067	2026-10-06 15:10:43.067	\N
450	5	1	الأصول	Assets	الأصول	\N	\N	مدين	قائمة المركز المالي	1	\N	t	t	t	0.00	2026-10-06 15:10:43.072	2026-10-06 15:10:43.072	\N
451	5	33	الاحتياطيات	Reserves	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	t	t	t	0.00	2026-10-06 15:10:43.079	2026-10-06 15:10:43.079	\N
452	5	34	الأرباح المحتجزة / المرحلة	Retained Earnings	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	f	t	t	0.00	2026-10-06 15:10:43.085	2026-10-06 15:10:43.085	\N
453	5	35	أرباح (خسائر) العام الحالي	Current Year Profit / Loss	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	f	t	t	0.00	2026-10-06 15:10:43.091	2026-10-06 15:10:43.091	\N
454	5	41	إيرادات النشاط الرئيسي	Operating Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	2	4	t	t	t	0.00	2026-10-06 15:10:43.101	2026-10-06 15:10:43.101	\N
455	5	42	إيرادات أخرى متنوعة	Other Revenues	الإيرادات	\N	\N	دائن	قائمة الدخل	2	4	t	t	t	0.00	2026-10-06 15:10:43.107	2026-10-06 15:10:43.107	\N
456	5	51	تكلفة النشاط والمبيعات	Cost of Goods Sold (COGS)	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-06 15:10:43.114	2026-10-06 15:10:43.114	\N
457	5	52	مصاريف البيع والتسويق	Selling & Marketing Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-06 15:10:43.121	2026-10-06 15:10:43.121	\N
458	5	53	مصروفات إدارية وعمومية	General & Administrative Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-06 15:10:43.127	2026-10-06 15:10:43.127	\N
459	5	54	مصروفات التشغيل والإنتاج	Operating & Production Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-06 15:10:43.132	2026-10-06 15:10:43.132	\N
460	5	12	الأصول المتداولة	Current Assets	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	2	1	t	t	t	0.00	2026-10-06 15:10:43.136	2026-10-06 15:10:43.136	\N
461	5	11	الأصول الثابتة	Fixed Assets	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	2	1	t	t	t	0.00	2026-10-06 15:10:43.14	2026-10-06 15:10:43.14	\N
462	5	21	الخصوم المتداولة	Current Liabilities	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	2	2	t	t	t	0.00	2026-10-06 15:10:43.144	2026-10-06 15:10:43.144	\N
463	5	22	الخصوم طويلة الأجل	Long-term Liabilities	الخصوم	الخصوم طويلة الأجل	\N	دائن	قائمة المركز المالي	2	2	t	t	t	0.00	2026-10-06 15:10:43.147	2026-10-06 15:10:43.147	\N
464	5	31	رأس المال	Capital	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	f	t	t	0.00	2026-10-06 15:10:43.152	2026-10-06 15:10:43.152	\N
465	5	32	جاري الشركاء / صاحب المنشأة	Partners' Current Accounts	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	t	t	t	0.00	2026-10-06 15:10:43.156	2026-10-06 15:10:43.156	\N
466	5	2105	قروض وتسهيلات قصيرة الأجل	Short-term Loans	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	f	t	t	0.00	2026-10-06 15:10:43.162	2026-10-06 15:10:43.162	\N
467	5	2201	قروض بنكية طويلة الأجل	Long-term Bank Loans	الخصوم	الخصوم طويلة الأجل	\N	دائن	قائمة المركز المالي	3	22	f	t	t	0.00	2026-10-06 15:10:43.166	2026-10-06 15:10:43.166	\N
468	5	3201	جاري الشريك الرئيسي	Main Partner Current Account	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	3	32	f	t	t	0.00	2026-10-06 15:10:43.17	2026-10-06 15:10:43.17	\N
469	5	3301	الاحتياطي القانوني	Legal Reserve	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	3	33	f	t	t	0.00	2026-10-06 15:10:43.174	2026-10-06 15:10:43.174	\N
470	5	3302	الاحتياطي العام	General Reserve	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	3	33	f	t	t	0.00	2026-10-06 15:10:43.18	2026-10-06 15:10:43.18	\N
471	5	4101	إيراد المبيعات	Sales Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	3	41	f	t	t	0.00	2026-10-06 15:10:43.185	2026-10-06 15:10:43.185	\N
472	5	4102	إيراد تقديم خدمات	Services Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	3	41	f	t	t	0.00	2026-10-06 15:10:43.189	2026-10-06 15:10:43.189	\N
473	5	4103	مردودات ومسموحات المبيعات	Sales Returns & Allowances	الإيرادات	\N	\N	مدين	قائمة الدخل	3	41	f	t	t	0.00	2026-10-06 15:10:43.192	2026-10-06 15:10:43.192	\N
474	5	4104	الخصم المسموح به	Sales Discounts Allowed	الإيرادات	\N	\N	مدين	قائمة الدخل	3	41	f	t	t	0.00	2026-10-06 15:10:43.197	2026-10-06 15:10:43.197	\N
475	5	4201	أرباح بيع أصول ثابتة	Gain on Sale of Assets	الإيرادات	\N	\N	دائن	قائمة الدخل	3	42	f	t	t	0.00	2026-10-06 15:10:43.2	2026-10-06 15:10:43.2	\N
476	5	4202	إيرادات استثمارات وفوائد بنكية	Interest & Investment Income	الإيرادات	\N	\N	دائن	قائمة الدخل	3	42	f	t	t	0.00	2026-10-06 15:10:43.204	2026-10-06 15:10:43.204	\N
477	5	4203	إيرادات عرضية ومتنوعة	Miscellaneous Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	3	42	f	t	t	0.00	2026-10-06 15:10:43.208	2026-10-06 15:10:43.208	\N
478	5	5101	المشتريات	Purchases	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-06 15:10:43.214	2026-10-06 15:10:43.214	\N
479	5	5102	مصاريف نقل وشحن المشتريات (نولون)	Freight-In Purchases	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-06 15:10:43.219	2026-10-06 15:10:43.219	\N
480	5	5103	جمارك ورسوم استيراد	Customs & Import Duties	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-06 15:10:43.223	2026-10-06 15:10:43.223	\N
481	5	5104	مردودات ومسموحات المشتريات	Purchases Returns & Allowances	المصروفات	\N	\N	دائن	قائمة الدخل	3	51	f	t	t	0.00	2026-10-06 15:10:43.227	2026-10-06 15:10:43.227	\N
482	5	5105	الخصم المكتسب	Purchases Discounts Received	المصروفات	\N	\N	دائن	قائمة الدخل	3	51	f	t	t	0.00	2026-10-06 15:10:43.23	2026-10-06 15:10:43.23	\N
483	5	5201	حملات الدعاية والتسويق الرقمي	Marketing & Digital Ads	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-06 15:10:43.235	2026-10-06 15:10:43.235	\N
484	5	5202	رواتب وعمولات فريق المبيعات	Sales Salaries & Commissions	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-06 15:10:43.239	2026-10-06 15:10:43.239	\N
485	5	5203	مصاريف شحن وتوصيل المبيعات	Delivery & Shipping Out	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-06 15:10:43.243	2026-10-06 15:10:43.243	\N
486	5	5204	مواد تعبئة وتغليف	Packaging Materials	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-06 15:10:43.247	2026-10-06 15:10:43.247	\N
487	5	5205	إيجار معارض ومنافذ بيع	Showroom Rent	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-06 15:10:43.252	2026-10-06 15:10:43.252	\N
488	5	5301	الأجور والرواتب الإدارية	Administrative Salaries	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 15:10:43.255	2026-10-06 15:10:43.255	\N
489	5	5302	إيجار المقرات الإدارية	Office Rent	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 15:10:43.259	2026-10-06 15:10:43.259	\N
490	5	5303	كهرباء ومياه وغاز	Utilities (Electricity & Water)	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 15:10:43.265	2026-10-06 15:10:43.265	\N
491	5	5304	تليفونات وإنترنت واشتراكات رقمية	Telephone & Internet	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 15:10:43.271	2026-10-06 15:10:43.271	\N
492	5	5305	أدوات مكتبية ومطبوعات ورقية	Stationery & Printing	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 15:10:43.275	2026-10-06 15:10:43.275	\N
493	5	5306	مصروفات ضيافة وبوفيه ونظافة	Hospitality & Cleaning	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 15:10:43.279	2026-10-06 15:10:43.279	\N
494	5	5307	مصروفات وعمولات بنكية	Bank Charges & Fees	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 15:10:43.285	2026-10-06 15:10:43.285	\N
495	5	5309	استشارات قانونية ومحاسبية وتدقيق	Legal & Accounting Consultations	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 15:10:43.289	2026-10-06 15:10:43.289	\N
496	5	5310	إصلاحات وصيانة دورية عامة	Repairs & Maintenance	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 15:10:43.293	2026-10-06 15:10:43.293	\N
497	5	5311	انتقالات وسفريات ومحروقات سيارات	Transportation & Fuel	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 15:10:43.297	2026-10-06 15:10:43.297	\N
498	5	5312	تأمينات اجتماعية - حصة المنشأة	Company Social Insurance	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 15:10:43.303	2026-10-06 15:10:43.303	\N
499	5	5313	قسط إهلاك الأصول الثابتة	Depreciation Expense	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 15:10:43.309	2026-10-06 15:10:43.309	\N
500	5	5314	ديون معدومة	Bad Debts	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 15:10:43.316	2026-10-06 15:10:43.316	\N
501	5	5315	رسوم وغرامات حكومية وتراخيص	Government Licenses & Fees	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 15:10:43.321	2026-10-06 15:10:43.321	\N
502	5	5316	مصروفات إدارية ونثرية متنوعة	Miscellaneous Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 15:10:43.329	2026-10-06 15:10:43.329	\N
503	5	5401	أجور ومرتبات عمال التشغيل والإنتاج	Factory Labor Wages	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-06 15:10:43.334	2026-10-06 15:10:43.334	\N
504	5	5402	إيجار المصنع والورش ومواقع التشغيل	Factory & Workshop Rent	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-06 15:10:43.338	2026-10-06 15:10:43.338	\N
505	5	5403	كهرباء وقوى محركة للمصنع والآلات	Industrial Power & Electricity	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-06 15:10:43.342	2026-10-06 15:10:43.342	\N
506	5	5404	زيوت ووقود وصيانة آلات الإنتاج	Machine Oil, Fuel & Maintenance	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-06 15:10:43.348	2026-10-06 15:10:43.348	\N
507	5	5405	تشغيل وتصنيع خارجي لدى الغير	Subcontracting & External Processing	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-06 15:10:43.352	2026-10-06 15:10:43.352	\N
508	5	5406	مهمات وأدوات أمن صناعي وسلامة	Safety & Industrial Supplies	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-06 15:10:43.356	2026-10-06 15:10:43.356	\N
509	5	5308	اشتراك برامج وحلول سحابية	Software & Cloud Subscriptions	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-06 15:10:43.362	2026-10-06 15:10:43.362	\N
510	5	1101	الأراضي	Lands	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 15:10:43.366	2026-10-06 15:10:43.366	\N
511	5	1102	المباني والإنشاءات	Buildings	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 15:10:43.371	2026-10-06 15:10:43.371	\N
512	5	1103	الآلات والمعدات	Machinery & Equipment	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 15:10:43.377	2026-10-06 15:10:43.377	\N
513	5	1104	السيارات ووسائل النقل	Vehicles	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 15:10:43.382	2026-10-06 15:10:43.382	\N
514	5	1105	الأثاث والتجهيزات المكتبية	Furniture & Fixtures	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 15:10:43.392	2026-10-06 15:10:43.392	\N
515	5	1106	أجهزة الكمبيوتر والبرمجيات	Computers & IT Equipment	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 15:10:43.4	2026-10-06 15:10:43.4	\N
516	5	1107	الديكورات والتركيبات	Decorations & Installations	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 15:10:43.404	2026-10-06 15:10:43.404	\N
517	5	1108	ماكينات ومعدات تشغيل	Operating Machines	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 15:10:43.409	2026-10-06 15:10:43.409	\N
518	5	1109	مجمع إهلاك الأصول الثابتة	Accumulated Depreciation	الأصول	الأصول الثابتة	\N	دائن	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-06 15:10:43.415	2026-10-06 15:10:43.415	\N
519	5	1201	النقدية وما في حكمها	Cash & Cash Equivalents	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-06 15:10:43.421	2026-10-06 15:10:43.421	\N
520	5	1202	البنوك والمحافظ المالية	Banks & E-Wallets	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-06 15:10:43.427	2026-10-06 15:10:43.427	\N
521	5	1203	أوراق القبض (شيكات تحت التحصيل)	Notes Receivable	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	3	12	f	t	t	0.00	2026-10-06 15:10:43.43	2026-10-06 15:10:43.43	\N
522	5	1204	المخزون السلعي	Inventory	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-06 15:10:43.437	2026-10-06 15:10:43.437	\N
523	5	1205	العملاء (حساب المراقبة)	Accounts Receivable (Control)	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-06 15:10:43.442	2026-10-06 15:10:43.442	\N
524	5	1206	أرصدة مدينة أخرى	Other Debit Balances	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-06 15:10:43.447	2026-10-06 15:10:43.447	\N
525	5	2101	الموردين (حساب المراقبة)	Accounts Payable (Control)	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	3	21	t	t	t	0.00	2026-10-06 15:10:43.452	2026-10-06 15:10:43.452	\N
526	5	2102	أوراق الدفع (شيكات تحت الصرف)	Notes Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	f	t	t	0.00	2026-10-06 15:10:43.457	2026-10-06 15:10:43.457	\N
527	5	2103	مصروفات مستحقة	Accrued Expenses	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	t	t	t	0.00	2026-10-06 15:10:43.462	2026-10-06 15:10:43.462	\N
528	5	2104	أرصدة دائنة أخرى والضرائب	Other Creditors & Taxes	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	t	t	t	0.00	2026-10-06 15:10:43.466	2026-10-06 15:10:43.466	\N
529	5	5106	تغير مخزون آخر الفترة	Periodic Inventory Change	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-06 15:10:43.472	2026-10-06 15:10:43.472	\N
530	5	120102	الخزينة الفرعية	Sub Safe	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	4	1201	f	t	t	0.00	2026-10-06 15:10:43.476	2026-10-06 15:10:43.476	\N
531	5	120103	عهد نقدية مؤقتة	Petty Cash	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	4	1201	f	t	t	0.00	2026-10-06 15:10:43.48	2026-10-06 15:10:43.48	\N
532	5	120201	الحسابات الجارية بالبنوك	Bank Current Accounts	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-06 15:10:43.484	2026-10-06 15:10:43.484	\N
533	5	120202	حسابات التوفير والودائع	Savings & Deposits	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-06 15:10:43.488	2026-10-06 15:10:43.488	\N
534	5	120203	المحافظ الإلكترونية والمدفوعات الرقمية	Digital Wallets & Cash	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-06 15:10:43.492	2026-10-06 15:10:43.492	\N
535	5	120204	حساب الهيئة القومية للبريد	Postal Account	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-06 15:10:43.498	2026-10-06 15:10:43.498	\N
536	5	120401	مخزون بضاعة تامة الصنع	Finished Goods Inventory	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	4	1204	f	t	t	0.00	2026-10-06 15:10:43.504	2026-10-06 15:10:43.504	\N
537	5	120402	مخزون خامات ومواد أولية	Raw Materials Inventory	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	4	1204	f	t	t	0.00	2026-10-06 15:10:43.508	2026-10-06 15:10:43.508	\N
538	5	120403	مخزون مهمات وقطع غيار	Spare Parts & Supplies	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	4	1204	f	t	t	0.00	2026-10-06 15:10:43.512	2026-10-06 15:10:43.512	\N
539	5	120501	عملاء محليون	Local Customers	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	4	1205	f	t	t	0.00	2026-10-06 15:10:43.519	2026-10-06 15:10:43.519	\N
540	5	120502	عملاء تصدير وخارجيون	Foreign Customers	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	4	1205	f	t	t	0.00	2026-10-06 15:10:43.524	2026-10-06 15:10:43.524	\N
541	5	120503	مبيعات نقدية (عميل نقدي)	Cash Customers	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	4	1205	f	t	t	0.00	2026-10-06 15:10:43.532	2026-10-06 15:10:43.532	\N
542	5	120601	إيراد مستحق	Accrued Revenues	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-06 15:10:43.538	2026-10-06 15:10:43.538	\N
543	5	120602	مصروف مدفوع مقدماً	Prepaid Expenses	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-06 15:10:43.542	2026-10-06 15:10:43.542	\N
544	5	120603	تأمينات لدى الغير	Deposits with Others	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-06 15:10:43.547	2026-10-06 15:10:43.547	\N
545	5	120604	سلف وذمم الموظفين	Employee Advances	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-06 15:10:43.551	2026-10-06 15:10:43.551	\N
546	5	120605	مدينون متنوعون	Miscellaneous Debtors	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-06 15:10:43.555	2026-10-06 15:10:43.555	\N
547	5	210101	موردون محليون	Local Suppliers	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	4	2101	f	t	t	0.00	2026-10-06 15:10:43.561	2026-10-06 15:10:43.561	\N
548	5	210102	موردون خارجيون	Foreign Suppliers	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	4	2101	f	t	t	0.00	2026-10-06 15:10:43.565	2026-10-06 15:10:43.565	\N
549	5	210103	مشتريات نقدية (مورد نقدي)	Cash Purchases (Cash Supplier)	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	4	2101	f	t	t	0.00	2026-10-06 15:10:43.57	2026-10-06 15:10:43.57	\N
550	5	210301	مرتبات وأجور مستحقة	Accrued Salaries	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2103	f	t	t	0.00	2026-10-06 15:10:43.576	2026-10-06 15:10:43.576	\N
551	5	210302	إيجارات مستحقة	Accrued Rent	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2103	f	t	t	0.00	2026-10-06 15:10:43.583	2026-10-06 15:10:43.583	\N
552	5	210401	مصلحة الضرائب - ضريبة القيمة المضافة	VAT Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-06 15:10:43.588	2026-10-06 15:10:43.588	\N
553	5	210402	مصلحة الضرائب - كسب العمل	Payroll Tax Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-06 15:10:43.593	2026-10-06 15:10:43.593	\N
554	5	210403	الهيئة القومية للتأمينات الاجتماعية	Social Insurance Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-06 15:10:43.599	2026-10-06 15:10:43.599	\N
555	5	210404	دائنون متنوعون	Miscellaneous Creditors	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-06 15:10:43.605	2026-10-06 15:10:43.605	\N
556	5	120101	الخزينة الرئيسية	Main Safe	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	4	1201	f	t	t	0.00	2026-10-06 15:10:43.611	2026-10-06 15:10:43.611	\N
557	6	2	الخصوم	Liabilities	الخصوم	\N	\N	دائن	قائمة المركز المالي	1	\N	t	t	t	0.00	2026-10-13 17:25:18.258	2026-10-13 17:25:18.258	\N
558	6	3	حقوق الملكية	Equity	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	1	\N	t	t	t	0.00	2026-10-13 17:25:18.293	2026-10-13 17:25:18.293	\N
559	6	4	الإيرادات	Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	1	\N	t	t	t	0.00	2026-10-13 17:25:18.303	2026-10-13 17:25:18.303	\N
560	6	5	المصروفات	Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	1	\N	t	t	t	0.00	2026-10-13 17:25:18.311	2026-10-13 17:25:18.311	\N
561	6	1	الأصول	Assets	الأصول	\N	\N	مدين	قائمة المركز المالي	1	\N	t	t	t	0.00	2026-10-13 17:25:18.318	2026-10-13 17:25:18.318	\N
562	6	33	الاحتياطيات	Reserves	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	t	t	t	0.00	2026-10-13 17:25:18.323	2026-10-13 17:25:18.323	\N
563	6	34	الأرباح المحتجزة / المرحلة	Retained Earnings	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	f	t	t	0.00	2026-10-13 17:25:18.332	2026-10-13 17:25:18.332	\N
564	6	35	أرباح (خسائر) العام الحالي	Current Year Profit / Loss	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	f	t	t	0.00	2026-10-13 17:25:18.343	2026-10-13 17:25:18.343	\N
565	6	41	إيرادات النشاط الرئيسي	Operating Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	2	4	t	t	t	0.00	2026-10-13 17:25:18.354	2026-10-13 17:25:18.354	\N
566	6	42	إيرادات أخرى متنوعة	Other Revenues	الإيرادات	\N	\N	دائن	قائمة الدخل	2	4	t	t	t	0.00	2026-10-13 17:25:18.367	2026-10-13 17:25:18.367	\N
567	6	51	تكلفة النشاط والمبيعات	Cost of Goods Sold (COGS)	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-13 17:25:18.375	2026-10-13 17:25:18.375	\N
568	6	52	مصاريف البيع والتسويق	Selling & Marketing Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-13 17:25:18.385	2026-10-13 17:25:18.385	\N
569	6	53	مصروفات إدارية وعمومية	General & Administrative Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-13 17:25:18.398	2026-10-13 17:25:18.398	\N
570	6	54	مصروفات التشغيل والإنتاج	Operating & Production Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-13 17:25:18.404	2026-10-13 17:25:18.404	\N
571	6	12	الأصول المتداولة	Current Assets	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	2	1	t	t	t	0.00	2026-10-13 17:25:18.411	2026-10-13 17:25:18.411	\N
572	6	11	الأصول الثابتة	Fixed Assets	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	2	1	t	t	t	0.00	2026-10-13 17:25:18.416	2026-10-13 17:25:18.416	\N
573	6	21	الخصوم المتداولة	Current Liabilities	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	2	2	t	t	t	0.00	2026-10-13 17:25:18.421	2026-10-13 17:25:18.421	\N
574	6	22	الخصوم طويلة الأجل	Long-term Liabilities	الخصوم	الخصوم طويلة الأجل	\N	دائن	قائمة المركز المالي	2	2	t	t	t	0.00	2026-10-13 17:25:18.425	2026-10-13 17:25:18.425	\N
575	6	31	رأس المال	Capital	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	f	t	t	0.00	2026-10-13 17:25:18.431	2026-10-13 17:25:18.431	\N
576	6	32	جاري الشركاء / صاحب المنشأة	Partners' Current Accounts	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	t	t	t	0.00	2026-10-13 17:25:18.436	2026-10-13 17:25:18.436	\N
577	6	2105	قروض وتسهيلات قصيرة الأجل	Short-term Loans	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	f	t	t	0.00	2026-10-13 17:25:18.44	2026-10-13 17:25:18.44	\N
578	6	2201	قروض بنكية طويلة الأجل	Long-term Bank Loans	الخصوم	الخصوم طويلة الأجل	\N	دائن	قائمة المركز المالي	3	22	f	t	t	0.00	2026-10-13 17:25:18.445	2026-10-13 17:25:18.445	\N
579	6	3201	جاري الشريك الرئيسي	Main Partner Current Account	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	3	32	f	t	t	0.00	2026-10-13 17:25:18.452	2026-10-13 17:25:18.452	\N
580	6	3301	الاحتياطي القانوني	Legal Reserve	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	3	33	f	t	t	0.00	2026-10-13 17:25:18.458	2026-10-13 17:25:18.458	\N
581	6	3302	الاحتياطي العام	General Reserve	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	3	33	f	t	t	0.00	2026-10-13 17:25:18.487	2026-10-13 17:25:18.487	\N
582	6	4101	إيراد المبيعات	Sales Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	3	41	f	t	t	0.00	2026-10-13 17:25:18.514	2026-10-13 17:25:18.514	\N
583	6	4102	إيراد تقديم خدمات	Services Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	3	41	f	t	t	0.00	2026-10-13 17:25:18.522	2026-10-13 17:25:18.522	\N
584	6	4103	مردودات ومسموحات المبيعات	Sales Returns & Allowances	الإيرادات	\N	\N	مدين	قائمة الدخل	3	41	f	t	t	0.00	2026-10-13 17:25:18.534	2026-10-13 17:25:18.534	\N
585	6	4104	الخصم المسموح به	Sales Discounts Allowed	الإيرادات	\N	\N	مدين	قائمة الدخل	3	41	f	t	t	0.00	2026-10-13 17:25:18.538	2026-10-13 17:25:18.538	\N
586	6	4201	أرباح بيع أصول ثابتة	Gain on Sale of Assets	الإيرادات	\N	\N	دائن	قائمة الدخل	3	42	f	t	t	0.00	2026-10-13 17:25:18.545	2026-10-13 17:25:18.545	\N
587	6	4202	إيرادات استثمارات وفوائد بنكية	Interest & Investment Income	الإيرادات	\N	\N	دائن	قائمة الدخل	3	42	f	t	t	0.00	2026-10-13 17:25:18.551	2026-10-13 17:25:18.551	\N
588	6	4203	إيرادات عرضية ومتنوعة	Miscellaneous Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	3	42	f	t	t	0.00	2026-10-13 17:25:18.556	2026-10-13 17:25:18.556	\N
589	6	5101	المشتريات	Purchases	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 17:25:18.564	2026-10-13 17:25:18.564	\N
590	6	5102	مصاريف نقل وشحن المشتريات (نولون)	Freight-In Purchases	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 17:25:18.57	2026-10-13 17:25:18.57	\N
591	6	5103	جمارك ورسوم استيراد	Customs & Import Duties	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 17:25:18.574	2026-10-13 17:25:18.574	\N
592	6	5104	مردودات ومسموحات المشتريات	Purchases Returns & Allowances	المصروفات	\N	\N	دائن	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 17:25:18.604	2026-10-13 17:25:18.604	\N
593	6	5105	الخصم المكتسب	Purchases Discounts Received	المصروفات	\N	\N	دائن	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 17:25:18.672	2026-10-13 17:25:18.672	\N
594	6	5201	حملات الدعاية والتسويق الرقمي	Marketing & Digital Ads	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-13 17:25:18.712	2026-10-13 17:25:18.712	\N
595	6	5202	رواتب وعمولات فريق المبيعات	Sales Salaries & Commissions	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-13 17:25:18.726	2026-10-13 17:25:18.726	\N
596	6	5203	مصاريف شحن وتوصيل المبيعات	Delivery & Shipping Out	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-13 17:25:18.742	2026-10-13 17:25:18.742	\N
597	6	5204	مواد تعبئة وتغليف	Packaging Materials	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-13 17:25:18.759	2026-10-13 17:25:18.759	\N
598	6	5205	إيجار معارض ومنافذ بيع	Showroom Rent	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-13 17:25:18.763	2026-10-13 17:25:18.763	\N
599	6	5301	الأجور والرواتب الإدارية	Administrative Salaries	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:25:18.767	2026-10-13 17:25:18.767	\N
600	6	5302	إيجار المقرات الإدارية	Office Rent	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:25:18.772	2026-10-13 17:25:18.772	\N
601	6	5303	كهرباء ومياه وغاز	Utilities (Electricity & Water)	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:25:18.779	2026-10-13 17:25:18.779	\N
602	6	5304	تليفونات وإنترنت واشتراكات رقمية	Telephone & Internet	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:25:18.784	2026-10-13 17:25:18.784	\N
603	6	5305	أدوات مكتبية ومطبوعات ورقية	Stationery & Printing	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:25:18.787	2026-10-13 17:25:18.787	\N
604	6	5306	مصروفات ضيافة وبوفيه ونظافة	Hospitality & Cleaning	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:25:18.791	2026-10-13 17:25:18.791	\N
605	6	5307	مصروفات وعمولات بنكية	Bank Charges & Fees	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:25:18.794	2026-10-13 17:25:18.794	\N
606	6	5309	استشارات قانونية ومحاسبية وتدقيق	Legal & Accounting Consultations	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:25:18.798	2026-10-13 17:25:18.798	\N
607	6	5310	إصلاحات وصيانة دورية عامة	Repairs & Maintenance	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:25:18.802	2026-10-13 17:25:18.802	\N
608	6	5311	انتقالات وسفريات ومحروقات سيارات	Transportation & Fuel	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:25:18.808	2026-10-13 17:25:18.808	\N
609	6	5312	تأمينات اجتماعية - حصة المنشأة	Company Social Insurance	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:25:18.813	2026-10-13 17:25:18.813	\N
610	6	5313	قسط إهلاك الأصول الثابتة	Depreciation Expense	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:25:18.821	2026-10-13 17:25:18.821	\N
611	6	5314	ديون معدومة	Bad Debts	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:25:18.827	2026-10-13 17:25:18.827	\N
612	6	5315	رسوم وغرامات حكومية وتراخيص	Government Licenses & Fees	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:25:18.831	2026-10-13 17:25:18.831	\N
613	6	5316	مصروفات إدارية ونثرية متنوعة	Miscellaneous Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:25:18.837	2026-10-13 17:25:18.837	\N
614	6	5401	أجور ومرتبات عمال التشغيل والإنتاج	Factory Labor Wages	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 17:25:18.843	2026-10-13 17:25:18.843	\N
615	6	5402	إيجار المصنع والورش ومواقع التشغيل	Factory & Workshop Rent	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 17:25:18.851	2026-10-13 17:25:18.851	\N
616	6	5403	كهرباء وقوى محركة للمصنع والآلات	Industrial Power & Electricity	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 17:25:18.861	2026-10-13 17:25:18.861	\N
617	6	5404	زيوت ووقود وصيانة آلات الإنتاج	Machine Oil, Fuel & Maintenance	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 17:25:18.866	2026-10-13 17:25:18.866	\N
618	6	5405	تشغيل وتصنيع خارجي لدى الغير	Subcontracting & External Processing	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 17:25:18.873	2026-10-13 17:25:18.873	\N
619	6	5406	مهمات وأدوات أمن صناعي وسلامة	Safety & Industrial Supplies	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 17:25:18.879	2026-10-13 17:25:18.879	\N
620	6	5308	اشتراك برامج وحلول سحابية	Software & Cloud Subscriptions	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:25:18.884	2026-10-13 17:25:18.884	\N
621	6	1101	الأراضي	Lands	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:25:18.889	2026-10-13 17:25:18.889	\N
622	6	1102	المباني والإنشاءات	Buildings	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:25:18.895	2026-10-13 17:25:18.895	\N
623	6	1103	الآلات والمعدات	Machinery & Equipment	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:25:18.904	2026-10-13 17:25:18.904	\N
624	6	1104	السيارات ووسائل النقل	Vehicles	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:25:18.916	2026-10-13 17:25:18.916	\N
625	6	1105	الأثاث والتجهيزات المكتبية	Furniture & Fixtures	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:25:18.924	2026-10-13 17:25:18.924	\N
626	6	1106	أجهزة الكمبيوتر والبرمجيات	Computers & IT Equipment	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:25:18.936	2026-10-13 17:25:18.936	\N
627	6	1107	الديكورات والتركيبات	Decorations & Installations	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:25:18.949	2026-10-13 17:25:18.949	\N
628	6	1108	ماكينات ومعدات تشغيل	Operating Machines	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:25:18.955	2026-10-13 17:25:18.955	\N
629	6	1109	مجمع إهلاك الأصول الثابتة	Accumulated Depreciation	الأصول	الأصول الثابتة	\N	دائن	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:25:18.963	2026-10-13 17:25:18.963	\N
630	6	1201	النقدية وما في حكمها	Cash & Cash Equivalents	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-13 17:25:18.971	2026-10-13 17:25:18.971	\N
631	6	1202	البنوك والمحافظ المالية	Banks & E-Wallets	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-13 17:25:18.98	2026-10-13 17:25:18.98	\N
632	6	1203	أوراق القبض (شيكات تحت التحصيل)	Notes Receivable	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	3	12	f	t	t	0.00	2026-10-13 17:25:18.992	2026-10-13 17:25:18.992	\N
633	6	1204	المخزون السلعي	Inventory	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-13 17:25:19.01	2026-10-13 17:25:19.01	\N
634	6	1205	العملاء (حساب المراقبة)	Accounts Receivable (Control)	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-13 17:25:19.026	2026-10-13 17:25:19.026	\N
635	6	1206	أرصدة مدينة أخرى	Other Debit Balances	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-13 17:25:19.033	2026-10-13 17:25:19.033	\N
636	6	2101	الموردين (حساب المراقبة)	Accounts Payable (Control)	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	3	21	t	t	t	0.00	2026-10-13 17:25:19.037	2026-10-13 17:25:19.037	\N
637	6	2102	أوراق الدفع (شيكات تحت الصرف)	Notes Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	f	t	t	0.00	2026-10-13 17:25:19.076	2026-10-13 17:25:19.076	\N
638	6	2103	مصروفات مستحقة	Accrued Expenses	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	t	t	t	0.00	2026-10-13 17:25:19.082	2026-10-13 17:25:19.082	\N
639	6	2104	أرصدة دائنة أخرى والضرائب	Other Creditors & Taxes	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	t	t	t	0.00	2026-10-13 17:25:19.094	2026-10-13 17:25:19.094	\N
640	6	5106	تغير مخزون آخر الفترة	Periodic Inventory Change	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 17:25:19.097	2026-10-13 17:25:19.097	\N
641	6	120102	الخزينة الفرعية	Sub Safe	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	4	1201	f	t	t	0.00	2026-10-13 17:25:19.102	2026-10-13 17:25:19.102	\N
642	6	120103	عهد نقدية مؤقتة	Petty Cash	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	4	1201	f	t	t	0.00	2026-10-13 17:25:19.106	2026-10-13 17:25:19.106	\N
643	6	120201	الحسابات الجارية بالبنوك	Bank Current Accounts	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-13 17:25:19.112	2026-10-13 17:25:19.112	\N
644	6	120202	حسابات التوفير والودائع	Savings & Deposits	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-13 17:25:19.117	2026-10-13 17:25:19.117	\N
645	6	120203	المحافظ الإلكترونية والمدفوعات الرقمية	Digital Wallets & Cash	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-13 17:25:19.121	2026-10-13 17:25:19.121	\N
646	6	120204	حساب الهيئة القومية للبريد	Postal Account	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-13 17:25:19.127	2026-10-13 17:25:19.127	\N
647	6	120401	مخزون بضاعة تامة الصنع	Finished Goods Inventory	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	4	1204	f	t	t	0.00	2026-10-13 17:25:19.137	2026-10-13 17:25:19.137	\N
648	6	120402	مخزون خامات ومواد أولية	Raw Materials Inventory	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	4	1204	f	t	t	0.00	2026-10-13 17:25:19.143	2026-10-13 17:25:19.143	\N
649	6	120403	مخزون مهمات وقطع غيار	Spare Parts & Supplies	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	4	1204	f	t	t	0.00	2026-10-13 17:25:19.151	2026-10-13 17:25:19.151	\N
650	6	120501	عملاء محليون	Local Customers	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	4	1205	f	t	t	0.00	2026-10-13 17:25:19.158	2026-10-13 17:25:19.158	\N
651	6	120502	عملاء تصدير وخارجيون	Foreign Customers	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	4	1205	f	t	t	0.00	2026-10-13 17:25:19.165	2026-10-13 17:25:19.165	\N
652	6	120503	مبيعات نقدية (عميل نقدي)	Cash Customers	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	4	1205	f	t	t	0.00	2026-10-13 17:25:19.174	2026-10-13 17:25:19.174	\N
653	6	120601	إيراد مستحق	Accrued Revenues	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-13 17:25:19.179	2026-10-13 17:25:19.179	\N
654	6	120602	مصروف مدفوع مقدماً	Prepaid Expenses	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-13 17:25:19.186	2026-10-13 17:25:19.186	\N
655	6	120603	تأمينات لدى الغير	Deposits with Others	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-13 17:25:19.19	2026-10-13 17:25:19.19	\N
656	6	120604	سلف وذمم الموظفين	Employee Advances	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-13 17:25:19.195	2026-10-13 17:25:19.195	\N
657	6	120605	مدينون متنوعون	Miscellaneous Debtors	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-13 17:25:19.201	2026-10-13 17:25:19.201	\N
658	6	210101	موردون محليون	Local Suppliers	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	4	2101	f	t	t	0.00	2026-10-13 17:25:19.212	2026-10-13 17:25:19.212	\N
659	6	210102	موردون خارجيون	Foreign Suppliers	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	4	2101	f	t	t	0.00	2026-10-13 17:25:19.233	2026-10-13 17:25:19.233	\N
660	6	210103	مشتريات نقدية (مورد نقدي)	Cash Purchases (Cash Supplier)	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	4	2101	f	t	t	0.00	2026-10-13 17:25:19.246	2026-10-13 17:25:19.246	\N
661	6	210301	مرتبات وأجور مستحقة	Accrued Salaries	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2103	f	t	t	0.00	2026-10-13 17:25:19.256	2026-10-13 17:25:19.256	\N
662	6	210302	إيجارات مستحقة	Accrued Rent	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2103	f	t	t	0.00	2026-10-13 17:25:19.269	2026-10-13 17:25:19.269	\N
663	6	210401	مصلحة الضرائب - ضريبة القيمة المضافة	VAT Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-13 17:25:19.294	2026-10-13 17:25:19.294	\N
664	6	210402	مصلحة الضرائب - كسب العمل	Payroll Tax Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-13 17:25:19.305	2026-10-13 17:25:19.305	\N
665	6	210403	الهيئة القومية للتأمينات الاجتماعية	Social Insurance Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-13 17:25:19.311	2026-10-13 17:25:19.311	\N
666	6	210404	دائنون متنوعون	Miscellaneous Creditors	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-13 17:25:19.323	2026-10-13 17:25:19.323	\N
667	6	120101	الخزينة الرئيسية	Main Safe	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	4	1201	f	t	t	0.00	2026-10-13 17:25:19.339	2026-10-13 17:25:19.339	\N
668	7	2	الخصوم	Liabilities	الخصوم	\N	\N	دائن	قائمة المركز المالي	1	\N	t	t	t	0.00	2026-10-13 17:30:24.304	2026-10-13 17:30:24.304	\N
669	7	3	حقوق الملكية	Equity	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	1	\N	t	t	t	0.00	2026-10-13 17:30:24.316	2026-10-13 17:30:24.316	\N
670	7	4	الإيرادات	Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	1	\N	t	t	t	0.00	2026-10-13 17:30:24.323	2026-10-13 17:30:24.323	\N
671	7	5	المصروفات	Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	1	\N	t	t	t	0.00	2026-10-13 17:30:24.332	2026-10-13 17:30:24.332	\N
672	7	1	الأصول	Assets	الأصول	\N	\N	مدين	قائمة المركز المالي	1	\N	t	t	t	0.00	2026-10-13 17:30:24.342	2026-10-13 17:30:24.342	\N
673	7	33	الاحتياطيات	Reserves	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	t	t	t	0.00	2026-10-13 17:30:24.348	2026-10-13 17:30:24.348	\N
674	7	34	الأرباح المحتجزة / المرحلة	Retained Earnings	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	f	t	t	0.00	2026-10-13 17:30:24.368	2026-10-13 17:30:24.368	\N
675	7	35	أرباح (خسائر) العام الحالي	Current Year Profit / Loss	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	f	t	t	0.00	2026-10-13 17:30:24.406	2026-10-13 17:30:24.406	\N
676	7	41	إيرادات النشاط الرئيسي	Operating Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	2	4	t	t	t	0.00	2026-10-13 17:30:24.41	2026-10-13 17:30:24.41	\N
677	7	42	إيرادات أخرى متنوعة	Other Revenues	الإيرادات	\N	\N	دائن	قائمة الدخل	2	4	t	t	t	0.00	2026-10-13 17:30:24.418	2026-10-13 17:30:24.418	\N
678	7	51	تكلفة النشاط والمبيعات	Cost of Goods Sold (COGS)	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-13 17:30:24.424	2026-10-13 17:30:24.424	\N
679	7	52	مصاريف البيع والتسويق	Selling & Marketing Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-13 17:30:24.434	2026-10-13 17:30:24.434	\N
680	7	53	مصروفات إدارية وعمومية	General & Administrative Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-13 17:30:24.441	2026-10-13 17:30:24.441	\N
681	7	54	مصروفات التشغيل والإنتاج	Operating & Production Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-13 17:30:24.452	2026-10-13 17:30:24.452	\N
682	7	12	الأصول المتداولة	Current Assets	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	2	1	t	t	t	0.00	2026-10-13 17:30:24.463	2026-10-13 17:30:24.463	\N
683	7	11	الأصول الثابتة	Fixed Assets	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	2	1	t	t	t	0.00	2026-10-13 17:30:24.468	2026-10-13 17:30:24.468	\N
684	7	21	الخصوم المتداولة	Current Liabilities	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	2	2	t	t	t	0.00	2026-10-13 17:30:24.476	2026-10-13 17:30:24.476	\N
685	7	22	الخصوم طويلة الأجل	Long-term Liabilities	الخصوم	الخصوم طويلة الأجل	\N	دائن	قائمة المركز المالي	2	2	t	t	t	0.00	2026-10-13 17:30:24.517	2026-10-13 17:30:24.517	\N
686	7	31	رأس المال	Capital	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	f	t	t	0.00	2026-10-13 17:30:24.542	2026-10-13 17:30:24.542	\N
687	7	32	جاري الشركاء / صاحب المنشأة	Partners' Current Accounts	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	t	t	t	0.00	2026-10-13 17:30:24.557	2026-10-13 17:30:24.557	\N
688	7	2105	قروض وتسهيلات قصيرة الأجل	Short-term Loans	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	f	t	t	0.00	2026-10-13 17:30:24.562	2026-10-13 17:30:24.562	\N
689	7	2201	قروض بنكية طويلة الأجل	Long-term Bank Loans	الخصوم	الخصوم طويلة الأجل	\N	دائن	قائمة المركز المالي	3	22	f	t	t	0.00	2026-10-13 17:30:24.566	2026-10-13 17:30:24.566	\N
690	7	3201	جاري الشريك الرئيسي	Main Partner Current Account	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	3	32	f	t	t	0.00	2026-10-13 17:30:24.571	2026-10-13 17:30:24.571	\N
691	7	3301	الاحتياطي القانوني	Legal Reserve	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	3	33	f	t	t	0.00	2026-10-13 17:30:24.575	2026-10-13 17:30:24.575	\N
692	7	3302	الاحتياطي العام	General Reserve	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	3	33	f	t	t	0.00	2026-10-13 17:30:24.58	2026-10-13 17:30:24.58	\N
693	7	4101	إيراد المبيعات	Sales Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	3	41	f	t	t	0.00	2026-10-13 17:30:24.586	2026-10-13 17:30:24.586	\N
694	7	4102	إيراد تقديم خدمات	Services Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	3	41	f	t	t	0.00	2026-10-13 17:30:24.59	2026-10-13 17:30:24.59	\N
695	7	4103	مردودات ومسموحات المبيعات	Sales Returns & Allowances	الإيرادات	\N	\N	مدين	قائمة الدخل	3	41	f	t	t	0.00	2026-10-13 17:30:24.594	2026-10-13 17:30:24.594	\N
696	7	4104	الخصم المسموح به	Sales Discounts Allowed	الإيرادات	\N	\N	مدين	قائمة الدخل	3	41	f	t	t	0.00	2026-10-13 17:30:24.604	2026-10-13 17:30:24.604	\N
697	7	4201	أرباح بيع أصول ثابتة	Gain on Sale of Assets	الإيرادات	\N	\N	دائن	قائمة الدخل	3	42	f	t	t	0.00	2026-10-13 17:30:24.615	2026-10-13 17:30:24.615	\N
698	7	4202	إيرادات استثمارات وفوائد بنكية	Interest & Investment Income	الإيرادات	\N	\N	دائن	قائمة الدخل	3	42	f	t	t	0.00	2026-10-13 17:30:24.658	2026-10-13 17:30:24.658	\N
699	7	4203	إيرادات عرضية ومتنوعة	Miscellaneous Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	3	42	f	t	t	0.00	2026-10-13 17:30:24.666	2026-10-13 17:30:24.666	\N
700	7	5101	المشتريات	Purchases	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 17:30:24.671	2026-10-13 17:30:24.671	\N
701	7	5102	مصاريف نقل وشحن المشتريات (نولون)	Freight-In Purchases	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 17:30:24.686	2026-10-13 17:30:24.686	\N
702	7	5103	جمارك ورسوم استيراد	Customs & Import Duties	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 17:30:24.692	2026-10-13 17:30:24.692	\N
703	7	5104	مردودات ومسموحات المشتريات	Purchases Returns & Allowances	المصروفات	\N	\N	دائن	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 17:30:24.697	2026-10-13 17:30:24.697	\N
704	7	5105	الخصم المكتسب	Purchases Discounts Received	المصروفات	\N	\N	دائن	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 17:30:24.704	2026-10-13 17:30:24.704	\N
705	7	5201	حملات الدعاية والتسويق الرقمي	Marketing & Digital Ads	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-13 17:30:24.712	2026-10-13 17:30:24.712	\N
706	7	5202	رواتب وعمولات فريق المبيعات	Sales Salaries & Commissions	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-13 17:30:24.717	2026-10-13 17:30:24.717	\N
707	7	5203	مصاريف شحن وتوصيل المبيعات	Delivery & Shipping Out	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-13 17:30:24.721	2026-10-13 17:30:24.721	\N
708	7	5204	مواد تعبئة وتغليف	Packaging Materials	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-13 17:30:24.725	2026-10-13 17:30:24.725	\N
709	7	5205	إيجار معارض ومنافذ بيع	Showroom Rent	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-13 17:30:24.734	2026-10-13 17:30:24.734	\N
710	7	5301	الأجور والرواتب الإدارية	Administrative Salaries	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:30:24.75	2026-10-13 17:30:24.75	\N
711	7	5302	إيجار المقرات الإدارية	Office Rent	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:30:24.775	2026-10-13 17:30:24.775	\N
712	7	5303	كهرباء ومياه وغاز	Utilities (Electricity & Water)	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:30:24.781	2026-10-13 17:30:24.781	\N
713	7	5304	تليفونات وإنترنت واشتراكات رقمية	Telephone & Internet	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:30:24.788	2026-10-13 17:30:24.788	\N
714	7	5305	أدوات مكتبية ومطبوعات ورقية	Stationery & Printing	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:30:24.792	2026-10-13 17:30:24.792	\N
715	7	5306	مصروفات ضيافة وبوفيه ونظافة	Hospitality & Cleaning	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:30:24.797	2026-10-13 17:30:24.797	\N
716	7	5307	مصروفات وعمولات بنكية	Bank Charges & Fees	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:30:24.803	2026-10-13 17:30:24.803	\N
717	7	5309	استشارات قانونية ومحاسبية وتدقيق	Legal & Accounting Consultations	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:30:24.809	2026-10-13 17:30:24.809	\N
718	7	5310	إصلاحات وصيانة دورية عامة	Repairs & Maintenance	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:30:24.816	2026-10-13 17:30:24.816	\N
719	7	5311	انتقالات وسفريات ومحروقات سيارات	Transportation & Fuel	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:30:24.825	2026-10-13 17:30:24.825	\N
720	7	5312	تأمينات اجتماعية - حصة المنشأة	Company Social Insurance	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:30:24.831	2026-10-13 17:30:24.831	\N
721	7	5313	قسط إهلاك الأصول الثابتة	Depreciation Expense	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:30:24.836	2026-10-13 17:30:24.836	\N
722	7	5314	ديون معدومة	Bad Debts	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:30:24.845	2026-10-13 17:30:24.845	\N
723	7	5315	رسوم وغرامات حكومية وتراخيص	Government Licenses & Fees	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:30:24.854	2026-10-13 17:30:24.854	\N
724	7	5316	مصروفات إدارية ونثرية متنوعة	Miscellaneous Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:30:24.869	2026-10-13 17:30:24.869	\N
725	7	5401	أجور ومرتبات عمال التشغيل والإنتاج	Factory Labor Wages	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 17:30:24.901	2026-10-13 17:30:24.901	\N
726	7	5402	إيجار المصنع والورش ومواقع التشغيل	Factory & Workshop Rent	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 17:30:24.998	2026-10-13 17:30:24.998	\N
727	7	5403	كهرباء وقوى محركة للمصنع والآلات	Industrial Power & Electricity	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 17:30:25.008	2026-10-13 17:30:25.008	\N
728	7	5404	زيوت ووقود وصيانة آلات الإنتاج	Machine Oil, Fuel & Maintenance	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 17:30:25.025	2026-10-13 17:30:25.025	\N
729	7	5405	تشغيل وتصنيع خارجي لدى الغير	Subcontracting & External Processing	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 17:30:25.031	2026-10-13 17:30:25.031	\N
730	7	5406	مهمات وأدوات أمن صناعي وسلامة	Safety & Industrial Supplies	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 17:30:25.036	2026-10-13 17:30:25.036	\N
731	7	5308	اشتراك برامج وحلول سحابية	Software & Cloud Subscriptions	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:30:25.041	2026-10-13 17:30:25.041	\N
732	7	1101	الأراضي	Lands	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:30:25.046	2026-10-13 17:30:25.046	\N
733	7	1102	المباني والإنشاءات	Buildings	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:30:25.05	2026-10-13 17:30:25.05	\N
734	7	1103	الآلات والمعدات	Machinery & Equipment	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:30:25.054	2026-10-13 17:30:25.054	\N
735	7	1104	السيارات ووسائل النقل	Vehicles	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:30:25.058	2026-10-13 17:30:25.058	\N
736	7	1105	الأثاث والتجهيزات المكتبية	Furniture & Fixtures	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:30:25.064	2026-10-13 17:30:25.064	\N
737	7	1106	أجهزة الكمبيوتر والبرمجيات	Computers & IT Equipment	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:30:25.069	2026-10-13 17:30:25.069	\N
738	7	1107	الديكورات والتركيبات	Decorations & Installations	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:30:25.075	2026-10-13 17:30:25.075	\N
739	7	1108	ماكينات ومعدات تشغيل	Operating Machines	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:30:25.079	2026-10-13 17:30:25.079	\N
740	7	1109	مجمع إهلاك الأصول الثابتة	Accumulated Depreciation	الأصول	الأصول الثابتة	\N	دائن	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:30:25.085	2026-10-13 17:30:25.085	\N
741	7	1201	النقدية وما في حكمها	Cash & Cash Equivalents	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-13 17:30:25.088	2026-10-13 17:30:25.088	\N
815	8	5105	الخصم المكتسب	Purchases Discounts Received	المصروفات	\N	\N	دائن	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 17:31:23.224	2026-10-13 17:31:23.224	\N
742	7	1202	البنوك والمحافظ المالية	Banks & E-Wallets	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-13 17:30:25.092	2026-10-13 17:30:25.092	\N
743	7	1203	أوراق القبض (شيكات تحت التحصيل)	Notes Receivable	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	3	12	f	t	t	0.00	2026-10-13 17:30:25.097	2026-10-13 17:30:25.097	\N
744	7	1204	المخزون السلعي	Inventory	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-13 17:30:25.102	2026-10-13 17:30:25.102	\N
745	7	1205	العملاء (حساب المراقبة)	Accounts Receivable (Control)	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-13 17:30:25.108	2026-10-13 17:30:25.108	\N
746	7	1206	أرصدة مدينة أخرى	Other Debit Balances	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-13 17:30:25.114	2026-10-13 17:30:25.114	\N
747	7	2101	الموردين (حساب المراقبة)	Accounts Payable (Control)	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	3	21	t	t	t	0.00	2026-10-13 17:30:25.121	2026-10-13 17:30:25.121	\N
748	7	2102	أوراق الدفع (شيكات تحت الصرف)	Notes Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	f	t	t	0.00	2026-10-13 17:30:25.126	2026-10-13 17:30:25.126	\N
749	7	2103	مصروفات مستحقة	Accrued Expenses	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	t	t	t	0.00	2026-10-13 17:30:25.13	2026-10-13 17:30:25.13	\N
750	7	2104	أرصدة دائنة أخرى والضرائب	Other Creditors & Taxes	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	t	t	t	0.00	2026-10-13 17:30:25.135	2026-10-13 17:30:25.135	\N
751	7	5106	تغير مخزون آخر الفترة	Periodic Inventory Change	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 17:30:25.139	2026-10-13 17:30:25.139	\N
752	7	120102	الخزينة الفرعية	Sub Safe	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	4	1201	f	t	t	0.00	2026-10-13 17:30:25.143	2026-10-13 17:30:25.143	\N
753	7	120103	عهد نقدية مؤقتة	Petty Cash	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	4	1201	f	t	t	0.00	2026-10-13 17:30:25.148	2026-10-13 17:30:25.148	\N
754	7	120201	الحسابات الجارية بالبنوك	Bank Current Accounts	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-13 17:30:25.158	2026-10-13 17:30:25.158	\N
755	7	120202	حسابات التوفير والودائع	Savings & Deposits	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-13 17:30:25.165	2026-10-13 17:30:25.165	\N
756	7	120203	المحافظ الإلكترونية والمدفوعات الرقمية	Digital Wallets & Cash	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-13 17:30:25.171	2026-10-13 17:30:25.171	\N
757	7	120204	حساب الهيئة القومية للبريد	Postal Account	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-13 17:30:25.175	2026-10-13 17:30:25.175	\N
758	7	120401	مخزون بضاعة تامة الصنع	Finished Goods Inventory	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	4	1204	f	t	t	0.00	2026-10-13 17:30:25.18	2026-10-13 17:30:25.18	\N
759	7	120402	مخزون خامات ومواد أولية	Raw Materials Inventory	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	4	1204	f	t	t	0.00	2026-10-13 17:30:25.19	2026-10-13 17:30:25.19	\N
760	7	120403	مخزون مهمات وقطع غيار	Spare Parts & Supplies	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	4	1204	f	t	t	0.00	2026-10-13 17:30:25.202	2026-10-13 17:30:25.202	\N
761	7	120501	عملاء محليون	Local Customers	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	4	1205	f	t	t	0.00	2026-10-13 17:30:25.212	2026-10-13 17:30:25.212	\N
762	7	120502	عملاء تصدير وخارجيون	Foreign Customers	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	4	1205	f	t	t	0.00	2026-10-13 17:30:25.217	2026-10-13 17:30:25.217	\N
763	7	120503	مبيعات نقدية (عميل نقدي)	Cash Customers	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	4	1205	f	t	t	0.00	2026-10-13 17:30:25.224	2026-10-13 17:30:25.224	\N
764	7	120601	إيراد مستحق	Accrued Revenues	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-13 17:30:25.229	2026-10-13 17:30:25.229	\N
765	7	120602	مصروف مدفوع مقدماً	Prepaid Expenses	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-13 17:30:25.234	2026-10-13 17:30:25.234	\N
766	7	120603	تأمينات لدى الغير	Deposits with Others	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-13 17:30:25.242	2026-10-13 17:30:25.242	\N
767	7	120604	سلف وذمم الموظفين	Employee Advances	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-13 17:30:25.251	2026-10-13 17:30:25.251	\N
768	7	120605	مدينون متنوعون	Miscellaneous Debtors	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-13 17:30:25.258	2026-10-13 17:30:25.258	\N
769	7	210101	موردون محليون	Local Suppliers	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	4	2101	f	t	t	0.00	2026-10-13 17:30:25.265	2026-10-13 17:30:25.265	\N
770	7	210102	موردون خارجيون	Foreign Suppliers	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	4	2101	f	t	t	0.00	2026-10-13 17:30:25.275	2026-10-13 17:30:25.275	\N
771	7	210103	مشتريات نقدية (مورد نقدي)	Cash Purchases (Cash Supplier)	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	4	2101	f	t	t	0.00	2026-10-13 17:30:25.28	2026-10-13 17:30:25.28	\N
772	7	210301	مرتبات وأجور مستحقة	Accrued Salaries	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2103	f	t	t	0.00	2026-10-13 17:30:25.286	2026-10-13 17:30:25.286	\N
773	7	210302	إيجارات مستحقة	Accrued Rent	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2103	f	t	t	0.00	2026-10-13 17:30:25.291	2026-10-13 17:30:25.291	\N
774	7	210401	مصلحة الضرائب - ضريبة القيمة المضافة	VAT Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-13 17:30:25.299	2026-10-13 17:30:25.299	\N
775	7	210402	مصلحة الضرائب - كسب العمل	Payroll Tax Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-13 17:30:25.307	2026-10-13 17:30:25.307	\N
776	7	210403	الهيئة القومية للتأمينات الاجتماعية	Social Insurance Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-13 17:30:25.316	2026-10-13 17:30:25.316	\N
777	7	210404	دائنون متنوعون	Miscellaneous Creditors	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-13 17:30:25.323	2026-10-13 17:30:25.323	\N
778	7	120101	الخزينة الرئيسية	Main Safe	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	4	1201	f	t	t	0.00	2026-10-13 17:30:25.333	2026-10-13 17:30:25.333	\N
779	8	2	الخصوم	Liabilities	الخصوم	\N	\N	دائن	قائمة المركز المالي	1	\N	t	t	t	0.00	2026-10-13 17:31:22.84	2026-10-13 17:31:22.84	\N
780	8	3	حقوق الملكية	Equity	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	1	\N	t	t	t	0.00	2026-10-13 17:31:22.847	2026-10-13 17:31:22.847	\N
781	8	4	الإيرادات	Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	1	\N	t	t	t	0.00	2026-10-13 17:31:22.854	2026-10-13 17:31:22.854	\N
782	8	5	المصروفات	Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	1	\N	t	t	t	0.00	2026-10-13 17:31:22.874	2026-10-13 17:31:22.874	\N
783	8	1	الأصول	Assets	الأصول	\N	\N	مدين	قائمة المركز المالي	1	\N	t	t	t	0.00	2026-10-13 17:31:22.925	2026-10-13 17:31:22.925	\N
784	8	33	الاحتياطيات	Reserves	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	t	t	t	0.00	2026-10-13 17:31:22.987	2026-10-13 17:31:22.987	\N
785	8	34	الأرباح المحتجزة / المرحلة	Retained Earnings	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	f	t	t	0.00	2026-10-13 17:31:22.994	2026-10-13 17:31:22.994	\N
786	8	35	أرباح (خسائر) العام الحالي	Current Year Profit / Loss	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	f	t	t	0.00	2026-10-13 17:31:23	2026-10-13 17:31:23	\N
787	8	41	إيرادات النشاط الرئيسي	Operating Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	2	4	t	t	t	0.00	2026-10-13 17:31:23.017	2026-10-13 17:31:23.017	\N
788	8	42	إيرادات أخرى متنوعة	Other Revenues	الإيرادات	\N	\N	دائن	قائمة الدخل	2	4	t	t	t	0.00	2026-10-13 17:31:23.023	2026-10-13 17:31:23.023	\N
789	8	51	تكلفة النشاط والمبيعات	Cost of Goods Sold (COGS)	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-13 17:31:23.031	2026-10-13 17:31:23.031	\N
790	8	52	مصاريف البيع والتسويق	Selling & Marketing Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-13 17:31:23.045	2026-10-13 17:31:23.045	\N
791	8	53	مصروفات إدارية وعمومية	General & Administrative Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-13 17:31:23.056	2026-10-13 17:31:23.056	\N
792	8	54	مصروفات التشغيل والإنتاج	Operating & Production Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-13 17:31:23.064	2026-10-13 17:31:23.064	\N
793	8	12	الأصول المتداولة	Current Assets	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	2	1	t	t	t	0.00	2026-10-13 17:31:23.069	2026-10-13 17:31:23.069	\N
794	8	11	الأصول الثابتة	Fixed Assets	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	2	1	t	t	t	0.00	2026-10-13 17:31:23.075	2026-10-13 17:31:23.075	\N
795	8	21	الخصوم المتداولة	Current Liabilities	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	2	2	t	t	t	0.00	2026-10-13 17:31:23.098	2026-10-13 17:31:23.098	\N
796	8	22	الخصوم طويلة الأجل	Long-term Liabilities	الخصوم	الخصوم طويلة الأجل	\N	دائن	قائمة المركز المالي	2	2	t	t	t	0.00	2026-10-13 17:31:23.106	2026-10-13 17:31:23.106	\N
797	8	31	رأس المال	Capital	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	f	t	t	0.00	2026-10-13 17:31:23.111	2026-10-13 17:31:23.111	\N
798	8	32	جاري الشركاء / صاحب المنشأة	Partners' Current Accounts	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	t	t	t	0.00	2026-10-13 17:31:23.117	2026-10-13 17:31:23.117	\N
799	8	2105	قروض وتسهيلات قصيرة الأجل	Short-term Loans	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	f	t	t	0.00	2026-10-13 17:31:23.122	2026-10-13 17:31:23.122	\N
800	8	2201	قروض بنكية طويلة الأجل	Long-term Bank Loans	الخصوم	الخصوم طويلة الأجل	\N	دائن	قائمة المركز المالي	3	22	f	t	t	0.00	2026-10-13 17:31:23.129	2026-10-13 17:31:23.129	\N
801	8	3201	جاري الشريك الرئيسي	Main Partner Current Account	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	3	32	f	t	t	0.00	2026-10-13 17:31:23.133	2026-10-13 17:31:23.133	\N
802	8	3301	الاحتياطي القانوني	Legal Reserve	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	3	33	f	t	t	0.00	2026-10-13 17:31:23.138	2026-10-13 17:31:23.138	\N
803	8	3302	الاحتياطي العام	General Reserve	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	3	33	f	t	t	0.00	2026-10-13 17:31:23.144	2026-10-13 17:31:23.144	\N
804	8	4101	إيراد المبيعات	Sales Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	3	41	f	t	t	0.00	2026-10-13 17:31:23.151	2026-10-13 17:31:23.151	\N
805	8	4102	إيراد تقديم خدمات	Services Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	3	41	f	t	t	0.00	2026-10-13 17:31:23.167	2026-10-13 17:31:23.167	\N
806	8	4103	مردودات ومسموحات المبيعات	Sales Returns & Allowances	الإيرادات	\N	\N	مدين	قائمة الدخل	3	41	f	t	t	0.00	2026-10-13 17:31:23.173	2026-10-13 17:31:23.173	\N
807	8	4104	الخصم المسموح به	Sales Discounts Allowed	الإيرادات	\N	\N	مدين	قائمة الدخل	3	41	f	t	t	0.00	2026-10-13 17:31:23.177	2026-10-13 17:31:23.177	\N
808	8	4201	أرباح بيع أصول ثابتة	Gain on Sale of Assets	الإيرادات	\N	\N	دائن	قائمة الدخل	3	42	f	t	t	0.00	2026-10-13 17:31:23.184	2026-10-13 17:31:23.184	\N
809	8	4202	إيرادات استثمارات وفوائد بنكية	Interest & Investment Income	الإيرادات	\N	\N	دائن	قائمة الدخل	3	42	f	t	t	0.00	2026-10-13 17:31:23.189	2026-10-13 17:31:23.189	\N
810	8	4203	إيرادات عرضية ومتنوعة	Miscellaneous Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	3	42	f	t	t	0.00	2026-10-13 17:31:23.198	2026-10-13 17:31:23.198	\N
811	8	5101	المشتريات	Purchases	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 17:31:23.203	2026-10-13 17:31:23.203	\N
812	8	5102	مصاريف نقل وشحن المشتريات (نولون)	Freight-In Purchases	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 17:31:23.212	2026-10-13 17:31:23.212	\N
813	8	5103	جمارك ورسوم استيراد	Customs & Import Duties	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 17:31:23.216	2026-10-13 17:31:23.216	\N
814	8	5104	مردودات ومسموحات المشتريات	Purchases Returns & Allowances	المصروفات	\N	\N	دائن	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 17:31:23.221	2026-10-13 17:31:23.221	\N
816	8	5201	حملات الدعاية والتسويق الرقمي	Marketing & Digital Ads	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-13 17:31:23.232	2026-10-13 17:31:23.232	\N
817	8	5202	رواتب وعمولات فريق المبيعات	Sales Salaries & Commissions	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-13 17:31:23.236	2026-10-13 17:31:23.236	\N
818	8	5203	مصاريف شحن وتوصيل المبيعات	Delivery & Shipping Out	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-13 17:31:23.24	2026-10-13 17:31:23.24	\N
819	8	5204	مواد تعبئة وتغليف	Packaging Materials	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-13 17:31:23.247	2026-10-13 17:31:23.247	\N
820	8	5205	إيجار معارض ومنافذ بيع	Showroom Rent	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-13 17:31:23.257	2026-10-13 17:31:23.257	\N
821	8	5301	الأجور والرواتب الإدارية	Administrative Salaries	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:31:23.265	2026-10-13 17:31:23.265	\N
822	8	5302	إيجار المقرات الإدارية	Office Rent	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:31:23.281	2026-10-13 17:31:23.281	\N
823	8	5303	كهرباء ومياه وغاز	Utilities (Electricity & Water)	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:31:23.289	2026-10-13 17:31:23.289	\N
824	8	5304	تليفونات وإنترنت واشتراكات رقمية	Telephone & Internet	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:31:23.293	2026-10-13 17:31:23.293	\N
825	8	5305	أدوات مكتبية ومطبوعات ورقية	Stationery & Printing	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:31:23.297	2026-10-13 17:31:23.297	\N
826	8	5306	مصروفات ضيافة وبوفيه ونظافة	Hospitality & Cleaning	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:31:23.301	2026-10-13 17:31:23.301	\N
827	8	5307	مصروفات وعمولات بنكية	Bank Charges & Fees	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:31:23.307	2026-10-13 17:31:23.307	\N
828	8	5309	استشارات قانونية ومحاسبية وتدقيق	Legal & Accounting Consultations	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:31:23.311	2026-10-13 17:31:23.311	\N
829	8	5310	إصلاحات وصيانة دورية عامة	Repairs & Maintenance	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:31:23.315	2026-10-13 17:31:23.315	\N
830	8	5311	انتقالات وسفريات ومحروقات سيارات	Transportation & Fuel	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:31:23.319	2026-10-13 17:31:23.319	\N
831	8	5312	تأمينات اجتماعية - حصة المنشأة	Company Social Insurance	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:31:23.325	2026-10-13 17:31:23.325	\N
832	8	5313	قسط إهلاك الأصول الثابتة	Depreciation Expense	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:31:23.332	2026-10-13 17:31:23.332	\N
833	8	5314	ديون معدومة	Bad Debts	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:31:23.336	2026-10-13 17:31:23.336	\N
834	8	5315	رسوم وغرامات حكومية وتراخيص	Government Licenses & Fees	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:31:23.34	2026-10-13 17:31:23.34	\N
835	8	5316	مصروفات إدارية ونثرية متنوعة	Miscellaneous Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:31:23.344	2026-10-13 17:31:23.344	\N
836	8	5401	أجور ومرتبات عمال التشغيل والإنتاج	Factory Labor Wages	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 17:31:23.35	2026-10-13 17:31:23.35	\N
837	8	5402	إيجار المصنع والورش ومواقع التشغيل	Factory & Workshop Rent	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 17:31:23.355	2026-10-13 17:31:23.355	\N
838	8	5403	كهرباء وقوى محركة للمصنع والآلات	Industrial Power & Electricity	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 17:31:23.362	2026-10-13 17:31:23.362	\N
839	8	5404	زيوت ووقود وصيانة آلات الإنتاج	Machine Oil, Fuel & Maintenance	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 17:31:23.37	2026-10-13 17:31:23.37	\N
840	8	5405	تشغيل وتصنيع خارجي لدى الغير	Subcontracting & External Processing	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 17:31:23.374	2026-10-13 17:31:23.374	\N
841	8	5406	مهمات وأدوات أمن صناعي وسلامة	Safety & Industrial Supplies	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 17:31:23.379	2026-10-13 17:31:23.379	\N
842	8	5308	اشتراك برامج وحلول سحابية	Software & Cloud Subscriptions	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:31:23.385	2026-10-13 17:31:23.385	\N
843	8	1101	الأراضي	Lands	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:31:23.39	2026-10-13 17:31:23.39	\N
844	8	1102	المباني والإنشاءات	Buildings	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:31:23.394	2026-10-13 17:31:23.394	\N
845	8	1103	الآلات والمعدات	Machinery & Equipment	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:31:23.398	2026-10-13 17:31:23.398	\N
846	8	1104	السيارات ووسائل النقل	Vehicles	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:31:23.402	2026-10-13 17:31:23.402	\N
847	8	1105	الأثاث والتجهيزات المكتبية	Furniture & Fixtures	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:31:23.406	2026-10-13 17:31:23.406	\N
848	8	1106	أجهزة الكمبيوتر والبرمجيات	Computers & IT Equipment	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:31:23.409	2026-10-13 17:31:23.409	\N
849	8	1107	الديكورات والتركيبات	Decorations & Installations	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:31:23.412	2026-10-13 17:31:23.412	\N
850	8	1108	ماكينات ومعدات تشغيل	Operating Machines	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:31:23.417	2026-10-13 17:31:23.417	\N
851	8	1109	مجمع إهلاك الأصول الثابتة	Accumulated Depreciation	الأصول	الأصول الثابتة	\N	دائن	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:31:23.423	2026-10-13 17:31:23.423	\N
852	8	1201	النقدية وما في حكمها	Cash & Cash Equivalents	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-13 17:31:23.426	2026-10-13 17:31:23.426	\N
853	8	1202	البنوك والمحافظ المالية	Banks & E-Wallets	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-13 17:31:23.431	2026-10-13 17:31:23.431	\N
854	8	1203	أوراق القبض (شيكات تحت التحصيل)	Notes Receivable	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	3	12	f	t	t	0.00	2026-10-13 17:31:23.435	2026-10-13 17:31:23.435	\N
855	8	1204	المخزون السلعي	Inventory	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-13 17:31:23.439	2026-10-13 17:31:23.439	\N
856	8	1205	العملاء (حساب المراقبة)	Accounts Receivable (Control)	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-13 17:31:23.447	2026-10-13 17:31:23.447	\N
857	8	1206	أرصدة مدينة أخرى	Other Debit Balances	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-13 17:31:23.451	2026-10-13 17:31:23.451	\N
858	8	2101	الموردين (حساب المراقبة)	Accounts Payable (Control)	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	3	21	t	t	t	0.00	2026-10-13 17:31:23.455	2026-10-13 17:31:23.455	\N
859	8	2102	أوراق الدفع (شيكات تحت الصرف)	Notes Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	f	t	t	0.00	2026-10-13 17:31:23.462	2026-10-13 17:31:23.462	\N
860	8	2103	مصروفات مستحقة	Accrued Expenses	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	t	t	t	0.00	2026-10-13 17:31:23.468	2026-10-13 17:31:23.468	\N
861	8	2104	أرصدة دائنة أخرى والضرائب	Other Creditors & Taxes	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	t	t	t	0.00	2026-10-13 17:31:23.473	2026-10-13 17:31:23.473	\N
862	8	5106	تغير مخزون آخر الفترة	Periodic Inventory Change	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 17:31:23.481	2026-10-13 17:31:23.481	\N
863	8	120102	الخزينة الفرعية	Sub Safe	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	4	1201	f	t	t	0.00	2026-10-13 17:31:23.488	2026-10-13 17:31:23.488	\N
864	8	120103	عهد نقدية مؤقتة	Petty Cash	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	4	1201	f	t	t	0.00	2026-10-13 17:31:23.494	2026-10-13 17:31:23.494	\N
865	8	120201	الحسابات الجارية بالبنوك	Bank Current Accounts	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-13 17:31:23.5	2026-10-13 17:31:23.5	\N
866	8	120202	حسابات التوفير والودائع	Savings & Deposits	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-13 17:31:23.506	2026-10-13 17:31:23.506	\N
867	8	120203	المحافظ الإلكترونية والمدفوعات الرقمية	Digital Wallets & Cash	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-13 17:31:23.51	2026-10-13 17:31:23.51	\N
868	8	120204	حساب الهيئة القومية للبريد	Postal Account	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-13 17:31:23.514	2026-10-13 17:31:23.514	\N
869	8	120401	مخزون بضاعة تامة الصنع	Finished Goods Inventory	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	4	1204	f	t	t	0.00	2026-10-13 17:31:23.517	2026-10-13 17:31:23.517	\N
870	8	120402	مخزون خامات ومواد أولية	Raw Materials Inventory	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	4	1204	f	t	t	0.00	2026-10-13 17:31:23.521	2026-10-13 17:31:23.521	\N
871	8	120403	مخزون مهمات وقطع غيار	Spare Parts & Supplies	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	4	1204	f	t	t	0.00	2026-10-13 17:31:23.525	2026-10-13 17:31:23.525	\N
872	8	120501	عملاء محليون	Local Customers	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	4	1205	f	t	t	0.00	2026-10-13 17:31:23.53	2026-10-13 17:31:23.53	\N
873	8	120502	عملاء تصدير وخارجيون	Foreign Customers	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	4	1205	f	t	t	0.00	2026-10-13 17:31:23.534	2026-10-13 17:31:23.534	\N
874	8	120503	مبيعات نقدية (عميل نقدي)	Cash Customers	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	4	1205	f	t	t	0.00	2026-10-13 17:31:23.539	2026-10-13 17:31:23.539	\N
875	8	120601	إيراد مستحق	Accrued Revenues	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-13 17:31:23.543	2026-10-13 17:31:23.543	\N
876	8	120602	مصروف مدفوع مقدماً	Prepaid Expenses	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-13 17:31:23.547	2026-10-13 17:31:23.547	\N
877	8	120603	تأمينات لدى الغير	Deposits with Others	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-13 17:31:23.554	2026-10-13 17:31:23.554	\N
878	8	120604	سلف وذمم الموظفين	Employee Advances	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-13 17:31:23.558	2026-10-13 17:31:23.558	\N
879	8	120605	مدينون متنوعون	Miscellaneous Debtors	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-13 17:31:23.563	2026-10-13 17:31:23.563	\N
880	8	210101	موردون محليون	Local Suppliers	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	4	2101	f	t	t	0.00	2026-10-13 17:31:23.569	2026-10-13 17:31:23.569	\N
881	8	210102	موردون خارجيون	Foreign Suppliers	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	4	2101	f	t	t	0.00	2026-10-13 17:31:23.574	2026-10-13 17:31:23.574	\N
882	8	210103	مشتريات نقدية (مورد نقدي)	Cash Purchases (Cash Supplier)	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	4	2101	f	t	t	0.00	2026-10-13 17:31:23.58	2026-10-13 17:31:23.58	\N
883	8	210301	مرتبات وأجور مستحقة	Accrued Salaries	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2103	f	t	t	0.00	2026-10-13 17:31:23.585	2026-10-13 17:31:23.585	\N
884	8	210302	إيجارات مستحقة	Accrued Rent	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2103	f	t	t	0.00	2026-10-13 17:31:23.589	2026-10-13 17:31:23.589	\N
885	8	210401	مصلحة الضرائب - ضريبة القيمة المضافة	VAT Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-13 17:31:23.594	2026-10-13 17:31:23.594	\N
886	8	210402	مصلحة الضرائب - كسب العمل	Payroll Tax Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-13 17:31:23.598	2026-10-13 17:31:23.598	\N
887	8	210403	الهيئة القومية للتأمينات الاجتماعية	Social Insurance Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-13 17:31:23.604	2026-10-13 17:31:23.604	\N
888	8	210404	دائنون متنوعون	Miscellaneous Creditors	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-13 17:31:23.609	2026-10-13 17:31:23.609	\N
889	8	120101	الخزينة الرئيسية	Main Safe	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	4	1201	f	t	t	0.00	2026-10-13 17:31:23.615	2026-10-13 17:31:23.615	\N
890	9	2	الخصوم	Liabilities	الخصوم	\N	\N	دائن	قائمة المركز المالي	1	\N	t	t	t	0.00	2026-10-13 17:33:17.033	2026-10-13 17:33:17.033	\N
891	9	3	حقوق الملكية	Equity	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	1	\N	t	t	t	0.00	2026-10-13 17:33:17.047	2026-10-13 17:33:17.047	\N
892	9	4	الإيرادات	Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	1	\N	t	t	t	0.00	2026-10-13 17:33:17.056	2026-10-13 17:33:17.056	\N
893	9	5	المصروفات	Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	1	\N	t	t	t	0.00	2026-10-13 17:33:17.063	2026-10-13 17:33:17.063	\N
894	9	1	الأصول	Assets	الأصول	\N	\N	مدين	قائمة المركز المالي	1	\N	t	t	t	0.00	2026-10-13 17:33:17.071	2026-10-13 17:33:17.071	\N
895	9	33	الاحتياطيات	Reserves	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	t	t	t	0.00	2026-10-13 17:33:17.078	2026-10-13 17:33:17.078	\N
896	9	34	الأرباح المحتجزة / المرحلة	Retained Earnings	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	f	t	t	0.00	2026-10-13 17:33:17.083	2026-10-13 17:33:17.083	\N
897	9	35	أرباح (خسائر) العام الحالي	Current Year Profit / Loss	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	f	t	t	0.00	2026-10-13 17:33:17.088	2026-10-13 17:33:17.088	\N
898	9	41	إيرادات النشاط الرئيسي	Operating Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	2	4	t	t	t	0.00	2026-10-13 17:33:17.094	2026-10-13 17:33:17.094	\N
899	9	42	إيرادات أخرى متنوعة	Other Revenues	الإيرادات	\N	\N	دائن	قائمة الدخل	2	4	t	t	t	0.00	2026-10-13 17:33:17.102	2026-10-13 17:33:17.102	\N
900	9	51	تكلفة النشاط والمبيعات	Cost of Goods Sold (COGS)	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-13 17:33:17.115	2026-10-13 17:33:17.115	\N
901	9	52	مصاريف البيع والتسويق	Selling & Marketing Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-13 17:33:17.14	2026-10-13 17:33:17.14	\N
902	9	53	مصروفات إدارية وعمومية	General & Administrative Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-13 17:33:17.146	2026-10-13 17:33:17.146	\N
903	9	54	مصروفات التشغيل والإنتاج	Operating & Production Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-13 17:33:17.162	2026-10-13 17:33:17.162	\N
904	9	12	الأصول المتداولة	Current Assets	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	2	1	t	t	t	0.00	2026-10-13 17:33:17.167	2026-10-13 17:33:17.167	\N
905	9	11	الأصول الثابتة	Fixed Assets	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	2	1	t	t	t	0.00	2026-10-13 17:33:17.174	2026-10-13 17:33:17.174	\N
906	9	21	الخصوم المتداولة	Current Liabilities	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	2	2	t	t	t	0.00	2026-10-13 17:33:17.182	2026-10-13 17:33:17.182	\N
907	9	22	الخصوم طويلة الأجل	Long-term Liabilities	الخصوم	الخصوم طويلة الأجل	\N	دائن	قائمة المركز المالي	2	2	t	t	t	0.00	2026-10-13 17:33:17.187	2026-10-13 17:33:17.187	\N
908	9	31	رأس المال	Capital	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	f	t	t	0.00	2026-10-13 17:33:17.194	2026-10-13 17:33:17.194	\N
909	9	32	جاري الشركاء / صاحب المنشأة	Partners' Current Accounts	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	t	t	t	0.00	2026-10-13 17:33:17.199	2026-10-13 17:33:17.199	\N
910	9	2105	قروض وتسهيلات قصيرة الأجل	Short-term Loans	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	f	t	t	0.00	2026-10-13 17:33:17.206	2026-10-13 17:33:17.206	\N
911	9	2201	قروض بنكية طويلة الأجل	Long-term Bank Loans	الخصوم	الخصوم طويلة الأجل	\N	دائن	قائمة المركز المالي	3	22	f	t	t	0.00	2026-10-13 17:33:17.212	2026-10-13 17:33:17.212	\N
912	9	3201	جاري الشريك الرئيسي	Main Partner Current Account	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	3	32	f	t	t	0.00	2026-10-13 17:33:17.219	2026-10-13 17:33:17.219	\N
913	9	3301	الاحتياطي القانوني	Legal Reserve	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	3	33	f	t	t	0.00	2026-10-13 17:33:17.224	2026-10-13 17:33:17.224	\N
914	9	3302	الاحتياطي العام	General Reserve	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	3	33	f	t	t	0.00	2026-10-13 17:33:17.231	2026-10-13 17:33:17.231	\N
915	9	4101	إيراد المبيعات	Sales Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	3	41	f	t	t	0.00	2026-10-13 17:33:17.238	2026-10-13 17:33:17.238	\N
916	9	4102	إيراد تقديم خدمات	Services Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	3	41	f	t	t	0.00	2026-10-13 17:33:17.241	2026-10-13 17:33:17.241	\N
917	9	4103	مردودات ومسموحات المبيعات	Sales Returns & Allowances	الإيرادات	\N	\N	مدين	قائمة الدخل	3	41	f	t	t	0.00	2026-10-13 17:33:17.247	2026-10-13 17:33:17.247	\N
918	9	4104	الخصم المسموح به	Sales Discounts Allowed	الإيرادات	\N	\N	مدين	قائمة الدخل	3	41	f	t	t	0.00	2026-10-13 17:33:17.252	2026-10-13 17:33:17.252	\N
919	9	4201	أرباح بيع أصول ثابتة	Gain on Sale of Assets	الإيرادات	\N	\N	دائن	قائمة الدخل	3	42	f	t	t	0.00	2026-10-13 17:33:17.256	2026-10-13 17:33:17.256	\N
920	9	4202	إيرادات استثمارات وفوائد بنكية	Interest & Investment Income	الإيرادات	\N	\N	دائن	قائمة الدخل	3	42	f	t	t	0.00	2026-10-13 17:33:17.261	2026-10-13 17:33:17.261	\N
921	9	4203	إيرادات عرضية ومتنوعة	Miscellaneous Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	3	42	f	t	t	0.00	2026-10-13 17:33:17.266	2026-10-13 17:33:17.266	\N
922	9	5101	المشتريات	Purchases	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 17:33:17.27	2026-10-13 17:33:17.27	\N
923	9	5102	مصاريف نقل وشحن المشتريات (نولون)	Freight-In Purchases	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 17:33:17.276	2026-10-13 17:33:17.276	\N
924	9	5103	جمارك ورسوم استيراد	Customs & Import Duties	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 17:33:17.284	2026-10-13 17:33:17.284	\N
925	9	5104	مردودات ومسموحات المشتريات	Purchases Returns & Allowances	المصروفات	\N	\N	دائن	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 17:33:17.295	2026-10-13 17:33:17.295	\N
926	9	5105	الخصم المكتسب	Purchases Discounts Received	المصروفات	\N	\N	دائن	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 17:33:17.302	2026-10-13 17:33:17.302	\N
927	9	5201	حملات الدعاية والتسويق الرقمي	Marketing & Digital Ads	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-13 17:33:17.309	2026-10-13 17:33:17.309	\N
928	9	5202	رواتب وعمولات فريق المبيعات	Sales Salaries & Commissions	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-13 17:33:17.329	2026-10-13 17:33:17.329	\N
929	9	5203	مصاريف شحن وتوصيل المبيعات	Delivery & Shipping Out	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-13 17:33:17.336	2026-10-13 17:33:17.336	\N
930	9	5204	مواد تعبئة وتغليف	Packaging Materials	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-13 17:33:17.341	2026-10-13 17:33:17.341	\N
931	9	5205	إيجار معارض ومنافذ بيع	Showroom Rent	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-13 17:33:17.345	2026-10-13 17:33:17.345	\N
932	9	5301	الأجور والرواتب الإدارية	Administrative Salaries	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:33:17.349	2026-10-13 17:33:17.349	\N
933	9	5302	إيجار المقرات الإدارية	Office Rent	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:33:17.353	2026-10-13 17:33:17.353	\N
934	9	5303	كهرباء ومياه وغاز	Utilities (Electricity & Water)	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:33:17.356	2026-10-13 17:33:17.356	\N
935	9	5304	تليفونات وإنترنت واشتراكات رقمية	Telephone & Internet	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:33:17.36	2026-10-13 17:33:17.36	\N
936	9	5305	أدوات مكتبية ومطبوعات ورقية	Stationery & Printing	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:33:17.364	2026-10-13 17:33:17.364	\N
937	9	5306	مصروفات ضيافة وبوفيه ونظافة	Hospitality & Cleaning	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:33:17.37	2026-10-13 17:33:17.37	\N
938	9	5307	مصروفات وعمولات بنكية	Bank Charges & Fees	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:33:17.374	2026-10-13 17:33:17.374	\N
939	9	5309	استشارات قانونية ومحاسبية وتدقيق	Legal & Accounting Consultations	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:33:17.38	2026-10-13 17:33:17.38	\N
940	9	5310	إصلاحات وصيانة دورية عامة	Repairs & Maintenance	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:33:17.387	2026-10-13 17:33:17.387	\N
941	9	5311	انتقالات وسفريات ومحروقات سيارات	Transportation & Fuel	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:33:17.398	2026-10-13 17:33:17.398	\N
942	9	5312	تأمينات اجتماعية - حصة المنشأة	Company Social Insurance	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:33:17.41	2026-10-13 17:33:17.41	\N
943	9	5313	قسط إهلاك الأصول الثابتة	Depreciation Expense	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:33:17.417	2026-10-13 17:33:17.417	\N
944	9	5314	ديون معدومة	Bad Debts	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:33:17.422	2026-10-13 17:33:17.422	\N
945	9	5315	رسوم وغرامات حكومية وتراخيص	Government Licenses & Fees	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:33:17.428	2026-10-13 17:33:17.428	\N
1166	19	5314	ديون معدومة	Bad Debts	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 21:37:07.028	2026-10-13 21:37:07.028	\N
946	9	5316	مصروفات إدارية ونثرية متنوعة	Miscellaneous Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:33:17.436	2026-10-13 17:33:17.436	\N
947	9	5401	أجور ومرتبات عمال التشغيل والإنتاج	Factory Labor Wages	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 17:33:17.442	2026-10-13 17:33:17.442	\N
948	9	5402	إيجار المصنع والورش ومواقع التشغيل	Factory & Workshop Rent	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 17:33:17.449	2026-10-13 17:33:17.449	\N
949	9	5403	كهرباء وقوى محركة للمصنع والآلات	Industrial Power & Electricity	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 17:33:17.454	2026-10-13 17:33:17.454	\N
950	9	5404	زيوت ووقود وصيانة آلات الإنتاج	Machine Oil, Fuel & Maintenance	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 17:33:17.46	2026-10-13 17:33:17.46	\N
951	9	5405	تشغيل وتصنيع خارجي لدى الغير	Subcontracting & External Processing	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 17:33:17.465	2026-10-13 17:33:17.465	\N
952	9	5406	مهمات وأدوات أمن صناعي وسلامة	Safety & Industrial Supplies	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 17:33:17.476	2026-10-13 17:33:17.476	\N
953	9	5308	اشتراك برامج وحلول سحابية	Software & Cloud Subscriptions	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:33:17.5	2026-10-13 17:33:17.5	\N
954	9	1101	الأراضي	Lands	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:33:17.526	2026-10-13 17:33:17.526	\N
955	9	1102	المباني والإنشاءات	Buildings	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:33:17.607	2026-10-13 17:33:17.607	\N
956	9	1103	الآلات والمعدات	Machinery & Equipment	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:33:17.619	2026-10-13 17:33:17.619	\N
957	9	1104	السيارات ووسائل النقل	Vehicles	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:33:17.624	2026-10-13 17:33:17.624	\N
958	9	1105	الأثاث والتجهيزات المكتبية	Furniture & Fixtures	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:33:17.628	2026-10-13 17:33:17.628	\N
959	9	1106	أجهزة الكمبيوتر والبرمجيات	Computers & IT Equipment	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:33:17.639	2026-10-13 17:33:17.639	\N
960	9	1107	الديكورات والتركيبات	Decorations & Installations	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:33:17.65	2026-10-13 17:33:17.65	\N
961	9	1108	ماكينات ومعدات تشغيل	Operating Machines	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:33:17.655	2026-10-13 17:33:17.655	\N
962	9	1109	مجمع إهلاك الأصول الثابتة	Accumulated Depreciation	الأصول	الأصول الثابتة	\N	دائن	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:33:17.663	2026-10-13 17:33:17.663	\N
963	9	1201	النقدية وما في حكمها	Cash & Cash Equivalents	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-13 17:33:17.691	2026-10-13 17:33:17.691	\N
964	9	1202	البنوك والمحافظ المالية	Banks & E-Wallets	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-13 17:33:17.702	2026-10-13 17:33:17.702	\N
965	9	1203	أوراق القبض (شيكات تحت التحصيل)	Notes Receivable	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	3	12	f	t	t	0.00	2026-10-13 17:33:17.709	2026-10-13 17:33:17.709	\N
966	9	1204	المخزون السلعي	Inventory	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-13 17:33:17.715	2026-10-13 17:33:17.715	\N
967	9	1205	العملاء (حساب المراقبة)	Accounts Receivable (Control)	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-13 17:33:17.722	2026-10-13 17:33:17.722	\N
968	9	1206	أرصدة مدينة أخرى	Other Debit Balances	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-13 17:33:17.73	2026-10-13 17:33:17.73	\N
969	9	2101	الموردين (حساب المراقبة)	Accounts Payable (Control)	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	3	21	t	t	t	0.00	2026-10-13 17:33:17.741	2026-10-13 17:33:17.741	\N
970	9	2102	أوراق الدفع (شيكات تحت الصرف)	Notes Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	f	t	t	0.00	2026-10-13 17:33:17.763	2026-10-13 17:33:17.763	\N
971	9	2103	مصروفات مستحقة	Accrued Expenses	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	t	t	t	0.00	2026-10-13 17:33:17.779	2026-10-13 17:33:17.779	\N
972	9	2104	أرصدة دائنة أخرى والضرائب	Other Creditors & Taxes	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	t	t	t	0.00	2026-10-13 17:33:17.783	2026-10-13 17:33:17.783	\N
973	9	5106	تغير مخزون آخر الفترة	Periodic Inventory Change	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 17:33:17.788	2026-10-13 17:33:17.788	\N
974	9	120102	الخزينة الفرعية	Sub Safe	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	4	1201	f	t	t	0.00	2026-10-13 17:33:17.796	2026-10-13 17:33:17.796	\N
975	9	120103	عهد نقدية مؤقتة	Petty Cash	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	4	1201	f	t	t	0.00	2026-10-13 17:33:17.807	2026-10-13 17:33:17.807	\N
976	9	120201	الحسابات الجارية بالبنوك	Bank Current Accounts	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-13 17:33:17.811	2026-10-13 17:33:17.811	\N
977	9	120202	حسابات التوفير والودائع	Savings & Deposits	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-13 17:33:17.817	2026-10-13 17:33:17.817	\N
978	9	120203	المحافظ الإلكترونية والمدفوعات الرقمية	Digital Wallets & Cash	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-13 17:33:17.823	2026-10-13 17:33:17.823	\N
979	9	120204	حساب الهيئة القومية للبريد	Postal Account	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-13 17:33:17.831	2026-10-13 17:33:17.831	\N
980	9	120401	مخزون بضاعة تامة الصنع	Finished Goods Inventory	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	4	1204	f	t	t	0.00	2026-10-13 17:33:17.838	2026-10-13 17:33:17.838	\N
981	9	120402	مخزون خامات ومواد أولية	Raw Materials Inventory	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	4	1204	f	t	t	0.00	2026-10-13 17:33:17.888	2026-10-13 17:33:17.888	\N
982	9	120403	مخزون مهمات وقطع غيار	Spare Parts & Supplies	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	4	1204	f	t	t	0.00	2026-10-13 17:33:17.894	2026-10-13 17:33:17.894	\N
983	9	120501	عملاء محليون	Local Customers	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	4	1205	f	t	t	0.00	2026-10-13 17:33:17.898	2026-10-13 17:33:17.898	\N
984	9	120502	عملاء تصدير وخارجيون	Foreign Customers	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	4	1205	f	t	t	0.00	2026-10-13 17:33:17.907	2026-10-13 17:33:17.907	\N
985	9	120503	مبيعات نقدية (عميل نقدي)	Cash Customers	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	4	1205	f	t	t	0.00	2026-10-13 17:33:17.917	2026-10-13 17:33:17.917	\N
986	9	120601	إيراد مستحق	Accrued Revenues	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-13 17:33:17.929	2026-10-13 17:33:17.929	\N
987	9	120602	مصروف مدفوع مقدماً	Prepaid Expenses	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-13 17:33:17.934	2026-10-13 17:33:17.934	\N
988	9	120603	تأمينات لدى الغير	Deposits with Others	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-13 17:33:17.941	2026-10-13 17:33:17.941	\N
989	9	120604	سلف وذمم الموظفين	Employee Advances	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-13 17:33:17.945	2026-10-13 17:33:17.945	\N
990	9	120605	مدينون متنوعون	Miscellaneous Debtors	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-13 17:33:17.953	2026-10-13 17:33:17.953	\N
991	9	210101	موردون محليون	Local Suppliers	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	4	2101	f	t	t	0.00	2026-10-13 17:33:17.974	2026-10-13 17:33:17.974	\N
992	9	210102	موردون خارجيون	Foreign Suppliers	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	4	2101	f	t	t	0.00	2026-10-13 17:33:17.997	2026-10-13 17:33:17.997	\N
993	9	210103	مشتريات نقدية (مورد نقدي)	Cash Purchases (Cash Supplier)	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	4	2101	f	t	t	0.00	2026-10-13 17:33:18.008	2026-10-13 17:33:18.008	\N
994	9	210301	مرتبات وأجور مستحقة	Accrued Salaries	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2103	f	t	t	0.00	2026-10-13 17:33:18.013	2026-10-13 17:33:18.013	\N
995	9	210302	إيجارات مستحقة	Accrued Rent	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2103	f	t	t	0.00	2026-10-13 17:33:18.018	2026-10-13 17:33:18.018	\N
996	9	210401	مصلحة الضرائب - ضريبة القيمة المضافة	VAT Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-13 17:33:18.023	2026-10-13 17:33:18.023	\N
997	9	210402	مصلحة الضرائب - كسب العمل	Payroll Tax Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-13 17:33:18.027	2026-10-13 17:33:18.027	\N
998	9	210403	الهيئة القومية للتأمينات الاجتماعية	Social Insurance Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-13 17:33:18.031	2026-10-13 17:33:18.031	\N
999	9	210404	دائنون متنوعون	Miscellaneous Creditors	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-13 17:33:18.036	2026-10-13 17:33:18.036	\N
1000	9	120101	الخزينة الرئيسية	Main Safe	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	4	1201	f	t	t	0.00	2026-10-13 17:33:18.043	2026-10-13 17:33:18.043	\N
1001	10	2	الخصوم	Liabilities	الخصوم	\N	\N	دائن	قائمة المركز المالي	1	\N	t	t	t	0.00	2026-10-13 17:34:54.226	2026-10-13 17:34:54.226	\N
1002	10	3	حقوق الملكية	Equity	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	1	\N	t	t	t	0.00	2026-10-13 17:34:54.237	2026-10-13 17:34:54.237	\N
1003	10	4	الإيرادات	Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	1	\N	t	t	t	0.00	2026-10-13 17:34:54.241	2026-10-13 17:34:54.241	\N
1004	10	5	المصروفات	Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	1	\N	t	t	t	0.00	2026-10-13 17:34:54.248	2026-10-13 17:34:54.248	\N
1005	10	1	الأصول	Assets	الأصول	\N	\N	مدين	قائمة المركز المالي	1	\N	t	t	t	0.00	2026-10-13 17:34:54.253	2026-10-13 17:34:54.253	\N
1006	10	33	الاحتياطيات	Reserves	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	t	t	t	0.00	2026-10-13 17:34:54.258	2026-10-13 17:34:54.258	\N
1007	10	34	الأرباح المحتجزة / المرحلة	Retained Earnings	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	f	t	t	0.00	2026-10-13 17:34:54.263	2026-10-13 17:34:54.263	\N
1008	10	35	أرباح (خسائر) العام الحالي	Current Year Profit / Loss	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	f	t	t	0.00	2026-10-13 17:34:54.268	2026-10-13 17:34:54.268	\N
1009	10	41	إيرادات النشاط الرئيسي	Operating Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	2	4	t	t	t	0.00	2026-10-13 17:34:54.275	2026-10-13 17:34:54.275	\N
1010	10	42	إيرادات أخرى متنوعة	Other Revenues	الإيرادات	\N	\N	دائن	قائمة الدخل	2	4	t	t	t	0.00	2026-10-13 17:34:54.28	2026-10-13 17:34:54.28	\N
1011	10	51	تكلفة النشاط والمبيعات	Cost of Goods Sold (COGS)	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-13 17:34:54.285	2026-10-13 17:34:54.285	\N
1012	10	52	مصاريف البيع والتسويق	Selling & Marketing Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-13 17:34:54.29	2026-10-13 17:34:54.29	\N
1013	10	53	مصروفات إدارية وعمومية	General & Administrative Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-13 17:34:54.295	2026-10-13 17:34:54.295	\N
1014	10	54	مصروفات التشغيل والإنتاج	Operating & Production Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-13 17:34:54.299	2026-10-13 17:34:54.299	\N
1015	10	12	الأصول المتداولة	Current Assets	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	2	1	t	t	t	0.00	2026-10-13 17:34:54.305	2026-10-13 17:34:54.305	\N
1016	10	11	الأصول الثابتة	Fixed Assets	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	2	1	t	t	t	0.00	2026-10-13 17:34:54.311	2026-10-13 17:34:54.311	\N
1017	10	21	الخصوم المتداولة	Current Liabilities	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	2	2	t	t	t	0.00	2026-10-13 17:34:54.315	2026-10-13 17:34:54.315	\N
1018	10	22	الخصوم طويلة الأجل	Long-term Liabilities	الخصوم	الخصوم طويلة الأجل	\N	دائن	قائمة المركز المالي	2	2	t	t	t	0.00	2026-10-13 17:34:54.32	2026-10-13 17:34:54.32	\N
1019	10	31	رأس المال	Capital	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	f	t	t	0.00	2026-10-13 17:34:54.324	2026-10-13 17:34:54.324	\N
1020	10	32	جاري الشركاء / صاحب المنشأة	Partners' Current Accounts	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	t	t	t	0.00	2026-10-13 17:34:54.329	2026-10-13 17:34:54.329	\N
1021	10	2105	قروض وتسهيلات قصيرة الأجل	Short-term Loans	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	f	t	t	0.00	2026-10-13 17:34:54.336	2026-10-13 17:34:54.336	\N
1022	10	2201	قروض بنكية طويلة الأجل	Long-term Bank Loans	الخصوم	الخصوم طويلة الأجل	\N	دائن	قائمة المركز المالي	3	22	f	t	t	0.00	2026-10-13 17:34:54.347	2026-10-13 17:34:54.347	\N
1023	10	3201	جاري الشريك الرئيسي	Main Partner Current Account	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	3	32	f	t	t	0.00	2026-10-13 17:34:54.354	2026-10-13 17:34:54.354	\N
1024	10	3301	الاحتياطي القانوني	Legal Reserve	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	3	33	f	t	t	0.00	2026-10-13 17:34:54.366	2026-10-13 17:34:54.366	\N
1025	10	3302	الاحتياطي العام	General Reserve	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	3	33	f	t	t	0.00	2026-10-13 17:34:54.372	2026-10-13 17:34:54.372	\N
1026	10	4101	إيراد المبيعات	Sales Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	3	41	f	t	t	0.00	2026-10-13 17:34:54.376	2026-10-13 17:34:54.376	\N
1027	10	4102	إيراد تقديم خدمات	Services Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	3	41	f	t	t	0.00	2026-10-13 17:34:54.38	2026-10-13 17:34:54.38	\N
1028	10	4103	مردودات ومسموحات المبيعات	Sales Returns & Allowances	الإيرادات	\N	\N	مدين	قائمة الدخل	3	41	f	t	t	0.00	2026-10-13 17:34:54.384	2026-10-13 17:34:54.384	\N
1029	10	4104	الخصم المسموح به	Sales Discounts Allowed	الإيرادات	\N	\N	مدين	قائمة الدخل	3	41	f	t	t	0.00	2026-10-13 17:34:54.39	2026-10-13 17:34:54.39	\N
1030	10	4201	أرباح بيع أصول ثابتة	Gain on Sale of Assets	الإيرادات	\N	\N	دائن	قائمة الدخل	3	42	f	t	t	0.00	2026-10-13 17:34:54.396	2026-10-13 17:34:54.396	\N
1031	10	4202	إيرادات استثمارات وفوائد بنكية	Interest & Investment Income	الإيرادات	\N	\N	دائن	قائمة الدخل	3	42	f	t	t	0.00	2026-10-13 17:34:54.403	2026-10-13 17:34:54.403	\N
1032	10	4203	إيرادات عرضية ومتنوعة	Miscellaneous Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	3	42	f	t	t	0.00	2026-10-13 17:34:54.412	2026-10-13 17:34:54.412	\N
1033	10	5101	المشتريات	Purchases	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 17:34:54.416	2026-10-13 17:34:54.416	\N
1034	10	5102	مصاريف نقل وشحن المشتريات (نولون)	Freight-In Purchases	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 17:34:54.433	2026-10-13 17:34:54.433	\N
1035	10	5103	جمارك ورسوم استيراد	Customs & Import Duties	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 17:34:54.44	2026-10-13 17:34:54.44	\N
1036	10	5104	مردودات ومسموحات المشتريات	Purchases Returns & Allowances	المصروفات	\N	\N	دائن	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 17:34:54.445	2026-10-13 17:34:54.445	\N
1037	10	5105	الخصم المكتسب	Purchases Discounts Received	المصروفات	\N	\N	دائن	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 17:34:54.449	2026-10-13 17:34:54.449	\N
1038	10	5201	حملات الدعاية والتسويق الرقمي	Marketing & Digital Ads	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-13 17:34:54.455	2026-10-13 17:34:54.455	\N
1039	10	5202	رواتب وعمولات فريق المبيعات	Sales Salaries & Commissions	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-13 17:34:54.461	2026-10-13 17:34:54.461	\N
1040	10	5203	مصاريف شحن وتوصيل المبيعات	Delivery & Shipping Out	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-13 17:34:54.466	2026-10-13 17:34:54.466	\N
1041	10	5204	مواد تعبئة وتغليف	Packaging Materials	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-13 17:34:54.469	2026-10-13 17:34:54.469	\N
1042	10	5205	إيجار معارض ومنافذ بيع	Showroom Rent	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-13 17:34:54.475	2026-10-13 17:34:54.475	\N
1043	10	5301	الأجور والرواتب الإدارية	Administrative Salaries	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:34:54.479	2026-10-13 17:34:54.479	\N
1044	10	5302	إيجار المقرات الإدارية	Office Rent	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:34:54.485	2026-10-13 17:34:54.485	\N
1045	10	5303	كهرباء ومياه وغاز	Utilities (Electricity & Water)	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:34:54.491	2026-10-13 17:34:54.491	\N
1046	10	5304	تليفونات وإنترنت واشتراكات رقمية	Telephone & Internet	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:34:54.496	2026-10-13 17:34:54.496	\N
1047	10	5305	أدوات مكتبية ومطبوعات ورقية	Stationery & Printing	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:34:54.502	2026-10-13 17:34:54.502	\N
1048	10	5306	مصروفات ضيافة وبوفيه ونظافة	Hospitality & Cleaning	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:34:54.506	2026-10-13 17:34:54.506	\N
1049	10	5307	مصروفات وعمولات بنكية	Bank Charges & Fees	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:34:54.51	2026-10-13 17:34:54.51	\N
1050	10	5309	استشارات قانونية ومحاسبية وتدقيق	Legal & Accounting Consultations	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:34:54.515	2026-10-13 17:34:54.515	\N
1051	10	5310	إصلاحات وصيانة دورية عامة	Repairs & Maintenance	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:34:54.524	2026-10-13 17:34:54.524	\N
1052	10	5311	انتقالات وسفريات ومحروقات سيارات	Transportation & Fuel	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:34:54.527	2026-10-13 17:34:54.527	\N
1053	10	5312	تأمينات اجتماعية - حصة المنشأة	Company Social Insurance	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:34:54.53	2026-10-13 17:34:54.53	\N
1054	10	5313	قسط إهلاك الأصول الثابتة	Depreciation Expense	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:34:54.534	2026-10-13 17:34:54.534	\N
1055	10	5314	ديون معدومة	Bad Debts	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:34:54.538	2026-10-13 17:34:54.538	\N
1056	10	5315	رسوم وغرامات حكومية وتراخيص	Government Licenses & Fees	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:34:54.543	2026-10-13 17:34:54.543	\N
1057	10	5316	مصروفات إدارية ونثرية متنوعة	Miscellaneous Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:34:54.55	2026-10-13 17:34:54.55	\N
1058	10	5401	أجور ومرتبات عمال التشغيل والإنتاج	Factory Labor Wages	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 17:34:54.555	2026-10-13 17:34:54.555	\N
1059	10	5402	إيجار المصنع والورش ومواقع التشغيل	Factory & Workshop Rent	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 17:34:54.562	2026-10-13 17:34:54.562	\N
1060	10	5403	كهرباء وقوى محركة للمصنع والآلات	Industrial Power & Electricity	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 17:34:54.566	2026-10-13 17:34:54.566	\N
1061	10	5404	زيوت ووقود وصيانة آلات الإنتاج	Machine Oil, Fuel & Maintenance	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 17:34:54.57	2026-10-13 17:34:54.57	\N
1062	10	5405	تشغيل وتصنيع خارجي لدى الغير	Subcontracting & External Processing	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 17:34:54.574	2026-10-13 17:34:54.574	\N
1063	10	5406	مهمات وأدوات أمن صناعي وسلامة	Safety & Industrial Supplies	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 17:34:54.578	2026-10-13 17:34:54.578	\N
1064	10	5308	اشتراك برامج وحلول سحابية	Software & Cloud Subscriptions	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 17:34:54.582	2026-10-13 17:34:54.582	\N
1065	10	1101	الأراضي	Lands	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:34:54.586	2026-10-13 17:34:54.586	\N
1066	10	1102	المباني والإنشاءات	Buildings	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:34:54.591	2026-10-13 17:34:54.591	\N
1067	10	1103	الآلات والمعدات	Machinery & Equipment	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:34:54.595	2026-10-13 17:34:54.595	\N
1068	10	1104	السيارات ووسائل النقل	Vehicles	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:34:54.6	2026-10-13 17:34:54.6	\N
1069	10	1105	الأثاث والتجهيزات المكتبية	Furniture & Fixtures	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:34:54.605	2026-10-13 17:34:54.605	\N
1070	10	1106	أجهزة الكمبيوتر والبرمجيات	Computers & IT Equipment	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:34:54.61	2026-10-13 17:34:54.61	\N
1071	10	1107	الديكورات والتركيبات	Decorations & Installations	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:34:54.616	2026-10-13 17:34:54.616	\N
1072	10	1108	ماكينات ومعدات تشغيل	Operating Machines	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:34:54.622	2026-10-13 17:34:54.622	\N
1073	10	1109	مجمع إهلاك الأصول الثابتة	Accumulated Depreciation	الأصول	الأصول الثابتة	\N	دائن	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 17:34:54.628	2026-10-13 17:34:54.628	\N
1074	10	1201	النقدية وما في حكمها	Cash & Cash Equivalents	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-13 17:34:54.636	2026-10-13 17:34:54.636	\N
1075	10	1202	البنوك والمحافظ المالية	Banks & E-Wallets	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-13 17:34:54.641	2026-10-13 17:34:54.641	\N
1076	10	1203	أوراق القبض (شيكات تحت التحصيل)	Notes Receivable	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	3	12	f	t	t	0.00	2026-10-13 17:34:54.646	2026-10-13 17:34:54.646	\N
1077	10	1204	المخزون السلعي	Inventory	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-13 17:34:54.65	2026-10-13 17:34:54.65	\N
1078	10	1205	العملاء (حساب المراقبة)	Accounts Receivable (Control)	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-13 17:34:54.656	2026-10-13 17:34:54.656	\N
1079	10	1206	أرصدة مدينة أخرى	Other Debit Balances	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-13 17:34:54.661	2026-10-13 17:34:54.661	\N
1080	10	2101	الموردين (حساب المراقبة)	Accounts Payable (Control)	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	3	21	t	t	t	0.00	2026-10-13 17:34:54.665	2026-10-13 17:34:54.665	\N
1081	10	2102	أوراق الدفع (شيكات تحت الصرف)	Notes Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	f	t	t	0.00	2026-10-13 17:34:54.671	2026-10-13 17:34:54.671	\N
1082	10	2103	مصروفات مستحقة	Accrued Expenses	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	t	t	t	0.00	2026-10-13 17:34:54.676	2026-10-13 17:34:54.676	\N
1083	10	2104	أرصدة دائنة أخرى والضرائب	Other Creditors & Taxes	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	t	t	t	0.00	2026-10-13 17:34:54.686	2026-10-13 17:34:54.686	\N
1084	10	5106	تغير مخزون آخر الفترة	Periodic Inventory Change	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 17:34:54.707	2026-10-13 17:34:54.707	\N
1085	10	120102	الخزينة الفرعية	Sub Safe	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	4	1201	f	t	t	0.00	2026-10-13 17:34:54.711	2026-10-13 17:34:54.711	\N
1086	10	120103	عهد نقدية مؤقتة	Petty Cash	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	4	1201	f	t	t	0.00	2026-10-13 17:34:54.719	2026-10-13 17:34:54.719	\N
1087	10	120201	الحسابات الجارية بالبنوك	Bank Current Accounts	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-13 17:34:54.725	2026-10-13 17:34:54.725	\N
1088	10	120202	حسابات التوفير والودائع	Savings & Deposits	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-13 17:34:54.736	2026-10-13 17:34:54.736	\N
1089	10	120203	المحافظ الإلكترونية والمدفوعات الرقمية	Digital Wallets & Cash	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-13 17:34:54.746	2026-10-13 17:34:54.746	\N
1090	10	120204	حساب الهيئة القومية للبريد	Postal Account	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-13 17:34:54.758	2026-10-13 17:34:54.758	\N
1091	10	120401	مخزون بضاعة تامة الصنع	Finished Goods Inventory	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	4	1204	f	t	t	0.00	2026-10-13 17:34:54.767	2026-10-13 17:34:54.767	\N
1092	10	120402	مخزون خامات ومواد أولية	Raw Materials Inventory	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	4	1204	f	t	t	0.00	2026-10-13 17:34:54.776	2026-10-13 17:34:54.776	\N
1093	10	120403	مخزون مهمات وقطع غيار	Spare Parts & Supplies	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	4	1204	f	t	t	0.00	2026-10-13 17:34:54.784	2026-10-13 17:34:54.784	\N
1094	10	120501	عملاء محليون	Local Customers	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	4	1205	f	t	t	0.00	2026-10-13 17:34:54.787	2026-10-13 17:34:54.787	\N
1095	10	120502	عملاء تصدير وخارجيون	Foreign Customers	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	4	1205	f	t	t	0.00	2026-10-13 17:34:54.79	2026-10-13 17:34:54.79	\N
1096	10	120503	مبيعات نقدية (عميل نقدي)	Cash Customers	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	4	1205	f	t	t	0.00	2026-10-13 17:34:54.795	2026-10-13 17:34:54.795	\N
1097	10	120601	إيراد مستحق	Accrued Revenues	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-13 17:34:54.8	2026-10-13 17:34:54.8	\N
1098	10	120602	مصروف مدفوع مقدماً	Prepaid Expenses	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-13 17:34:54.805	2026-10-13 17:34:54.805	\N
1099	10	120603	تأمينات لدى الغير	Deposits with Others	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-13 17:34:54.809	2026-10-13 17:34:54.809	\N
1100	10	120604	سلف وذمم الموظفين	Employee Advances	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-13 17:34:54.814	2026-10-13 17:34:54.814	\N
1101	10	120605	مدينون متنوعون	Miscellaneous Debtors	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-13 17:34:54.819	2026-10-13 17:34:54.819	\N
1102	10	210101	موردون محليون	Local Suppliers	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	4	2101	f	t	t	0.00	2026-10-13 17:34:54.825	2026-10-13 17:34:54.825	\N
1103	10	210102	موردون خارجيون	Foreign Suppliers	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	4	2101	f	t	t	0.00	2026-10-13 17:34:54.829	2026-10-13 17:34:54.829	\N
1104	10	210103	مشتريات نقدية (مورد نقدي)	Cash Purchases (Cash Supplier)	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	4	2101	f	t	t	0.00	2026-10-13 17:34:54.84	2026-10-13 17:34:54.84	\N
1105	10	210301	مرتبات وأجور مستحقة	Accrued Salaries	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2103	f	t	t	0.00	2026-10-13 17:34:54.865	2026-10-13 17:34:54.865	\N
1106	10	210302	إيجارات مستحقة	Accrued Rent	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2103	f	t	t	0.00	2026-10-13 17:34:54.876	2026-10-13 17:34:54.876	\N
1107	10	210401	مصلحة الضرائب - ضريبة القيمة المضافة	VAT Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-13 17:34:54.881	2026-10-13 17:34:54.881	\N
1108	10	210402	مصلحة الضرائب - كسب العمل	Payroll Tax Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-13 17:34:54.888	2026-10-13 17:34:54.888	\N
1109	10	210403	الهيئة القومية للتأمينات الاجتماعية	Social Insurance Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-13 17:34:54.892	2026-10-13 17:34:54.892	\N
1110	10	210404	دائنون متنوعون	Miscellaneous Creditors	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-13 17:34:54.896	2026-10-13 17:34:54.896	\N
1111	10	120101	الخزينة الرئيسية	Main Safe	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	4	1201	f	t	t	0.00	2026-10-13 17:34:54.9	2026-10-13 17:34:54.9	\N
1112	19	2	الخصوم	Liabilities	الخصوم	\N	\N	دائن	قائمة المركز المالي	1	\N	t	t	t	0.00	2026-10-13 21:37:06.584	2026-10-13 21:37:06.584	\N
1113	19	3	حقوق الملكية	Equity	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	1	\N	t	t	t	0.00	2026-10-13 21:37:06.602	2026-10-13 21:37:06.602	\N
1114	19	4	الإيرادات	Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	1	\N	t	t	t	0.00	2026-10-13 21:37:06.614	2026-10-13 21:37:06.614	\N
1115	19	5	المصروفات	Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	1	\N	t	t	t	0.00	2026-10-13 21:37:06.629	2026-10-13 21:37:06.629	\N
1116	19	1	الأصول	Assets	الأصول	\N	\N	مدين	قائمة المركز المالي	1	\N	t	t	t	0.00	2026-10-13 21:37:06.643	2026-10-13 21:37:06.643	\N
1117	19	33	الاحتياطيات	Reserves	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	t	t	t	0.00	2026-10-13 21:37:06.652	2026-10-13 21:37:06.652	\N
1118	19	34	الأرباح المحتجزة / المرحلة	Retained Earnings	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	f	t	t	0.00	2026-10-13 21:37:06.657	2026-10-13 21:37:06.657	\N
1119	19	35	أرباح (خسائر) العام الحالي	Current Year Profit / Loss	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	f	t	t	0.00	2026-10-13 21:37:06.663	2026-10-13 21:37:06.663	\N
1120	19	41	إيرادات النشاط الرئيسي	Operating Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	2	4	t	t	t	0.00	2026-10-13 21:37:06.668	2026-10-13 21:37:06.668	\N
1121	19	42	إيرادات أخرى متنوعة	Other Revenues	الإيرادات	\N	\N	دائن	قائمة الدخل	2	4	t	t	t	0.00	2026-10-13 21:37:06.679	2026-10-13 21:37:06.679	\N
1122	19	51	تكلفة النشاط والمبيعات	Cost of Goods Sold (COGS)	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-13 21:37:06.684	2026-10-13 21:37:06.684	\N
1123	19	52	مصاريف البيع والتسويق	Selling & Marketing Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-13 21:37:06.69	2026-10-13 21:37:06.69	\N
1124	19	53	مصروفات إدارية وعمومية	General & Administrative Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-13 21:37:06.697	2026-10-13 21:37:06.697	\N
1125	19	54	مصروفات التشغيل والإنتاج	Operating & Production Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	2	5	t	t	t	0.00	2026-10-13 21:37:06.701	2026-10-13 21:37:06.701	\N
1126	19	12	الأصول المتداولة	Current Assets	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	2	1	t	t	t	0.00	2026-10-13 21:37:06.706	2026-10-13 21:37:06.706	\N
1127	19	11	الأصول الثابتة	Fixed Assets	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	2	1	t	t	t	0.00	2026-10-13 21:37:06.712	2026-10-13 21:37:06.712	\N
1128	19	21	الخصوم المتداولة	Current Liabilities	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	2	2	t	t	t	0.00	2026-10-13 21:37:06.723	2026-10-13 21:37:06.723	\N
1129	19	22	الخصوم طويلة الأجل	Long-term Liabilities	الخصوم	الخصوم طويلة الأجل	\N	دائن	قائمة المركز المالي	2	2	t	t	t	0.00	2026-10-13 21:37:06.729	2026-10-13 21:37:06.729	\N
1130	19	31	رأس المال	Capital	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	f	t	t	0.00	2026-10-13 21:37:06.735	2026-10-13 21:37:06.735	\N
1131	19	32	جاري الشركاء / صاحب المنشأة	Partners' Current Accounts	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	2	3	t	t	t	0.00	2026-10-13 21:37:06.747	2026-10-13 21:37:06.747	\N
1132	19	2105	قروض وتسهيلات قصيرة الأجل	Short-term Loans	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	f	t	t	0.00	2026-10-13 21:37:06.751	2026-10-13 21:37:06.751	\N
1133	19	2201	قروض بنكية طويلة الأجل	Long-term Bank Loans	الخصوم	الخصوم طويلة الأجل	\N	دائن	قائمة المركز المالي	3	22	f	t	t	0.00	2026-10-13 21:37:06.758	2026-10-13 21:37:06.758	\N
1134	19	3201	جاري الشريك الرئيسي	Main Partner Current Account	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	3	32	f	t	t	0.00	2026-10-13 21:37:06.764	2026-10-13 21:37:06.764	\N
1135	19	3301	الاحتياطي القانوني	Legal Reserve	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	3	33	f	t	t	0.00	2026-10-13 21:37:06.77	2026-10-13 21:37:06.77	\N
1136	19	3302	الاحتياطي العام	General Reserve	حقوق الملكية	\N	\N	دائن	قائمة المركز المالي	3	33	f	t	t	0.00	2026-10-13 21:37:06.775	2026-10-13 21:37:06.775	\N
1137	19	4101	إيراد المبيعات	Sales Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	3	41	f	t	t	0.00	2026-10-13 21:37:06.781	2026-10-13 21:37:06.781	\N
1138	19	4102	إيراد تقديم خدمات	Services Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	3	41	f	t	t	0.00	2026-10-13 21:37:06.787	2026-10-13 21:37:06.787	\N
1139	19	4103	مردودات ومسموحات المبيعات	Sales Returns & Allowances	الإيرادات	\N	\N	مدين	قائمة الدخل	3	41	f	t	t	0.00	2026-10-13 21:37:06.793	2026-10-13 21:37:06.793	\N
1140	19	4104	الخصم المسموح به	Sales Discounts Allowed	الإيرادات	\N	\N	مدين	قائمة الدخل	3	41	f	t	t	0.00	2026-10-13 21:37:06.805	2026-10-13 21:37:06.805	\N
1141	19	4201	أرباح بيع أصول ثابتة	Gain on Sale of Assets	الإيرادات	\N	\N	دائن	قائمة الدخل	3	42	f	t	t	0.00	2026-10-13 21:37:06.81	2026-10-13 21:37:06.81	\N
1142	19	4202	إيرادات استثمارات وفوائد بنكية	Interest & Investment Income	الإيرادات	\N	\N	دائن	قائمة الدخل	3	42	f	t	t	0.00	2026-10-13 21:37:06.826	2026-10-13 21:37:06.826	\N
1143	19	4203	إيرادات عرضية ومتنوعة	Miscellaneous Revenue	الإيرادات	\N	\N	دائن	قائمة الدخل	3	42	f	t	t	0.00	2026-10-13 21:37:06.831	2026-10-13 21:37:06.831	\N
1144	19	5101	المشتريات	Purchases	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 21:37:06.837	2026-10-13 21:37:06.837	\N
1145	19	5102	مصاريف نقل وشحن المشتريات (نولون)	Freight-In Purchases	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 21:37:06.843	2026-10-13 21:37:06.843	\N
1146	19	5103	جمارك ورسوم استيراد	Customs & Import Duties	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 21:37:06.847	2026-10-13 21:37:06.847	\N
1147	19	5104	مردودات ومسموحات المشتريات	Purchases Returns & Allowances	المصروفات	\N	\N	دائن	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 21:37:06.852	2026-10-13 21:37:06.852	\N
1148	19	5105	الخصم المكتسب	Purchases Discounts Received	المصروفات	\N	\N	دائن	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 21:37:06.863	2026-10-13 21:37:06.863	\N
1149	19	5201	حملات الدعاية والتسويق الرقمي	Marketing & Digital Ads	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-13 21:37:06.867	2026-10-13 21:37:06.867	\N
1150	19	5202	رواتب وعمولات فريق المبيعات	Sales Salaries & Commissions	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-13 21:37:06.872	2026-10-13 21:37:06.872	\N
1151	19	5203	مصاريف شحن وتوصيل المبيعات	Delivery & Shipping Out	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-13 21:37:06.877	2026-10-13 21:37:06.877	\N
1152	19	5204	مواد تعبئة وتغليف	Packaging Materials	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-13 21:37:06.882	2026-10-13 21:37:06.882	\N
1153	19	5205	إيجار معارض ومنافذ بيع	Showroom Rent	المصروفات	\N	\N	مدين	قائمة الدخل	3	52	f	t	t	0.00	2026-10-13 21:37:06.904	2026-10-13 21:37:06.904	\N
1154	19	5301	الأجور والرواتب الإدارية	Administrative Salaries	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 21:37:06.912	2026-10-13 21:37:06.912	\N
1155	19	5302	إيجار المقرات الإدارية	Office Rent	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 21:37:06.916	2026-10-13 21:37:06.916	\N
1156	19	5303	كهرباء ومياه وغاز	Utilities (Electricity & Water)	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 21:37:06.922	2026-10-13 21:37:06.922	\N
1157	19	5304	تليفونات وإنترنت واشتراكات رقمية	Telephone & Internet	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 21:37:06.932	2026-10-13 21:37:06.932	\N
1158	19	5305	أدوات مكتبية ومطبوعات ورقية	Stationery & Printing	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 21:37:06.938	2026-10-13 21:37:06.938	\N
1159	19	5306	مصروفات ضيافة وبوفيه ونظافة	Hospitality & Cleaning	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 21:37:06.949	2026-10-13 21:37:06.949	\N
1160	19	5307	مصروفات وعمولات بنكية	Bank Charges & Fees	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 21:37:06.958	2026-10-13 21:37:06.958	\N
1161	19	5309	استشارات قانونية ومحاسبية وتدقيق	Legal & Accounting Consultations	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 21:37:06.963	2026-10-13 21:37:06.963	\N
1162	19	5310	إصلاحات وصيانة دورية عامة	Repairs & Maintenance	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 21:37:06.968	2026-10-13 21:37:06.968	\N
1163	19	5311	انتقالات وسفريات ومحروقات سيارات	Transportation & Fuel	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 21:37:06.976	2026-10-13 21:37:06.976	\N
1164	19	5312	تأمينات اجتماعية - حصة المنشأة	Company Social Insurance	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 21:37:06.981	2026-10-13 21:37:06.981	\N
1165	19	5313	قسط إهلاك الأصول الثابتة	Depreciation Expense	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 21:37:07.008	2026-10-13 21:37:07.008	\N
1167	19	5315	رسوم وغرامات حكومية وتراخيص	Government Licenses & Fees	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 21:37:07.034	2026-10-13 21:37:07.034	\N
1168	19	5316	مصروفات إدارية ونثرية متنوعة	Miscellaneous Expenses	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 21:37:07.041	2026-10-13 21:37:07.041	\N
1169	19	5401	أجور ومرتبات عمال التشغيل والإنتاج	Factory Labor Wages	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 21:37:07.046	2026-10-13 21:37:07.046	\N
1170	19	5402	إيجار المصنع والورش ومواقع التشغيل	Factory & Workshop Rent	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 21:37:07.051	2026-10-13 21:37:07.051	\N
1171	19	5403	كهرباء وقوى محركة للمصنع والآلات	Industrial Power & Electricity	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 21:37:07.056	2026-10-13 21:37:07.056	\N
1172	19	5404	زيوت ووقود وصيانة آلات الإنتاج	Machine Oil, Fuel & Maintenance	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 21:37:07.061	2026-10-13 21:37:07.061	\N
1173	19	5405	تشغيل وتصنيع خارجي لدى الغير	Subcontracting & External Processing	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 21:37:07.068	2026-10-13 21:37:07.068	\N
1174	19	5406	مهمات وأدوات أمن صناعي وسلامة	Safety & Industrial Supplies	المصروفات	\N	\N	مدين	قائمة الدخل	3	54	f	t	t	0.00	2026-10-13 21:37:07.075	2026-10-13 21:37:07.075	\N
1175	19	5308	اشتراك برامج وحلول سحابية	Software & Cloud Subscriptions	المصروفات	\N	\N	مدين	قائمة الدخل	3	53	f	t	t	0.00	2026-10-13 21:37:07.081	2026-10-13 21:37:07.081	\N
1176	19	1101	الأراضي	Lands	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 21:37:07.087	2026-10-13 21:37:07.087	\N
1177	19	1102	المباني والإنشاءات	Buildings	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 21:37:07.094	2026-10-13 21:37:07.094	\N
1178	19	1103	الآلات والمعدات	Machinery & Equipment	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 21:37:07.099	2026-10-13 21:37:07.099	\N
1179	19	1104	السيارات ووسائل النقل	Vehicles	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 21:37:07.105	2026-10-13 21:37:07.105	\N
1180	19	1105	الأثاث والتجهيزات المكتبية	Furniture & Fixtures	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 21:37:07.113	2026-10-13 21:37:07.113	\N
1181	19	1106	أجهزة الكمبيوتر والبرمجيات	Computers & IT Equipment	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 21:37:07.119	2026-10-13 21:37:07.119	\N
1182	19	1107	الديكورات والتركيبات	Decorations & Installations	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 21:37:07.125	2026-10-13 21:37:07.125	\N
1183	19	1108	ماكينات ومعدات تشغيل	Operating Machines	الأصول	الأصول الثابتة	\N	مدين	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 21:37:07.13	2026-10-13 21:37:07.13	\N
1184	19	1109	مجمع إهلاك الأصول الثابتة	Accumulated Depreciation	الأصول	الأصول الثابتة	\N	دائن	قائمة المركز المالي	3	11	f	t	t	0.00	2026-10-13 21:37:07.134	2026-10-13 21:37:07.134	\N
1185	19	1201	النقدية وما في حكمها	Cash & Cash Equivalents	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-13 21:37:07.14	2026-10-13 21:37:07.14	\N
1186	19	1202	البنوك والمحافظ المالية	Banks & E-Wallets	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-13 21:37:07.147	2026-10-13 21:37:07.147	\N
1187	19	1203	أوراق القبض (شيكات تحت التحصيل)	Notes Receivable	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	3	12	f	t	t	0.00	2026-10-13 21:37:07.157	2026-10-13 21:37:07.157	\N
1188	19	1204	المخزون السلعي	Inventory	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-13 21:37:07.164	2026-10-13 21:37:07.164	\N
1189	19	1205	العملاء (حساب المراقبة)	Accounts Receivable (Control)	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-13 21:37:07.17	2026-10-13 21:37:07.17	\N
1190	19	1206	أرصدة مدينة أخرى	Other Debit Balances	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	3	12	t	t	t	0.00	2026-10-13 21:37:07.175	2026-10-13 21:37:07.175	\N
1191	19	2101	الموردين (حساب المراقبة)	Accounts Payable (Control)	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	3	21	t	t	t	0.00	2026-10-13 21:37:07.183	2026-10-13 21:37:07.183	\N
1192	19	2102	أوراق الدفع (شيكات تحت الصرف)	Notes Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	f	t	t	0.00	2026-10-13 21:37:07.189	2026-10-13 21:37:07.189	\N
1193	19	2103	مصروفات مستحقة	Accrued Expenses	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	t	t	t	0.00	2026-10-13 21:37:07.193	2026-10-13 21:37:07.193	\N
1194	19	2104	أرصدة دائنة أخرى والضرائب	Other Creditors & Taxes	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	3	21	t	t	t	0.00	2026-10-13 21:37:07.199	2026-10-13 21:37:07.199	\N
1195	19	5106	تغير مخزون آخر الفترة	Periodic Inventory Change	المصروفات	\N	\N	مدين	قائمة الدخل	3	51	f	t	t	0.00	2026-10-13 21:37:07.204	2026-10-13 21:37:07.204	\N
1196	19	120102	الخزينة الفرعية	Sub Safe	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	4	1201	f	t	t	0.00	2026-10-13 21:37:07.209	2026-10-13 21:37:07.209	\N
1197	19	120103	عهد نقدية مؤقتة	Petty Cash	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	4	1201	f	t	t	0.00	2026-10-13 21:37:07.216	2026-10-13 21:37:07.216	\N
1198	19	120201	الحسابات الجارية بالبنوك	Bank Current Accounts	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-13 21:37:07.222	2026-10-13 21:37:07.222	\N
1199	19	120202	حسابات التوفير والودائع	Savings & Deposits	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-13 21:37:07.23	2026-10-13 21:37:07.23	\N
1200	19	120203	المحافظ الإلكترونية والمدفوعات الرقمية	Digital Wallets & Cash	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-13 21:37:07.236	2026-10-13 21:37:07.236	\N
1201	19	120204	حساب الهيئة القومية للبريد	Postal Account	الأصول	الأصول المتداولة	البنوك	مدين	قائمة المركز المالي	4	1202	f	t	t	0.00	2026-10-13 21:37:07.243	2026-10-13 21:37:07.243	\N
1202	19	120401	مخزون بضاعة تامة الصنع	Finished Goods Inventory	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	4	1204	f	t	t	0.00	2026-10-13 21:37:07.252	2026-10-13 21:37:07.252	\N
1203	19	120402	مخزون خامات ومواد أولية	Raw Materials Inventory	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	4	1204	f	t	t	0.00	2026-10-13 21:37:07.259	2026-10-13 21:37:07.259	\N
1204	19	120403	مخزون مهمات وقطع غيار	Spare Parts & Supplies	الأصول	الأصول المتداولة	المخزون	مدين	قائمة المركز المالي	4	1204	f	t	t	0.00	2026-10-13 21:37:07.263	2026-10-13 21:37:07.263	\N
1205	19	120501	عملاء محليون	Local Customers	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	4	1205	f	t	t	0.00	2026-10-13 21:37:07.268	2026-10-13 21:37:07.268	\N
1206	19	120502	عملاء تصدير وخارجيون	Foreign Customers	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	4	1205	f	t	t	0.00	2026-10-13 21:37:07.273	2026-10-13 21:37:07.273	\N
1207	19	120503	مبيعات نقدية (عميل نقدي)	Cash Customers	الأصول	الأصول المتداولة	العملاء	مدين	قائمة المركز المالي	4	1205	f	t	t	0.00	2026-10-13 21:37:07.279	2026-10-13 21:37:07.279	\N
1208	19	120601	إيراد مستحق	Accrued Revenues	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-13 21:37:07.29	2026-10-13 21:37:07.29	\N
1209	19	120602	مصروف مدفوع مقدماً	Prepaid Expenses	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-13 21:37:07.296	2026-10-13 21:37:07.296	\N
1210	19	120603	تأمينات لدى الغير	Deposits with Others	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-13 21:37:07.306	2026-10-13 21:37:07.306	\N
1211	19	120604	سلف وذمم الموظفين	Employee Advances	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-13 21:37:07.325	2026-10-13 21:37:07.325	\N
1212	19	120605	مدينون متنوعون	Miscellaneous Debtors	الأصول	الأصول المتداولة	\N	مدين	قائمة المركز المالي	4	1206	f	t	t	0.00	2026-10-13 21:37:07.338	2026-10-13 21:37:07.338	\N
1213	19	210101	موردون محليون	Local Suppliers	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	4	2101	f	t	t	0.00	2026-10-13 21:37:07.342	2026-10-13 21:37:07.342	\N
1214	19	210102	موردون خارجيون	Foreign Suppliers	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	4	2101	f	t	t	0.00	2026-10-13 21:37:07.348	2026-10-13 21:37:07.348	\N
1215	19	210103	مشتريات نقدية (مورد نقدي)	Cash Purchases (Cash Supplier)	الخصوم	الخصوم المتداولة	الموردين	دائن	قائمة المركز المالي	4	2101	f	t	t	0.00	2026-10-13 21:37:07.353	2026-10-13 21:37:07.353	\N
1216	19	210301	مرتبات وأجور مستحقة	Accrued Salaries	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2103	f	t	t	0.00	2026-10-13 21:37:07.358	2026-10-13 21:37:07.358	\N
1217	19	210302	إيجارات مستحقة	Accrued Rent	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2103	f	t	t	0.00	2026-10-13 21:37:07.363	2026-10-13 21:37:07.363	\N
1218	19	210401	مصلحة الضرائب - ضريبة القيمة المضافة	VAT Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-13 21:37:07.369	2026-10-13 21:37:07.369	\N
1219	19	210402	مصلحة الضرائب - كسب العمل	Payroll Tax Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-13 21:37:07.375	2026-10-13 21:37:07.375	\N
1220	19	210403	الهيئة القومية للتأمينات الاجتماعية	Social Insurance Payable	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-13 21:37:07.387	2026-10-13 21:37:07.387	\N
1221	19	210404	دائنون متنوعون	Miscellaneous Creditors	الخصوم	الخصوم المتداولة	\N	دائن	قائمة المركز المالي	4	2104	f	t	t	0.00	2026-10-13 21:37:07.392	2026-10-13 21:37:07.392	\N
1222	19	120101	الخزينة الرئيسية	Main Safe	الأصول	الأصول المتداولة	النقدية بالصندوق	مدين	قائمة المركز المالي	4	1201	f	t	t	0.00	2026-10-13 21:37:07.397	2026-10-13 21:37:07.397	\N
1223	51	101	خزينة رئيسية	\N	الأصول	\N	\N	مدين	قائمة المركز المالي	4	\N	f	f	t	0.00	2026-10-15 03:57:41.709	2026-10-15 03:57:41.709	\N
1224	51	401	إيرادات مبيعات	\N	الإيرادات	\N	\N	دائن	قائمة الدخل	4	\N	f	f	t	0.00	2026-10-15 03:57:41.709	2026-10-15 03:57:41.709	\N
1225	52	101	خزينة رئيسية	\N	الأصول	\N	\N	مدين	قائمة المركز المالي	4	\N	f	f	t	0.00	2026-10-15 03:58:23.621	2026-10-15 03:58:23.621	\N
1226	52	401	إيرادات مبيعات	\N	الإيرادات	\N	\N	دائن	قائمة الدخل	4	\N	f	f	t	0.00	2026-10-15 03:58:23.621	2026-10-15 03:58:23.621	\N
1227	54	101	خزينة رئيسية	\N	الأصول	\N	\N	مدين	قائمة المركز المالي	4	\N	f	f	t	0.00	2026-10-15 03:58:59.579	2026-10-15 03:58:59.579	\N
1228	54	401	إيرادات مبيعات	\N	الإيرادات	\N	\N	دائن	قائمة الدخل	4	\N	f	f	t	0.00	2026-10-15 03:58:59.579	2026-10-15 03:58:59.579	\N
1229	55	101	خزينة رئيسية	\N	الأصول	\N	\N	مدين	قائمة المركز المالي	4	\N	f	f	t	0.00	2026-10-15 03:59:13.669	2026-10-15 03:59:13.669	\N
1230	55	401	إيرادات مبيعات	\N	الإيرادات	\N	\N	دائن	قائمة الدخل	4	\N	f	f	t	0.00	2026-10-15 03:59:13.669	2026-10-15 03:59:13.669	\N
1241	67	105	مخزون بضاعة	\N	الأصول	\N	\N	مدين	قائمة المركز المالي	4	\N	f	f	t	0.00	2026-10-16 08:24:17.985	2026-10-16 08:24:17.985	\N
1242	67	501	مشتريات بضاعة	\N	المصروفات	\N	\N	مدين	قائمة الدخل	4	\N	f	f	t	0.00	2026-10-16 08:24:17.985	2026-10-16 08:24:17.985	\N
1243	67	201	موردين محليين	\N	الخصوم	\N	\N	دائن	قائمة المركز المالي	4	\N	f	f	t	0.00	2026-10-16 08:24:17.985	2026-10-16 08:24:17.985	\N
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.companies (id, name, "taxNumber", "commercialReg", currency, "isDefault", "createdAt", "updatedAt", "closedThrough") FROM stdin;
1	شركة نموذجية للتجارة والصناعة (تجريبية)	100-200-300	45678	EGP	t	2026-09-20 21:42:07.147	2026-09-20 21:42:07.147	\N
51	شركة اختبار عكس القيود 1792036661493	\N	\N	EGP	t	2026-10-15 03:57:41.673	2026-10-15 03:57:41.673	\N
52	شركة اختبار عكس القيود 1792036703456	\N	\N	EGP	t	2026-10-15 03:58:23.593	2026-10-15 03:58:23.593	\N
53	شركة اختبار عكس القيود 1792036721708	\N	\N	EGP	t	2026-10-15 03:58:41.846	2026-10-15 03:58:41.846	\N
54	شركة اختبار عكس القيود 1792036739405	\N	\N	EGP	t	2026-10-15 03:58:59.551	2026-10-15 03:58:59.551	\N
55	شركة اختبار عكس القيود 1792036753506	\N	\N	EGP	t	2026-10-15 03:59:13.641	2026-10-15 03:59:13.641	\N
56	شركة اختبار عكس القيود 1792036767599	\N	\N	EGP	t	2026-10-15 03:59:27.844	2026-10-15 03:59:27.844	\N
2	شركة اختبار الجودة QA (شركة مستقلة)	\N	\N	EGP	f	2026-10-06 13:44:22.248	2026-10-06 14:10:50.984	2026-01-31
3	شركة اختبار الجودة QA (تشغيل 1791298756935)	\N	\N	EGP	f	2026-10-06 14:59:17.219	2026-10-06 14:59:23.815	2026-01-31
4	شركة اختبار الجودة QA (تشغيل 1791299089455)	\N	\N	EGP	f	2026-10-06 15:04:49.617	2026-10-06 15:04:54.069	2026-01-31
5	شركة اختبار الجودة QA (تشغيل 1791299442846)	\N	\N	EGP	f	2026-10-06 15:10:43.015	2026-10-06 15:10:47.451	2026-01-31
6	شركة اختبار القبول المعزولة (تشغيل 1791912317830)	\N	\N	EGP	f	2026-10-13 17:25:18.134	2026-10-13 17:25:18.134	\N
7	شركة اختبار القبول المعزولة (تشغيل 1791912624046)	\N	\N	EGP	f	2026-10-13 17:30:24.267	2026-10-13 17:30:24.267	\N
8	شركة اختبار القبول المعزولة (تشغيل 1791912682444)	\N	\N	EGP	f	2026-10-13 17:31:22.77	2026-10-13 17:31:22.77	\N
9	شركة اختبار القبول المعزولة (تشغيل 1791912796789)	\N	\N	EGP	f	2026-10-13 17:33:16.983	2026-10-13 17:33:16.983	\N
10	شركة اختبار القبول المعزولة (تشغيل 1791912894001)	\N	\N	EGP	f	2026-10-13 17:34:54.198	2026-10-13 17:34:54.198	\N
19	تدريب محمود — اختبار يدوي	\N	\N	EGP	f	2026-10-13 21:37:06.558	2026-10-13 21:37:06.558	\N
30	شركة فحص الصلاحيات أ (1791997061990)	\N	\N	EGP	t	2026-10-14 16:57:42.183	2026-10-14 16:57:42.183	\N
31	شركة فحص الصلاحيات ب (1791997061990)	\N	\N	EGP	t	2026-10-14 16:57:42.208	2026-10-14 16:57:42.208	\N
65	شركة اختبار فحص الصرف والمخازن 1792138916850	\N	\N	EGP	t	2026-10-16 08:21:57.07	2026-10-16 08:21:57.07	\N
67	شركة اختبار فحص الصرف والمخازن 1792139057677	\N	\N	EGP	t	2026-10-16 08:24:17.883	2026-10-16 08:24:17.883	\N
\.


--
-- Name: accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.accounts_id_seq', 1276, true);


--
-- Name: companies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.companies_id_seq', 83, true);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: FiscalPeriod FiscalPeriod_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FiscalPeriod"
    ADD CONSTRAINT "FiscalPeriod_pkey" PRIMARY KEY (id);


--
-- Name: InventoryClose InventoryClose_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."InventoryClose"
    ADD CONSTRAINT "InventoryClose_pkey" PRIMARY KEY (id);


--
-- Name: JournalEntry JournalEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."JournalEntry"
    ADD CONSTRAINT "JournalEntry_pkey" PRIMARY KEY (id);


--
-- Name: JournalLine JournalLine_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."JournalLine"
    ADD CONSTRAINT "JournalLine_pkey" PRIMARY KEY (id);


--
-- Name: LoginAttempt LoginAttempt_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LoginAttempt"
    ADD CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY (key);


--
-- Name: Register Register_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Register"
    ADD CONSTRAINT "Register_pkey" PRIMARY KEY (id);


--
-- Name: Sequence Sequence_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Sequence"
    ADD CONSTRAINT "Sequence_pkey" PRIMARY KEY ("companyId", key);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY ("tokenHash");


--
-- Name: StockMovement StockMovement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StockMovement"
    ADD CONSTRAINT "StockMovement_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: AuditLog_companyId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_companyId_createdAt_idx" ON public."AuditLog" USING btree ("companyId", "createdAt");


--
-- Name: FiscalPeriod_companyId_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "FiscalPeriod_companyId_name_key" ON public."FiscalPeriod" USING btree ("companyId", name);


--
-- Name: InventoryClose_companyId_date_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "InventoryClose_companyId_date_key" ON public."InventoryClose" USING btree ("companyId", date);


--
-- Name: JournalEntry_companyId_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "JournalEntry_companyId_number_key" ON public."JournalEntry" USING btree ("companyId", number);


--
-- Name: JournalEntry_companyId_requestKey_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "JournalEntry_companyId_requestKey_key" ON public."JournalEntry" USING btree ("companyId", "requestKey");


--
-- Name: JournalEntry_companyId_status_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JournalEntry_companyId_status_date_idx" ON public."JournalEntry" USING btree ("companyId", status, date);


--
-- Name: JournalEntry_id_companyId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "JournalEntry_id_companyId_key" ON public."JournalEntry" USING btree (id, "companyId");


--
-- Name: JournalEntry_reversalOf_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "JournalEntry_reversalOf_key" ON public."JournalEntry" USING btree ("reversalOf");


--
-- Name: JournalLine_companyId_accountCode_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JournalLine_companyId_accountCode_idx" ON public."JournalLine" USING btree ("companyId", "accountCode");


--
-- Name: JournalLine_companyId_costCenter_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JournalLine_companyId_costCenter_idx" ON public."JournalLine" USING btree ("companyId", "costCenter");


--
-- Name: JournalLine_companyId_party_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "JournalLine_companyId_party_idx" ON public."JournalLine" USING btree ("companyId", party);


--
-- Name: Register_companyId_kind_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Register_companyId_kind_code_key" ON public."Register" USING btree ("companyId", kind, code);


--
-- Name: Register_companyId_kind_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Register_companyId_kind_isActive_idx" ON public."Register" USING btree ("companyId", kind, "isActive");


--
-- Name: Register_id_companyId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Register_id_companyId_key" ON public."Register" USING btree (id, "companyId");


--
-- Name: Session_expiresAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Session_expiresAt_idx" ON public."Session" USING btree ("expiresAt");


--
-- Name: StockMovement_companyId_itemId_warehouse_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "StockMovement_companyId_itemId_warehouse_date_idx" ON public."StockMovement" USING btree ("companyId", "itemId", warehouse, date);


--
-- Name: StockMovement_companyId_requestKey_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "StockMovement_companyId_requestKey_key" ON public."StockMovement" USING btree ("companyId", "requestKey");


--
-- Name: User_companyId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "User_companyId_idx" ON public."User" USING btree ("companyId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_username_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);


--
-- Name: accounts_companyId_accountClass_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "accounts_companyId_accountClass_idx" ON public.accounts USING btree ("companyId", "accountClass");


--
-- Name: accounts_companyId_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "accounts_companyId_code_key" ON public.accounts USING btree ("companyId", code);


--
-- Name: accounts_companyId_level_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "accounts_companyId_level_idx" ON public.accounts USING btree ("companyId", level);


--
-- Name: accounts_companyId_parentCode_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "accounts_companyId_parentCode_idx" ON public.accounts USING btree ("companyId", "parentCode");


--
-- Name: JournalEntry journal_header_balance; Type: TRIGGER; Schema: public; Owner: -
--

CREATE CONSTRAINT TRIGGER journal_header_balance AFTER INSERT OR UPDATE ON public."JournalEntry" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.check_posted_entry_balance();


--
-- Name: JournalLine journal_line_balance; Type: TRIGGER; Schema: public; Owner: -
--

CREATE CONSTRAINT TRIGGER journal_line_balance AFTER INSERT OR DELETE OR UPDATE ON public."JournalLine" DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.check_posted_entry_balance();


--
-- Name: AuditLog AuditLog_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: FiscalPeriod FiscalPeriod_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."FiscalPeriod"
    ADD CONSTRAINT "FiscalPeriod_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: JournalEntry JournalEntry_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."JournalEntry"
    ADD CONSTRAINT "JournalEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: JournalLine JournalLine_companyId_accountCode_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."JournalLine"
    ADD CONSTRAINT "JournalLine_companyId_accountCode_fkey" FOREIGN KEY ("companyId", "accountCode") REFERENCES public.accounts("companyId", code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: JournalLine JournalLine_entryId_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."JournalLine"
    ADD CONSTRAINT "JournalLine_entryId_companyId_fkey" FOREIGN KEY ("entryId", "companyId") REFERENCES public."JournalEntry"(id, "companyId") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Register Register_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Register"
    ADD CONSTRAINT "Register_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Sequence Sequence_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Sequence"
    ADD CONSTRAINT "Sequence_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: StockMovement StockMovement_itemId_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."StockMovement"
    ADD CONSTRAINT "StockMovement_itemId_companyId_fkey" FOREIGN KEY ("itemId", "companyId") REFERENCES public."Register"(id, "companyId") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: User User_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: accounts accounts_companyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT "accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES public.companies(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: accounts accounts_companyId_parentCode_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT "accounts_companyId_parentCode_fkey" FOREIGN KEY ("companyId", "parentCode") REFERENCES public.accounts("companyId", code) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict H1UTaNgDjk2MonhpDRkAEsMDoidNltied5VtdfAVD2xauh6vpw3RSLmtHAY4FX9

