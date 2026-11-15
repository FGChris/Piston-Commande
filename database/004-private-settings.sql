CREATE TABLE public.supplier_credentials (
 garage_id uuid NOT NULL DEFAULT public.current_garage() REFERENCES public.garages(id),
 provider text NOT NULL CHECK(provider IN ('dasir','pavi','partslink24','yacco','henrri')),
 sealed_value text NOT NULL CHECK(length(sealed_value) BETWEEN 20 AND 20000),
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(garage_id,provider)
);
ALTER TABLE public.supplier_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_credentials FORCE ROW LEVEL SECURITY;
CREATE POLICY private_supplier ON public.supplier_credentials
 USING(garage_id=public.current_garage() AND EXISTS(SELECT 1 FROM public.session_identity() WHERE role='boss'))
 WITH CHECK(garage_id=public.current_garage() AND EXISTS(SELECT 1 FROM public.session_identity() WHERE role='boss'));
GRANT SELECT,INSERT,UPDATE,DELETE ON public.supplier_credentials TO depanos_app;
CREATE TABLE public.settings_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,garage_id uuid NOT NULL REFERENCES public.garages(id),
 actor_id uuid NOT NULL REFERENCES private.accounts(id), provider text NOT NULL,
 action text NOT NULL,happened_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.settings_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings_events FORCE ROW LEVEL SECURITY;
CREATE POLICY private_settings_events ON public.settings_events FOR SELECT
 USING(garage_id=public.current_garage() AND EXISTS(SELECT 1 FROM public.session_identity() WHERE role='boss'));
GRANT SELECT ON public.settings_events TO depanos_app;
CREATE FUNCTION private.audit_supplier() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE actor uuid; tenant uuid; source text;
BEGIN
 SELECT account_id INTO actor FROM public.session_identity();
 tenant:=CASE WHEN TG_OP='DELETE' THEN OLD.garage_id ELSE NEW.garage_id END;
 source:=CASE WHEN TG_OP='DELETE' THEN OLD.provider ELSE NEW.provider END;
 INSERT INTO public.settings_events(garage_id,actor_id,provider,action) VALUES(tenant,actor,source,TG_OP);
 RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION private.audit_supplier() FROM PUBLIC;
CREATE TRIGGER audit_supplier AFTER INSERT OR UPDATE OR DELETE ON public.supplier_credentials FOR EACH ROW EXECUTE FUNCTION private.audit_supplier();

CREATE FUNCTION public.change_password(p_current text,p_new text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE account private.accounts; attempts private.login_limits; limit_key text;
BEGIN
 SELECT a.* INTO account FROM private.accounts a JOIN public.session_identity() s ON s.account_id=a.id FOR UPDATE OF a;
 IF account.id IS NULL OR p_current IS NULL OR p_new IS NULL OR octet_length(p_current)>72 OR octet_length(p_new)>72 OR length(p_new)<15 OR p_current=p_new THEN RETURN false; END IF;
 limit_key:='password:'||account.id::text;
 INSERT INTO private.login_limits(key) VALUES(limit_key) ON CONFLICT DO NOTHING;
 SELECT * INTO attempts FROM private.login_limits WHERE key=limit_key FOR UPDATE;
 IF attempts.started_at<now()-interval '15 minutes' THEN
 UPDATE private.login_limits SET failures=0,started_at=now() WHERE key=limit_key;attempts.failures:=0;
 END IF;
 IF attempts.failures>=5 THEN RETURN false; END IF;
 IF extensions.crypt(p_current,account.password_hash)<>account.password_hash THEN
 UPDATE private.login_limits SET failures=failures+1 WHERE key=limit_key;RETURN false;
 END IF;
 UPDATE private.accounts SET password_hash=extensions.crypt(p_new,extensions.gen_salt('bf',12)) WHERE id=account.id;
 DELETE FROM private.sessions WHERE account_id=account.id;
 DELETE FROM private.login_limits WHERE key=limit_key;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.change_password(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.change_password(text,text) TO depanos_app;
