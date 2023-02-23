FROM node:latest

# Create app directory
RUN mkdir -p /opt/webrtc_video_chat
# Install app dependencies
COPY package.json /opt/webrtc_video_chat/
COPY index.html /opt/webrtc_video_chat/
COPY web_server.js /opt/webrtc_video_chat/
COPY app /opt/webrtc_video_chat/script/

WORKDIR /opt/webrtc_video_chat
RUN echo $(TZ=UTC-8 date +%Y-%m-%d" "%H:%M:%S) > currentTime

RUN npm install

#EXPOSE 8001 8002 8003 8043
CMD [ "npm", "start" ]

