# mikrotik-pcc-generator
MikroTik v7 LB PCC Generator

Clone repository

- `git clone https://github.com/sideka-cloud/mikrotik-pcc-generator.git && cd mikrotik-pcc-generator`

Build image

- `docker build -t mikrotik .`

Run container

- `docker run -d -p 3030:3030 --name mikrotik --restart always mikrotik`

Access container with URL: `http://IP_or_domain:3030`
