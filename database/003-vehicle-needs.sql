CREATE TABLE public.vehicle_needs (
  id uuid PRIMARY KEY,
  garage_id uuid NOT NULL DEFAULT public.current_garage(),
  vehicle_id uuid NOT NULL,
  family text NOT NULL CHECK(family IN ('filtration','braking','timing','suspension','steering','transmission','ignition')),
  label text NOT NULL CHECK(length(btrim(label)) BETWEEN 1 AND 120),
  quantity integer NOT NULL CHECK(quantity BETWEEN 1 AND 9999),
  axle text NOT NULL CHECK(axle IN ('front','rear','not_applicable','unknown')),
  side text NOT NULL CHECK(side IN ('left','right','both','not_applicable','unknown')),
  notes text NOT NULL DEFAULT '' CHECK(length(notes)<=1000),
  active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  created_by uuid NOT NULL REFERENCES private.accounts(id),
  updated_by uuid NOT NULL REFERENCES private.accounts(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(garage_id,vehicle_id) REFERENCES public.vehicles(garage_id,id),
  UNIQUE(garage_id,id)
);
CREATE INDEX vehicle_needs_vehicle ON public.vehicle_needs(garage_id,vehicle_id) WHERE active;
CREATE TABLE public.need_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  garage_id uuid NOT NULL,
  need_id uuid NOT NULL,
  actor_id uuid NOT NULL REFERENCES private.accounts(id),
  happened_at timestamptz NOT NULL DEFAULT now(),
  before_value jsonb,
  after_value jsonb NOT NULL,
  FOREIGN KEY(garage_id,need_id) REFERENCES public.vehicle_needs(garage_id,id)
);
ALTER TABLE public.vehicle_needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_needs FORCE ROW LEVEL SECURITY;
CREATE POLICY needs_tenant ON public.vehicle_needs USING(garage_id=public.current_garage()) WITH CHECK(garage_id=public.current_garage());
ALTER TABLE public.need_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.need_events FORCE ROW LEVEL SECURITY;
CREATE POLICY events_tenant ON public.need_events FOR SELECT USING(garage_id=public.current_garage());

CREATE FUNCTION private.prepare_need() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE actor uuid;
BEGIN
  SELECT account_id INTO actor FROM public.session_identity();
  IF actor IS NULL THEN RAISE EXCEPTION 'Session requise' USING ERRCODE='42501'; END IF;
  IF TG_OP='UPDATE' THEN
    IF (NEW.id,NEW.garage_id,NEW.vehicle_id) IS DISTINCT FROM (OLD.id,OLD.garage_id,OLD.vehicle_id) THEN
      RAISE EXCEPTION 'Déplacement interdit' USING ERRCODE='42501';
    END IF;
    NEW.created_by:=OLD.created_by; NEW.created_at:=OLD.created_at;
    NEW.version:=OLD.version+1;
  ELSE
    NEW.created_by:=actor; NEW.created_at:=now(); NEW.version:=1;
  END IF;
  IF NEW.active AND NOT EXISTS(SELECT 1 FROM public.vehicles WHERE id=NEW.vehicle_id AND garage_id=NEW.garage_id AND latest_status='identified') THEN
    RAISE EXCEPTION 'Identité incomplète ou inaccessible' USING ERRCODE='23514';
  END IF;
  NEW.updated_by:=actor; NEW.updated_at:=now();
  RETURN NEW;
END $$;
CREATE TRIGGER prepare_need BEFORE INSERT OR UPDATE ON public.vehicle_needs FOR EACH ROW EXECUTE FUNCTION private.prepare_need();

CREATE FUNCTION private.audit_need() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
  INSERT INTO public.need_events(garage_id,need_id,actor_id,before_value,after_value)
  VALUES(NEW.garage_id,NEW.id,NEW.updated_by,CASE WHEN TG_OP='UPDATE' THEN to_jsonb(OLD) ELSE NULL END,to_jsonb(NEW));
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.prepare_need(),private.audit_need() FROM PUBLIC;
CREATE TRIGGER audit_need AFTER INSERT OR UPDATE ON public.vehicle_needs FOR EACH ROW EXECUTE FUNCTION private.audit_need();
GRANT SELECT,INSERT ON public.vehicle_needs TO depanos_app;
GRANT UPDATE(family,label,quantity,axle,side,notes,active) ON public.vehicle_needs TO depanos_app;
GRANT SELECT ON public.need_events TO depanos_app;
