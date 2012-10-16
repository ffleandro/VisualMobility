WITH RECURSIVE segments AS (
    SELECT ST_Makeline(pts.the_geom_webmercator) AS the_geom_webmercator,
        ST_Length(ST_Makeline(pts.the_geom_webmercator))/1000 AS distance,
        transport_modes.factor,
        transport_mode,
        (MAX(timestamp)-MIN(timestamp)) AS time,
        pts.track_id,
        pts.path_id AS id,
        pts.user_id
    FROM (SELECT * FROM points ORDER BY track_id, path_id, timestamp ASC) AS pts
        JOIN paths ON pts.path_id=paths.cartodb_id
        JOIN transport_modes ON paths.transport_mode = transport_modes.name
    GROUP BY pts.path_id, pts.track_id, factor, pts.user_id, transport_mode
), starts AS (
    SELECT events.date AS date, events.track_id, events.location_id AS location_id, locations.name AS location_name FROM events JOIN locations ON events.location_id=locations.cartodb_id WHERE events.type='StartTrack'
), ends AS (
    SELECT events.date AS date, events.track_id, events.location_id AS location_id, locations.name AS location_name FROM events JOIN locations ON events.location_id=locations.cartodb_id WHERE events.type='EndTrack'
), tracks AS (
    SELECT
        segments.track_id AS id,
        SUM(distance*factor) AS carbon,
        SUM(distance) AS distance,
        SUM(segments.time) AS time,
        starts.location_id AS start_id,
        ends.location_id AS end_id,
        starts.location_name AS start_name,
        ends.location_name AS end_name,
        starts.date AS start_date,
        ends.date AS end_date,
        user_id
    FROM segments
        JOIN starts ON starts.track_id=segments.track_id
        JOIN ends ON ends.track_id=segments.track_id
    GROUP BY segments.track_id, user_id, start_date, end_date, start_id, end_id, start_name, end_name
), filtered_tracks AS (
    SELECT tracks.distance, start_date
    FROM tracks
    WHERE 
        tracks.user_id = 1
        AND (tracks.carbon >= 0 AND tracks.carbon <= 4000)
        AND (tracks.distance >= 0 AND tracks.distance <= 30)
        AND (extract(hour from tracks.start_date) >= 9 AND extract(hour from tracks.start_date) <= 20)
        AND (tracks.start_name='Casa')
        AND (tracks.end_name='StartupLisboa')
        AND tracks.id IN 
          (SELECT segments.track_id FROM segments WHERE segments.transport_mode='Walk')
), tracks_interval AS (
    SELECT MAX(start_date) AS max, MIN(start_date) AS min
    FROM tracks
    WHERE tracks.user_id = 1
), numbers ( n ) AS (
    SELECT 1 UNION ALL
    SELECT 1 + n FROM numbers WHERE n < 1000
), dates AS (
    SELECT date_trunc('day',  tracks_interval.max) - interval '1 day' * (n-1) AS date
    FROM numbers, tracks_interval
    WHERE date_trunc('day',  tracks_interval.max) - interval '1 day' * (n-1) >= date_trunc('day', tracks_interval.min)
)

SELECT dates.date AS day, SUM(COALESCE(distance, 0)) AS distance
FROM dates
    LEFT OUTER JOIN filtered_tracks ON date_trunc('day', start_date) = date
GROUP BY date
ORDER BY date