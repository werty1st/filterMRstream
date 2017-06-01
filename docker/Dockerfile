FROM node:7-alpine

WORKDIR /usr/src/app/
COPY ./ /usr/src/app/

RUN npm install --production

EXPOSE 3000

#build
#docker build -t mr_stream_hs:1.0 .

# rebuild
#docker rmi -f mr_stream_hs:1.0 && docker build -t mr_stream_hs:1.0 .

# debug run
#docker run -it --rm --net=host --entrypoint=/bin/bash -e test="false" -e listenport="3000" mr_stream_hs:1.0 


# IMPORTANT
# on production build include node_modules in the .dockerignore file
# IMPORTANT

# export image
#docker save mr_stream_hs:1.0 | gzip -c > docker/mr_stream_hs.tar.gz

# import image
#gunzip -c mr_stream_hs.tar.gz | docker load


# run image mr_stream_hs:1.0
# env logLevel=info
# env listenport=3000
# env mailserver=mail.dbc.zdf.de
# env mailport=25
# env receiver=adams.r@zdf.de
# port 3000
# restart always
# run npm run live