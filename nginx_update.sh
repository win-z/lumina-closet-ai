cat << 'CONFIG' > /www/server/panel/vhost/nginx/lumina-closet.conf
server {
    listen 80;
    server_name 101.37.159.90;

    root /www/wwwroot/lumina-closet/dist;
    index index.html;

    # Do not fallback to index.html for assets to allow browsers to detect missing JS chunks and PWA fallback
    location /assets/ {
        try_files $uri =404;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    # COS 图片代理
    location ^~ /cos-image/ {
        proxy_pass https://5205210-1320011806.cos.ap-guangzhou.myqcloud.com/;
        proxy_ssl_server_name on;
        proxy_set_header Host 5205210-1320011806.cos.ap-guangzhou.myqcloud.com;
    }

    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_read_timeout 300s;
    }
}
CONFIG
systemctl reload nginx || service nginx reload || /etc/init.d/nginx reload || nginx -s reload
