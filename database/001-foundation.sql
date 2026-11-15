CREATE SCHEMA private;
CREATE SCHEMA extensions;
CREATE EXTENSION pgcrypto WITH SCHEMA extensions;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM PUBLIC;

CREATE TABLE public.garages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, synthetic boolean NOT NULL DEFAULT false
);
CREATE TABLE private.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), garage_id uuid NOT NULL REFERENCES public.garages(id),
  email text NOT NULL UNIQUE, display_name text NOT NULL, password_hash text NOT NULL,
  role text NOT NULL CHECK (role IN ('boss','seller','mechanic')), active boolean NOT NULL DEFAULT true
);
CREATE TABLE private.sessions (
  token_hash text PRIMARY KEY, account_id uuid NOT NULL REFERENCES private.accounts(id),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '8 hours'
);
CREATE TABLE private.login_limits (
  key text PRIMARY KEY, failures integer NOT NULL DEFAULT 0, started_at timestamptz NOT NULL DEFAULT now()
);

CREATE FUNCTION public.open_session(p_email text, p_password text, p_hash text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE account private.accounts; attempts private.login_limits;
BEGIN
  IF length(p_email) > 254 OR length(p_password) > 200 OR p_hash !~ '^[a-f0-9]{64}$' THEN RETURN false; END IF;
  INSERT INTO private.login_limits(key) VALUES (lower(p_email)) ON CONFLICT DO NOTHING;
  SELECT * INTO attempts FROM private.login_limits WHERE key=lower(p_email) FOR UPDATE;
  IF attempts.started_at < now() - interval '15 minutes' THEN
    UPDATE private.login_limits SET failures=0, started_at=now() WHERE key=lower(p_email);
    attempts.failures := 0;
  END IF;
  IF attempts.failures >= 5 THEN RETURN false; END IF;
  SELECT * INTO account FROM private.accounts WHERE email=lower(p_email) AND active;
  IF account.id IS NULL OR extensions.crypt(p_password, account.password_hash) <> account.password_hash THEN
    UPDATE private.login_limits SET failures=failures+1 WHERE key=lower(p_email);
    RETURN false;
  END IF;
  DELETE FROM private.sessions WHERE expires_at < now();
  INSERT INTO private.sessions(token_hash,account_id) VALUES (p_hash,account.id);
  DELETE FROM private.login_limits WHERE key=lower(p_email);
  RETURN true;
END $$;

CREATE FUNCTION public.session_identity()
RETURNS TABLE(account_id uuid,garage_id uuid,display_name text,role text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
  SELECT a.id,a.garage_id,a.display_name,a.role FROM private.sessions s
  JOIN private.accounts a ON a.id=s.account_id
  WHERE s.token_hash=nullif(current_setting('app.session_hash',true),'') AND s.expires_at>now() AND a.active
$$;
CREATE FUNCTION public.current_garage() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
  SELECT garage_id FROM public.session_identity()
$$;
CREATE FUNCTION public.close_session() RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $$
  DELETE FROM private.sessions WHERE token_hash=nullif(current_setting('app.session_hash',true),'')
$$;

CREATE TABLE public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), garage_id uuid NOT NULL DEFAULT public.current_garage() REFERENCES public.garages(id),
  plate text NOT NULL CHECK (plate ~ '^(DEMO-[0-9]{3}|[A-Z]{2}-[0-9]{3}-[A-Z]{2})$'),
  synthetic boolean NOT NULL, last_known jsonb, latest_status text NOT NULL CHECK (latest_status IN ('identified','incomplete','ambiguous','not_found','unavailable')),
  checked_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(garage_id,plate), UNIQUE(garage_id,id)
);
CREATE TABLE public.observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), garage_id uuid NOT NULL DEFAULT public.current_garage(),
  vehicle_id uuid NOT NULL, source text NOT NULL, result jsonb NOT NULL, checked_at timestamptz NOT NULL,
  FOREIGN KEY(garage_id,vehicle_id) REFERENCES public.vehicles(garage_id,id) ON DELETE CASCADE
);

ALTER TABLE public.garages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garages FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_garage ON public.garages USING(id=public.current_garage());
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_vehicle ON public.vehicles USING(garage_id=public.current_garage()) WITH CHECK(garage_id=public.current_garage());
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observations FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_observation ON public.observations USING(garage_id=public.current_garage()) WITH CHECK(garage_id=public.current_garage());

REVOKE ALL ON FUNCTION public.open_session(text,text,text),public.session_identity(),public.current_garage(),public.close_session() FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO depanos_app;
GRANT EXECUTE ON FUNCTION public.open_session(text,text,text),public.session_identity(),public.current_garage(),public.close_session() TO depanos_app;
GRANT SELECT ON public.garages TO depanos_app;
GRANT SELECT,INSERT,UPDATE ON public.vehicles TO depanos_app;
GRANT SELECT,INSERT ON public.observations TO depanos_app;
