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
), tracks_interval AS (
    SELECT MAX(tracks.distance)/20 AS interval, MAX(tracks.distance) AS max
    FROM tracks
    WHERE tracks.user_id = 1
), numbers ( n ) AS (
    SELECT cast(0 as double precision) UNION ALL
    SELECT n + tracks_interval.interval FROM numbers,tracks_interval WHERE n+tracks_interval.interval < tracks_interval.max
), filtered_tracks AS (
    SELECT tracks.distance, interval
    FROM tracks, tracks_interval
    WHERE 
        tracks.user_id = 1
        AND tracks.start_name='Casa' AND tracks.end_name='Casa'
)

SELECT COUNT(filtered_tracks.*), numbers.n
    FROM filtered_tracks
    RIGHT OUTER JOIN numbers ON (filtered_tracks.distance >= numbers.n AND filtered_tracks.distance < numbers.n+filtered_tracks.interval)
    GROUP BY numbers.n
    ORDER BY numbers.n