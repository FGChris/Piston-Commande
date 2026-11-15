-- bcrypt ne doit pas tronquer silencieusement un mot de passe au-delà de 72 octets.
CREATE OR REPLACE FUNCTION public.open_session(p_email text, p_password text, p_hash text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $$
DECLARE account private.accounts; attempts private.login_limits;
BEGIN
  IF p_email IS NULL OR p_password IS NULL OR p_hash IS NULL THEN RETURN false; END IF;
  IF length(p_email) > 254 OR octet_length(p_password) > 72 OR p_hash !~ '^[a-f0-9]{64}$' THEN RETURN false; END IF;
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
