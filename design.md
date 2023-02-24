# Signal

## Domain Objects

* Room, Conference, Meeting
* Group
* Channel
* User, Attendee, Participant, Host/Moderator, Attendee, Visitor/Guest
* Session
* Device, Endpoint
* Session, MediaSession
* Stream, MediaStream
* Track, MediaStreamTrack

refer to [RFC4575](https://www.rfc-editor.org/rfc/rfc4575.htm)

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

Role

Name |	Description
-----|-----
Moderator	| Host of the meeting, or administrator of room
None| the absence of a role)
Participant | Attendee
Visitor | Guest


## Room Service

Like XMPP MUC(Multi User Chat) - [XEP-0045: Multi-User Chat](https://xmpp.org/extensions/xep-0045.html).
We use Json instead of XMPP to exchange SDP, Command and other message between two peers


* Message format:

```
{
  "type": $type,
  "data": $payload,
  "from": $from_addr
  "to": $to_addr
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
* offer: SDP offer
* answer: SDP answer
* end: close the room or end the meeting
* floor
* message
* publish
* subscribe

# Publish-Subscribe Framework

Inspired by [XEP-0060: Publish-Subscribe](https://xmpp.org/extensions/xep-0060.html)

We can publish messsage or media stream to a group or channel, also can subscribe message or media stream of a group or channel
