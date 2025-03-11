# mikrotik-pcc-generator
MikroTik v7 LB PCC Generator

Build image

- `docker build -t mikrotik .`

Run container

- `docker run -d -p 3030:3030 --name mikrotik --restart always mikrotik`

Access container with URL: `http://IP_or_domain:3030`
