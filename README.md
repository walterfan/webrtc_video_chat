# webrtc_video_chat

webrtc video chat for p2p call

# Signal

## Domain Objects

* Conference State, refer to [RFC4575](https://www.rfc-editor.org/rfc/rfc4575.htm)

```
conference-info
     |
     |-- conference-description
     |
     |-- host-info
     |
     |-- conference-state
     |
     |-- users
     |    |-- user
     |    |    |-- endpoint
     |    |    |    |-- media
     |    |    |    |-- media
     |    |    |    |-- call-info
     |    |    |
     |    |    |-- endpoint
     |    |         |-- media
     |    |-- user
     |         |-- endpoint
     |              |-- media
     |

     |-- sidebars-by-ref
     |    |-- entry
     |    |-- entry
     |
     |-- sidebars-by-val
          |-- entry
          |    |-- users
          |         |-- user
          |         |-- user
          |-- entry
               |-- users
                    |-- user
                    |-- user
                    |-- user

```


## Room Service
Like XMPP MUC(Multi User Chat) - [XEP-0045: Multi-User Chat](https://xmpp.org/extensions/xep-0045.html).
We use Json to exchange SDP, Command and other message between two peers


* Message format:

```
{
"type": $type
"data": $payload
}
```

such as:

```
{
    "type": "join"
    "data": {
        "username": $username,
        "password": $password,
        "email": $email
    }
}
```

### message type

* join: join room with basic user info
* leave: leave room
* echo: ask server send back the message it received
* offer
* answer
* bye
* floor
* message
* publish
* subscribe