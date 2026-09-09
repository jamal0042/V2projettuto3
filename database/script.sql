    -- WARNING: This schema is for context only and is not meant to be run.
    -- Table order and constraints may not be valid for execution.

    CREATE TABLE public.members (
    id uuid NOT NULL,
    role text NOT NULL DEFAULT 'student'::text CHECK (role = ANY (ARRAY['admin'::text, 'librarian'::text, 'teacher'::text, 'student'::text, 'external'::text])),
    first_name text NOT NULL DEFAULT ''::text,
    last_name text NOT NULL DEFAULT ''::text,
    email text NOT NULL DEFAULT ''::text,
    phone text,
    matricule text,
    department text,
    status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'pending'::text, 'suspended'::text, 'inactive'::text])),
    max_loans integer NOT NULL DEFAULT 5,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    invite_status text CHECK (invite_status IS NULL OR (invite_status = ANY (ARRAY['pending'::text, 'accepted'::text, 'expired'::text, 'revoked'::text]))),
    invite_token_hash text,
    invite_sent_at timestamp with time zone,
    invite_expires_at timestamp with time zone,
    invite_accepted_at timestamp with time zone,
    invited_by uuid,
    birth_date date,
    address text,
    city text,
    level text,
    speciality text,
    notes text,
    max_loans_duration integer,
    max_digital_loans integer,
    email_notifications boolean DEFAULT true,
    sms_notifications boolean DEFAULT false,
    CONSTRAINT members_pkey PRIMARY KEY (id),
    CONSTRAINT members_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
    CONSTRAINT members_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.members(id)
    );
    CREATE TABLE public.auteurs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    nationality text,
    birth_year integer,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT auteurs_pkey PRIMARY KEY (id)
    );
    CREATE TABLE public.categories (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    code text UNIQUE,
    description text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT categories_pkey PRIMARY KEY (id)
    );
    CREATE TABLE public.locations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    name text NOT NULL,
    building text,
    floor integer,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    parent_id uuid,
    level text NOT NULL DEFAULT 'bibliotheque'::text CHECK (level = ANY (ARRAY['bibliotheque'::text, 'salle'::text, 'section'::text, 'rayon'::text, 'etagere'::text, 'position'::text])),
    CONSTRAINT locations_pkey PRIMARY KEY (id),
    CONSTRAINT locations_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.locations(id)
    );
    CREATE TABLE public.documents (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    title text NOT NULL,
    category_id uuid,
    isbn text,
    type text NOT NULL DEFAULT 'book'::text CHECK (type = ANY (ARRAY['book'::text, 'thesis'::text, 'memoire'::text, 'journal'::text, 'article'::text, 'dvd'::text, 'cd'::text, 'other'::text])),
    publisher text,
    year integer,
    language text DEFAULT 'fr'::text,
    pages integer,
    description text,
    cover_url text,
    digital_url text,
    tags ARRAY DEFAULT '{}'::text[],
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    format text DEFAULT 'physique'::text,
    file_path text,
    subtitle text,
    keywords text,
    cote_dewey text,
    cote_complete text,
    edition text,
    volume text,
    issn text,
    doi text,
    collection text,
    num_report text,
    institution text,
    department text,
    academic_year text,
    dewey_code text,
    CONSTRAINT documents_pkey PRIMARY KEY (id),
    CONSTRAINT documents_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id),
    CONSTRAINT documents_dewey_code_fkey FOREIGN KEY (dewey_code) REFERENCES public.dewey_classes(code)
    );
    CREATE TABLE public.exemplaires (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL,
    barcode text NOT NULL UNIQUE,
    inventory_code text,
    status text NOT NULL DEFAULT 'available'::text CHECK (status = ANY (ARRAY['available'::text, 'loaned'::text, 'reserved'::text, 'maintenance'::text, 'lost'::text])),
    location_id uuid,
    acquisition_date date,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    cote_complete text,
    CONSTRAINT exemplaires_pkey PRIMARY KEY (id),
    CONSTRAINT exemplaires_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id),
    CONSTRAINT exemplaires_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id)
    );
    CREATE TABLE public.prets (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    member_id uuid NOT NULL,
    exemplaire_id uuid NOT NULL,
    loan_date date NOT NULL DEFAULT CURRENT_DATE,
    due_date date NOT NULL,
    status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'overdue'::text, 'returned'::text])),
    notified_overdue boolean DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT prets_pkey PRIMARY KEY (id),
    CONSTRAINT prets_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id),
    CONSTRAINT prets_exemplaire_id_fkey FOREIGN KEY (exemplaire_id) REFERENCES public.exemplaires(id)
    );
    CREATE TABLE public.retours (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    pret_id uuid NOT NULL UNIQUE,
    return_date timestamp with time zone NOT NULL DEFAULT now(),
    days_late integer DEFAULT 0,
    penalty_amount numeric DEFAULT 0,
    book_condition text DEFAULT 'good'::text CHECK (book_condition = ANY (ARRAY['good'::text, 'damaged'::text, 'lost'::text])),
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT retours_pkey PRIMARY KEY (id),
    CONSTRAINT retours_pret_id_fkey FOREIGN KEY (pret_id) REFERENCES public.prets(id)
    );
    CREATE TABLE public.reservations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL,
    member_id uuid NOT NULL,
    reserved_date date NOT NULL DEFAULT CURRENT_DATE,
    available_date date,
    expiry_date date,
    status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'ready'::text, 'fulfilled'::text, 'cancelled'::text, 'expired'::text])),
    note text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT reservations_pkey PRIMARY KEY (id),
    CONSTRAINT reservations_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id),
    CONSTRAINT reservations_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id)
    );
    CREATE TABLE public.penalites (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    member_id uuid NOT NULL,
    pret_id uuid,
    type text NOT NULL DEFAULT 'late'::text CHECK (type = ANY (ARRAY['late'::text, 'lost'::text, 'damage'::text, 'other'::text])),
    amount numeric NOT NULL DEFAULT 0,
    days integer DEFAULT 0,
    reason text,
    status text NOT NULL DEFAULT 'unpaid'::text CHECK (status = ANY (ARRAY['unpaid'::text, 'paid'::text, 'waived'::text])),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    resolved_at timestamp with time zone,
    CONSTRAINT penalites_pkey PRIMARY KEY (id),
    CONSTRAINT penalites_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id)
    );
    CREATE TABLE public.digital_resources (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    url text NOT NULL,
    type text NOT NULL DEFAULT 'pdf'::text,
    category text NOT NULL DEFAULT 'article'::text,
    access_level text NOT NULL DEFAULT 'all'::text CHECK (access_level = ANY (ARRAY['all'::text, 'student'::text, 'staff'::text])),
    document_id uuid,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    downloadable boolean NOT NULL DEFAULT true,
    author_id uuid,
    uploaded_by uuid,
    CONSTRAINT digital_resources_pkey PRIMARY KEY (id),
    CONSTRAINT digital_resources_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id),
    CONSTRAINT digital_resources_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.auteurs(id),
    CONSTRAINT digital_resources_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.members(id)
    );
    CREATE TABLE public.notifications (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    member_id uuid,
    pret_id uuid,
    type text NOT NULL DEFAULT 'retard'::text,
    subject text NOT NULL,
    message text,
    channel text NOT NULL DEFAULT 'email'::text,
    status text NOT NULL DEFAULT 'sent'::text,
    sent_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT notifications_pkey PRIMARY KEY (id),
    CONSTRAINT notifications_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id),
    CONSTRAINT notifications_pret_id_fkey FOREIGN KEY (pret_id) REFERENCES public.prets(id)
    );
    CREATE TABLE public.activity_log (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    actor_id uuid,
    action text NOT NULL,
    entity text,
    entity_id uuid,
    details jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT activity_log_pkey PRIMARY KEY (id),
    CONSTRAINT activity_log_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.members(id)
    );
    CREATE TABLE public.settings (
    id integer NOT NULL DEFAULT 1 CHECK (id = 1),
    library_name text,
    library_address text,
    library_phone text,
    library_email text,
    penalty_per_day_late integer DEFAULT 100,
    penalty_lost_book integer DEFAULT 15000,
    penalty_damaged_book integer DEFAULT 5000,
    enable_email_notifications boolean DEFAULT true,
    enable_sms_notifications boolean DEFAULT false,
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT settings_pkey PRIMARY KEY (id)
    );
    CREATE TABLE public.ai_conversations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    member_id uuid NOT NULL,
    role text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text])),
    content text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT ai_conversations_pkey PRIMARY KEY (id),
    CONSTRAINT ai_conversations_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id)
    );
    CREATE TABLE public.document_auteurs (
    document_id uuid NOT NULL,
    author_id uuid NOT NULL,
    role text NOT NULL DEFAULT 'principal'::text CHECK (role = ANY (ARRAY['principal'::text, 'coauteur'::text, 'secondaire'::text, 'encadreur'::text, 'directeur_memoire'::text, 'directeur_these'::text, 'editeur_scientifique'::text, 'traducteur'::text, 'illustrateur'::text, 'coordinateur'::text, 'responsable_institutionnel'::text])),
    author_order integer NOT NULL DEFAULT 1,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT document_auteurs_pkey PRIMARY KEY (document_id, author_id),
    CONSTRAINT document_auteurs_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id),
    CONSTRAINT document_auteurs_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.auteurs(id)
    );
    CREATE TABLE public.dewey_classes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE,
    libelle text NOT NULL,
    parent_code text,
    description text,
    status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'deprecated'::text, 'draft'::text])),
    source text,
    level integer,
    CONSTRAINT dewey_classes_pkey PRIMARY KEY (id)
    );
    CREATE TABLE public.classification_log (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    document_id uuid,
    source text NOT NULL DEFAULT 'manual'::text CHECK (source = ANY (ARRAY['manual'::text, 'ai'::text, 'import'::text])),
    status text NOT NULL DEFAULT 'proposed'::text CHECK (status = ANY (ARRAY['proposed'::text, 'validated'::text, 'rejected'::text, 'modified'::text])),
    proposed_code text,
    proposed_libelle text,
    confidence integer CHECK (confidence >= 0 AND confidence <= 100),
    justification text,
    validated_code text,
    validated_by uuid,
    validated_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT classification_log_pkey PRIMARY KEY (id),
    CONSTRAINT classification_log_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.documents(id),
    CONSTRAINT classification_log_validated_by_fkey FOREIGN KEY (validated_by) REFERENCES public.members(id)
    );
    CREATE TABLE public.contact_messages (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    type text NOT NULL DEFAULT 'contact'::text CHECK (type = ANY (ARRAY['contact'::text, 'demo'::text])),
    name text NOT NULL,
    email text NOT NULL,
    subject text,
    message text,
    establishment text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    read boolean NOT NULL DEFAULT false,
    CONSTRAINT contact_messages_pkey PRIMARY KEY (id)
    );