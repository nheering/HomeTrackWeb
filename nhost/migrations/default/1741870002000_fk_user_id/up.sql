-- FK-Constraints: user_id → auth.users (ON DELETE CASCADE)
-- Stellt sicher, dass beim Löschen eines Nutzers alle zugehörigen Daten entfernt werden (DSGVO).

ALTER TABLE verbrauchstyp
  ADD CONSTRAINT fk_verbrauchstyp_user
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE verbrauchsstelle
  ADD CONSTRAINT fk_verbrauchsstelle_user
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE anbieter
  ADD CONSTRAINT fk_anbieter_user
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE vertrag
  ADD CONSTRAINT fk_vertrag_user
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE preisperiode
  ADD CONSTRAINT fk_preisperiode_user
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE verbrauchswert
  ADD CONSTRAINT fk_verbrauchswert_user
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
