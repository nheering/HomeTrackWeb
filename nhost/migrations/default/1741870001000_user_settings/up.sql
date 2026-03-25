-- HomeTrack: User Settings
CREATE TABLE user_settings (
  user_id        UUID  PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nav_position   TEXT  NOT NULL DEFAULT 'bottom'
    CHECK (nav_position IN ('bottom', 'left')),
  aktualisiert_am TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE OR REPLACE FUNCTION set_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.aktualisiert_am = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_settings_updated
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION set_user_settings_updated_at();
