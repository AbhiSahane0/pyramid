--
-- PostgreSQL database dump
--

\restrict PARKIDyUFFJEkycoq5cFbnbLlmlMnDK9tpqLlOY8C6o8EfUrgH63DGSiyNPiVbM

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

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
-- Name: Priority; Type: TYPE; Schema: public; Owner: pyramid
--

CREATE TYPE public."Priority" AS ENUM (
    'NO_PRIORITY',
    'URGENT',
    'HIGH',
    'MEDIUM',
    'LOW'
);


ALTER TYPE public."Priority" OWNER TO pyramid;

--
-- Name: TaskStatus; Type: TYPE; Schema: public; Owner: pyramid
--

CREATE TYPE public."TaskStatus" AS ENUM (
    'BACKLOG',
    'TODO',
    'DOING',
    'COMPLETED',
    'ON_HOLD'
);


ALTER TYPE public."TaskStatus" OWNER TO pyramid;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Activity; Type: TABLE; Schema: public; Owner: pyramid
--

CREATE TABLE public."Activity" (
    id text NOT NULL,
    type text NOT NULL,
    meta jsonb,
    "taskId" text NOT NULL,
    "actorId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Activity" OWNER TO pyramid;

--
-- Name: Comment; Type: TABLE; Schema: public; Owner: pyramid
--

CREATE TABLE public."Comment" (
    id text NOT NULL,
    body text NOT NULL,
    "taskId" text NOT NULL,
    "authorId" text NOT NULL,
    "parentId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Comment" OWNER TO pyramid;

--
-- Name: Label; Type: TABLE; Schema: public; Owner: pyramid
--

CREATE TABLE public."Label" (
    id text NOT NULL,
    name text NOT NULL
);


ALTER TABLE public."Label" OWNER TO pyramid;

--
-- Name: Project; Type: TABLE; Schema: public; Owner: pyramid
--

CREATE TABLE public."Project" (
    id text NOT NULL,
    name text NOT NULL,
    priority public."Priority" DEFAULT 'NO_PRIORITY'::public."Priority" NOT NULL,
    "dueDate" timestamp(3) without time zone,
    "ownerId" text NOT NULL,
    "leadId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Project" OWNER TO pyramid;

--
-- Name: Resource; Type: TABLE; Schema: public; Owner: pyramid
--

CREATE TABLE public."Resource" (
    id text NOT NULL,
    name text NOT NULL,
    url text NOT NULL,
    "taskId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Resource" OWNER TO pyramid;

--
-- Name: Task; Type: TABLE; Schema: public; Owner: pyramid
--

CREATE TABLE public."Task" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    status public."TaskStatus" DEFAULT 'TODO'::public."TaskStatus" NOT NULL,
    priority public."Priority" DEFAULT 'NO_PRIORITY'::public."Priority" NOT NULL,
    "startDate" timestamp(3) without time zone,
    "dueDate" timestamp(3) without time zone,
    "position" double precision DEFAULT 0 NOT NULL,
    "ownerId" text NOT NULL,
    "projectId" text,
    "reporterId" text,
    "parentId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Task" OWNER TO pyramid;

--
-- Name: User; Type: TABLE; Schema: public; Owner: pyramid
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    username text,
    title text,
    "avatarUrl" text,
    "googleId" text,
    "isGuest" boolean DEFAULT false NOT NULL,
    "isDemo" boolean DEFAULT false NOT NULL,
    "hashedRefreshToken" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO pyramid;

--
-- Name: _TaskLabels; Type: TABLE; Schema: public; Owner: pyramid
--

CREATE TABLE public."_TaskLabels" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_TaskLabels" OWNER TO pyramid;

--
-- Name: _TaskMembers; Type: TABLE; Schema: public; Owner: pyramid
--

CREATE TABLE public."_TaskMembers" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_TaskMembers" OWNER TO pyramid;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: pyramid
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


ALTER TABLE public._prisma_migrations OWNER TO pyramid;

--
-- Data for Name: Activity; Type: TABLE DATA; Schema: public; Owner: pyramid
--

COPY public."Activity" (id, type, meta, "taskId", "actorId", "createdAt") FROM stdin;
cmsj486pe00118zetxx6pstjr	update_posted	{"text": "posted an update"}	cmsj486p5000s8zet4n9epypb	cmsj486o400008zet6qmndy7y	2026-08-07 15:44:33.266
cmsj486pe00128zeto6dwuph3	priority_changed	{"to": "High", "from": "No priority"}	cmsj486p5000s8zet4n9epypb	cmsj486o400008zet6qmndy7y	2026-08-07 15:44:33.266
cmsj56xr7002q8zetwhv751lt	update_posted	{"text": "posted an update"}	cmsj56xqz002h8zet4gdc0h4l	cmsj56xq4001p8zetb8uxz502	2026-08-07 16:11:34.627
cmsj56xr7002r8zetfdb3ivcg	priority_changed	{"to": "High", "from": "No priority"}	cmsj56xqz002h8zet4gdc0h4l	cmsj56xq4001p8zetb8uxz502	2026-08-07 16:11:34.627
cmsj6fg5200018zc9i3oe014a	status_changed	{"to": "Completed", "from": "Doing"}	cmsj56xrd002z8zetkbnldoik	cmsj56xq4001p8zetb8uxz502	2026-08-07 16:46:11.319
cmsjzgyiq00118zig5fqz8ilh	update_posted	{"text": "posted an update"}	cmsjzgyih000s8zigapwp7hfn	cmsjzgyhe00008zig3qj26yd8	2026-08-08 06:19:10.658
cmsjzgyiq00128zigf53gj8ku	priority_changed	{"to": "High", "from": "No priority"}	cmsjzgyih000s8zigapwp7hfn	cmsjzgyhe00008zig3qj26yd8	2026-08-08 06:19:10.658
cmsj6ty8r00118z4a6zmnis9v	update_posted	{"text": "posted an update"}	cmsj6ty8k000s8z4a29kk167j	cmsj6ty7l00008z4axjd3dsf5	2026-08-07 16:57:27.963
cmsj6ty8r00128z4ah4msyxq3	priority_changed	{"to": "High", "from": "No priority"}	cmsj6ty8k000s8z4a29kk167j	cmsj6ty7l00008z4axjd3dsf5	2026-08-07 16:57:27.963
cmslouz0q001q8zceq1tkbtfb	update_posted	{"text": "posted an update"}	cmslouyzz001h8zcecnn5fjgo	cmslouyyb000p8zce1nsrpcxq	2026-08-09 10:57:41.066
cmslouz0q001r8zcezrhs3anp	priority_changed	{"to": "High", "from": "No priority"}	cmslouyzz001h8zcecnn5fjgo	cmslouyyb000p8zce1nsrpcxq	2026-08-09 10:57:41.066
cmsk0092r00118zrd1k1fnm0l	update_posted	{"text": "posted an update"}	cmsk0092i000s8zrd3ohbq4fv	cmsk0091a00008zrdhvxw5wfy	2026-08-08 06:34:10.803
cmsk0092r00128zrd6p891mo2	priority_changed	{"to": "High", "from": "No priority"}	cmsk0092i000s8zrd3ohbq4fv	cmsk0091a00008zrdhvxw5wfy	2026-08-08 06:34:10.803
cmsj8c16m00118zlpll5rmu61	update_posted	{"text": "posted an update"}	cmsj8c16d000s8zlpwnd2pmz1	cmsj8c15b00008zlp0mwhbspd	2026-08-07 17:39:31.199
cmsj8c16m00128zlpaq1utteu	priority_changed	{"to": "High", "from": "No priority"}	cmsj8c16d000s8zlpwnd2pmz1	cmsj8c15b00008zlp0mwhbspd	2026-08-07 17:39:31.199
cmslqfspx003f8zceyqcf46nu	update_posted	{"text": "posted an update"}	cmslqfspg00368zce89jpjlpe	cmslqfsnk002e8zcexexb3zhh	2026-08-09 11:41:52.294
cmslqfspx003g8zce8rblcdw7	priority_changed	{"to": "High", "from": "No priority"}	cmslqfspg00368zce89jpjlpe	cmslqfsnk002e8zcexexb3zhh	2026-08-09 11:41:52.294
cmsj6sx9u004i8zy5tz12k5lx	update_posted	{"text": "posted an update"}	cmsj6sx9p00498zy53s589cus	cmsj6sx9c003h8zy57oeiyolg	2026-08-07 16:56:40.05
cmsj6sx9u004j8zy59n49tabc	priority_changed	{"to": "High", "from": "No priority"}	cmsj6sx9p00498zy53s589cus	cmsj6sx9c003h8zy57oeiyolg	2026-08-07 16:56:40.05
cmsj70vgi00118ze75yf7gepg	update_posted	{"text": "posted an update"}	cmsj70vg8000s8ze7teebq27b	cmsj70vf700008ze7u3heecsc	2026-08-07 17:02:50.946
cmsj70vgi00128ze72lnj6zpn	priority_changed	{"to": "High", "from": "No priority"}	cmsj70vg8000s8ze7teebq27b	cmsj70vf700008ze7u3heecsc	2026-08-07 17:02:50.946
cmsj8u2yg00118zp2sdeoihzo	update_posted	{"text": "posted an update"}	cmsj8u2y5000s8zp23c2e1mzi	cmsj8u2xc00008zp2ha0k6iz7	2026-08-07 17:53:33.305
cmsj8u2yg00128zp2d0yfo1od	priority_changed	{"to": "High", "from": "No priority"}	cmsj8u2y5000s8zp23c2e1mzi	cmsj8u2xc00008zp2ha0k6iz7	2026-08-07 17:53:33.305
cmsjsm9ch002q8zp2dbqf0ola	update_posted	{"text": "posted an update"}	cmsjsm9c0002h8zp2x1uwisuo	cmsjsm9al001p8zp23wiz7gxl	2026-08-08 03:07:20.657
cmsjsm9ch002r8zp282aal4n9	priority_changed	{"to": "High", "from": "No priority"}	cmsjsm9c0002h8zp2x1uwisuo	cmsjsm9al001p8zp23wiz7gxl	2026-08-08 03:07:20.657
cmsjt6x4700118ze1cuvxnq45	update_posted	{"text": "posted an update"}	cmsjt6x3t000s8ze1esghzjaq	cmsjt6x2l00008ze1ej6rxw57	2026-08-08 03:23:24.583
cmsjt6x4700128ze1sdelgtdv	priority_changed	{"to": "High", "from": "No priority"}	cmsjt6x3t000s8ze1esghzjaq	cmsjt6x2l00008ze1ej6rxw57	2026-08-08 03:23:24.583
cmsjtu8k2001q8ze1a7k2xr06	status_changed	{"to": "Doing", "from": "Completed"}	cmsjt6x4m001c8ze19xdzas3x	cmsjt6x2l00008ze1ej6rxw57	2026-08-08 03:41:32.499
cmsjwa69600118zzvp084z4p3	update_posted	{"text": "posted an update"}	cmsjwa68y000s8zzvttaqonu4	cmsjwa67w00008zzvsl6pnn0e	2026-08-08 04:49:55.243
cmsjwa69600128zzvc1ni9cbe	priority_changed	{"to": "High", "from": "No priority"}	cmsjwa68y000s8zzvttaqonu4	cmsjwa67w00008zzvsl6pnn0e	2026-08-08 04:49:55.243
\.


--
-- Data for Name: Comment; Type: TABLE DATA; Schema: public; Owner: pyramid
--

COPY public."Comment" (id, body, "taskId", "authorId", "parentId", "createdAt", "updatedAt") FROM stdin;
cmsj486pd00108zetn4b5vay1	Looks good — let's include example requests for each endpoint.	cmsj486p5000s8zet4n9epypb	cmsj486oh00088zethtyos2k8	\N	2026-08-07 15:44:33.265	2026-08-07 15:44:33.265
cmsj56xr6002p8zet0e58ur7j	Looks good — let's include example requests for each endpoint.	cmsj56xqz002h8zet4gdc0h4l	cmsj486oh00088zethtyos2k8	\N	2026-08-07 16:11:34.627	2026-08-07 16:11:34.627
cmsj6sx9t004h8zy5inmd3d1k	Looks good — let's include example requests for each endpoint.	cmsj6sx9p00498zy53s589cus	cmsj486oh00088zethtyos2k8	\N	2026-08-07 16:56:40.05	2026-08-07 16:56:40.05
cmsj6ty8q00108z4anij1isv2	Looks good — let's include example requests for each endpoint.	cmsj6ty8k000s8z4a29kk167j	cmsj486oh00088zethtyos2k8	\N	2026-08-07 16:57:27.963	2026-08-07 16:57:27.963
cmsj70vgh00108ze7lx8355p2	Looks good — let's include example requests for each endpoint.	cmsj70vg8000s8ze7teebq27b	cmsj486oh00088zethtyos2k8	\N	2026-08-07 17:02:50.945	2026-08-07 17:02:50.945
cmsj8c16l00108zlpb9xtwgh4	Looks good — let's include example requests for each endpoint.	cmsj8c16d000s8zlpwnd2pmz1	cmsj486oh00088zethtyos2k8	\N	2026-08-07 17:39:31.198	2026-08-07 17:39:31.198
cmsj8u2yf00108zp2a0qjxk87	Looks good — let's include example requests for each endpoint.	cmsj8u2y5000s8zp23c2e1mzi	cmsj486oh00088zethtyos2k8	\N	2026-08-07 17:53:33.304	2026-08-07 17:53:33.304
cmsjsm9cf002p8zp2a1j0psdi	Looks good — let's include example requests for each endpoint.	cmsjsm9c0002h8zp2x1uwisuo	cmsj486oh00088zethtyos2k8	\N	2026-08-08 03:07:20.656	2026-08-08 03:07:20.656
cmsjt6x4500108ze18c0wgnr4	Looks good — let's include example requests for each endpoint.	cmsjt6x3t000s8ze1esghzjaq	cmsj486oh00088zethtyos2k8	\N	2026-08-08 03:23:24.582	2026-08-08 03:23:24.582
cmsjwa69500108zzv3q6d104w	Looks good — let's include example requests for each endpoint.	cmsjwa68y000s8zzvttaqonu4	cmsj486oh00088zethtyos2k8	\N	2026-08-08 04:49:55.242	2026-08-08 04:49:55.242
cmsjzgyip00108zigp4lsh78z	Looks good — let's include example requests for each endpoint.	cmsjzgyih000s8zigapwp7hfn	cmsj486oh00088zethtyos2k8	\N	2026-08-08 06:19:10.657	2026-08-08 06:19:10.657
cmsk0092q00108zrd2ybjte3h	Looks good — let's include example requests for each endpoint.	cmsk0092i000s8zrd3ohbq4fv	cmsj486oh00088zethtyos2k8	\N	2026-08-08 06:34:10.802	2026-08-08 06:34:10.802
cmslouz0n001p8zceutqnhzt4	Looks good — let's include example requests for each endpoint.	cmslouyzz001h8zcecnn5fjgo	cmsj486oh00088zethtyos2k8	\N	2026-08-09 10:57:41.063	2026-08-09 10:57:41.063
cmslqfspv003e8zcezywp284b	Looks good — let's include example requests for each endpoint.	cmslqfspg00368zce89jpjlpe	cmsj486oh00088zethtyos2k8	\N	2026-08-09 11:41:52.292	2026-08-09 11:41:52.292
\.


--
-- Data for Name: Label; Type: TABLE DATA; Schema: public; Owner: pyramid
--

COPY public."Label" (id, name) FROM stdin;
cmsj486oj000a8zettitr40zp	Research
cmsj486om000b8zet7m9y2nkw	Design
cmsj486oo000c8zety0vcesm1	Development
cmsj486oq000d8zetrpc91l4m	Testing
cmsj486os000e8zet1zphl924	Deployment
cmsj486ot000f8zett2lwl0n3	Review
cmsj486ou000g8zet4luhko4u	Updated
cmsj486ow000h8zetpjtaja6i	Passed
cmsj486ox000i8zet0dq50g8n	Audit
cmsj486oy000j8zetoy9vgijd	Scheduled
cmsj486p0000k8zetvyfleko2	Optimization
\.


--
-- Data for Name: Project; Type: TABLE DATA; Schema: public; Owner: pyramid
--

COPY public."Project" (id, name, priority, "dueDate", "ownerId", "leadId", "createdAt", "updatedAt") FROM stdin;
cmsj486p2000m8zetbqv7p4lt	Design Homepage	HIGH	2026-09-12 00:00:00	cmsj486o400008zet6qmndy7y	cmsj486o900018zetb77l1kdw	2026-08-07 15:44:33.254	2026-08-07 15:44:33.254
cmsj486p3000o8zetthoq48q1	Develop Login Feature	LOW	2026-09-15 00:00:00	cmsj486o400008zet6qmndy7y	cmsj486oi00098zetcthi8b5t	2026-08-07 15:44:33.256	2026-08-07 15:44:33.256
cmsj486p4000q8zetwsvgp0r3	Test Payment Gateway	MEDIUM	2026-09-18 00:00:00	cmsj486o400008zet6qmndy7y	\N	2026-08-07 15:44:33.256	2026-08-07 15:44:33.256
cmsj56xqw002b8zet8l2knfgu	Design Homepage	HIGH	2026-09-12 00:00:00	cmsj56xq4001p8zetb8uxz502	cmsj486o900018zetb77l1kdw	2026-08-07 16:11:34.616	2026-08-07 16:11:34.616
cmsj56xqy002d8zetmpc5hkx9	Develop Login Feature	LOW	2026-09-15 00:00:00	cmsj56xq4001p8zetb8uxz502	cmsj486oi00098zetcthi8b5t	2026-08-07 16:11:34.618	2026-08-07 16:11:34.618
cmsj56xqy002f8zetvj6dqj3r	Test Payment Gateway	MEDIUM	2026-09-18 00:00:00	cmsj56xq4001p8zetb8uxz502	\N	2026-08-07 16:11:34.619	2026-08-07 16:11:34.619
cmsjzgyid000m8zigw4tmttf4	Design Homepage	HIGH	2026-09-12 00:00:00	cmsjzgyhe00008zig3qj26yd8	cmsj486o900018zetb77l1kdw	2026-08-08 06:19:10.646	2026-08-08 06:19:10.646
cmsjzgyif000o8zigcu05i1d8	Develop Login Feature	LOW	2026-09-15 00:00:00	cmsjzgyhe00008zig3qj26yd8	cmsj486oi00098zetcthi8b5t	2026-08-08 06:19:10.647	2026-08-08 06:19:10.647
cmsjzgyif000q8zigjaqve3n2	Test Payment Gateway	MEDIUM	2026-09-18 00:00:00	cmsjzgyhe00008zig3qj26yd8	\N	2026-08-08 06:19:10.648	2026-08-08 06:19:10.648
cmsk0092f000m8zrdfso95x7n	Design Homepage	HIGH	2026-09-12 00:00:00	cmsk0091a00008zrdhvxw5wfy	cmsj486o900018zetb77l1kdw	2026-08-08 06:34:10.791	2026-08-08 06:34:10.791
cmsk0092g000o8zrdfd84i6wn	Develop Login Feature	LOW	2026-09-15 00:00:00	cmsk0091a00008zrdhvxw5wfy	cmsj486oi00098zetcthi8b5t	2026-08-08 06:34:10.793	2026-08-08 06:34:10.793
cmsk0092h000q8zrdc1fyp9m8	Test Payment Gateway	MEDIUM	2026-09-18 00:00:00	cmsk0091a00008zrdhvxw5wfy	\N	2026-08-08 06:34:10.793	2026-08-08 06:34:10.793
cmsj6sx9o00438zy5rfkt9n12	Design Homepage	HIGH	2026-09-12 00:00:00	cmsj6sx9c003h8zy57oeiyolg	cmsj486o900018zetb77l1kdw	2026-08-07 16:56:40.045	2026-08-07 16:56:40.045
cmsj6sx9p00458zy5g7snaevc	Develop Login Feature	LOW	2026-09-15 00:00:00	cmsj6sx9c003h8zy57oeiyolg	cmsj486oi00098zetcthi8b5t	2026-08-07 16:56:40.045	2026-08-07 16:56:40.045
cmsj6sx9p00478zy53geqr9h4	Test Payment Gateway	MEDIUM	2026-09-18 00:00:00	cmsj6sx9c003h8zy57oeiyolg	\N	2026-08-07 16:56:40.045	2026-08-07 16:56:40.045
cmsloefd2000o8zcew31m14ud	Dashboard Revamp	MEDIUM	2026-08-31 00:00:00	cmslo7wi2000k8zcevaya9b2p	cmslo7wi2000k8zcevaya9b2p	2026-08-09 10:44:49.094	2026-08-09 10:44:49.094
cmslouyzq001b8zcesesu31q5	Design Homepage	HIGH	2026-09-12 00:00:00	cmslouyyb000p8zce1nsrpcxq	cmsj486o900018zetb77l1kdw	2026-08-09 10:57:41.031	2026-08-09 10:57:41.031
cmslouyzu001d8zce58u0z6gh	Develop Login Feature	LOW	2026-09-15 00:00:00	cmslouyyb000p8zce1nsrpcxq	cmsj486oi00098zetcthi8b5t	2026-08-09 10:57:41.034	2026-08-09 10:57:41.034
cmslouyzx001f8zcekepaqv9t	Test Payment Gateway	MEDIUM	2026-09-18 00:00:00	cmslouyyb000p8zce1nsrpcxq	\N	2026-08-09 10:57:41.037	2026-08-09 10:57:41.037
cmslqfsp900308zcesq90tvw0	Design Homepage	HIGH	2026-09-12 00:00:00	cmslqfsnk002e8zcexexb3zhh	cmsj486o900018zetb77l1kdw	2026-08-09 11:41:52.27	2026-08-09 11:41:52.27
cmslqfspc00328zcenlcsdcc5	Develop Login Feature	LOW	2026-09-15 00:00:00	cmslqfsnk002e8zcexexb3zhh	cmsj486oi00098zetcthi8b5t	2026-08-09 11:41:52.273	2026-08-09 11:41:52.273
cmsj6ty8h000m8z4ajkddm1oc	Design Homepage	HIGH	2026-09-12 00:00:00	cmsj6ty7l00008z4axjd3dsf5	cmsj486o900018zetb77l1kdw	2026-08-07 16:57:27.954	2026-08-07 16:57:27.954
cmsj6ty8j000o8z4anzmcnxzg	Develop Login Feature	LOW	2026-09-15 00:00:00	cmsj6ty7l00008z4axjd3dsf5	cmsj486oi00098zetcthi8b5t	2026-08-07 16:57:27.955	2026-08-07 16:57:27.955
cmsj6ty8j000q8z4arm3a1rrx	Test Payment Gateway	MEDIUM	2026-09-18 00:00:00	cmsj6ty7l00008z4axjd3dsf5	\N	2026-08-07 16:57:27.956	2026-08-07 16:57:27.956
cmslqfspe00348zce30229xvp	Test Payment Gateway	MEDIUM	2026-09-18 00:00:00	cmslqfsnk002e8zcexexb3zhh	\N	2026-08-09 11:41:52.275	2026-08-09 11:41:52.275
cmsj70vg4000m8ze7hiov69sn	Design Homepage	HIGH	2026-09-12 00:00:00	cmsj70vf700008ze7u3heecsc	cmsj486o900018zetb77l1kdw	2026-08-07 17:02:50.933	2026-08-07 17:02:50.933
cmsj70vg6000o8ze7vwpgkk1c	Develop Login Feature	LOW	2026-09-15 00:00:00	cmsj70vf700008ze7u3heecsc	cmsj486oi00098zetcthi8b5t	2026-08-07 17:02:50.935	2026-08-07 17:02:50.935
cmsj70vg7000q8ze71yzlwd33	Test Payment Gateway	MEDIUM	2026-09-18 00:00:00	cmsj70vf700008ze7u3heecsc	\N	2026-08-07 17:02:50.935	2026-08-07 17:02:50.935
cmsj8c16a000m8zlp7kkthhoq	Design Homepage	HIGH	2026-09-12 00:00:00	cmsj8c15b00008zlp0mwhbspd	cmsj486o900018zetb77l1kdw	2026-08-07 17:39:31.187	2026-08-07 17:39:31.187
cmsj8c16c000o8zlpm8rajb2y	Develop Login Feature	LOW	2026-09-15 00:00:00	cmsj8c15b00008zlp0mwhbspd	cmsj486oi00098zetcthi8b5t	2026-08-07 17:39:31.188	2026-08-07 17:39:31.188
cmsj8c16c000q8zlpmlvs3nm3	Test Payment Gateway	MEDIUM	2026-09-18 00:00:00	cmsj8c15b00008zlp0mwhbspd	\N	2026-08-07 17:39:31.189	2026-08-07 17:39:31.189
cmsj8u2y2000m8zp2i3n8n71l	Design Homepage	HIGH	2026-09-12 00:00:00	cmsj8u2xc00008zp2ha0k6iz7	cmsj486o900018zetb77l1kdw	2026-08-07 17:53:33.29	2026-08-07 17:53:33.29
cmsj8u2y4000o8zp2ffhx33ub	Develop Login Feature	LOW	2026-09-15 00:00:00	cmsj8u2xc00008zp2ha0k6iz7	cmsj486oi00098zetcthi8b5t	2026-08-07 17:53:33.292	2026-08-07 17:53:33.292
cmsj8u2y4000q8zp24o34dasf	Test Payment Gateway	MEDIUM	2026-09-18 00:00:00	cmsj8u2xc00008zp2ha0k6iz7	\N	2026-08-07 17:53:33.293	2026-08-07 17:53:33.293
cmsjsm9bv002b8zp2tl5l26k1	Design Homepage	HIGH	2026-09-12 00:00:00	cmsjsm9al001p8zp23wiz7gxl	cmsj486o900018zetb77l1kdw	2026-08-08 03:07:20.635	2026-08-08 03:07:20.635
cmsjsm9by002d8zp2qe247g98	Develop Login Feature	LOW	2026-09-15 00:00:00	cmsjsm9al001p8zp23wiz7gxl	cmsj486oi00098zetcthi8b5t	2026-08-08 03:07:20.638	2026-08-08 03:07:20.638
cmsjsm9bz002f8zp2z3k40k3q	Test Payment Gateway	MEDIUM	2026-09-18 00:00:00	cmsjsm9al001p8zp23wiz7gxl	\N	2026-08-08 03:07:20.639	2026-08-08 03:07:20.639
cmsjt6x3o000m8ze1o2vdwn0g	Design Homepage	HIGH	2026-09-12 00:00:00	cmsjt6x2l00008ze1ej6rxw57	cmsj486o900018zetb77l1kdw	2026-08-08 03:23:24.564	2026-08-08 03:23:24.564
cmsjt6x3r000o8ze12ugywvz9	Develop Login Feature	LOW	2026-09-15 00:00:00	cmsjt6x2l00008ze1ej6rxw57	cmsj486oi00098zetcthi8b5t	2026-08-08 03:23:24.567	2026-08-08 03:23:24.567
cmsjt6x3r000q8ze1bhfj29lf	Test Payment Gateway	MEDIUM	2026-09-18 00:00:00	cmsjt6x2l00008ze1ej6rxw57	\N	2026-08-08 03:23:24.568	2026-08-08 03:23:24.568
cmsjwa68v000m8zzv555yqdod	Design Homepage	HIGH	2026-09-12 00:00:00	cmsjwa67w00008zzvsl6pnn0e	cmsj486o900018zetb77l1kdw	2026-08-08 04:49:55.231	2026-08-08 04:49:55.231
cmsjwa68w000o8zzvr89fdtri	Develop Login Feature	LOW	2026-09-15 00:00:00	cmsjwa67w00008zzvsl6pnn0e	cmsj486oi00098zetcthi8b5t	2026-08-08 04:49:55.233	2026-08-08 04:49:55.233
cmsjwa68x000q8zzvu4bpx0rz	Test Payment Gateway	MEDIUM	2026-09-18 00:00:00	cmsjwa67w00008zzvsl6pnn0e	\N	2026-08-08 04:49:55.233	2026-08-08 04:49:55.233
\.


--
-- Data for Name: Resource; Type: TABLE DATA; Schema: public; Owner: pyramid
--

COPY public."Resource" (id, name, url, "taskId", "createdAt") FROM stdin;
\.


--
-- Data for Name: Task; Type: TABLE DATA; Schema: public; Owner: pyramid
--

COPY public."Task" (id, title, description, status, priority, "startDate", "dueDate", "position", "ownerId", "projectId", "reporterId", "parentId", "createdAt", "updatedAt") FROM stdin;
cmsj486p5000s8zet4n9epypb	Write API Documentation	Create clear and detailed API documentation to guide developers in using the inventory and sales metrics features effectively.	TODO	HIGH	\N	2026-07-29 00:00:00	1000	cmsj486o400008zet6qmndy7y	cmsj486p2000m8zetbqv7p4lt	cmsj486oc00028zetwmownyk5	\N	2026-08-07 15:44:33.257	2026-08-07 15:44:33.257
cmsj486p8000u8zetyaeun3ox	Subtask 1	\N	TODO	HIGH	\N	2026-09-12 00:00:00	1000	cmsj486o400008zet6qmndy7y	\N	cmsj486o400008zet6qmndy7y	cmsj486p5000s8zet4n9epypb	2026-08-07 15:44:33.261	2026-08-07 15:44:33.261
cmsj486pa000w8zet10pmlbkw	Subtask 2	\N	TODO	LOW	\N	2026-09-15 00:00:00	2000	cmsj486o400008zet6qmndy7y	\N	cmsj486o400008zet6qmndy7y	cmsj486p5000s8zet4n9epypb	2026-08-07 15:44:33.262	2026-08-07 15:44:33.262
cmsj486pc000y8zetxlfkzynt	Subtask 3	\N	TODO	MEDIUM	\N	2026-09-18 00:00:00	3000	cmsj486o400008zet6qmndy7y	\N	cmsj486o400008zet6qmndy7y	cmsj486p5000s8zet4n9epypb	2026-08-07 15:44:33.264	2026-08-07 15:44:33.264
cmsj486pf00148zetnnx6urw9	Implement Search Function	\N	TODO	MEDIUM	\N	2026-07-29 00:00:00	2000	cmsj486o400008zet6qmndy7y	cmsj486p2000m8zetbqv7p4lt	cmsj486o400008zet6qmndy7y	\N	2026-08-07 15:44:33.267	2026-08-07 15:44:33.267
cmsj486ph00168zet5mcgrjpe	Deploy to Production	\N	TODO	URGENT	\N	2026-07-29 00:00:00	3000	cmsj486o400008zet6qmndy7y	cmsj486p3000o8zetthoq48q1	cmsj486o400008zet6qmndy7y	\N	2026-08-07 15:44:33.27	2026-08-07 15:44:33.27
cmsj486pj00188zetzwz0wim0	Code Review Completed	\N	DOING	MEDIUM	\N	2026-07-29 00:00:00	4000	cmsj486o400008zet6qmndy7y	cmsj486p3000o8zetthoq48q1	cmsj486o400008zet6qmndy7y	\N	2026-08-07 15:44:33.272	2026-08-07 15:44:33.272
cmsj486pl001a8zetpb1fag27	Design Mockups Finalized	\N	DOING	HIGH	\N	2026-07-29 00:00:00	5000	cmsj486o400008zet6qmndy7y	cmsj486p2000m8zetbqv7p4lt	cmsj486o400008zet6qmndy7y	\N	2026-08-07 15:44:33.273	2026-08-07 15:44:33.273
cmsj486pn001c8zetqp2h3f60	Feature Testing Passed	\N	COMPLETED	MEDIUM	\N	2026-07-30 00:00:00	6000	cmsj486o400008zet6qmndy7y	cmsj486p4000q8zetwsvgp0r3	cmsj486o400008zet6qmndy7y	\N	2026-08-07 15:44:33.275	2026-08-07 15:44:33.275
cmsj486po001e8zet0yndoyzo	UI Design Updated	\N	COMPLETED	LOW	\N	2026-07-31 00:00:00	7000	cmsj486o400008zet6qmndy7y	cmsj486p2000m8zetbqv7p4lt	cmsj486o400008zet6qmndy7y	\N	2026-08-07 15:44:33.277	2026-08-07 15:44:33.277
cmsj486pq001g8zety31s03a7	Security Audit Scheduled	\N	COMPLETED	HIGH	\N	2026-08-01 00:00:00	8000	cmsj486o400008zet6qmndy7y	cmsj486p4000q8zetwsvgp0r3	cmsj486o400008zet6qmndy7y	\N	2026-08-07 15:44:33.279	2026-08-07 15:44:33.279
cmsj486ps001i8zet3wj0l0xu	UI Review Session	\N	ON_HOLD	MEDIUM	\N	\N	9000	cmsj486o400008zet6qmndy7y	cmsj486p2000m8zetbqv7p4lt	cmsj486o400008zet6qmndy7y	\N	2026-08-07 15:44:33.28	2026-08-07 15:44:33.28
cmsj486pu001k8zetqeu4i162	Backend Refactor	\N	ON_HOLD	HIGH	\N	\N	10000	cmsj486o400008zet6qmndy7y	cmsj486p3000o8zetthoq48q1	cmsj486o400008zet6qmndy7y	\N	2026-08-07 15:44:33.283	2026-08-07 15:44:33.283
cmsj486pw001m8zet9r7mw7lx	User Feedback Analysis	\N	ON_HOLD	LOW	\N	\N	11000	cmsj486o400008zet6qmndy7y	cmsj486p4000q8zetwsvgp0r3	cmsj486o400008zet6qmndy7y	\N	2026-08-07 15:44:33.284	2026-08-07 15:44:33.284
cmsj486py001o8zetwkcync8n	Performance Optimization	\N	ON_HOLD	MEDIUM	\N	\N	12000	cmsj486o400008zet6qmndy7y	cmsj486p3000o8zetthoq48q1	cmsj486o400008zet6qmndy7y	\N	2026-08-07 15:44:33.286	2026-08-07 15:44:33.286
cmsj56xqz002h8zet4gdc0h4l	Write API Documentation	Create clear and detailed API documentation to guide developers in using the inventory and sales metrics features effectively.	TODO	HIGH	\N	2026-07-29 00:00:00	1000	cmsj56xq4001p8zetb8uxz502	cmsj56xqw002b8zet8l2knfgu	cmsj486oc00028zetwmownyk5	\N	2026-08-07 16:11:34.62	2026-08-07 16:11:34.62
cmsj56xr3002j8zet8hsa2bol	Subtask 1	\N	TODO	HIGH	\N	2026-09-12 00:00:00	1000	cmsj56xq4001p8zetb8uxz502	\N	cmsj56xq4001p8zetb8uxz502	cmsj56xqz002h8zet4gdc0h4l	2026-08-07 16:11:34.624	2026-08-07 16:11:34.624
cmsj56xr5002l8zetar9gaf39	Subtask 2	\N	TODO	LOW	\N	2026-09-15 00:00:00	2000	cmsj56xq4001p8zetb8uxz502	\N	cmsj56xq4001p8zetb8uxz502	cmsj56xqz002h8zet4gdc0h4l	2026-08-07 16:11:34.625	2026-08-07 16:11:34.625
cmsj56xr6002n8zetmawqx2ok	Subtask 3	\N	TODO	MEDIUM	\N	2026-09-18 00:00:00	3000	cmsj56xq4001p8zetb8uxz502	\N	cmsj56xq4001p8zetb8uxz502	cmsj56xqz002h8zet4gdc0h4l	2026-08-07 16:11:34.626	2026-08-07 16:11:34.626
cmsj56xr8002t8zet5rbkx6c7	Implement Search Function	\N	TODO	MEDIUM	\N	2026-07-29 00:00:00	2000	cmsj56xq4001p8zetb8uxz502	cmsj56xqw002b8zet8l2knfgu	cmsj56xq4001p8zetb8uxz502	\N	2026-08-07 16:11:34.628	2026-08-07 16:11:34.628
cmsj56xra002v8zetkdoa0o0u	Deploy to Production	\N	TODO	URGENT	\N	2026-07-29 00:00:00	3000	cmsj56xq4001p8zetb8uxz502	cmsj56xqy002d8zetmpc5hkx9	cmsj56xq4001p8zetb8uxz502	\N	2026-08-07 16:11:34.63	2026-08-07 16:11:34.63
cmsj56xrb002x8zetpkn815ky	Code Review Completed	\N	DOING	MEDIUM	\N	2026-07-29 00:00:00	4000	cmsj56xq4001p8zetb8uxz502	cmsj56xqy002d8zetmpc5hkx9	cmsj56xq4001p8zetb8uxz502	\N	2026-08-07 16:11:34.632	2026-08-07 16:11:34.632
cmsj70vg8000s8ze7teebq27b	Write API Documentation	Create clear and detailed API documentation to guide developers in using the inventory and sales metrics features effectively.	TODO	HIGH	\N	2026-07-29 00:00:00	1000	cmsj70vf700008ze7u3heecsc	cmsj70vg4000m8ze7hiov69sn	cmsj486oc00028zetwmownyk5	\N	2026-08-07 17:02:50.937	2026-08-07 17:02:50.937
cmsj56xrf00318zetph63wf19	Feature Testing Passed	\N	COMPLETED	MEDIUM	\N	2026-07-30 00:00:00	6000	cmsj56xq4001p8zetb8uxz502	cmsj56xqy002f8zetvj6dqj3r	cmsj56xq4001p8zetb8uxz502	\N	2026-08-07 16:11:34.635	2026-08-07 16:11:34.635
cmsj56xrg00338zetvt9krnom	UI Design Updated	\N	COMPLETED	LOW	\N	2026-07-31 00:00:00	7000	cmsj56xq4001p8zetb8uxz502	cmsj56xqw002b8zet8l2knfgu	cmsj56xq4001p8zetb8uxz502	\N	2026-08-07 16:11:34.637	2026-08-07 16:11:34.637
cmsj56xri00358zet8x3dxu0c	Security Audit Scheduled	\N	COMPLETED	HIGH	\N	2026-08-01 00:00:00	8000	cmsj56xq4001p8zetb8uxz502	cmsj56xqy002f8zetvj6dqj3r	cmsj56xq4001p8zetb8uxz502	\N	2026-08-07 16:11:34.639	2026-08-07 16:11:34.639
cmsj56xrk00378zeteom8zvj8	UI Review Session	\N	ON_HOLD	MEDIUM	\N	\N	9000	cmsj56xq4001p8zetb8uxz502	cmsj56xqw002b8zet8l2knfgu	cmsj56xq4001p8zetb8uxz502	\N	2026-08-07 16:11:34.64	2026-08-07 16:11:34.64
cmsj56xrl00398zetl0y6ve1e	Backend Refactor	\N	ON_HOLD	HIGH	\N	\N	10000	cmsj56xq4001p8zetb8uxz502	cmsj56xqy002d8zetmpc5hkx9	cmsj56xq4001p8zetb8uxz502	\N	2026-08-07 16:11:34.642	2026-08-07 16:11:34.642
cmsj56xrn003b8zet7ak7zfca	User Feedback Analysis	\N	ON_HOLD	LOW	\N	\N	11000	cmsj56xq4001p8zetb8uxz502	cmsj56xqy002f8zetvj6dqj3r	cmsj56xq4001p8zetb8uxz502	\N	2026-08-07 16:11:34.643	2026-08-07 16:11:34.643
cmsj56xro003d8zet7kzn1bbv	Performance Optimization	\N	ON_HOLD	MEDIUM	\N	\N	12000	cmsj56xq4001p8zetb8uxz502	cmsj56xqy002d8zetmpc5hkx9	cmsj56xq4001p8zetb8uxz502	\N	2026-08-07 16:11:34.645	2026-08-07 16:11:34.645
cmsj70vgd000u8ze7g75fcyqu	Subtask 1	\N	TODO	HIGH	\N	2026-09-12 00:00:00	1000	cmsj70vf700008ze7u3heecsc	\N	cmsj70vf700008ze7u3heecsc	cmsj70vg8000s8ze7teebq27b	2026-08-07 17:02:50.942	2026-08-07 17:02:50.942
cmsj56xrd002z8zetkbnldoik	Design Mockups Finalized	\N	COMPLETED	HIGH	\N	2026-07-29 00:00:00	7500	cmsj56xq4001p8zetb8uxz502	cmsj56xqw002b8zet8l2knfgu	cmsj56xq4001p8zetb8uxz502	\N	2026-08-07 16:11:34.633	2026-08-07 16:46:11.317
cmsj70vgf000w8ze77rnuqkgx	Subtask 2	\N	TODO	LOW	\N	2026-09-15 00:00:00	2000	cmsj70vf700008ze7u3heecsc	\N	cmsj70vf700008ze7u3heecsc	cmsj70vg8000s8ze7teebq27b	2026-08-07 17:02:50.943	2026-08-07 17:02:50.943
cmsj70vgg000y8ze761ouyewg	Subtask 3	\N	TODO	MEDIUM	\N	2026-09-18 00:00:00	3000	cmsj70vf700008ze7u3heecsc	\N	cmsj70vf700008ze7u3heecsc	cmsj70vg8000s8ze7teebq27b	2026-08-07 17:02:50.944	2026-08-07 17:02:50.944
cmsj70vgj00148ze7pmajgkux	Implement Search Function	\N	TODO	MEDIUM	\N	2026-07-29 00:00:00	2000	cmsj70vf700008ze7u3heecsc	cmsj70vg4000m8ze7hiov69sn	cmsj70vf700008ze7u3heecsc	\N	2026-08-07 17:02:50.947	2026-08-07 17:02:50.947
cmsj70vgl00168ze7ftrurdpu	Deploy to Production	\N	TODO	URGENT	\N	2026-07-29 00:00:00	3000	cmsj70vf700008ze7u3heecsc	cmsj70vg6000o8ze7vwpgkk1c	cmsj70vf700008ze7u3heecsc	\N	2026-08-07 17:02:50.949	2026-08-07 17:02:50.949
cmsj70vgn00188ze7fucn70o4	Code Review Completed	\N	DOING	MEDIUM	\N	2026-07-29 00:00:00	4000	cmsj70vf700008ze7u3heecsc	cmsj70vg6000o8ze7vwpgkk1c	cmsj70vf700008ze7u3heecsc	\N	2026-08-07 17:02:50.951	2026-08-07 17:02:50.951
cmsj70vgp001a8ze77d4vs9el	Design Mockups Finalized	\N	DOING	HIGH	\N	2026-07-29 00:00:00	5000	cmsj70vf700008ze7u3heecsc	cmsj70vg4000m8ze7hiov69sn	cmsj70vf700008ze7u3heecsc	\N	2026-08-07 17:02:50.953	2026-08-07 17:02:50.953
cmsj70vgq001c8ze72ubtxzu0	Feature Testing Passed	\N	COMPLETED	MEDIUM	\N	2026-07-30 00:00:00	6000	cmsj70vf700008ze7u3heecsc	cmsj70vg7000q8ze71yzlwd33	cmsj70vf700008ze7u3heecsc	\N	2026-08-07 17:02:50.955	2026-08-07 17:02:50.955
cmsj70vgs001e8ze7n9arxdyy	UI Design Updated	\N	COMPLETED	LOW	\N	2026-07-31 00:00:00	7000	cmsj70vf700008ze7u3heecsc	cmsj70vg4000m8ze7hiov69sn	cmsj70vf700008ze7u3heecsc	\N	2026-08-07 17:02:50.956	2026-08-07 17:02:50.956
cmsj70vgt001g8ze75yi5ka86	Security Audit Scheduled	\N	COMPLETED	HIGH	\N	2026-08-01 00:00:00	8000	cmsj70vf700008ze7u3heecsc	cmsj70vg7000q8ze71yzlwd33	cmsj70vf700008ze7u3heecsc	\N	2026-08-07 17:02:50.958	2026-08-07 17:02:50.958
cmsj70vgv001i8ze71wii6bnv	UI Review Session	\N	ON_HOLD	MEDIUM	\N	\N	9000	cmsj70vf700008ze7u3heecsc	cmsj70vg4000m8ze7hiov69sn	cmsj70vf700008ze7u3heecsc	\N	2026-08-07 17:02:50.959	2026-08-07 17:02:50.959
cmsj70vgw001k8ze7znsxn4vf	Backend Refactor	\N	ON_HOLD	HIGH	\N	\N	10000	cmsj70vf700008ze7u3heecsc	cmsj70vg6000o8ze7vwpgkk1c	cmsj70vf700008ze7u3heecsc	\N	2026-08-07 17:02:50.96	2026-08-07 17:02:50.96
cmsj70vgx001m8ze7yvt0f9rg	User Feedback Analysis	\N	ON_HOLD	LOW	\N	\N	11000	cmsj70vf700008ze7u3heecsc	cmsj70vg7000q8ze71yzlwd33	cmsj70vf700008ze7u3heecsc	\N	2026-08-07 17:02:50.962	2026-08-07 17:02:50.962
cmsj70vgz001o8ze775el7paf	Performance Optimization	\N	ON_HOLD	MEDIUM	\N	\N	12000	cmsj70vf700008ze7u3heecsc	cmsj70vg6000o8ze7vwpgkk1c	cmsj70vf700008ze7u3heecsc	\N	2026-08-07 17:02:50.963	2026-08-07 17:02:50.963
cmsj6ty8k000s8z4a29kk167j	Write API Documentation	Create clear and detailed API documentation to guide developers in using the inventory and sales metrics features effectively.	TODO	HIGH	\N	2026-07-29 00:00:00	1000	cmsj6ty7l00008z4axjd3dsf5	cmsj6ty8h000m8z4ajkddm1oc	cmsj486oc00028zetwmownyk5	\N	2026-08-07 16:57:27.956	2026-08-07 16:57:27.956
cmsj6ty8n000u8z4amp2lxdif	Subtask 1	\N	TODO	HIGH	\N	2026-09-12 00:00:00	1000	cmsj6ty7l00008z4axjd3dsf5	\N	cmsj6ty7l00008z4axjd3dsf5	cmsj6ty8k000s8z4a29kk167j	2026-08-07 16:57:27.96	2026-08-07 16:57:27.96
cmsj6ty8p000w8z4aymq4nql0	Subtask 2	\N	TODO	LOW	\N	2026-09-15 00:00:00	2000	cmsj6ty7l00008z4axjd3dsf5	\N	cmsj6ty7l00008z4axjd3dsf5	cmsj6ty8k000s8z4a29kk167j	2026-08-07 16:57:27.961	2026-08-07 16:57:27.961
cmsj6ty8q000y8z4a8dtwlcyo	Subtask 3	\N	TODO	MEDIUM	\N	2026-09-18 00:00:00	3000	cmsj6ty7l00008z4axjd3dsf5	\N	cmsj6ty7l00008z4axjd3dsf5	cmsj6ty8k000s8z4a29kk167j	2026-08-07 16:57:27.962	2026-08-07 16:57:27.962
cmsj6ty8s00148z4ajgkzl7o6	Implement Search Function	\N	TODO	MEDIUM	\N	2026-07-29 00:00:00	2000	cmsj6ty7l00008z4axjd3dsf5	cmsj6ty8h000m8z4ajkddm1oc	cmsj6ty7l00008z4axjd3dsf5	\N	2026-08-07 16:57:27.964	2026-08-07 16:57:27.964
cmsj6ty8u00168z4aa78ld7is	Deploy to Production	\N	TODO	URGENT	\N	2026-07-29 00:00:00	3000	cmsj6ty7l00008z4axjd3dsf5	cmsj6ty8j000o8z4anzmcnxzg	cmsj6ty7l00008z4axjd3dsf5	\N	2026-08-07 16:57:27.966	2026-08-07 16:57:27.966
cmsj6ty8v00188z4a7ro6rulm	Code Review Completed	\N	DOING	MEDIUM	\N	2026-07-29 00:00:00	4000	cmsj6ty7l00008z4axjd3dsf5	cmsj6ty8j000o8z4anzmcnxzg	cmsj6ty7l00008z4axjd3dsf5	\N	2026-08-07 16:57:27.968	2026-08-07 16:57:27.968
cmsj6ty8x001a8z4ahap8jcm3	Design Mockups Finalized	\N	DOING	HIGH	\N	2026-07-29 00:00:00	5000	cmsj6ty7l00008z4axjd3dsf5	cmsj6ty8h000m8z4ajkddm1oc	cmsj6ty7l00008z4axjd3dsf5	\N	2026-08-07 16:57:27.969	2026-08-07 16:57:27.969
cmsj6ty8z001c8z4aikhcgdti	Feature Testing Passed	\N	COMPLETED	MEDIUM	\N	2026-07-30 00:00:00	6000	cmsj6ty7l00008z4axjd3dsf5	cmsj6ty8j000q8z4arm3a1rrx	cmsj6ty7l00008z4axjd3dsf5	\N	2026-08-07 16:57:27.972	2026-08-07 16:57:27.972
cmsj6ty91001e8z4amk3svk3x	UI Design Updated	\N	COMPLETED	LOW	\N	2026-07-31 00:00:00	7000	cmsj6ty7l00008z4axjd3dsf5	cmsj6ty8h000m8z4ajkddm1oc	cmsj6ty7l00008z4axjd3dsf5	\N	2026-08-07 16:57:27.973	2026-08-07 16:57:27.973
cmsj6ty92001g8z4a6cbwechl	Security Audit Scheduled	\N	COMPLETED	HIGH	\N	2026-08-01 00:00:00	8000	cmsj6ty7l00008z4axjd3dsf5	cmsj6ty8j000q8z4arm3a1rrx	cmsj6ty7l00008z4axjd3dsf5	\N	2026-08-07 16:57:27.975	2026-08-07 16:57:27.975
cmsj6ty93001i8z4a07jauw3w	UI Review Session	\N	ON_HOLD	MEDIUM	\N	\N	9000	cmsj6ty7l00008z4axjd3dsf5	cmsj6ty8h000m8z4ajkddm1oc	cmsj6ty7l00008z4axjd3dsf5	\N	2026-08-07 16:57:27.976	2026-08-07 16:57:27.976
cmsj6ty95001k8z4alb15lp2e	Backend Refactor	\N	ON_HOLD	HIGH	\N	\N	10000	cmsj6ty7l00008z4axjd3dsf5	cmsj6ty8j000o8z4anzmcnxzg	cmsj6ty7l00008z4axjd3dsf5	\N	2026-08-07 16:57:27.977	2026-08-07 16:57:27.977
cmsj6ty96001m8z4ay2tllg1p	User Feedback Analysis	\N	ON_HOLD	LOW	\N	\N	11000	cmsj6ty7l00008z4axjd3dsf5	cmsj6ty8j000q8z4arm3a1rrx	cmsj6ty7l00008z4axjd3dsf5	\N	2026-08-07 16:57:27.979	2026-08-07 16:57:27.979
cmsj6ty97001o8z4atvjmlstk	Performance Optimization	\N	ON_HOLD	MEDIUM	\N	\N	12000	cmsj6ty7l00008z4axjd3dsf5	cmsj6ty8j000o8z4anzmcnxzg	cmsj6ty7l00008z4axjd3dsf5	\N	2026-08-07 16:57:27.98	2026-08-07 16:57:27.98
cmsj6sx9p00498zy53s589cus	Write API Documentation	Create clear and detailed API documentation to guide developers in using the inventory and sales metrics features effectively.	TODO	HIGH	\N	2026-07-29 00:00:00	1000	cmsj6sx9c003h8zy57oeiyolg	cmsj6sx9o00438zy5rfkt9n12	cmsj486oc00028zetwmownyk5	\N	2026-08-07 16:56:40.046	2026-08-07 16:56:40.046
cmsj6sx9r004b8zy5bevehxc6	Subtask 1	\N	TODO	HIGH	\N	2026-09-12 00:00:00	1000	cmsj6sx9c003h8zy57oeiyolg	\N	cmsj6sx9c003h8zy57oeiyolg	cmsj6sx9p00498zy53s589cus	2026-08-07 16:56:40.047	2026-08-07 16:56:40.047
cmsj6sx9s004d8zy52yculb3v	Subtask 2	\N	TODO	LOW	\N	2026-09-15 00:00:00	2000	cmsj6sx9c003h8zy57oeiyolg	\N	cmsj6sx9c003h8zy57oeiyolg	cmsj6sx9p00498zy53s589cus	2026-08-07 16:56:40.049	2026-08-07 16:56:40.049
cmsj6sx9t004f8zy59ryxeel9	Subtask 3	\N	TODO	MEDIUM	\N	2026-09-18 00:00:00	3000	cmsj6sx9c003h8zy57oeiyolg	\N	cmsj6sx9c003h8zy57oeiyolg	cmsj6sx9p00498zy53s589cus	2026-08-07 16:56:40.05	2026-08-07 16:56:40.05
cmsj6sx9u004l8zy5ktpl9n1y	Implement Search Function	\N	TODO	MEDIUM	\N	2026-07-29 00:00:00	2000	cmsj6sx9c003h8zy57oeiyolg	cmsj6sx9o00438zy5rfkt9n12	cmsj6sx9c003h8zy57oeiyolg	\N	2026-08-07 16:56:40.051	2026-08-07 16:56:40.051
cmsj6sx9w004n8zy5er15uu4u	Deploy to Production	\N	TODO	URGENT	\N	2026-07-29 00:00:00	3000	cmsj6sx9c003h8zy57oeiyolg	cmsj6sx9p00458zy5g7snaevc	cmsj6sx9c003h8zy57oeiyolg	\N	2026-08-07 16:56:40.052	2026-08-07 16:56:40.052
cmsj6sx9y004p8zy51xcokher	Code Review Completed	\N	DOING	MEDIUM	\N	2026-07-29 00:00:00	4000	cmsj6sx9c003h8zy57oeiyolg	cmsj6sx9p00458zy5g7snaevc	cmsj6sx9c003h8zy57oeiyolg	\N	2026-08-07 16:56:40.054	2026-08-07 16:56:40.054
cmsj6sx9z004r8zy549bw9p3p	Design Mockups Finalized	\N	DOING	HIGH	\N	2026-07-29 00:00:00	5000	cmsj6sx9c003h8zy57oeiyolg	cmsj6sx9o00438zy5rfkt9n12	cmsj6sx9c003h8zy57oeiyolg	\N	2026-08-07 16:56:40.056	2026-08-07 16:56:40.056
cmsj6sxa1004t8zy5d4pe80dl	Feature Testing Passed	\N	COMPLETED	MEDIUM	\N	2026-07-30 00:00:00	6000	cmsj6sx9c003h8zy57oeiyolg	cmsj6sx9p00478zy53geqr9h4	cmsj6sx9c003h8zy57oeiyolg	\N	2026-08-07 16:56:40.057	2026-08-07 16:56:40.057
cmsj6sxa2004v8zy5hbjzulb1	UI Design Updated	\N	COMPLETED	LOW	\N	2026-07-31 00:00:00	7000	cmsj6sx9c003h8zy57oeiyolg	cmsj6sx9o00438zy5rfkt9n12	cmsj6sx9c003h8zy57oeiyolg	\N	2026-08-07 16:56:40.059	2026-08-07 16:56:40.059
cmsj6sxa4004x8zy5d9fm0tpj	Security Audit Scheduled	\N	COMPLETED	HIGH	\N	2026-08-01 00:00:00	8000	cmsj6sx9c003h8zy57oeiyolg	cmsj6sx9p00478zy53geqr9h4	cmsj6sx9c003h8zy57oeiyolg	\N	2026-08-07 16:56:40.06	2026-08-07 16:56:40.06
cmsj6sxa5004z8zy5j51eed0h	UI Review Session	\N	ON_HOLD	MEDIUM	\N	\N	9000	cmsj6sx9c003h8zy57oeiyolg	cmsj6sx9o00438zy5rfkt9n12	cmsj6sx9c003h8zy57oeiyolg	\N	2026-08-07 16:56:40.061	2026-08-07 16:56:40.061
cmsj6sxa600518zy5ysm2jtc3	Backend Refactor	\N	ON_HOLD	HIGH	\N	\N	10000	cmsj6sx9c003h8zy57oeiyolg	cmsj6sx9p00458zy5g7snaevc	cmsj6sx9c003h8zy57oeiyolg	\N	2026-08-07 16:56:40.063	2026-08-07 16:56:40.063
cmsj6sxa700538zy5qdl5pw4h	User Feedback Analysis	\N	ON_HOLD	LOW	\N	\N	11000	cmsj6sx9c003h8zy57oeiyolg	cmsj6sx9p00478zy53geqr9h4	cmsj6sx9c003h8zy57oeiyolg	\N	2026-08-07 16:56:40.064	2026-08-07 16:56:40.064
cmsj6sxa900558zy5p1t6yli8	Performance Optimization	\N	ON_HOLD	MEDIUM	\N	\N	12000	cmsj6sx9c003h8zy57oeiyolg	cmsj6sx9p00458zy5g7snaevc	cmsj6sx9c003h8zy57oeiyolg	\N	2026-08-07 16:56:40.065	2026-08-07 16:56:40.065
cmsjzgyih000s8zigapwp7hfn	Write API Documentation	Create clear and detailed API documentation to guide developers in using the inventory and sales metrics features effectively.	TODO	HIGH	\N	2026-07-29 00:00:00	1000	cmsjzgyhe00008zig3qj26yd8	cmsjzgyid000m8zigw4tmttf4	cmsj486oc00028zetwmownyk5	\N	2026-08-08 06:19:10.649	2026-08-08 06:19:10.649
cmsj8c16h000u8zlp28kieihg	Subtask 1	\N	TODO	HIGH	\N	2026-09-12 00:00:00	1000	cmsj8c15b00008zlp0mwhbspd	\N	cmsj8c15b00008zlp0mwhbspd	cmsj8c16d000s8zlpwnd2pmz1	2026-08-07 17:39:31.194	2026-08-07 17:39:31.194
cmsj8c16d000s8zlpwnd2pmz1	Write API Documentation	Create clear and detailed API documentation to guide developers in using the inventory and sales metrics features effectively.	TODO	HIGH	\N	2026-07-29 00:00:00	1000	cmsj8c15b00008zlp0mwhbspd	cmsj8c16a000m8zlp7kkthhoq	cmsj486oc00028zetwmownyk5	\N	2026-08-07 17:39:31.19	2026-08-07 17:39:31.19
cmsj8c16j000w8zlpqyukw5tf	Subtask 2	\N	TODO	LOW	\N	2026-09-15 00:00:00	2000	cmsj8c15b00008zlp0mwhbspd	\N	cmsj8c15b00008zlp0mwhbspd	cmsj8c16d000s8zlpwnd2pmz1	2026-08-07 17:39:31.195	2026-08-07 17:39:31.195
cmsj8c16k000y8zlpubpgt908	Subtask 3	\N	TODO	MEDIUM	\N	2026-09-18 00:00:00	3000	cmsj8c15b00008zlp0mwhbspd	\N	cmsj8c15b00008zlp0mwhbspd	cmsj8c16d000s8zlpwnd2pmz1	2026-08-07 17:39:31.197	2026-08-07 17:39:31.197
cmsj8c16n00148zlplwh9wgj0	Implement Search Function	\N	TODO	MEDIUM	\N	2026-07-29 00:00:00	2000	cmsj8c15b00008zlp0mwhbspd	cmsj8c16a000m8zlp7kkthhoq	cmsj8c15b00008zlp0mwhbspd	\N	2026-08-07 17:39:31.2	2026-08-07 17:39:31.2
cmsj8c16p00168zlp7jla06ye	Deploy to Production	\N	TODO	URGENT	\N	2026-07-29 00:00:00	3000	cmsj8c15b00008zlp0mwhbspd	cmsj8c16c000o8zlpm8rajb2y	cmsj8c15b00008zlp0mwhbspd	\N	2026-08-07 17:39:31.202	2026-08-07 17:39:31.202
cmsj8c16r00188zlp6nxyfu6o	Code Review Completed	\N	DOING	MEDIUM	\N	2026-07-29 00:00:00	4000	cmsj8c15b00008zlp0mwhbspd	cmsj8c16c000o8zlpm8rajb2y	cmsj8c15b00008zlp0mwhbspd	\N	2026-08-07 17:39:31.204	2026-08-07 17:39:31.204
cmsj8c16t001a8zlp1avf9o99	Design Mockups Finalized	\N	DOING	HIGH	\N	2026-07-29 00:00:00	5000	cmsj8c15b00008zlp0mwhbspd	cmsj8c16a000m8zlp7kkthhoq	cmsj8c15b00008zlp0mwhbspd	\N	2026-08-07 17:39:31.205	2026-08-07 17:39:31.205
cmsj8c16u001c8zlpvdendtmu	Feature Testing Passed	\N	COMPLETED	MEDIUM	\N	2026-07-30 00:00:00	6000	cmsj8c15b00008zlp0mwhbspd	cmsj8c16c000q8zlpmlvs3nm3	cmsj8c15b00008zlp0mwhbspd	\N	2026-08-07 17:39:31.207	2026-08-07 17:39:31.207
cmsj8c16w001e8zlpngvkop8w	UI Design Updated	\N	COMPLETED	LOW	\N	2026-07-31 00:00:00	7000	cmsj8c15b00008zlp0mwhbspd	cmsj8c16a000m8zlp7kkthhoq	cmsj8c15b00008zlp0mwhbspd	\N	2026-08-07 17:39:31.208	2026-08-07 17:39:31.208
cmsj8c16x001g8zlpbpgawfif	Security Audit Scheduled	\N	COMPLETED	HIGH	\N	2026-08-01 00:00:00	8000	cmsj8c15b00008zlp0mwhbspd	cmsj8c16c000q8zlpmlvs3nm3	cmsj8c15b00008zlp0mwhbspd	\N	2026-08-07 17:39:31.21	2026-08-07 17:39:31.21
cmsj8c16z001i8zlpal3sm0wk	UI Review Session	\N	ON_HOLD	MEDIUM	\N	\N	9000	cmsj8c15b00008zlp0mwhbspd	cmsj8c16a000m8zlp7kkthhoq	cmsj8c15b00008zlp0mwhbspd	\N	2026-08-07 17:39:31.211	2026-08-07 17:39:31.211
cmsj8c170001k8zlp207uvx0k	Backend Refactor	\N	ON_HOLD	HIGH	\N	\N	10000	cmsj8c15b00008zlp0mwhbspd	cmsj8c16c000o8zlpm8rajb2y	cmsj8c15b00008zlp0mwhbspd	\N	2026-08-07 17:39:31.213	2026-08-07 17:39:31.213
cmsj8c172001m8zlp2mumbe0o	User Feedback Analysis	\N	ON_HOLD	LOW	\N	\N	11000	cmsj8c15b00008zlp0mwhbspd	cmsj8c16c000q8zlpmlvs3nm3	cmsj8c15b00008zlp0mwhbspd	\N	2026-08-07 17:39:31.215	2026-08-07 17:39:31.215
cmsj8c174001o8zlpufpstgya	Performance Optimization	\N	ON_HOLD	MEDIUM	\N	\N	12000	cmsj8c15b00008zlp0mwhbspd	cmsj8c16c000o8zlpm8rajb2y	cmsj8c15b00008zlp0mwhbspd	\N	2026-08-07 17:39:31.216	2026-08-07 17:39:31.216
cmsj8u2y5000s8zp23c2e1mzi	Write API Documentation	Create clear and detailed API documentation to guide developers in using the inventory and sales metrics features effectively.	TODO	HIGH	\N	2026-07-29 00:00:00	1000	cmsj8u2xc00008zp2ha0k6iz7	cmsj8u2y2000m8zp2i3n8n71l	cmsj486oc00028zetwmownyk5	\N	2026-08-07 17:53:33.294	2026-08-07 17:53:33.294
cmsj8u2ya000u8zp20bo95v5b	Subtask 1	\N	TODO	HIGH	\N	2026-09-12 00:00:00	1000	cmsj8u2xc00008zp2ha0k6iz7	\N	cmsj8u2xc00008zp2ha0k6iz7	cmsj8u2y5000s8zp23c2e1mzi	2026-08-07 17:53:33.299	2026-08-07 17:53:33.299
cmsj8u2yc000w8zp21z3yq3rx	Subtask 2	\N	TODO	LOW	\N	2026-09-15 00:00:00	2000	cmsj8u2xc00008zp2ha0k6iz7	\N	cmsj8u2xc00008zp2ha0k6iz7	cmsj8u2y5000s8zp23c2e1mzi	2026-08-07 17:53:33.3	2026-08-07 17:53:33.3
cmsj8u2ye000y8zp2v91vsylb	Subtask 3	\N	TODO	MEDIUM	\N	2026-09-18 00:00:00	3000	cmsj8u2xc00008zp2ha0k6iz7	\N	cmsj8u2xc00008zp2ha0k6iz7	cmsj8u2y5000s8zp23c2e1mzi	2026-08-07 17:53:33.303	2026-08-07 17:53:33.303
cmsj8u2yi00148zp24h132juq	Implement Search Function	\N	TODO	MEDIUM	\N	2026-07-29 00:00:00	2000	cmsj8u2xc00008zp2ha0k6iz7	cmsj8u2y2000m8zp2i3n8n71l	cmsj8u2xc00008zp2ha0k6iz7	\N	2026-08-07 17:53:33.306	2026-08-07 17:53:33.306
cmsj8u2yl00168zp242wmiasl	Deploy to Production	\N	TODO	URGENT	\N	2026-07-29 00:00:00	3000	cmsj8u2xc00008zp2ha0k6iz7	cmsj8u2y4000o8zp2ffhx33ub	cmsj8u2xc00008zp2ha0k6iz7	\N	2026-08-07 17:53:33.309	2026-08-07 17:53:33.309
cmsj8u2yn00188zp2hiwxua3t	Code Review Completed	\N	DOING	MEDIUM	\N	2026-07-29 00:00:00	4000	cmsj8u2xc00008zp2ha0k6iz7	cmsj8u2y4000o8zp2ffhx33ub	cmsj8u2xc00008zp2ha0k6iz7	\N	2026-08-07 17:53:33.312	2026-08-07 17:53:33.312
cmsj8u2yp001a8zp21n096g6a	Design Mockups Finalized	\N	DOING	HIGH	\N	2026-07-29 00:00:00	5000	cmsj8u2xc00008zp2ha0k6iz7	cmsj8u2y2000m8zp2i3n8n71l	cmsj8u2xc00008zp2ha0k6iz7	\N	2026-08-07 17:53:33.314	2026-08-07 17:53:33.314
cmsj8u2yr001c8zp285mr3439	Feature Testing Passed	\N	COMPLETED	MEDIUM	\N	2026-07-30 00:00:00	6000	cmsj8u2xc00008zp2ha0k6iz7	cmsj8u2y4000q8zp24o34dasf	cmsj8u2xc00008zp2ha0k6iz7	\N	2026-08-07 17:53:33.316	2026-08-07 17:53:33.316
cmsj8u2yt001e8zp2xxpcv8sq	UI Design Updated	\N	COMPLETED	LOW	\N	2026-07-31 00:00:00	7000	cmsj8u2xc00008zp2ha0k6iz7	cmsj8u2y2000m8zp2i3n8n71l	cmsj8u2xc00008zp2ha0k6iz7	\N	2026-08-07 17:53:33.318	2026-08-07 17:53:33.318
cmsj8u2yw001g8zp2obr4e3qn	Security Audit Scheduled	\N	COMPLETED	HIGH	\N	2026-08-01 00:00:00	8000	cmsj8u2xc00008zp2ha0k6iz7	cmsj8u2y4000q8zp24o34dasf	cmsj8u2xc00008zp2ha0k6iz7	\N	2026-08-07 17:53:33.32	2026-08-07 17:53:33.32
cmsj8u2yy001i8zp24c4hwaug	UI Review Session	\N	ON_HOLD	MEDIUM	\N	\N	9000	cmsj8u2xc00008zp2ha0k6iz7	cmsj8u2y2000m8zp2i3n8n71l	cmsj8u2xc00008zp2ha0k6iz7	\N	2026-08-07 17:53:33.323	2026-08-07 17:53:33.323
cmsj8u2z0001k8zp21io9rvf7	Backend Refactor	\N	ON_HOLD	HIGH	\N	\N	10000	cmsj8u2xc00008zp2ha0k6iz7	cmsj8u2y4000o8zp2ffhx33ub	cmsj8u2xc00008zp2ha0k6iz7	\N	2026-08-07 17:53:33.325	2026-08-07 17:53:33.325
cmsj8u2z2001m8zp2cq5bbhxy	User Feedback Analysis	\N	ON_HOLD	LOW	\N	\N	11000	cmsj8u2xc00008zp2ha0k6iz7	cmsj8u2y4000q8zp24o34dasf	cmsj8u2xc00008zp2ha0k6iz7	\N	2026-08-07 17:53:33.327	2026-08-07 17:53:33.327
cmsj8u2z4001o8zp2j3il4jia	Performance Optimization	\N	ON_HOLD	MEDIUM	\N	\N	12000	cmsj8u2xc00008zp2ha0k6iz7	cmsj8u2y4000o8zp2ffhx33ub	cmsj8u2xc00008zp2ha0k6iz7	\N	2026-08-07 17:53:33.328	2026-08-07 17:53:33.328
cmsjsm9c9002j8zp2nddwi6br	Subtask 1	\N	TODO	HIGH	\N	2026-09-12 00:00:00	1000	cmsjsm9al001p8zp23wiz7gxl	\N	cmsjsm9al001p8zp23wiz7gxl	cmsjsm9c0002h8zp2x1uwisuo	2026-08-08 03:07:20.649	2026-08-08 03:07:20.649
cmsjsm9cc002l8zp2inqnv5vz	Subtask 2	\N	TODO	LOW	\N	2026-09-15 00:00:00	2000	cmsjsm9al001p8zp23wiz7gxl	\N	cmsjsm9al001p8zp23wiz7gxl	cmsjsm9c0002h8zp2x1uwisuo	2026-08-08 03:07:20.652	2026-08-08 03:07:20.652
cmsjsm9ce002n8zp2x9n5u66m	Subtask 3	\N	TODO	MEDIUM	\N	2026-09-18 00:00:00	3000	cmsjsm9al001p8zp23wiz7gxl	\N	cmsjsm9al001p8zp23wiz7gxl	cmsjsm9c0002h8zp2x1uwisuo	2026-08-08 03:07:20.654	2026-08-08 03:07:20.654
cmsjsm9cj002t8zp2jttyjstt	Implement Search Function	\N	TODO	MEDIUM	\N	2026-07-29 00:00:00	2000	cmsjsm9al001p8zp23wiz7gxl	cmsjsm9bv002b8zp2tl5l26k1	cmsjsm9al001p8zp23wiz7gxl	\N	2026-08-08 03:07:20.659	2026-08-08 03:07:20.659
cmsjsm9cn002v8zp2c2nwhkhv	Deploy to Production	\N	TODO	URGENT	\N	2026-07-29 00:00:00	3000	cmsjsm9al001p8zp23wiz7gxl	cmsjsm9by002d8zp2qe247g98	cmsjsm9al001p8zp23wiz7gxl	\N	2026-08-08 03:07:20.664	2026-08-08 03:07:20.664
cmsjsm9cq002x8zp2nij49oov	Code Review Completed	\N	DOING	MEDIUM	\N	2026-07-29 00:00:00	4000	cmsjsm9al001p8zp23wiz7gxl	cmsjsm9by002d8zp2qe247g98	cmsjsm9al001p8zp23wiz7gxl	\N	2026-08-08 03:07:20.667	2026-08-08 03:07:20.667
cmsjsm9ct002z8zp2fb635cqv	Design Mockups Finalized	\N	DOING	HIGH	\N	2026-07-29 00:00:00	5000	cmsjsm9al001p8zp23wiz7gxl	cmsjsm9bv002b8zp2tl5l26k1	cmsjsm9al001p8zp23wiz7gxl	\N	2026-08-08 03:07:20.67	2026-08-08 03:07:20.67
cmsjsm9cw00318zp2nhw8x88x	Feature Testing Passed	\N	COMPLETED	MEDIUM	\N	2026-07-30 00:00:00	6000	cmsjsm9al001p8zp23wiz7gxl	cmsjsm9bz002f8zp2z3k40k3q	cmsjsm9al001p8zp23wiz7gxl	\N	2026-08-08 03:07:20.672	2026-08-08 03:07:20.672
cmsjsm9cy00338zp2u4r8xdwj	UI Design Updated	\N	COMPLETED	LOW	\N	2026-07-31 00:00:00	7000	cmsjsm9al001p8zp23wiz7gxl	cmsjsm9bv002b8zp2tl5l26k1	cmsjsm9al001p8zp23wiz7gxl	\N	2026-08-08 03:07:20.674	2026-08-08 03:07:20.674
cmsjsm9d000358zp2vx8e8t46	Security Audit Scheduled	\N	COMPLETED	HIGH	\N	2026-08-01 00:00:00	8000	cmsjsm9al001p8zp23wiz7gxl	cmsjsm9bz002f8zp2z3k40k3q	cmsjsm9al001p8zp23wiz7gxl	\N	2026-08-08 03:07:20.677	2026-08-08 03:07:20.677
cmsjsm9d300378zp2rblzr1ub	UI Review Session	\N	ON_HOLD	MEDIUM	\N	\N	9000	cmsjsm9al001p8zp23wiz7gxl	cmsjsm9bv002b8zp2tl5l26k1	cmsjsm9al001p8zp23wiz7gxl	\N	2026-08-08 03:07:20.679	2026-08-08 03:07:20.679
cmsjsm9d500398zp27lbtm4wv	Backend Refactor	\N	ON_HOLD	HIGH	\N	\N	10000	cmsjsm9al001p8zp23wiz7gxl	cmsjsm9by002d8zp2qe247g98	cmsjsm9al001p8zp23wiz7gxl	\N	2026-08-08 03:07:20.682	2026-08-08 03:07:20.682
cmsjsm9d8003b8zp2mxx4rvu1	User Feedback Analysis	\N	ON_HOLD	LOW	\N	\N	11000	cmsjsm9al001p8zp23wiz7gxl	cmsjsm9bz002f8zp2z3k40k3q	cmsjsm9al001p8zp23wiz7gxl	\N	2026-08-08 03:07:20.684	2026-08-08 03:07:20.684
cmsjsm9da003d8zp22kd4ldcy	Performance Optimization	\N	ON_HOLD	MEDIUM	\N	\N	12000	cmsjsm9al001p8zp23wiz7gxl	cmsjsm9by002d8zp2qe247g98	cmsjsm9al001p8zp23wiz7gxl	\N	2026-08-08 03:07:20.686	2026-08-08 03:07:20.686
cmsjsm9c0002h8zp2x1uwisuo	Write API Documentation	Create clear and detailed API documentation to guide developers in using the inventory and sales metrics features effectively.	TODO	HIGH	\N	2026-07-29 00:00:00	1000	cmsjsm9al001p8zp23wiz7gxl	cmsjsm9bv002b8zp2tl5l26k1	cmsj486oc00028zetwmownyk5	\N	2026-08-08 03:07:20.64	2026-08-08 03:07:25.637
cmsjt6x3t000s8ze1esghzjaq	Write API Documentation	Create clear and detailed API documentation to guide developers in using the inventory and sales metrics features effectively.	TODO	HIGH	\N	2026-07-29 00:00:00	1000	cmsjt6x2l00008ze1ej6rxw57	cmsjt6x3o000m8ze1o2vdwn0g	cmsj486oc00028zetwmownyk5	\N	2026-08-08 03:23:24.569	2026-08-08 03:23:24.569
cmsjt6x40000u8ze1q6d2yv38	Subtask 1	\N	TODO	HIGH	\N	2026-09-12 00:00:00	1000	cmsjt6x2l00008ze1ej6rxw57	\N	cmsjt6x2l00008ze1ej6rxw57	cmsjt6x3t000s8ze1esghzjaq	2026-08-08 03:23:24.576	2026-08-08 03:23:24.576
cmsjt6x42000w8ze1kmzg0dx9	Subtask 2	\N	TODO	LOW	\N	2026-09-15 00:00:00	2000	cmsjt6x2l00008ze1ej6rxw57	\N	cmsjt6x2l00008ze1ej6rxw57	cmsjt6x3t000s8ze1esghzjaq	2026-08-08 03:23:24.579	2026-08-08 03:23:24.579
cmsjt6x44000y8ze1cmhusv9x	Subtask 3	\N	TODO	MEDIUM	\N	2026-09-18 00:00:00	3000	cmsjt6x2l00008ze1ej6rxw57	\N	cmsjt6x2l00008ze1ej6rxw57	cmsjt6x3t000s8ze1esghzjaq	2026-08-08 03:23:24.581	2026-08-08 03:23:24.581
cmsjt6x4900148ze1os2a2ylf	Implement Search Function	\N	TODO	MEDIUM	\N	2026-07-29 00:00:00	2000	cmsjt6x2l00008ze1ej6rxw57	cmsjt6x3o000m8ze1o2vdwn0g	cmsjt6x2l00008ze1ej6rxw57	\N	2026-08-08 03:23:24.585	2026-08-08 03:23:24.585
cmsjt6x4d00168ze192p09rqe	Deploy to Production	\N	TODO	URGENT	\N	2026-07-29 00:00:00	3000	cmsjt6x2l00008ze1ej6rxw57	cmsjt6x3r000o8ze12ugywvz9	cmsjt6x2l00008ze1ej6rxw57	\N	2026-08-08 03:23:24.589	2026-08-08 03:23:24.589
cmsjt6x4g00188ze14onk9ku8	Code Review Completed	\N	DOING	MEDIUM	\N	2026-07-29 00:00:00	4000	cmsjt6x2l00008ze1ej6rxw57	cmsjt6x3r000o8ze12ugywvz9	cmsjt6x2l00008ze1ej6rxw57	\N	2026-08-08 03:23:24.592	2026-08-08 03:23:24.592
cmsjt6x4j001a8ze10fmywp9l	Design Mockups Finalized	\N	DOING	HIGH	\N	2026-07-29 00:00:00	5000	cmsjt6x2l00008ze1ej6rxw57	cmsjt6x3o000m8ze1o2vdwn0g	cmsjt6x2l00008ze1ej6rxw57	\N	2026-08-08 03:23:24.595	2026-08-08 03:23:24.595
cmsjt6x4o001e8ze14x0v48s5	UI Design Updated	\N	COMPLETED	LOW	\N	2026-07-31 00:00:00	7000	cmsjt6x2l00008ze1ej6rxw57	cmsjt6x3o000m8ze1o2vdwn0g	cmsjt6x2l00008ze1ej6rxw57	\N	2026-08-08 03:23:24.601	2026-08-08 03:23:24.601
cmsjt6x4q001g8ze1mxfn2v1w	Security Audit Scheduled	\N	COMPLETED	HIGH	\N	2026-08-01 00:00:00	8000	cmsjt6x2l00008ze1ej6rxw57	cmsjt6x3r000q8ze1bhfj29lf	cmsjt6x2l00008ze1ej6rxw57	\N	2026-08-08 03:23:24.603	2026-08-08 03:23:24.603
cmsjt6x4t001i8ze10lrbu09k	UI Review Session	\N	ON_HOLD	MEDIUM	\N	\N	9000	cmsjt6x2l00008ze1ej6rxw57	cmsjt6x3o000m8ze1o2vdwn0g	cmsjt6x2l00008ze1ej6rxw57	\N	2026-08-08 03:23:24.605	2026-08-08 03:23:24.605
cmsjt6x4v001k8ze1kgunlol6	Backend Refactor	\N	ON_HOLD	HIGH	\N	\N	10000	cmsjt6x2l00008ze1ej6rxw57	cmsjt6x3r000o8ze12ugywvz9	cmsjt6x2l00008ze1ej6rxw57	\N	2026-08-08 03:23:24.608	2026-08-08 03:23:24.608
cmsjt6x4x001m8ze1u85c73io	User Feedback Analysis	\N	ON_HOLD	LOW	\N	\N	11000	cmsjt6x2l00008ze1ej6rxw57	cmsjt6x3r000q8ze1bhfj29lf	cmsjt6x2l00008ze1ej6rxw57	\N	2026-08-08 03:23:24.61	2026-08-08 03:23:24.61
cmsjt6x50001o8ze1asbxgnx7	Performance Optimization	\N	ON_HOLD	MEDIUM	\N	\N	12000	cmsjt6x2l00008ze1ej6rxw57	cmsjt6x3r000o8ze12ugywvz9	cmsjt6x2l00008ze1ej6rxw57	\N	2026-08-08 03:23:24.612	2026-08-08 03:23:24.612
cmsjt6x4m001c8ze19xdzas3x	Feature Testing Passed	\N	DOING	MEDIUM	\N	2026-07-30 00:00:00	4500	cmsjt6x2l00008ze1ej6rxw57	cmsjt6x3r000q8ze1bhfj29lf	cmsjt6x2l00008ze1ej6rxw57	\N	2026-08-08 03:23:24.598	2026-08-08 03:41:32.497
cmsjwa68y000s8zzvttaqonu4	Write API Documentation	Create clear and detailed API documentation to guide developers in using the inventory and sales metrics features effectively.	TODO	HIGH	\N	2026-07-29 00:00:00	1000	cmsjwa67w00008zzvsl6pnn0e	cmsjwa68v000m8zzv555yqdod	cmsj486oc00028zetwmownyk5	\N	2026-08-08 04:49:55.234	2026-08-08 04:49:55.234
cmsjwa691000u8zzvbgohtw40	Subtask 1	\N	TODO	HIGH	\N	2026-09-12 00:00:00	1000	cmsjwa67w00008zzvsl6pnn0e	\N	cmsjwa67w00008zzvsl6pnn0e	cmsjwa68y000s8zzvttaqonu4	2026-08-08 04:49:55.238	2026-08-08 04:49:55.238
cmsjwa693000w8zzvl29ryayw	Subtask 2	\N	TODO	LOW	\N	2026-09-15 00:00:00	2000	cmsjwa67w00008zzvsl6pnn0e	\N	cmsjwa67w00008zzvsl6pnn0e	cmsjwa68y000s8zzvttaqonu4	2026-08-08 04:49:55.239	2026-08-08 04:49:55.239
cmsjwa694000y8zzvhjouef1d	Subtask 3	\N	TODO	MEDIUM	\N	2026-09-18 00:00:00	3000	cmsjwa67w00008zzvsl6pnn0e	\N	cmsjwa67w00008zzvsl6pnn0e	cmsjwa68y000s8zzvttaqonu4	2026-08-08 04:49:55.241	2026-08-08 04:49:55.241
cmsjwa69800148zzvquzr0h9d	Implement Search Function	\N	TODO	MEDIUM	\N	2026-07-29 00:00:00	2000	cmsjwa67w00008zzvsl6pnn0e	cmsjwa68v000m8zzv555yqdod	cmsjwa67w00008zzvsl6pnn0e	\N	2026-08-08 04:49:55.244	2026-08-08 04:49:55.244
cmsjwa69a00168zzv3mi7rlrj	Deploy to Production	\N	TODO	URGENT	\N	2026-07-29 00:00:00	3000	cmsjwa67w00008zzvsl6pnn0e	cmsjwa68w000o8zzvr89fdtri	cmsjwa67w00008zzvsl6pnn0e	\N	2026-08-08 04:49:55.246	2026-08-08 04:49:55.246
cmsjwa69b00188zzv94izh1jo	Code Review Completed	\N	DOING	MEDIUM	\N	2026-07-29 00:00:00	4000	cmsjwa67w00008zzvsl6pnn0e	cmsjwa68w000o8zzvr89fdtri	cmsjwa67w00008zzvsl6pnn0e	\N	2026-08-08 04:49:55.248	2026-08-08 04:49:55.248
cmsjwa69d001a8zzvysw0oqmn	Design Mockups Finalized	\N	DOING	HIGH	\N	2026-07-29 00:00:00	5000	cmsjwa67w00008zzvsl6pnn0e	cmsjwa68v000m8zzv555yqdod	cmsjwa67w00008zzvsl6pnn0e	\N	2026-08-08 04:49:55.25	2026-08-08 04:49:55.25
cmsjwa69f001c8zzvkid9isfg	Feature Testing Passed	\N	COMPLETED	MEDIUM	\N	2026-07-30 00:00:00	6000	cmsjwa67w00008zzvsl6pnn0e	cmsjwa68x000q8zzvu4bpx0rz	cmsjwa67w00008zzvsl6pnn0e	\N	2026-08-08 04:49:55.251	2026-08-08 04:49:55.251
cmsjwa69g001e8zzv05x6kcvk	UI Design Updated	\N	COMPLETED	LOW	\N	2026-07-31 00:00:00	7000	cmsjwa67w00008zzvsl6pnn0e	cmsjwa68v000m8zzv555yqdod	cmsjwa67w00008zzvsl6pnn0e	\N	2026-08-08 04:49:55.253	2026-08-08 04:49:55.253
cmsjwa69i001g8zzvn1z7armc	Security Audit Scheduled	\N	COMPLETED	HIGH	\N	2026-08-01 00:00:00	8000	cmsjwa67w00008zzvsl6pnn0e	cmsjwa68x000q8zzvu4bpx0rz	cmsjwa67w00008zzvsl6pnn0e	\N	2026-08-08 04:49:55.254	2026-08-08 04:49:55.254
cmsjwa69j001i8zzvr6vlevfj	UI Review Session	\N	ON_HOLD	MEDIUM	\N	\N	9000	cmsjwa67w00008zzvsl6pnn0e	cmsjwa68v000m8zzv555yqdod	cmsjwa67w00008zzvsl6pnn0e	\N	2026-08-08 04:49:55.256	2026-08-08 04:49:55.256
cmsjwa69l001k8zzvovpo9sdv	Backend Refactor	\N	ON_HOLD	HIGH	\N	\N	10000	cmsjwa67w00008zzvsl6pnn0e	cmsjwa68w000o8zzvr89fdtri	cmsjwa67w00008zzvsl6pnn0e	\N	2026-08-08 04:49:55.257	2026-08-08 04:49:55.257
cmsjwa69n001m8zzv74u2lwop	User Feedback Analysis	\N	ON_HOLD	LOW	\N	\N	11000	cmsjwa67w00008zzvsl6pnn0e	cmsjwa68x000q8zzvu4bpx0rz	cmsjwa67w00008zzvsl6pnn0e	\N	2026-08-08 04:49:55.259	2026-08-08 04:49:55.259
cmsjwa69o001o8zzv8zkq9182	Performance Optimization	\N	ON_HOLD	MEDIUM	\N	\N	12000	cmsjwa67w00008zzvsl6pnn0e	cmsjwa68w000o8zzvr89fdtri	cmsjwa67w00008zzvsl6pnn0e	\N	2026-08-08 04:49:55.261	2026-08-08 04:49:55.261
cmsjzgyil000u8zigvqtpu3f3	Subtask 1	\N	TODO	HIGH	\N	2026-09-12 00:00:00	1000	cmsjzgyhe00008zig3qj26yd8	\N	cmsjzgyhe00008zig3qj26yd8	cmsjzgyih000s8zigapwp7hfn	2026-08-08 06:19:10.654	2026-08-08 06:19:10.654
cmsjzgyin000w8ziguvgeeb8c	Subtask 2	\N	TODO	LOW	\N	2026-09-15 00:00:00	2000	cmsjzgyhe00008zig3qj26yd8	\N	cmsjzgyhe00008zig3qj26yd8	cmsjzgyih000s8zigapwp7hfn	2026-08-08 06:19:10.655	2026-08-08 06:19:10.655
cmsjzgyio000y8zigt0tipsa1	Subtask 3	\N	TODO	MEDIUM	\N	2026-09-18 00:00:00	3000	cmsjzgyhe00008zig3qj26yd8	\N	cmsjzgyhe00008zig3qj26yd8	cmsjzgyih000s8zigapwp7hfn	2026-08-08 06:19:10.657	2026-08-08 06:19:10.657
cmsjzgyir00148zig2memcdm0	Implement Search Function	\N	TODO	MEDIUM	\N	2026-07-29 00:00:00	2000	cmsjzgyhe00008zig3qj26yd8	cmsjzgyid000m8zigw4tmttf4	cmsjzgyhe00008zig3qj26yd8	\N	2026-08-08 06:19:10.659	2026-08-08 06:19:10.659
cmsjzgyit00168zig4qdcs6uv	Deploy to Production	\N	TODO	URGENT	\N	2026-07-29 00:00:00	3000	cmsjzgyhe00008zig3qj26yd8	cmsjzgyif000o8zigcu05i1d8	cmsjzgyhe00008zig3qj26yd8	\N	2026-08-08 06:19:10.661	2026-08-08 06:19:10.661
cmsjzgyiv00188zigzv0oitn8	Code Review Completed	\N	DOING	MEDIUM	\N	2026-07-29 00:00:00	4000	cmsjzgyhe00008zig3qj26yd8	cmsjzgyif000o8zigcu05i1d8	cmsjzgyhe00008zig3qj26yd8	\N	2026-08-08 06:19:10.663	2026-08-08 06:19:10.663
cmsjzgyix001a8zighti2ndq2	Design Mockups Finalized	\N	DOING	HIGH	\N	2026-07-29 00:00:00	5000	cmsjzgyhe00008zig3qj26yd8	cmsjzgyid000m8zigw4tmttf4	cmsjzgyhe00008zig3qj26yd8	\N	2026-08-08 06:19:10.665	2026-08-08 06:19:10.665
cmsjzgyiy001c8zigl67isa16	Feature Testing Passed	\N	COMPLETED	MEDIUM	\N	2026-07-30 00:00:00	6000	cmsjzgyhe00008zig3qj26yd8	cmsjzgyif000q8zigjaqve3n2	cmsjzgyhe00008zig3qj26yd8	\N	2026-08-08 06:19:10.667	2026-08-08 06:19:10.667
cmsjzgyj0001e8zighnopkxgx	UI Design Updated	\N	COMPLETED	LOW	\N	2026-07-31 00:00:00	7000	cmsjzgyhe00008zig3qj26yd8	cmsjzgyid000m8zigw4tmttf4	cmsjzgyhe00008zig3qj26yd8	\N	2026-08-08 06:19:10.668	2026-08-08 06:19:10.668
cmsjzgyj2001g8zigvao7spvi	Security Audit Scheduled	\N	COMPLETED	HIGH	\N	2026-08-01 00:00:00	8000	cmsjzgyhe00008zig3qj26yd8	cmsjzgyif000q8zigjaqve3n2	cmsjzgyhe00008zig3qj26yd8	\N	2026-08-08 06:19:10.67	2026-08-08 06:19:10.67
cmsjzgyj3001i8zig06eyi6gx	UI Review Session	\N	ON_HOLD	MEDIUM	\N	\N	9000	cmsjzgyhe00008zig3qj26yd8	cmsjzgyid000m8zigw4tmttf4	cmsjzgyhe00008zig3qj26yd8	\N	2026-08-08 06:19:10.672	2026-08-08 06:19:10.672
cmsjzgyj5001k8zig3odpf3o2	Backend Refactor	\N	ON_HOLD	HIGH	\N	\N	10000	cmsjzgyhe00008zig3qj26yd8	cmsjzgyif000o8zigcu05i1d8	cmsjzgyhe00008zig3qj26yd8	\N	2026-08-08 06:19:10.673	2026-08-08 06:19:10.673
cmsjzgyj6001m8ziga2jdfps4	User Feedback Analysis	\N	ON_HOLD	LOW	\N	\N	11000	cmsjzgyhe00008zig3qj26yd8	cmsjzgyif000q8zigjaqve3n2	cmsjzgyhe00008zig3qj26yd8	\N	2026-08-08 06:19:10.675	2026-08-08 06:19:10.675
cmsjzgyj8001o8zigknntqw53	Performance Optimization	\N	ON_HOLD	MEDIUM	\N	\N	12000	cmsjzgyhe00008zig3qj26yd8	cmsjzgyif000o8zigcu05i1d8	cmsjzgyhe00008zig3qj26yd8	\N	2026-08-08 06:19:10.676	2026-08-08 06:19:10.676
cmsk0092i000s8zrd3ohbq4fv	Write API Documentation	Create clear and detailed API documentation to guide developers in using the inventory and sales metrics features effectively.	TODO	HIGH	\N	2026-07-29 00:00:00	1000	cmsk0091a00008zrdhvxw5wfy	cmsk0092f000m8zrdfso95x7n	cmsj486oc00028zetwmownyk5	\N	2026-08-08 06:34:10.794	2026-08-08 06:34:10.794
cmsk0092m000u8zrdy59v11t4	Subtask 1	\N	TODO	HIGH	\N	2026-09-12 00:00:00	1000	cmsk0091a00008zrdhvxw5wfy	\N	cmsk0091a00008zrdhvxw5wfy	cmsk0092i000s8zrd3ohbq4fv	2026-08-08 06:34:10.799	2026-08-08 06:34:10.799
cmsk0092o000w8zrd0237ike4	Subtask 2	\N	TODO	LOW	\N	2026-09-15 00:00:00	2000	cmsk0091a00008zrdhvxw5wfy	\N	cmsk0091a00008zrdhvxw5wfy	cmsk0092i000s8zrd3ohbq4fv	2026-08-08 06:34:10.8	2026-08-08 06:34:10.8
cmsk0092p000y8zrdajqnvkds	Subtask 3	\N	TODO	MEDIUM	\N	2026-09-18 00:00:00	3000	cmsk0091a00008zrdhvxw5wfy	\N	cmsk0091a00008zrdhvxw5wfy	cmsk0092i000s8zrd3ohbq4fv	2026-08-08 06:34:10.801	2026-08-08 06:34:10.801
cmsk0092s00148zrd4t14wmte	Implement Search Function	\N	TODO	MEDIUM	\N	2026-07-29 00:00:00	2000	cmsk0091a00008zrdhvxw5wfy	cmsk0092f000m8zrdfso95x7n	cmsk0091a00008zrdhvxw5wfy	\N	2026-08-08 06:34:10.804	2026-08-08 06:34:10.804
cmsk0092v00168zrdco4rp5yw	Deploy to Production	\N	TODO	URGENT	\N	2026-07-29 00:00:00	3000	cmsk0091a00008zrdhvxw5wfy	cmsk0092g000o8zrdfd84i6wn	cmsk0091a00008zrdhvxw5wfy	\N	2026-08-08 06:34:10.807	2026-08-08 06:34:10.807
cmsk0092w00188zrd7jigwd0t	Code Review Completed	\N	DOING	MEDIUM	\N	2026-07-29 00:00:00	4000	cmsk0091a00008zrdhvxw5wfy	cmsk0092g000o8zrdfd84i6wn	cmsk0091a00008zrdhvxw5wfy	\N	2026-08-08 06:34:10.809	2026-08-08 06:34:10.809
cmsk0092y001a8zrdgyfpmev8	Design Mockups Finalized	\N	DOING	HIGH	\N	2026-07-29 00:00:00	5000	cmsk0091a00008zrdhvxw5wfy	cmsk0092f000m8zrdfso95x7n	cmsk0091a00008zrdhvxw5wfy	\N	2026-08-08 06:34:10.811	2026-08-08 06:34:10.811
cmsk00930001c8zrder2j0r3p	Feature Testing Passed	\N	COMPLETED	MEDIUM	\N	2026-07-30 00:00:00	6000	cmsk0091a00008zrdhvxw5wfy	cmsk0092h000q8zrdc1fyp9m8	cmsk0091a00008zrdhvxw5wfy	\N	2026-08-08 06:34:10.812	2026-08-08 06:34:10.812
cmsk00931001e8zrdh66gvied	UI Design Updated	\N	COMPLETED	LOW	\N	2026-07-31 00:00:00	7000	cmsk0091a00008zrdhvxw5wfy	cmsk0092f000m8zrdfso95x7n	cmsk0091a00008zrdhvxw5wfy	\N	2026-08-08 06:34:10.814	2026-08-08 06:34:10.814
cmsk00933001g8zrdcf4q807e	Security Audit Scheduled	\N	COMPLETED	HIGH	\N	2026-08-01 00:00:00	8000	cmsk0091a00008zrdhvxw5wfy	cmsk0092h000q8zrdc1fyp9m8	cmsk0091a00008zrdhvxw5wfy	\N	2026-08-08 06:34:10.815	2026-08-08 06:34:10.815
cmsk00934001i8zrdql56b37u	UI Review Session	\N	ON_HOLD	MEDIUM	\N	\N	9000	cmsk0091a00008zrdhvxw5wfy	cmsk0092f000m8zrdfso95x7n	cmsk0091a00008zrdhvxw5wfy	\N	2026-08-08 06:34:10.817	2026-08-08 06:34:10.817
cmsk00936001k8zrdruzom8l0	Backend Refactor	\N	ON_HOLD	HIGH	\N	\N	10000	cmsk0091a00008zrdhvxw5wfy	cmsk0092g000o8zrdfd84i6wn	cmsk0091a00008zrdhvxw5wfy	\N	2026-08-08 06:34:10.818	2026-08-08 06:34:10.818
cmsk00937001m8zrd0tcn62si	User Feedback Analysis	\N	ON_HOLD	LOW	\N	\N	11000	cmsk0091a00008zrdhvxw5wfy	cmsk0092h000q8zrdc1fyp9m8	cmsk0091a00008zrdhvxw5wfy	\N	2026-08-08 06:34:10.82	2026-08-08 06:34:10.82
cmsk00939001o8zrdct0xh6cj	Performance Optimization	\N	ON_HOLD	MEDIUM	\N	\N	12000	cmsk0091a00008zrdhvxw5wfy	cmsk0092g000o8zrdfd84i6wn	cmsk0091a00008zrdhvxw5wfy	\N	2026-08-08 06:34:10.822	2026-08-08 06:34:10.822
cmslouyzz001h8zcecnn5fjgo	Write API Documentation	Create clear and detailed API documentation to guide developers in using the inventory and sales metrics features effectively.	TODO	HIGH	\N	2026-07-29 00:00:00	1000	cmslouyyb000p8zce1nsrpcxq	cmslouyzq001b8zcesesu31q5	cmsj486oc00028zetwmownyk5	\N	2026-08-09 10:57:41.039	2026-08-09 10:57:41.039
cmslouz0c001j8zceihfo7uxy	Subtask 1	\N	TODO	HIGH	\N	2026-09-12 00:00:00	1000	cmslouyyb000p8zce1nsrpcxq	\N	cmslouyyb000p8zce1nsrpcxq	cmslouyzz001h8zcecnn5fjgo	2026-08-09 10:57:41.052	2026-08-09 10:57:41.052
cmslouz0h001l8zcexfmuk7vx	Subtask 2	\N	TODO	LOW	\N	2026-09-15 00:00:00	2000	cmslouyyb000p8zce1nsrpcxq	\N	cmslouyyb000p8zce1nsrpcxq	cmslouyzz001h8zcecnn5fjgo	2026-08-09 10:57:41.057	2026-08-09 10:57:41.057
cmslouz0k001n8zce43gt73j8	Subtask 3	\N	TODO	MEDIUM	\N	2026-09-18 00:00:00	3000	cmslouyyb000p8zce1nsrpcxq	\N	cmslouyyb000p8zce1nsrpcxq	cmslouyzz001h8zcecnn5fjgo	2026-08-09 10:57:41.061	2026-08-09 10:57:41.061
cmslouz0s001t8zcee1dfom6c	Implement Search Function	\N	TODO	MEDIUM	\N	2026-07-29 00:00:00	2000	cmslouyyb000p8zce1nsrpcxq	cmslouyzq001b8zcesesu31q5	cmslouyyb000p8zce1nsrpcxq	\N	2026-08-09 10:57:41.069	2026-08-09 10:57:41.069
cmslouz0z001v8zcemxlocj59	Deploy to Production	\N	TODO	URGENT	\N	2026-07-29 00:00:00	3000	cmslouyyb000p8zce1nsrpcxq	cmslouyzu001d8zce58u0z6gh	cmslouyyb000p8zce1nsrpcxq	\N	2026-08-09 10:57:41.075	2026-08-09 10:57:41.075
cmslouz14001x8zceczeypwzb	Code Review Completed	\N	DOING	MEDIUM	\N	2026-07-29 00:00:00	4000	cmslouyyb000p8zce1nsrpcxq	cmslouyzu001d8zce58u0z6gh	cmslouyyb000p8zce1nsrpcxq	\N	2026-08-09 10:57:41.08	2026-08-09 10:57:41.08
cmslouz1a001z8zcekxk296q7	Design Mockups Finalized	\N	DOING	HIGH	\N	2026-07-29 00:00:00	5000	cmslouyyb000p8zce1nsrpcxq	cmslouyzq001b8zcesesu31q5	cmslouyyb000p8zce1nsrpcxq	\N	2026-08-09 10:57:41.086	2026-08-09 10:57:41.086
cmslouz1g00218zcev9m7u4qp	Feature Testing Passed	\N	COMPLETED	MEDIUM	\N	2026-07-30 00:00:00	6000	cmslouyyb000p8zce1nsrpcxq	cmslouyzx001f8zcekepaqv9t	cmslouyyb000p8zce1nsrpcxq	\N	2026-08-09 10:57:41.092	2026-08-09 10:57:41.092
cmslouz1l00238zcerelakruq	UI Design Updated	\N	COMPLETED	LOW	\N	2026-07-31 00:00:00	7000	cmslouyyb000p8zce1nsrpcxq	cmslouyzq001b8zcesesu31q5	cmslouyyb000p8zce1nsrpcxq	\N	2026-08-09 10:57:41.097	2026-08-09 10:57:41.097
cmslouz1p00258zcedopm44zu	Security Audit Scheduled	\N	COMPLETED	HIGH	\N	2026-08-01 00:00:00	8000	cmslouyyb000p8zce1nsrpcxq	cmslouyzx001f8zcekepaqv9t	cmslouyyb000p8zce1nsrpcxq	\N	2026-08-09 10:57:41.101	2026-08-09 10:57:41.101
cmslouz1s00278zce2c4mtlw1	UI Review Session	\N	ON_HOLD	MEDIUM	\N	\N	9000	cmslouyyb000p8zce1nsrpcxq	cmslouyzq001b8zcesesu31q5	cmslouyyb000p8zce1nsrpcxq	\N	2026-08-09 10:57:41.104	2026-08-09 10:57:41.104
cmslouz1x00298zcem75b7mbh	Backend Refactor	\N	ON_HOLD	HIGH	\N	\N	10000	cmslouyyb000p8zce1nsrpcxq	cmslouyzu001d8zce58u0z6gh	cmslouyyb000p8zce1nsrpcxq	\N	2026-08-09 10:57:41.109	2026-08-09 10:57:41.109
cmslouz20002b8zcenerc7yc7	User Feedback Analysis	\N	ON_HOLD	LOW	\N	\N	11000	cmslouyyb000p8zce1nsrpcxq	cmslouyzx001f8zcekepaqv9t	cmslouyyb000p8zce1nsrpcxq	\N	2026-08-09 10:57:41.113	2026-08-09 10:57:41.113
cmslouz24002d8zce66j3zrto	Performance Optimization	\N	ON_HOLD	MEDIUM	\N	\N	12000	cmslouyyb000p8zce1nsrpcxq	cmslouyzu001d8zce58u0z6gh	cmslouyyb000p8zce1nsrpcxq	\N	2026-08-09 10:57:41.117	2026-08-09 10:57:41.117
cmslqfspg00368zce89jpjlpe	Write API Documentation	Create clear and detailed API documentation to guide developers in using the inventory and sales metrics features effectively.	TODO	HIGH	\N	2026-07-29 00:00:00	1000	cmslqfsnk002e8zcexexb3zhh	cmslqfsp900308zcesq90tvw0	cmsj486oc00028zetwmownyk5	\N	2026-08-09 11:41:52.276	2026-08-09 11:41:52.276
cmslqfspp00388zce51b0d08u	Subtask 1	\N	TODO	HIGH	\N	2026-09-12 00:00:00	1000	cmslqfsnk002e8zcexexb3zhh	\N	cmslqfsnk002e8zcexexb3zhh	cmslqfspg00368zce89jpjlpe	2026-08-09 11:41:52.285	2026-08-09 11:41:52.285
cmslqfsps003a8zcee32t2uwo	Subtask 2	\N	TODO	LOW	\N	2026-09-15 00:00:00	2000	cmslqfsnk002e8zcexexb3zhh	\N	cmslqfsnk002e8zcexexb3zhh	cmslqfspg00368zce89jpjlpe	2026-08-09 11:41:52.288	2026-08-09 11:41:52.288
cmslqfspu003c8zceqj5crn8p	Subtask 3	\N	TODO	MEDIUM	\N	2026-09-18 00:00:00	3000	cmslqfsnk002e8zcexexb3zhh	\N	cmslqfsnk002e8zcexexb3zhh	cmslqfspg00368zce89jpjlpe	2026-08-09 11:41:52.291	2026-08-09 11:41:52.291
cmslqfspz003i8zcei6eh3umg	Implement Search Function	\N	TODO	MEDIUM	\N	2026-07-29 00:00:00	2000	cmslqfsnk002e8zcexexb3zhh	cmslqfsp900308zcesq90tvw0	cmslqfsnk002e8zcexexb3zhh	\N	2026-08-09 11:41:52.296	2026-08-09 11:41:52.296
cmslqfsq4003k8zce32ab8vcs	Deploy to Production	\N	TODO	URGENT	\N	2026-07-29 00:00:00	3000	cmslqfsnk002e8zcexexb3zhh	cmslqfspc00328zcenlcsdcc5	cmslqfsnk002e8zcexexb3zhh	\N	2026-08-09 11:41:52.3	2026-08-09 11:41:52.3
cmslqfsq7003m8zceb6krhqbn	Code Review Completed	\N	DOING	MEDIUM	\N	2026-07-29 00:00:00	4000	cmslqfsnk002e8zcexexb3zhh	cmslqfspc00328zcenlcsdcc5	cmslqfsnk002e8zcexexb3zhh	\N	2026-08-09 11:41:52.303	2026-08-09 11:41:52.303
cmslqfsqa003o8zceuvdg0s7d	Design Mockups Finalized	\N	DOING	HIGH	\N	2026-07-29 00:00:00	5000	cmslqfsnk002e8zcexexb3zhh	cmslqfsp900308zcesq90tvw0	cmslqfsnk002e8zcexexb3zhh	\N	2026-08-09 11:41:52.306	2026-08-09 11:41:52.306
cmslqfsqc003q8zcebhhrxlm4	Feature Testing Passed	\N	COMPLETED	MEDIUM	\N	2026-07-30 00:00:00	6000	cmslqfsnk002e8zcexexb3zhh	cmslqfspe00348zce30229xvp	cmslqfsnk002e8zcexexb3zhh	\N	2026-08-09 11:41:52.309	2026-08-09 11:41:52.309
cmslqfsqf003s8zcevx3t28yo	UI Design Updated	\N	COMPLETED	LOW	\N	2026-07-31 00:00:00	7000	cmslqfsnk002e8zcexexb3zhh	cmslqfsp900308zcesq90tvw0	cmslqfsnk002e8zcexexb3zhh	\N	2026-08-09 11:41:52.311	2026-08-09 11:41:52.311
cmslqfsqi003u8zce1e0xla0t	Security Audit Scheduled	\N	COMPLETED	HIGH	\N	2026-08-01 00:00:00	8000	cmslqfsnk002e8zcexexb3zhh	cmslqfspe00348zce30229xvp	cmslqfsnk002e8zcexexb3zhh	\N	2026-08-09 11:41:52.314	2026-08-09 11:41:52.314
cmslqfsqk003w8zce5r0s9vaj	UI Review Session	\N	ON_HOLD	MEDIUM	\N	\N	9000	cmslqfsnk002e8zcexexb3zhh	cmslqfsp900308zcesq90tvw0	cmslqfsnk002e8zcexexb3zhh	\N	2026-08-09 11:41:52.317	2026-08-09 11:41:52.317
cmslqfsqn003y8zcekhlfiyc2	Backend Refactor	\N	ON_HOLD	HIGH	\N	\N	10000	cmslqfsnk002e8zcexexb3zhh	cmslqfspc00328zcenlcsdcc5	cmslqfsnk002e8zcexexb3zhh	\N	2026-08-09 11:41:52.32	2026-08-09 11:41:52.32
cmslqfsqp00408zcebnvw8auv	User Feedback Analysis	\N	ON_HOLD	LOW	\N	\N	11000	cmslqfsnk002e8zcexexb3zhh	cmslqfspe00348zce30229xvp	cmslqfsnk002e8zcexexb3zhh	\N	2026-08-09 11:41:52.322	2026-08-09 11:41:52.322
cmslqfsqs00428zcebrj3c9hh	Performance Optimization	\N	ON_HOLD	MEDIUM	\N	\N	12000	cmslqfsnk002e8zcexexb3zhh	cmslqfspc00328zcenlcsdcc5	cmslqfsnk002e8zcexexb3zhh	\N	2026-08-09 11:41:52.324	2026-08-09 11:41:52.324
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: pyramid
--

COPY public."User" (id, email, name, username, title, "avatarUrl", "googleId", "isGuest", "isDemo", "hashedRefreshToken", "createdAt", "updatedAt") FROM stdin;
cmsj8c15b00008zlp0mwhbspd	guest-a4364feb@guest.local	Guest	guest-a4364feb	\N	\N	\N	t	f	\N	2026-08-07 17:39:31.152	2026-08-07 17:39:31.32
cmsj486o400008zet6qmndy7y	guest-9b3c8167@guest.local	Guest	guest-9b3c8167	\N	\N	\N	t	f	\N	2026-08-07 15:44:33.219	2026-08-07 15:44:33.374
cmsj486og00068zetgcu8rojn	product@demo.pyramid.local	Product Team	\N	Product	https://api.dicebear.com/9.x/adventurer/png?seed=Product&size=96&backgroundColor=c0aede,b6e3f4,ffd5dc,d1d4f9	\N	f	t	\N	2026-08-07 15:44:33.232	2026-08-09 11:41:52.242
cmsj486oh00078zet01jz99sn	engineering@demo.pyramid.local	Engineering	\N	Engineering	https://api.dicebear.com/9.x/adventurer/png?seed=Engineering&size=96&backgroundColor=c0aede,b6e3f4,ffd5dc,d1d4f9	\N	f	t	\N	2026-08-07 15:44:33.233	2026-08-09 11:41:52.243
cmsj486oh00088zethtyos2k8	ankit@demo.pyramid.local	Ankit Dutta	\N	Developer	https://api.dicebear.com/9.x/adventurer/png?seed=Ankit&size=96&backgroundColor=c0aede,b6e3f4,ffd5dc,d1d4f9	\N	f	t	\N	2026-08-07 15:44:33.234	2026-08-09 11:41:52.244
cmsj6sx9c003h8zy57oeiyolg	guest-8663f1d3@guest.local	Guest	guest-8663f1d3	\N	\N	\N	t	f	\N	2026-08-07 16:56:40.032	2026-08-07 16:56:40.069
cmsj486oi00098zetcthi8b5t	charlie@demo.pyramid.local	Charlie Nguyen	\N	Engineer	\N	\N	f	t	\N	2026-08-07 15:44:33.235	2026-08-09 11:41:52.244
cmslqfsnk002e8zcexexb3zhh	guest-f93772cc@guest.local	Guest	guest-f93772cc	\N	\N	\N	t	f	c710c8a6bd74ff7778684c98a81e875a45825fbf7417ff95748ae1ae3be55395	2026-08-09 11:41:52.176	2026-08-09 11:41:52.33
cmslouyyb000p8zce1nsrpcxq	guest-9258a579@guest.local	Guest	guest-9258a579	\N	\N	\N	t	f	dd80646e7b584bfe8fbd0c33062af1138e9d96839d3aab2e19df547fa09367d2	2026-08-09 10:57:40.977	2026-08-10 13:43:31.869
cmsj70vf700008ze7u3heecsc	guest-a400f2d2@guest.local	Guest	guest-a400f2d2	\N	\N	\N	t	f	\N	2026-08-07 17:02:50.899	2026-08-07 17:02:51.092
cmsj6ty7l00008z4axjd3dsf5	guest-7dadc09c@guest.local	Guest	guest-7dadc09c	\N	\N	\N	t	f	\N	2026-08-07 16:57:27.921	2026-08-07 16:57:28.08
cmsjt6x2l00008ze1ej6rxw57	cloudabhi123@gmail.com	Abhi Sahane	cloudabhi123	\N	https://lh3.googleusercontent.com/a/ACg8ocLppA-MFYTUi1ym6eeai5rQGMlMxky5WaiQS9iecztxXe64Wq0p=s96-c	115487994671951213484	f	f	\N	2026-08-08 03:23:24.526	2026-08-09 10:39:34.297
cmsj486o900018zetb77l1kdw	admin@demo.pyramid.local	Admin	\N	Administrator	https://api.dicebear.com/9.x/adventurer/png?seed=Admin&size=96&backgroundColor=c0aede,b6e3f4,ffd5dc,d1d4f9	\N	f	t	\N	2026-08-07 15:44:33.225	2026-08-09 11:41:52.232
cmslo7wi2000k8zcevaya9b2p	abhisahane121@gmail.com	Abhijit Sahane	abhi	Devloper	https://lh3.googleusercontent.com/a/ACg8ocJXPyegOUBNmcK3vyFVunZXvfr37sE-ZYcz-jq-PuVYghSmYQ=s96-c	114181933318856537669	f	f	\N	2026-08-09 10:39:44.714	2026-08-09 10:57:23.888
cmsjsm9al001p8zp23wiz7gxl	guest-e5696d27@guest.local	Guest	guest-e5696d27	\N	\N	\N	t	f	\N	2026-08-08 03:07:20.572	2026-08-08 03:11:16.906
cmsj8u2xc00008zp2ha0k6iz7	guest-2348424e@guest.local	Guest	guest-2348424e	\N	\N	\N	t	f	63d619010b46343e0ad163e21bb1bdec361995fa737ebaffd35c41c3c4766a25	2026-08-07 17:53:33.264	2026-08-08 06:05:30.701
cmsj56xq4001p8zetb8uxz502	guest-f38ab8ac@guest.local	Guest	guest-f38ab8ac	\N	\N	\N	t	f	\N	2026-08-07 16:11:34.578	2026-08-07 17:52:53.985
cmsj486oc00028zetwmownyk5	designer@demo.pyramid.local	Designer	\N	Product Designer	https://api.dicebear.com/9.x/adventurer/png?seed=Designer&size=96&backgroundColor=c0aede,b6e3f4,ffd5dc,d1d4f9	\N	f	t	\N	2026-08-07 15:44:33.228	2026-08-09 11:41:52.237
cmsjwa67w00008zzvsl6pnn0e	guest-ce940073@guest.local	Guest	guest-ce940073	\N	\N	\N	t	f	\N	2026-08-08 04:49:55.196	2026-08-08 04:49:55.395
cmsk0091a00008zrdhvxw5wfy	guest-652fcfce@guest.local	Guest	guest-652fcfce	\N	\N	\N	t	f	\N	2026-08-08 06:34:10.751	2026-08-08 06:34:10.96
cmsjzgyhe00008zig3qj26yd8	guest-949adbdf@guest.local	Guest	guest-949adbdf	\N	\N	\N	t	f	\N	2026-08-08 06:19:10.61	2026-08-08 06:19:10.813
cmsj486od00038zetgbi3bqe6	qa@demo.pyramid.local	QA Team	\N	Quality Assurance	https://api.dicebear.com/9.x/adventurer/png?seed=QA&size=96&backgroundColor=c0aede,b6e3f4,ffd5dc,d1d4f9	\N	f	t	\N	2026-08-07 15:44:33.229	2026-08-09 11:41:52.239
cmsj486oe00048zetoah492nb	security@demo.pyramid.local	Security	\N	Security Engineer	https://api.dicebear.com/9.x/adventurer/png?seed=Security&size=96&backgroundColor=c0aede,b6e3f4,ffd5dc,d1d4f9	\N	f	t	\N	2026-08-07 15:44:33.23	2026-08-09 11:41:52.24
cmsj486of00058zetsgme61ev	devteam@demo.pyramid.local	Dev Team	\N	Development	https://api.dicebear.com/9.x/adventurer/png?seed=DevTeam&size=96&backgroundColor=c0aede,b6e3f4,ffd5dc,d1d4f9	\N	f	t	\N	2026-08-07 15:44:33.231	2026-08-09 11:41:52.241
\.


--
-- Data for Name: _TaskLabels; Type: TABLE DATA; Schema: public; Owner: pyramid
--

COPY public."_TaskLabels" ("A", "B") FROM stdin;
cmsj486oj000a8zettitr40zp	cmsj486p5000s8zet4n9epypb
cmsj486om000b8zet7m9y2nkw	cmsj486p5000s8zet4n9epypb
cmsj486oo000c8zety0vcesm1	cmsj486p5000s8zet4n9epypb
cmsj486oq000d8zetrpc91l4m	cmsj486p5000s8zet4n9epypb
cmsj486os000e8zet1zphl924	cmsj486p5000s8zet4n9epypb
cmsj486oo000c8zety0vcesm1	cmsj486pf00148zetnnx6urw9
cmsj486os000e8zet1zphl924	cmsj486pf00148zetnnx6urw9
cmsj486os000e8zet1zphl924	cmsj486ph00168zet5mcgrjpe
cmsj486oo000c8zety0vcesm1	cmsj486pj00188zetzwz0wim0
cmsj486ot000f8zett2lwl0n3	cmsj486pj00188zetzwz0wim0
cmsj486om000b8zet7m9y2nkw	cmsj486pl001a8zetpb1fag27
cmsj486ot000f8zett2lwl0n3	cmsj486pl001a8zetpb1fag27
cmsj486oq000d8zetrpc91l4m	cmsj486pn001c8zetqp2h3f60
cmsj486ow000h8zetpjtaja6i	cmsj486pn001c8zetqp2h3f60
cmsj486om000b8zet7m9y2nkw	cmsj486po001e8zet0yndoyzo
cmsj486ou000g8zet4luhko4u	cmsj486po001e8zet0yndoyzo
cmsj486ox000i8zet0dq50g8n	cmsj486pq001g8zety31s03a7
cmsj486oy000j8zetoy9vgijd	cmsj486pq001g8zety31s03a7
cmsj486om000b8zet7m9y2nkw	cmsj486ps001i8zet3wj0l0xu
cmsj486ot000f8zett2lwl0n3	cmsj486ps001i8zet3wj0l0xu
cmsj486oo000c8zety0vcesm1	cmsj486pu001k8zetqeu4i162
cmsj486oj000a8zettitr40zp	cmsj486pw001m8zet9r7mw7lx
cmsj486p0000k8zetvyfleko2	cmsj486py001o8zetwkcync8n
cmsj486oj000a8zettitr40zp	cmsj56xqz002h8zet4gdc0h4l
cmsj486om000b8zet7m9y2nkw	cmsj56xqz002h8zet4gdc0h4l
cmsj486oo000c8zety0vcesm1	cmsj56xqz002h8zet4gdc0h4l
cmsj486oq000d8zetrpc91l4m	cmsj56xqz002h8zet4gdc0h4l
cmsj486os000e8zet1zphl924	cmsj56xqz002h8zet4gdc0h4l
cmsj486oo000c8zety0vcesm1	cmsj56xr8002t8zet5rbkx6c7
cmsj486os000e8zet1zphl924	cmsj56xr8002t8zet5rbkx6c7
cmsj486os000e8zet1zphl924	cmsj56xra002v8zetkdoa0o0u
cmsj486oo000c8zety0vcesm1	cmsj56xrb002x8zetpkn815ky
cmsj486ot000f8zett2lwl0n3	cmsj56xrb002x8zetpkn815ky
cmsj486om000b8zet7m9y2nkw	cmsj56xrd002z8zetkbnldoik
cmsj486ot000f8zett2lwl0n3	cmsj56xrd002z8zetkbnldoik
cmsj486oq000d8zetrpc91l4m	cmsj56xrf00318zetph63wf19
cmsj486ow000h8zetpjtaja6i	cmsj56xrf00318zetph63wf19
cmsj486om000b8zet7m9y2nkw	cmsj56xrg00338zetvt9krnom
cmsj486ou000g8zet4luhko4u	cmsj56xrg00338zetvt9krnom
cmsj486ox000i8zet0dq50g8n	cmsj56xri00358zet8x3dxu0c
cmsj486oy000j8zetoy9vgijd	cmsj56xri00358zet8x3dxu0c
cmsj486om000b8zet7m9y2nkw	cmsj56xrk00378zeteom8zvj8
cmsj486ot000f8zett2lwl0n3	cmsj56xrk00378zeteom8zvj8
cmsj486oo000c8zety0vcesm1	cmsj56xrl00398zetl0y6ve1e
cmsj486oj000a8zettitr40zp	cmsj56xrn003b8zet7ak7zfca
cmsj486p0000k8zetvyfleko2	cmsj56xro003d8zet7kzn1bbv
cmsj486oj000a8zettitr40zp	cmsj70vg8000s8ze7teebq27b
cmsj486om000b8zet7m9y2nkw	cmsj70vg8000s8ze7teebq27b
cmsj486oo000c8zety0vcesm1	cmsj70vg8000s8ze7teebq27b
cmsj486oq000d8zetrpc91l4m	cmsj70vg8000s8ze7teebq27b
cmsj486os000e8zet1zphl924	cmsj70vg8000s8ze7teebq27b
cmsj486oo000c8zety0vcesm1	cmsj70vgj00148ze7pmajgkux
cmsj486os000e8zet1zphl924	cmsj70vgj00148ze7pmajgkux
cmsj486os000e8zet1zphl924	cmsj70vgl00168ze7ftrurdpu
cmsj486oo000c8zety0vcesm1	cmsj70vgn00188ze7fucn70o4
cmsj486ot000f8zett2lwl0n3	cmsj70vgn00188ze7fucn70o4
cmsj486om000b8zet7m9y2nkw	cmsj70vgp001a8ze77d4vs9el
cmsj486ot000f8zett2lwl0n3	cmsj70vgp001a8ze77d4vs9el
cmsj486oq000d8zetrpc91l4m	cmsj70vgq001c8ze72ubtxzu0
cmsj486ow000h8zetpjtaja6i	cmsj70vgq001c8ze72ubtxzu0
cmsj486om000b8zet7m9y2nkw	cmsj70vgs001e8ze7n9arxdyy
cmsj486ou000g8zet4luhko4u	cmsj70vgs001e8ze7n9arxdyy
cmsj486ox000i8zet0dq50g8n	cmsj70vgt001g8ze75yi5ka86
cmsj486oy000j8zetoy9vgijd	cmsj70vgt001g8ze75yi5ka86
cmsj486om000b8zet7m9y2nkw	cmsj70vgv001i8ze71wii6bnv
cmsj486ot000f8zett2lwl0n3	cmsj70vgv001i8ze71wii6bnv
cmsj486oo000c8zety0vcesm1	cmsj70vgw001k8ze7znsxn4vf
cmsj486oj000a8zettitr40zp	cmsj70vgx001m8ze7yvt0f9rg
cmsj486p0000k8zetvyfleko2	cmsj70vgz001o8ze775el7paf
cmsj486oj000a8zettitr40zp	cmsj8u2y5000s8zp23c2e1mzi
cmsj486om000b8zet7m9y2nkw	cmsj8u2y5000s8zp23c2e1mzi
cmsj486oo000c8zety0vcesm1	cmsj8u2y5000s8zp23c2e1mzi
cmsj486oq000d8zetrpc91l4m	cmsj8u2y5000s8zp23c2e1mzi
cmsj486os000e8zet1zphl924	cmsj8u2y5000s8zp23c2e1mzi
cmsj486oo000c8zety0vcesm1	cmsj8u2yi00148zp24h132juq
cmsj486os000e8zet1zphl924	cmsj8u2yi00148zp24h132juq
cmsj486os000e8zet1zphl924	cmsj8u2yl00168zp242wmiasl
cmsj486oo000c8zety0vcesm1	cmsj8u2yn00188zp2hiwxua3t
cmsj486ot000f8zett2lwl0n3	cmsj8u2yn00188zp2hiwxua3t
cmsj486om000b8zet7m9y2nkw	cmsj8u2yp001a8zp21n096g6a
cmsj486ot000f8zett2lwl0n3	cmsj8u2yp001a8zp21n096g6a
cmsj486oq000d8zetrpc91l4m	cmsj8u2yr001c8zp285mr3439
cmsj486ow000h8zetpjtaja6i	cmsj8u2yr001c8zp285mr3439
cmsj486om000b8zet7m9y2nkw	cmsj8u2yt001e8zp2xxpcv8sq
cmsj486ou000g8zet4luhko4u	cmsj8u2yt001e8zp2xxpcv8sq
cmsj486ox000i8zet0dq50g8n	cmsj8u2yw001g8zp2obr4e3qn
cmsj486oy000j8zetoy9vgijd	cmsj8u2yw001g8zp2obr4e3qn
cmsj486om000b8zet7m9y2nkw	cmsj8u2yy001i8zp24c4hwaug
cmsj486ot000f8zett2lwl0n3	cmsj8u2yy001i8zp24c4hwaug
cmsj486oo000c8zety0vcesm1	cmsj8u2z0001k8zp21io9rvf7
cmsj486oj000a8zettitr40zp	cmsj8u2z2001m8zp2cq5bbhxy
cmsj486p0000k8zetvyfleko2	cmsj8u2z4001o8zp2j3il4jia
cmsj486oj000a8zettitr40zp	cmsjt6x3t000s8ze1esghzjaq
cmsj486om000b8zet7m9y2nkw	cmsjt6x3t000s8ze1esghzjaq
cmsj486oo000c8zety0vcesm1	cmsjt6x3t000s8ze1esghzjaq
cmsj486oq000d8zetrpc91l4m	cmsjt6x3t000s8ze1esghzjaq
cmsj486os000e8zet1zphl924	cmsjt6x3t000s8ze1esghzjaq
cmsj486oj000a8zettitr40zp	cmsj6sx9p00498zy53s589cus
cmsj486om000b8zet7m9y2nkw	cmsj6sx9p00498zy53s589cus
cmsj486oo000c8zety0vcesm1	cmsj6sx9p00498zy53s589cus
cmsj486oq000d8zetrpc91l4m	cmsj6sx9p00498zy53s589cus
cmsj486os000e8zet1zphl924	cmsj6sx9p00498zy53s589cus
cmsj486oo000c8zety0vcesm1	cmsj6sx9u004l8zy5ktpl9n1y
cmsj486os000e8zet1zphl924	cmsj6sx9u004l8zy5ktpl9n1y
cmsj486os000e8zet1zphl924	cmsj6sx9w004n8zy5er15uu4u
cmsj486oo000c8zety0vcesm1	cmsj6sx9y004p8zy51xcokher
cmsj486ot000f8zett2lwl0n3	cmsj6sx9y004p8zy51xcokher
cmsj486om000b8zet7m9y2nkw	cmsj6sx9z004r8zy549bw9p3p
cmsj486ot000f8zett2lwl0n3	cmsj6sx9z004r8zy549bw9p3p
cmsj486oq000d8zetrpc91l4m	cmsj6sxa1004t8zy5d4pe80dl
cmsj486ow000h8zetpjtaja6i	cmsj6sxa1004t8zy5d4pe80dl
cmsj486om000b8zet7m9y2nkw	cmsj6sxa2004v8zy5hbjzulb1
cmsj486ou000g8zet4luhko4u	cmsj6sxa2004v8zy5hbjzulb1
cmsj486ox000i8zet0dq50g8n	cmsj6sxa4004x8zy5d9fm0tpj
cmsj486oy000j8zetoy9vgijd	cmsj6sxa4004x8zy5d9fm0tpj
cmsj486om000b8zet7m9y2nkw	cmsj6sxa5004z8zy5j51eed0h
cmsj486ot000f8zett2lwl0n3	cmsj6sxa5004z8zy5j51eed0h
cmsj486oo000c8zety0vcesm1	cmsj6sxa600518zy5ysm2jtc3
cmsj486oj000a8zettitr40zp	cmsj6sxa700538zy5qdl5pw4h
cmsj486p0000k8zetvyfleko2	cmsj6sxa900558zy5p1t6yli8
cmsj486oj000a8zettitr40zp	cmsj6ty8k000s8z4a29kk167j
cmsj486om000b8zet7m9y2nkw	cmsj6ty8k000s8z4a29kk167j
cmsj486oo000c8zety0vcesm1	cmsj6ty8k000s8z4a29kk167j
cmsj486oq000d8zetrpc91l4m	cmsj6ty8k000s8z4a29kk167j
cmsj486os000e8zet1zphl924	cmsj6ty8k000s8z4a29kk167j
cmsj486oo000c8zety0vcesm1	cmsj6ty8s00148z4ajgkzl7o6
cmsj486os000e8zet1zphl924	cmsj6ty8s00148z4ajgkzl7o6
cmsj486os000e8zet1zphl924	cmsj6ty8u00168z4aa78ld7is
cmsj486oo000c8zety0vcesm1	cmsj6ty8v00188z4a7ro6rulm
cmsj486ot000f8zett2lwl0n3	cmsj6ty8v00188z4a7ro6rulm
cmsj486om000b8zet7m9y2nkw	cmsj6ty8x001a8z4ahap8jcm3
cmsj486ot000f8zett2lwl0n3	cmsj6ty8x001a8z4ahap8jcm3
cmsj486oq000d8zetrpc91l4m	cmsj6ty8z001c8z4aikhcgdti
cmsj486ow000h8zetpjtaja6i	cmsj6ty8z001c8z4aikhcgdti
cmsj486om000b8zet7m9y2nkw	cmsj6ty91001e8z4amk3svk3x
cmsj486ou000g8zet4luhko4u	cmsj6ty91001e8z4amk3svk3x
cmsj486ox000i8zet0dq50g8n	cmsj6ty92001g8z4a6cbwechl
cmsj486oy000j8zetoy9vgijd	cmsj6ty92001g8z4a6cbwechl
cmsj486om000b8zet7m9y2nkw	cmsj6ty93001i8z4a07jauw3w
cmsj486ot000f8zett2lwl0n3	cmsj6ty93001i8z4a07jauw3w
cmsj486oo000c8zety0vcesm1	cmsj6ty95001k8z4alb15lp2e
cmsj486oj000a8zettitr40zp	cmsj6ty96001m8z4ay2tllg1p
cmsj486p0000k8zetvyfleko2	cmsj6ty97001o8z4atvjmlstk
cmsj486oj000a8zettitr40zp	cmsjsm9c0002h8zp2x1uwisuo
cmsj486om000b8zet7m9y2nkw	cmsjsm9c0002h8zp2x1uwisuo
cmsj486oo000c8zety0vcesm1	cmsjsm9c0002h8zp2x1uwisuo
cmsj486oq000d8zetrpc91l4m	cmsjsm9c0002h8zp2x1uwisuo
cmsj486os000e8zet1zphl924	cmsjsm9c0002h8zp2x1uwisuo
cmsj486oo000c8zety0vcesm1	cmsjsm9cj002t8zp2jttyjstt
cmsj486os000e8zet1zphl924	cmsjsm9cj002t8zp2jttyjstt
cmsj486os000e8zet1zphl924	cmsjsm9cn002v8zp2c2nwhkhv
cmsj486oo000c8zety0vcesm1	cmsjsm9cq002x8zp2nij49oov
cmsj486ot000f8zett2lwl0n3	cmsjsm9cq002x8zp2nij49oov
cmsj486om000b8zet7m9y2nkw	cmsjsm9ct002z8zp2fb635cqv
cmsj486ot000f8zett2lwl0n3	cmsjsm9ct002z8zp2fb635cqv
cmsj486oq000d8zetrpc91l4m	cmsjsm9cw00318zp2nhw8x88x
cmsj486ow000h8zetpjtaja6i	cmsjsm9cw00318zp2nhw8x88x
cmsj486om000b8zet7m9y2nkw	cmsjsm9cy00338zp2u4r8xdwj
cmsj486ou000g8zet4luhko4u	cmsjsm9cy00338zp2u4r8xdwj
cmsj486ox000i8zet0dq50g8n	cmsjsm9d000358zp2vx8e8t46
cmsj486oy000j8zetoy9vgijd	cmsjsm9d000358zp2vx8e8t46
cmsj486oj000a8zettitr40zp	cmsj8c16d000s8zlpwnd2pmz1
cmsj486om000b8zet7m9y2nkw	cmsj8c16d000s8zlpwnd2pmz1
cmsj486oo000c8zety0vcesm1	cmsj8c16d000s8zlpwnd2pmz1
cmsj486oq000d8zetrpc91l4m	cmsj8c16d000s8zlpwnd2pmz1
cmsj486os000e8zet1zphl924	cmsj8c16d000s8zlpwnd2pmz1
cmsj486oo000c8zety0vcesm1	cmsj8c16n00148zlplwh9wgj0
cmsj486os000e8zet1zphl924	cmsj8c16n00148zlplwh9wgj0
cmsj486os000e8zet1zphl924	cmsj8c16p00168zlp7jla06ye
cmsj486oo000c8zety0vcesm1	cmsj8c16r00188zlp6nxyfu6o
cmsj486ot000f8zett2lwl0n3	cmsj8c16r00188zlp6nxyfu6o
cmsj486om000b8zet7m9y2nkw	cmsj8c16t001a8zlp1avf9o99
cmsj486ot000f8zett2lwl0n3	cmsj8c16t001a8zlp1avf9o99
cmsj486oq000d8zetrpc91l4m	cmsj8c16u001c8zlpvdendtmu
cmsj486ow000h8zetpjtaja6i	cmsj8c16u001c8zlpvdendtmu
cmsj486om000b8zet7m9y2nkw	cmsj8c16w001e8zlpngvkop8w
cmsj486ou000g8zet4luhko4u	cmsj8c16w001e8zlpngvkop8w
cmsj486ox000i8zet0dq50g8n	cmsj8c16x001g8zlpbpgawfif
cmsj486oy000j8zetoy9vgijd	cmsj8c16x001g8zlpbpgawfif
cmsj486om000b8zet7m9y2nkw	cmsj8c16z001i8zlpal3sm0wk
cmsj486ot000f8zett2lwl0n3	cmsj8c16z001i8zlpal3sm0wk
cmsj486oo000c8zety0vcesm1	cmsj8c170001k8zlp207uvx0k
cmsj486oj000a8zettitr40zp	cmsj8c172001m8zlp2mumbe0o
cmsj486p0000k8zetvyfleko2	cmsj8c174001o8zlpufpstgya
cmsj486om000b8zet7m9y2nkw	cmsjsm9d300378zp2rblzr1ub
cmsj486ot000f8zett2lwl0n3	cmsjsm9d300378zp2rblzr1ub
cmsj486oo000c8zety0vcesm1	cmsjsm9d500398zp27lbtm4wv
cmsj486oj000a8zettitr40zp	cmsjsm9d8003b8zp2mxx4rvu1
cmsj486p0000k8zetvyfleko2	cmsjsm9da003d8zp22kd4ldcy
cmsj486oo000c8zety0vcesm1	cmsjt6x4900148ze1os2a2ylf
cmsj486os000e8zet1zphl924	cmsjt6x4900148ze1os2a2ylf
cmsj486os000e8zet1zphl924	cmsjt6x4d00168ze192p09rqe
cmsj486oo000c8zety0vcesm1	cmsjt6x4g00188ze14onk9ku8
cmsj486ot000f8zett2lwl0n3	cmsjt6x4g00188ze14onk9ku8
cmsj486om000b8zet7m9y2nkw	cmsjt6x4j001a8ze10fmywp9l
cmsj486ot000f8zett2lwl0n3	cmsjt6x4j001a8ze10fmywp9l
cmsj486oq000d8zetrpc91l4m	cmsjt6x4m001c8ze19xdzas3x
cmsj486ow000h8zetpjtaja6i	cmsjt6x4m001c8ze19xdzas3x
cmsj486om000b8zet7m9y2nkw	cmsjt6x4o001e8ze14x0v48s5
cmsj486ou000g8zet4luhko4u	cmsjt6x4o001e8ze14x0v48s5
cmsj486ox000i8zet0dq50g8n	cmsjt6x4q001g8ze1mxfn2v1w
cmsj486oy000j8zetoy9vgijd	cmsjt6x4q001g8ze1mxfn2v1w
cmsj486om000b8zet7m9y2nkw	cmsjt6x4t001i8ze10lrbu09k
cmsj486ot000f8zett2lwl0n3	cmsjt6x4t001i8ze10lrbu09k
cmsj486oo000c8zety0vcesm1	cmsjt6x4v001k8ze1kgunlol6
cmsj486oj000a8zettitr40zp	cmsjt6x4x001m8ze1u85c73io
cmsj486p0000k8zetvyfleko2	cmsjt6x50001o8ze1asbxgnx7
cmsj486oj000a8zettitr40zp	cmsjwa68y000s8zzvttaqonu4
cmsj486om000b8zet7m9y2nkw	cmsjwa68y000s8zzvttaqonu4
cmsj486oo000c8zety0vcesm1	cmsjwa68y000s8zzvttaqonu4
cmsj486oq000d8zetrpc91l4m	cmsjwa68y000s8zzvttaqonu4
cmsj486os000e8zet1zphl924	cmsjwa68y000s8zzvttaqonu4
cmsj486oo000c8zety0vcesm1	cmsjwa69800148zzvquzr0h9d
cmsj486os000e8zet1zphl924	cmsjwa69800148zzvquzr0h9d
cmsj486os000e8zet1zphl924	cmsjwa69a00168zzv3mi7rlrj
cmsj486oo000c8zety0vcesm1	cmsjwa69b00188zzv94izh1jo
cmsj486ot000f8zett2lwl0n3	cmsjwa69b00188zzv94izh1jo
cmsj486om000b8zet7m9y2nkw	cmsjwa69d001a8zzvysw0oqmn
cmsj486ot000f8zett2lwl0n3	cmsjwa69d001a8zzvysw0oqmn
cmsj486oq000d8zetrpc91l4m	cmsjwa69f001c8zzvkid9isfg
cmsj486ow000h8zetpjtaja6i	cmsjwa69f001c8zzvkid9isfg
cmsj486om000b8zet7m9y2nkw	cmsjwa69g001e8zzv05x6kcvk
cmsj486ou000g8zet4luhko4u	cmsjwa69g001e8zzv05x6kcvk
cmsj486ox000i8zet0dq50g8n	cmsjwa69i001g8zzvn1z7armc
cmsj486oy000j8zetoy9vgijd	cmsjwa69i001g8zzvn1z7armc
cmsj486om000b8zet7m9y2nkw	cmsjwa69j001i8zzvr6vlevfj
cmsj486ot000f8zett2lwl0n3	cmsjwa69j001i8zzvr6vlevfj
cmsj486oo000c8zety0vcesm1	cmsjwa69l001k8zzvovpo9sdv
cmsj486oj000a8zettitr40zp	cmsjwa69n001m8zzv74u2lwop
cmsj486p0000k8zetvyfleko2	cmsjwa69o001o8zzv8zkq9182
cmsj486oj000a8zettitr40zp	cmslqfspg00368zce89jpjlpe
cmsj486om000b8zet7m9y2nkw	cmslqfspg00368zce89jpjlpe
cmsj486oo000c8zety0vcesm1	cmslqfspg00368zce89jpjlpe
cmsj486oq000d8zetrpc91l4m	cmslqfspg00368zce89jpjlpe
cmsj486os000e8zet1zphl924	cmslqfspg00368zce89jpjlpe
cmsj486oo000c8zety0vcesm1	cmslqfspz003i8zcei6eh3umg
cmsj486os000e8zet1zphl924	cmslqfspz003i8zcei6eh3umg
cmsj486os000e8zet1zphl924	cmslqfsq4003k8zce32ab8vcs
cmsj486oo000c8zety0vcesm1	cmslqfsq7003m8zceb6krhqbn
cmsj486ot000f8zett2lwl0n3	cmslqfsq7003m8zceb6krhqbn
cmsj486om000b8zet7m9y2nkw	cmslqfsqa003o8zceuvdg0s7d
cmsj486ot000f8zett2lwl0n3	cmslqfsqa003o8zceuvdg0s7d
cmsj486oq000d8zetrpc91l4m	cmslqfsqc003q8zcebhhrxlm4
cmsj486ow000h8zetpjtaja6i	cmslqfsqc003q8zcebhhrxlm4
cmsj486om000b8zet7m9y2nkw	cmslqfsqf003s8zcevx3t28yo
cmsj486ou000g8zet4luhko4u	cmslqfsqf003s8zcevx3t28yo
cmsj486ox000i8zet0dq50g8n	cmslqfsqi003u8zce1e0xla0t
cmsj486oy000j8zetoy9vgijd	cmslqfsqi003u8zce1e0xla0t
cmsj486om000b8zet7m9y2nkw	cmslqfsqk003w8zce5r0s9vaj
cmsj486ot000f8zett2lwl0n3	cmslqfsqk003w8zce5r0s9vaj
cmsj486oo000c8zety0vcesm1	cmslqfsqn003y8zcekhlfiyc2
cmsj486oj000a8zettitr40zp	cmslqfsqp00408zcebnvw8auv
cmsj486p0000k8zetvyfleko2	cmslqfsqs00428zcebrj3c9hh
cmsj486oj000a8zettitr40zp	cmsjzgyih000s8zigapwp7hfn
cmsj486om000b8zet7m9y2nkw	cmsjzgyih000s8zigapwp7hfn
cmsj486oo000c8zety0vcesm1	cmsjzgyih000s8zigapwp7hfn
cmsj486oq000d8zetrpc91l4m	cmsjzgyih000s8zigapwp7hfn
cmsj486os000e8zet1zphl924	cmsjzgyih000s8zigapwp7hfn
cmsj486oo000c8zety0vcesm1	cmsjzgyir00148zig2memcdm0
cmsj486os000e8zet1zphl924	cmsjzgyir00148zig2memcdm0
cmsj486os000e8zet1zphl924	cmsjzgyit00168zig4qdcs6uv
cmsj486oo000c8zety0vcesm1	cmsjzgyiv00188zigzv0oitn8
cmsj486ot000f8zett2lwl0n3	cmsjzgyiv00188zigzv0oitn8
cmsj486om000b8zet7m9y2nkw	cmsjzgyix001a8zighti2ndq2
cmsj486ot000f8zett2lwl0n3	cmsjzgyix001a8zighti2ndq2
cmsj486oq000d8zetrpc91l4m	cmsjzgyiy001c8zigl67isa16
cmsj486ow000h8zetpjtaja6i	cmsjzgyiy001c8zigl67isa16
cmsj486om000b8zet7m9y2nkw	cmsjzgyj0001e8zighnopkxgx
cmsj486ou000g8zet4luhko4u	cmsjzgyj0001e8zighnopkxgx
cmsj486ox000i8zet0dq50g8n	cmsjzgyj2001g8zigvao7spvi
cmsj486oy000j8zetoy9vgijd	cmsjzgyj2001g8zigvao7spvi
cmsj486om000b8zet7m9y2nkw	cmsjzgyj3001i8zig06eyi6gx
cmsj486ot000f8zett2lwl0n3	cmsjzgyj3001i8zig06eyi6gx
cmsj486oo000c8zety0vcesm1	cmsjzgyj5001k8zig3odpf3o2
cmsj486oj000a8zettitr40zp	cmsjzgyj6001m8ziga2jdfps4
cmsj486p0000k8zetvyfleko2	cmsjzgyj8001o8zigknntqw53
cmsj486oj000a8zettitr40zp	cmslouyzz001h8zcecnn5fjgo
cmsj486om000b8zet7m9y2nkw	cmslouyzz001h8zcecnn5fjgo
cmsj486oo000c8zety0vcesm1	cmslouyzz001h8zcecnn5fjgo
cmsj486oq000d8zetrpc91l4m	cmslouyzz001h8zcecnn5fjgo
cmsj486os000e8zet1zphl924	cmslouyzz001h8zcecnn5fjgo
cmsj486oo000c8zety0vcesm1	cmslouz0s001t8zcee1dfom6c
cmsj486os000e8zet1zphl924	cmslouz0s001t8zcee1dfom6c
cmsj486os000e8zet1zphl924	cmslouz0z001v8zcemxlocj59
cmsj486oo000c8zety0vcesm1	cmslouz14001x8zceczeypwzb
cmsj486ot000f8zett2lwl0n3	cmslouz14001x8zceczeypwzb
cmsj486om000b8zet7m9y2nkw	cmslouz1a001z8zcekxk296q7
cmsj486ot000f8zett2lwl0n3	cmslouz1a001z8zcekxk296q7
cmsj486oq000d8zetrpc91l4m	cmslouz1g00218zcev9m7u4qp
cmsj486ow000h8zetpjtaja6i	cmslouz1g00218zcev9m7u4qp
cmsj486om000b8zet7m9y2nkw	cmslouz1l00238zcerelakruq
cmsj486ou000g8zet4luhko4u	cmslouz1l00238zcerelakruq
cmsj486ox000i8zet0dq50g8n	cmslouz1p00258zcedopm44zu
cmsj486oy000j8zetoy9vgijd	cmslouz1p00258zcedopm44zu
cmsj486om000b8zet7m9y2nkw	cmslouz1s00278zce2c4mtlw1
cmsj486ot000f8zett2lwl0n3	cmslouz1s00278zce2c4mtlw1
cmsj486oo000c8zety0vcesm1	cmslouz1x00298zcem75b7mbh
cmsj486oj000a8zettitr40zp	cmslouz20002b8zcenerc7yc7
cmsj486p0000k8zetvyfleko2	cmslouz24002d8zce66j3zrto
cmsj486oj000a8zettitr40zp	cmsk0092i000s8zrd3ohbq4fv
cmsj486om000b8zet7m9y2nkw	cmsk0092i000s8zrd3ohbq4fv
cmsj486oo000c8zety0vcesm1	cmsk0092i000s8zrd3ohbq4fv
cmsj486oq000d8zetrpc91l4m	cmsk0092i000s8zrd3ohbq4fv
cmsj486os000e8zet1zphl924	cmsk0092i000s8zrd3ohbq4fv
cmsj486oo000c8zety0vcesm1	cmsk0092s00148zrd4t14wmte
cmsj486os000e8zet1zphl924	cmsk0092s00148zrd4t14wmte
cmsj486os000e8zet1zphl924	cmsk0092v00168zrdco4rp5yw
cmsj486oo000c8zety0vcesm1	cmsk0092w00188zrd7jigwd0t
cmsj486ot000f8zett2lwl0n3	cmsk0092w00188zrd7jigwd0t
cmsj486om000b8zet7m9y2nkw	cmsk0092y001a8zrdgyfpmev8
cmsj486ot000f8zett2lwl0n3	cmsk0092y001a8zrdgyfpmev8
cmsj486oq000d8zetrpc91l4m	cmsk00930001c8zrder2j0r3p
cmsj486ow000h8zetpjtaja6i	cmsk00930001c8zrder2j0r3p
cmsj486om000b8zet7m9y2nkw	cmsk00931001e8zrdh66gvied
cmsj486ou000g8zet4luhko4u	cmsk00931001e8zrdh66gvied
cmsj486ox000i8zet0dq50g8n	cmsk00933001g8zrdcf4q807e
cmsj486oy000j8zetoy9vgijd	cmsk00933001g8zrdcf4q807e
cmsj486om000b8zet7m9y2nkw	cmsk00934001i8zrdql56b37u
cmsj486ot000f8zett2lwl0n3	cmsk00934001i8zrdql56b37u
cmsj486oo000c8zety0vcesm1	cmsk00936001k8zrdruzom8l0
cmsj486oj000a8zettitr40zp	cmsk00937001m8zrd0tcn62si
cmsj486p0000k8zetvyfleko2	cmsk00939001o8zrdct0xh6cj
\.


--
-- Data for Name: _TaskMembers; Type: TABLE DATA; Schema: public; Owner: pyramid
--

COPY public."_TaskMembers" ("A", "B") FROM stdin;
cmsj486p5000s8zet4n9epypb	cmsj486o900018zetb77l1kdw
cmsj486p8000u8zetyaeun3ox	cmsj486o900018zetb77l1kdw
cmsj486pa000w8zet10pmlbkw	cmsj486oi00098zetcthi8b5t
cmsj486pf00148zetnnx6urw9	cmsj486o900018zetb77l1kdw
cmsj486ph00168zet5mcgrjpe	cmsj486o900018zetb77l1kdw
cmsj486pj00188zetzwz0wim0	cmsj486o900018zetb77l1kdw
cmsj486pl001a8zetpb1fag27	cmsj486o900018zetb77l1kdw
cmsj486pn001c8zetqp2h3f60	cmsj486od00038zetgbi3bqe6
cmsj486po001e8zet0yndoyzo	cmsj486oc00028zetwmownyk5
cmsj486pq001g8zety31s03a7	cmsj486oe00048zetoah492nb
cmsj486ps001i8zet3wj0l0xu	cmsj486oc00028zetwmownyk5
cmsj486pu001k8zetqeu4i162	cmsj486of00058zetsgme61ev
cmsj486pw001m8zet9r7mw7lx	cmsj486og00068zetgcu8rojn
cmsj486py001o8zetwkcync8n	cmsj486oh00078zet01jz99sn
cmsj56xqz002h8zet4gdc0h4l	cmsj486o900018zetb77l1kdw
cmsj56xr3002j8zet8hsa2bol	cmsj486o900018zetb77l1kdw
cmsj56xr5002l8zetar9gaf39	cmsj486oi00098zetcthi8b5t
cmsj56xr8002t8zet5rbkx6c7	cmsj486o900018zetb77l1kdw
cmsj56xra002v8zetkdoa0o0u	cmsj486o900018zetb77l1kdw
cmsj56xrb002x8zetpkn815ky	cmsj486o900018zetb77l1kdw
cmsj56xrd002z8zetkbnldoik	cmsj486o900018zetb77l1kdw
cmsj56xrf00318zetph63wf19	cmsj486od00038zetgbi3bqe6
cmsj56xrg00338zetvt9krnom	cmsj486oc00028zetwmownyk5
cmsj56xri00358zet8x3dxu0c	cmsj486oe00048zetoah492nb
cmsj56xrk00378zeteom8zvj8	cmsj486oc00028zetwmownyk5
cmsj56xrl00398zetl0y6ve1e	cmsj486of00058zetsgme61ev
cmsj56xrn003b8zet7ak7zfca	cmsj486og00068zetgcu8rojn
cmsj56xro003d8zet7kzn1bbv	cmsj486oh00078zet01jz99sn
cmsj70vg8000s8ze7teebq27b	cmsj486o900018zetb77l1kdw
cmsj70vgd000u8ze7g75fcyqu	cmsj486o900018zetb77l1kdw
cmsj70vgf000w8ze77rnuqkgx	cmsj486oi00098zetcthi8b5t
cmsj70vgj00148ze7pmajgkux	cmsj486o900018zetb77l1kdw
cmsj70vgl00168ze7ftrurdpu	cmsj486o900018zetb77l1kdw
cmsj70vgn00188ze7fucn70o4	cmsj486o900018zetb77l1kdw
cmsj70vgp001a8ze77d4vs9el	cmsj486o900018zetb77l1kdw
cmsj70vgq001c8ze72ubtxzu0	cmsj486od00038zetgbi3bqe6
cmsj70vgs001e8ze7n9arxdyy	cmsj486oc00028zetwmownyk5
cmsj70vgt001g8ze75yi5ka86	cmsj486oe00048zetoah492nb
cmsj70vgv001i8ze71wii6bnv	cmsj486oc00028zetwmownyk5
cmsj70vgw001k8ze7znsxn4vf	cmsj486of00058zetsgme61ev
cmsj70vgx001m8ze7yvt0f9rg	cmsj486og00068zetgcu8rojn
cmsj70vgz001o8ze775el7paf	cmsj486oh00078zet01jz99sn
cmsjzgyih000s8zigapwp7hfn	cmsj486o900018zetb77l1kdw
cmsjzgyil000u8zigvqtpu3f3	cmsj486o900018zetb77l1kdw
cmsjzgyin000w8ziguvgeeb8c	cmsj486oi00098zetcthi8b5t
cmsjzgyir00148zig2memcdm0	cmsj486o900018zetb77l1kdw
cmsjzgyit00168zig4qdcs6uv	cmsj486o900018zetb77l1kdw
cmsjzgyiv00188zigzv0oitn8	cmsj486o900018zetb77l1kdw
cmsjzgyix001a8zighti2ndq2	cmsj486o900018zetb77l1kdw
cmsjzgyiy001c8zigl67isa16	cmsj486od00038zetgbi3bqe6
cmsjzgyj0001e8zighnopkxgx	cmsj486oc00028zetwmownyk5
cmsjzgyj2001g8zigvao7spvi	cmsj486oe00048zetoah492nb
cmsjzgyj3001i8zig06eyi6gx	cmsj486oc00028zetwmownyk5
cmsjzgyj5001k8zig3odpf3o2	cmsj486of00058zetsgme61ev
cmsjzgyj6001m8ziga2jdfps4	cmsj486og00068zetgcu8rojn
cmsjzgyj8001o8zigknntqw53	cmsj486oh00078zet01jz99sn
cmsj8u2y5000s8zp23c2e1mzi	cmsj486o900018zetb77l1kdw
cmsj8u2ya000u8zp20bo95v5b	cmsj486o900018zetb77l1kdw
cmsj8u2yc000w8zp21z3yq3rx	cmsj486oi00098zetcthi8b5t
cmsj8u2yi00148zp24h132juq	cmsj486o900018zetb77l1kdw
cmsj8u2yl00168zp242wmiasl	cmsj486o900018zetb77l1kdw
cmsj8u2yn00188zp2hiwxua3t	cmsj486o900018zetb77l1kdw
cmsj8u2yp001a8zp21n096g6a	cmsj486o900018zetb77l1kdw
cmsj8u2yr001c8zp285mr3439	cmsj486od00038zetgbi3bqe6
cmsj8u2yt001e8zp2xxpcv8sq	cmsj486oc00028zetwmownyk5
cmsj8u2yw001g8zp2obr4e3qn	cmsj486oe00048zetoah492nb
cmsj8u2yy001i8zp24c4hwaug	cmsj486oc00028zetwmownyk5
cmsj8u2z0001k8zp21io9rvf7	cmsj486of00058zetsgme61ev
cmsj8u2z2001m8zp2cq5bbhxy	cmsj486og00068zetgcu8rojn
cmsj8u2z4001o8zp2j3il4jia	cmsj486oh00078zet01jz99sn
cmsjt6x3t000s8ze1esghzjaq	cmsj486o900018zetb77l1kdw
cmsjt6x40000u8ze1q6d2yv38	cmsj486o900018zetb77l1kdw
cmsjt6x42000w8ze1kmzg0dx9	cmsj486oi00098zetcthi8b5t
cmsjt6x4900148ze1os2a2ylf	cmsj486o900018zetb77l1kdw
cmsjt6x4d00168ze192p09rqe	cmsj486o900018zetb77l1kdw
cmsjt6x4g00188ze14onk9ku8	cmsj486o900018zetb77l1kdw
cmsjt6x4j001a8ze10fmywp9l	cmsj486o900018zetb77l1kdw
cmsjt6x4m001c8ze19xdzas3x	cmsj486od00038zetgbi3bqe6
cmsjt6x4o001e8ze14x0v48s5	cmsj486oc00028zetwmownyk5
cmsjt6x4q001g8ze1mxfn2v1w	cmsj486oe00048zetoah492nb
cmsjt6x4t001i8ze10lrbu09k	cmsj486oc00028zetwmownyk5
cmsjt6x4v001k8ze1kgunlol6	cmsj486of00058zetsgme61ev
cmsjt6x4x001m8ze1u85c73io	cmsj486og00068zetgcu8rojn
cmsj6ty8k000s8z4a29kk167j	cmsj486o900018zetb77l1kdw
cmsj6ty8n000u8z4amp2lxdif	cmsj486o900018zetb77l1kdw
cmsj6ty8p000w8z4aymq4nql0	cmsj486oi00098zetcthi8b5t
cmsj6ty8s00148z4ajgkzl7o6	cmsj486o900018zetb77l1kdw
cmsj6ty8u00168z4aa78ld7is	cmsj486o900018zetb77l1kdw
cmsj6ty8v00188z4a7ro6rulm	cmsj486o900018zetb77l1kdw
cmsj6ty8x001a8z4ahap8jcm3	cmsj486o900018zetb77l1kdw
cmsj6ty8z001c8z4aikhcgdti	cmsj486od00038zetgbi3bqe6
cmsj6ty91001e8z4amk3svk3x	cmsj486oc00028zetwmownyk5
cmsj6ty92001g8z4a6cbwechl	cmsj486oe00048zetoah492nb
cmsj6ty93001i8z4a07jauw3w	cmsj486oc00028zetwmownyk5
cmsj6ty95001k8z4alb15lp2e	cmsj486of00058zetsgme61ev
cmsj6ty96001m8z4ay2tllg1p	cmsj486og00068zetgcu8rojn
cmsj6ty97001o8z4atvjmlstk	cmsj486oh00078zet01jz99sn
cmsj8c16d000s8zlpwnd2pmz1	cmsj486o900018zetb77l1kdw
cmsj6sx9p00498zy53s589cus	cmsj486o900018zetb77l1kdw
cmsj6sx9r004b8zy5bevehxc6	cmsj486o900018zetb77l1kdw
cmsj6sx9s004d8zy52yculb3v	cmsj486oi00098zetcthi8b5t
cmsj6sx9u004l8zy5ktpl9n1y	cmsj486o900018zetb77l1kdw
cmsj6sx9w004n8zy5er15uu4u	cmsj486o900018zetb77l1kdw
cmsj6sx9y004p8zy51xcokher	cmsj486o900018zetb77l1kdw
cmsj6sx9z004r8zy549bw9p3p	cmsj486o900018zetb77l1kdw
cmsj6sxa1004t8zy5d4pe80dl	cmsj486od00038zetgbi3bqe6
cmsj6sxa2004v8zy5hbjzulb1	cmsj486oc00028zetwmownyk5
cmsj6sxa4004x8zy5d9fm0tpj	cmsj486oe00048zetoah492nb
cmsj6sxa5004z8zy5j51eed0h	cmsj486oc00028zetwmownyk5
cmsj6sxa600518zy5ysm2jtc3	cmsj486of00058zetsgme61ev
cmsj6sxa700538zy5qdl5pw4h	cmsj486og00068zetgcu8rojn
cmsj6sxa900558zy5p1t6yli8	cmsj486oh00078zet01jz99sn
cmsj8c16h000u8zlp28kieihg	cmsj486o900018zetb77l1kdw
cmsj8c16j000w8zlpqyukw5tf	cmsj486oi00098zetcthi8b5t
cmsj8c16n00148zlplwh9wgj0	cmsj486o900018zetb77l1kdw
cmsj8c16p00168zlp7jla06ye	cmsj486o900018zetb77l1kdw
cmsj8c16r00188zlp6nxyfu6o	cmsj486o900018zetb77l1kdw
cmsj8c16t001a8zlp1avf9o99	cmsj486o900018zetb77l1kdw
cmsj8c16u001c8zlpvdendtmu	cmsj486od00038zetgbi3bqe6
cmsj8c16w001e8zlpngvkop8w	cmsj486oc00028zetwmownyk5
cmsj8c16x001g8zlpbpgawfif	cmsj486oe00048zetoah492nb
cmsj8c16z001i8zlpal3sm0wk	cmsj486oc00028zetwmownyk5
cmsj8c170001k8zlp207uvx0k	cmsj486of00058zetsgme61ev
cmsj8c172001m8zlp2mumbe0o	cmsj486og00068zetgcu8rojn
cmsj8c174001o8zlpufpstgya	cmsj486oh00078zet01jz99sn
cmsjsm9c0002h8zp2x1uwisuo	cmsj486o900018zetb77l1kdw
cmsjsm9c9002j8zp2nddwi6br	cmsj486o900018zetb77l1kdw
cmsjsm9cc002l8zp2inqnv5vz	cmsj486oi00098zetcthi8b5t
cmsjsm9cj002t8zp2jttyjstt	cmsj486o900018zetb77l1kdw
cmsjsm9cn002v8zp2c2nwhkhv	cmsj486o900018zetb77l1kdw
cmsjsm9cq002x8zp2nij49oov	cmsj486o900018zetb77l1kdw
cmsjsm9ct002z8zp2fb635cqv	cmsj486o900018zetb77l1kdw
cmsjsm9cw00318zp2nhw8x88x	cmsj486od00038zetgbi3bqe6
cmsjsm9cy00338zp2u4r8xdwj	cmsj486oc00028zetwmownyk5
cmsjsm9d000358zp2vx8e8t46	cmsj486oe00048zetoah492nb
cmsjsm9d300378zp2rblzr1ub	cmsj486oc00028zetwmownyk5
cmsjsm9d500398zp27lbtm4wv	cmsj486of00058zetsgme61ev
cmsjsm9d8003b8zp2mxx4rvu1	cmsj486og00068zetgcu8rojn
cmsjsm9da003d8zp22kd4ldcy	cmsj486oh00078zet01jz99sn
cmsjt6x50001o8ze1asbxgnx7	cmsj486oh00078zet01jz99sn
cmsjwa68y000s8zzvttaqonu4	cmsj486o900018zetb77l1kdw
cmsjwa691000u8zzvbgohtw40	cmsj486o900018zetb77l1kdw
cmsjwa693000w8zzvl29ryayw	cmsj486oi00098zetcthi8b5t
cmsjwa69800148zzvquzr0h9d	cmsj486o900018zetb77l1kdw
cmsjwa69a00168zzv3mi7rlrj	cmsj486o900018zetb77l1kdw
cmsjwa69b00188zzv94izh1jo	cmsj486o900018zetb77l1kdw
cmsjwa69d001a8zzvysw0oqmn	cmsj486o900018zetb77l1kdw
cmsjwa69f001c8zzvkid9isfg	cmsj486od00038zetgbi3bqe6
cmsjwa69g001e8zzv05x6kcvk	cmsj486oc00028zetwmownyk5
cmsjwa69i001g8zzvn1z7armc	cmsj486oe00048zetoah492nb
cmsjwa69j001i8zzvr6vlevfj	cmsj486oc00028zetwmownyk5
cmsjwa69l001k8zzvovpo9sdv	cmsj486of00058zetsgme61ev
cmsjwa69n001m8zzv74u2lwop	cmsj486og00068zetgcu8rojn
cmsjwa69o001o8zzv8zkq9182	cmsj486oh00078zet01jz99sn
cmsk0092i000s8zrd3ohbq4fv	cmsj486o900018zetb77l1kdw
cmsk0092m000u8zrdy59v11t4	cmsj486o900018zetb77l1kdw
cmsk0092o000w8zrd0237ike4	cmsj486oi00098zetcthi8b5t
cmsk0092s00148zrd4t14wmte	cmsj486o900018zetb77l1kdw
cmsk0092v00168zrdco4rp5yw	cmsj486o900018zetb77l1kdw
cmsk0092w00188zrd7jigwd0t	cmsj486o900018zetb77l1kdw
cmsk0092y001a8zrdgyfpmev8	cmsj486o900018zetb77l1kdw
cmsk00930001c8zrder2j0r3p	cmsj486od00038zetgbi3bqe6
cmsk00931001e8zrdh66gvied	cmsj486oc00028zetwmownyk5
cmsk00933001g8zrdcf4q807e	cmsj486oe00048zetoah492nb
cmsk00934001i8zrdql56b37u	cmsj486oc00028zetwmownyk5
cmsk00936001k8zrdruzom8l0	cmsj486of00058zetsgme61ev
cmsk00937001m8zrd0tcn62si	cmsj486og00068zetgcu8rojn
cmsk00939001o8zrdct0xh6cj	cmsj486oh00078zet01jz99sn
cmslouyzz001h8zcecnn5fjgo	cmsj486o900018zetb77l1kdw
cmslouz0c001j8zceihfo7uxy	cmsj486o900018zetb77l1kdw
cmslouz0h001l8zcexfmuk7vx	cmsj486oi00098zetcthi8b5t
cmslouz0s001t8zcee1dfom6c	cmsj486o900018zetb77l1kdw
cmslouz0z001v8zcemxlocj59	cmsj486o900018zetb77l1kdw
cmslouz14001x8zceczeypwzb	cmsj486o900018zetb77l1kdw
cmslouz1a001z8zcekxk296q7	cmsj486o900018zetb77l1kdw
cmslouz1g00218zcev9m7u4qp	cmsj486od00038zetgbi3bqe6
cmslouz1l00238zcerelakruq	cmsj486oc00028zetwmownyk5
cmslouz1p00258zcedopm44zu	cmsj486oe00048zetoah492nb
cmslouz1s00278zce2c4mtlw1	cmsj486oc00028zetwmownyk5
cmslouz1x00298zcem75b7mbh	cmsj486of00058zetsgme61ev
cmslouz20002b8zcenerc7yc7	cmsj486og00068zetgcu8rojn
cmslouz24002d8zce66j3zrto	cmsj486oh00078zet01jz99sn
cmslqfspg00368zce89jpjlpe	cmsj486o900018zetb77l1kdw
cmslqfspp00388zce51b0d08u	cmsj486o900018zetb77l1kdw
cmslqfsps003a8zcee32t2uwo	cmsj486oi00098zetcthi8b5t
cmslqfspz003i8zcei6eh3umg	cmsj486o900018zetb77l1kdw
cmslqfsq4003k8zce32ab8vcs	cmsj486o900018zetb77l1kdw
cmslqfsq7003m8zceb6krhqbn	cmsj486o900018zetb77l1kdw
cmslqfsqa003o8zceuvdg0s7d	cmsj486o900018zetb77l1kdw
cmslqfsqc003q8zcebhhrxlm4	cmsj486od00038zetgbi3bqe6
cmslqfsqf003s8zcevx3t28yo	cmsj486oc00028zetwmownyk5
cmslqfsqi003u8zce1e0xla0t	cmsj486oe00048zetoah492nb
cmslqfsqk003w8zce5r0s9vaj	cmsj486oc00028zetwmownyk5
cmslqfsqn003y8zcekhlfiyc2	cmsj486of00058zetsgme61ev
cmslqfsqp00408zcebnvw8auv	cmsj486og00068zetgcu8rojn
cmslqfsqs00428zcebrj3c9hh	cmsj486oh00078zet01jz99sn
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: pyramid
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
57809ce6-0b0f-4e95-81ff-19e4773da7d6	2c27f11fa4a3c5cbd149fd272ae9c76ca7b04b51e526ee624ba1a6d5424f4a4f	2026-08-07 15:02:29.722399+00	20260807150229_init	\N	\N	2026-08-07 15:02:29.697817+00	1
\.


--
-- Name: Activity Activity_pkey; Type: CONSTRAINT; Schema: public; Owner: pyramid
--

ALTER TABLE ONLY public."Activity"
    ADD CONSTRAINT "Activity_pkey" PRIMARY KEY (id);


--
-- Name: Comment Comment_pkey; Type: CONSTRAINT; Schema: public; Owner: pyramid
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_pkey" PRIMARY KEY (id);


--
-- Name: Label Label_pkey; Type: CONSTRAINT; Schema: public; Owner: pyramid
--

ALTER TABLE ONLY public."Label"
    ADD CONSTRAINT "Label_pkey" PRIMARY KEY (id);


--
-- Name: Project Project_pkey; Type: CONSTRAINT; Schema: public; Owner: pyramid
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_pkey" PRIMARY KEY (id);


--
-- Name: Resource Resource_pkey; Type: CONSTRAINT; Schema: public; Owner: pyramid
--

ALTER TABLE ONLY public."Resource"
    ADD CONSTRAINT "Resource_pkey" PRIMARY KEY (id);


--
-- Name: Task Task_pkey; Type: CONSTRAINT; Schema: public; Owner: pyramid
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: pyramid
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _TaskLabels _TaskLabels_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: pyramid
--

ALTER TABLE ONLY public."_TaskLabels"
    ADD CONSTRAINT "_TaskLabels_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _TaskMembers _TaskMembers_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: pyramid
--

ALTER TABLE ONLY public."_TaskMembers"
    ADD CONSTRAINT "_TaskMembers_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: pyramid
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Activity_taskId_idx; Type: INDEX; Schema: public; Owner: pyramid
--

CREATE INDEX "Activity_taskId_idx" ON public."Activity" USING btree ("taskId");


--
-- Name: Comment_taskId_idx; Type: INDEX; Schema: public; Owner: pyramid
--

CREATE INDEX "Comment_taskId_idx" ON public."Comment" USING btree ("taskId");


--
-- Name: Label_name_key; Type: INDEX; Schema: public; Owner: pyramid
--

CREATE UNIQUE INDEX "Label_name_key" ON public."Label" USING btree (name);


--
-- Name: Project_ownerId_idx; Type: INDEX; Schema: public; Owner: pyramid
--

CREATE INDEX "Project_ownerId_idx" ON public."Project" USING btree ("ownerId");


--
-- Name: Task_ownerId_status_position_idx; Type: INDEX; Schema: public; Owner: pyramid
--

CREATE INDEX "Task_ownerId_status_position_idx" ON public."Task" USING btree ("ownerId", status, "position");


--
-- Name: Task_parentId_idx; Type: INDEX; Schema: public; Owner: pyramid
--

CREATE INDEX "Task_parentId_idx" ON public."Task" USING btree ("parentId");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: pyramid
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_googleId_key; Type: INDEX; Schema: public; Owner: pyramid
--

CREATE UNIQUE INDEX "User_googleId_key" ON public."User" USING btree ("googleId");


--
-- Name: _TaskLabels_B_index; Type: INDEX; Schema: public; Owner: pyramid
--

CREATE INDEX "_TaskLabels_B_index" ON public."_TaskLabels" USING btree ("B");


--
-- Name: _TaskMembers_B_index; Type: INDEX; Schema: public; Owner: pyramid
--

CREATE INDEX "_TaskMembers_B_index" ON public."_TaskMembers" USING btree ("B");


--
-- Name: Activity Activity_actorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pyramid
--

ALTER TABLE ONLY public."Activity"
    ADD CONSTRAINT "Activity_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Activity Activity_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pyramid
--

ALTER TABLE ONLY public."Activity"
    ADD CONSTRAINT "Activity_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public."Task"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Comment Comment_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pyramid
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Comment Comment_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pyramid
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Comment"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Comment Comment_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pyramid
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public."Task"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Project Project_leadId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pyramid
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Project Project_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pyramid
--

ALTER TABLE ONLY public."Project"
    ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Resource Resource_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pyramid
--

ALTER TABLE ONLY public."Resource"
    ADD CONSTRAINT "Resource_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public."Task"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Task Task_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pyramid
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Task Task_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pyramid
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Task"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Task Task_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pyramid
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public."Project"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Task Task_reporterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pyramid
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: _TaskLabels _TaskLabels_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pyramid
--

ALTER TABLE ONLY public."_TaskLabels"
    ADD CONSTRAINT "_TaskLabels_A_fkey" FOREIGN KEY ("A") REFERENCES public."Label"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _TaskLabels _TaskLabels_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pyramid
--

ALTER TABLE ONLY public."_TaskLabels"
    ADD CONSTRAINT "_TaskLabels_B_fkey" FOREIGN KEY ("B") REFERENCES public."Task"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _TaskMembers _TaskMembers_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pyramid
--

ALTER TABLE ONLY public."_TaskMembers"
    ADD CONSTRAINT "_TaskMembers_A_fkey" FOREIGN KEY ("A") REFERENCES public."Task"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _TaskMembers _TaskMembers_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: pyramid
--

ALTER TABLE ONLY public."_TaskMembers"
    ADD CONSTRAINT "_TaskMembers_B_fkey" FOREIGN KEY ("B") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict PARKIDyUFFJEkycoq5cFbnbLlmlMnDK9tpqLlOY8C6o8EfUrgH63DGSiyNPiVbM

