SELECT MAX(ST_x(the_geom)) AS toprx, MAX(ST_y(the_geom)) AS topry, MIN(ST_x(the_geom)) AS botlx, MIN(ST_y(the_geom)) AS botly
FROM points
WHERE user_id = 1