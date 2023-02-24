FROM node:latest

# Create app directory
RUN mkdir -p /opt/webrtc_video_chat
RUN mkdir -p /opt/webrtc_video_chat/app
RUN mkdir -p /opt/webrtc_video_chat/certs
RUN mkdir -p /opt/webrtc_video_chat/css
RUN mkdir -p /opt/webrtc_video_chat/js


# Install app dependencies
COPY package.json /opt/webrtc_video_chat/
COPY index.html /opt/webrtc_video_chat/
COPY web_server.js /opt/webrtc_video_chat/
ADD ./app /opt/webrtc_video_chat/app
ADD ./certs /opt/webrtc_video_chat/certs
ADD ./css /opt/webrtc_video_chat/css
ADD ./js /opt/webrtc_video_chat/js

WORKDIR /opt/webrtc_video_chat
RUN echo $(TZ=UTC-8 date +%Y-%m-%d" "%H:%M:%S) > currentTime
RUN ls -l
RUN npm install

#EXPOSE 8001 8002 8003 8043
CMD [ "npm", "start" ]

