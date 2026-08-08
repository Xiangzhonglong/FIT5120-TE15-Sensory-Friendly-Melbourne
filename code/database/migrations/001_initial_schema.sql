BEGIN;

CREATE TABLE pedestrian_sensor (
  location_id INTEGER PRIMARY KEY,
  sensor_name VARCHAR(100) NOT NULL,
  sensor_description VARCHAR(255) NOT NULL,
  status CHAR(1) NOT NULL,
  location_type VARCHAR(50),
  direction_1_label VARCHAR(50),
  direction_2_label VARCHAR(50),
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  installation_date DATE,
  source_note TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pedestrian_sensor_status_check
    CHECK (status IN ('A', 'I', 'R')),
  CONSTRAINT pedestrian_sensor_latitude_check
    CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT pedestrian_sensor_longitude_check
    CHECK (longitude BETWEEN -180 AND 180)
);

CREATE TABLE pedestrian_count_minute (
  location_id INTEGER NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  direction_1_count INTEGER NOT NULL,
  direction_2_count INTEGER NOT NULL,
  pedestrian_count INTEGER NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (location_id, observed_at),
  CONSTRAINT pedestrian_count_minute_sensor_fk
    FOREIGN KEY (location_id)
    REFERENCES pedestrian_sensor(location_id),
  CONSTRAINT pedestrian_count_minute_direction_1_check
    CHECK (direction_1_count >= 0),
  CONSTRAINT pedestrian_count_minute_direction_2_check
    CHECK (direction_2_count >= 0),
  CONSTRAINT pedestrian_count_minute_total_check
    CHECK (pedestrian_count = direction_1_count + direction_2_count)
);

CREATE INDEX idx_minute_observed_at
  ON pedestrian_count_minute(observed_at);

CREATE TABLE pedestrian_count_hourly (
  location_id INTEGER NOT NULL,
  sensing_date DATE NOT NULL,
  hour_of_day SMALLINT NOT NULL,
  pedestrian_count INTEGER NOT NULL,
  sensor_name VARCHAR(100),
  PRIMARY KEY (location_id, sensing_date, hour_of_day),
  CONSTRAINT pedestrian_count_hourly_sensor_fk
    FOREIGN KEY (location_id)
    REFERENCES pedestrian_sensor(location_id),
  CONSTRAINT pedestrian_count_hourly_hour_check
    CHECK (hour_of_day BETWEEN 0 AND 23),
  CONSTRAINT pedestrian_count_hourly_count_check
    CHECK (pedestrian_count >= 0)
);

CREATE INDEX idx_hourly_lookup
  ON pedestrian_count_hourly(location_id, hour_of_day, sensing_date);

CREATE TABLE quiet_space_candidate (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(30) NOT NULL,
  latitude NUMERIC(10, 8) NOT NULL,
  longitude NUMERIC(11, 8) NOT NULL,
  source_dataset_id VARCHAR(255) NOT NULL,
  source_category VARCHAR(255) NOT NULL,
  source_record_name VARCHAR(255) NOT NULL,
  source_label VARCHAR(255) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT quiet_space_candidate_type_check
    CHECK (type IN ('PARK', 'LIBRARY', 'PUBLIC_SPACE')),
  CONSTRAINT quiet_space_candidate_latitude_check
    CHECK (latitude BETWEEN -90 AND 90),
  CONSTRAINT quiet_space_candidate_longitude_check
    CHECK (longitude BETWEEN -180 AND 180)
);

COMMIT;
