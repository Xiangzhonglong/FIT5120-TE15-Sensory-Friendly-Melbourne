CREATE TABLE pedestrian_sensor (
  location_id INT PRIMARY KEY,
  sensor_name VARCHAR(100) NOT NULL,
  sensor_description VARCHAR(255) NOT NULL,
  status CHAR(1) NOT NULL,
  location_type VARCHAR(50),
  direction_1_label VARCHAR(50),
  direction_2_label VARCHAR(50),
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  installation_date DATE,
  source_note TEXT,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  CHECK (status IN ('A', 'I', 'R')),
  CHECK (latitude BETWEEN -90 AND 90),
  CHECK (longitude BETWEEN -180 AND 180)
);

CREATE TABLE pedestrian_count_minute (
  location_id INT NOT NULL,
  observed_at DATETIME NOT NULL,
  direction_1_count INT NOT NULL,
  direction_2_count INT NOT NULL,
  pedestrian_count INT NOT NULL,
  fetched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (location_id, observed_at),
  CONSTRAINT fk_minute_sensor FOREIGN KEY (location_id)
    REFERENCES pedestrian_sensor(location_id),
  CHECK (direction_1_count >= 0),
  CHECK (direction_2_count >= 0),
  CHECK (pedestrian_count = direction_1_count + direction_2_count)
);

CREATE INDEX idx_minute_observed_at
  ON pedestrian_count_minute(observed_at);

CREATE TABLE pedestrian_count_hourly (
  location_id INT NOT NULL,
  sensing_date DATE NOT NULL,
  hour_of_day TINYINT NOT NULL,
  pedestrian_count INT NOT NULL,
  sensor_name VARCHAR(100),
  PRIMARY KEY (location_id, sensing_date, hour_of_day),
  CONSTRAINT fk_hourly_sensor FOREIGN KEY (location_id)
    REFERENCES pedestrian_sensor(location_id),
  CHECK (hour_of_day BETWEEN 0 AND 23),
  CHECK (pedestrian_count >= 0)
);

CREATE INDEX idx_hourly_lookup
  ON pedestrian_count_hourly(location_id, hour_of_day, sensing_date);

CREATE TABLE quiet_space_candidate (
  id VARCHAR(32) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(30) NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  source_dataset_id VARCHAR(255) NOT NULL,
  source_category VARCHAR(255) NOT NULL,
  source_record_name VARCHAR(255) NOT NULL,
  source_label VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  CHECK (type IN ('PARK', 'LIBRARY', 'PUBLIC_SPACE'))
);
