FROM nginx:alpine
COPY index.html /usr/share/nginx/html
COPY scripts/ /usr/share/nginx/html/scripts/
COPY avatar.jpg /usr/share/nginx/html