# Non-root (UID 101), port 8080 : le cluster refuse root et monte la racine en lecture seule.
FROM nginxinc/nginx-unprivileged:alpine
COPY config/default.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/
COPY img/ /usr/share/nginx/html/img/
