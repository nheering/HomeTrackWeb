ALTER TABLE verbrauchswert  DROP CONSTRAINT IF EXISTS fk_verbrauchswert_user;
ALTER TABLE preisperiode    DROP CONSTRAINT IF EXISTS fk_preisperiode_user;
ALTER TABLE vertrag         DROP CONSTRAINT IF EXISTS fk_vertrag_user;
ALTER TABLE anbieter        DROP CONSTRAINT IF EXISTS fk_anbieter_user;
ALTER TABLE verbrauchsstelle DROP CONSTRAINT IF EXISTS fk_verbrauchsstelle_user;
ALTER TABLE verbrauchstyp   DROP CONSTRAINT IF EXISTS fk_verbrauchstyp_user;
