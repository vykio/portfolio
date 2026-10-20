# Non-root (UID 101), port 8080 : le cluster refuse root et monte la racine en lecture seule.
FROM nginxinc/nginx-unprivileged:alpine
COPY config/default.conf /etc/nginx/conf.d/default.conf
COPY index.html robots.txt sitemap.xml favicon.ico favicon.svg apple-touch-icon.png /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/
COPY fonts/ /usr/share/nginx/html/fonts/
COPY img/ /usr/share/nginx/html/img/
