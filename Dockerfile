# Non-root (UID 101), port 8080 : le cluster refuse root et monte la racine en lecture seule.
FROM nginxinc/nginx-unprivileged:alpine
COPY index.html /usr/share/nginx/html
COPY scripts/ /usr/share/nginx/html/scripts/
COPY avatar.jpg /usr/share/nginx/html
COPY commait.webp /usr/share/nginx/html
COPY devinelemot.webp /usr/share/nginx/html
