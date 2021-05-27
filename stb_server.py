from pydantic import BaseModel
from typing import List
import socketio


sio = socketio.AsyncServer(cors_allowed_origins='*', async_mode='asgi')
app = socketio.ASGIApp(sio)


players = {}
rooms = []


class Player(BaseModel):
    username: str
    last_sid: str
    connected: bool = True


class Room(BaseModel):
    room_name: str
    players: List[Player]
    host: str


@sio.event
async def connect(sid, environ, auth):
    print(environ['asgi.scope']['client'])


@sio.event
async def connect_error(data):
    print("The connection failed!")


@sio.event
async def disconnect(sid):
    for room in rooms:
        room_players = [player.username for player in room.players]
        if players.get(sid) in room_players:
            print(f'found {players.get(sid)}')
            room.players[room_players.index(players[sid])].connected = False
            await sio.emit('update room', room.dict())

    print(f"{sid} disconnected!")


@sio.on('get response')
async def get_response(sid):
    print(sid)
    return 'Hello, world!'


@sio.event
async def new_player(sid: str, room_name: str, username: str):
    player = Player(username=username, last_sid=sid)
    players[sid] = username
    sio.enter_room(sid, room_name)
    room_names = [room.room_name for room in rooms]
    if room_name not in [room.room_name for room in rooms]:
        room = Room(room_name=room_name, players=[player], host=username)
        rooms.append(room)
    else:
        room = rooms[room_names.index(room_name)]
        room.players.append(player)
    if len(room.players) > 0:
        await sio.emit('update room', room.dict())
    return room.dict()