# WebRTC Video Chat

webrtc video chat and sharing mini app


# Quick start

* ./start.sh

```
          Name                         Command               State                                                                        Ports
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
selenium-hub                /opt/bin/entry_point.sh          Up      0.0.0.0:4442->4442/tcp,:::4442->4442/tcp, 0.0.0.0:4443->4443/tcp,:::4443->4443/tcp, 0.0.0.0:4444->4444/tcp,:::4444->4444/tcp
webrtc_service              docker-entrypoint.sh npm start   Up      0.0.0.0:8001->8001/tcp,:::8001->8001/tcp, 0.0.0.0:8002->8002/tcp,:::8002->8002/tcp, 0.0.0.0:8003->8003/tcp,:::8003->8003/tcp,
                                                                     0.0.0.0:8043->8043/tcp,:::8043->8043/tcp
webrtcvideochat_chrome_1    /opt/bin/entry_point.sh          Up      0.0.0.0:5900->5900/tcp,:::5900->5900/tcp, 0.0.0.0:7900->7900/tcp,:::7900->7900/tcp
webrtcvideochat_edge_1      /opt/bin/entry_point.sh          Up      0.0.0.0:5901->5900/tcp,:::5901->5900/tcp, 0.0.0.0:7901->7900/tcp,:::7901->7900/tcp
webrtcvideochat_firefox_1   /opt/bin/entry_point.sh          Up      0.0.0.0:5902->5900/tcp,:::5902->5900/tcp, 0.0.0.0:7902->7900/tcp,:::7902->7900/tcp

```

# Test video file

* https://media.xiph.org/video/derf/

* change the y4m to mp4

```
ffmpeg -i akiyo_qcif.y4m -c:v libx264 -preset ultrafast -qp 0 -pix_fmt yuv420p -movflags +faststart akiyo_qcif.mp4
```
