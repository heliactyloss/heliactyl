# Heliactyl

![GitHub commit](https://img.shields.io/github/last-commit/heliactyloss/heliactyl) ![GitHub Release](https://img.shields.io/github/v/release/heliactyloss/heliactyl)

> [!CAUTION]  
> ~~**⚠️ Heliactyl reaches permanent end-of-life on September 1st, 2024 ⚠️**~~
>
> ~~Security releases for Heliactyl 10, 11, 13 ended on July 1st, 2024, and security releases for Heliactyl 12, 14, 18 will end on September 1st, 2024~~
>
> ~~A while ago, we formed an agreement with all maintainers and contributors (excluding Ghostload, we have not contacted him yet) of Heliactyl to end development and support of it by 2025 (as by then, stable [Skyport Panel](https://skyport.dev) releases would be available) however this has been shortened to the start of September~~
> 
> ~~SRYDEN and/or me will not update Heliactyl with any future releases past this date, all users of it are highly recommended to move to something else~~
> 
> ~~**Dashboards such as legacy Dashactyl, HolaClient, NorthClient are Heliactyl-based and are not safe to use, and will not include any recent security patches - you are putting your servers and data at risk by using these**~~
> 
> ~~If the file structure of the dashboard you are looking at has folders named `themes`, `assets`, `misc`, `stuff` or anything similar, it has a high chance of being based on Heliactyl and should not be used~~
> 
> ~~We have delayed this for a long time despite the vulnerabilities, poor code quality and ancient modules in Heliactyl due to the amount of people still using it but this will end on September 1st ~~
>
> ~~**We have built our own panel to replace Pterodactyl and recommend you at least try it out: [Skyport Panel](https://skyport.dev)**~~
> 
> The Heliactyl Team has built a brand new dashboard, Graphene. Learn more [by clicking here](https://github.com/graphenepowered/), launching Oct 2024.

Heliactyl was a high-performance client area for the Pterodactyl Panel. It allows your users to create, edit and delete servers, and also earn coins which can be used to upgrade their servers.

## Get started

You can get started straight away by following these steps:

1. Clone the repo: Run `git clone https://github.com/heliactyloss/heliactyl` on your machine
2. Enter the directory and configure the `settings.json` file - most are optional except the Pterodactyl and OAuth2 settings which **must** be configured
3. Check everything out and make sure you've configured Heliactyl correctly
4. Create SSL certificates for your target domain and set up the NGINX reverse proxy

## NGINX Reverse Proxy

Here's a proxy config that we recommend, however you are free to change it:

```nginx
server {
    listen 80;
    server_name <domain>;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;

    location /ws {
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
      proxy_pass "http://localhost:<port>/ws";
    }

    server_name <domain>;

    ssl_certificate /etc/letsencrypt/live/<domain>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/<domain>/privkey.pem;
    ssl_session_cache shared:SSL:10m;
    ssl_protocols SSLv3 TLSv1 TLSv1.1 TLSv1.2;
    ssl_ciphers  HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
      proxy_pass http://localhost:<port>/;
      proxy_buffering off;
      proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Development Tools

These commands are available:
```
npm run start - starts Heliactyl via nodemon
npm run build - builds TailwindCSS, required for making changes to the UI
```

## Heliactyl API v2

In v14, we've introduced the next generation of Heliactyl's API. You can see the documentation below:

### /api/v2/userinfo

```
Method: GET
Query Parameters:
  - id (string): The user's ID

Response:
  - status (string): "success" or an error message
  - package (object): The user's package details
  - extra (object): The user's additional resources
  - userinfo (object): The user's information from the Pterodactyl panel
  - coins (number | null): The user's coin balance (if coins is enabled)
```

### /api/v2/setcoins

```
Method: POST
Request Body:
  - id (string): The user's ID
  - coins (number): The number of coins to set

Response:
  - status (string): "success" or an error message
```

### /api/v2/setplan

```
Method: POST
Request Body:
  - id (string): The user's ID
  - package (string, optional): The package name (if not provided, the user's package will be removed)

Response:
  - status (string): "success" or an error message
```

### /api/v2/setresources

```
Method: POST
Request Body:
  - id (string): The user's ID
  - ram (number): The amount of RAM to set
  - disk (number): The amount of disk space to set
  - cpu (number): The amount of CPU to set
  - servers (number): The number of servers to set

Response:
  - status (string): "success" or an error message
```
