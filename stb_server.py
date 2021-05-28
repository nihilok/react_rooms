from pydantic import BaseModel
from typing import List, Optional
import socketio
import hashlib

sio = socketio.AsyncServer(cors_allowed_origins='*', async_mode='asgi')
app = socketio.ASGIApp(sio)

players = {}
rooms = {}


class Player(BaseModel):
    username: Optional[str] = None
    last_sid: str
    last_client_ip: str
    token: Optional[str] = None
    connected: bool = True


class Room(BaseModel):
    room_name: str
    players: List[Player]
    host: str


@sio.event
async def connect(sid, environ, auth):
    player = Player(last_client_ip=environ['asgi.scope']['client'][0], last_sid=sid)
    players[sid] = player


@sio.event
async def get_token(sid):
    player = players.get(sid)
    if player:
        sha_sig = hashlib.sha256((player.last_client_ip).encode('utf-8')).hexdigest()
        player.token = sha_sig
        players[sha_sig] = player
        return sha_sig
    else:
        print('Player not found')


@sio.event
async def connect_error(data):
    print("The connection failed!")


async def get_player_by_sid(sid):
    player = [player for player in players.values() if player.last_sid == sid][0]
    return player


@sio.event
async def disconnect(sid):
    player = await get_player_by_sid(sid)
    for room in rooms.values():
        room_players = [player.username for player in room.players]
        if player.username in room_players:
            player.connected = False
            await sio.emit('update room', room.dict())
    print(f"{player.last_client_ip} disconnected!")


@sio.event
async def new_player(sid: str, room_name: str, username: str, token: str):
    player = players.get(token)
    player = player if player is not None else Player(
        last_sid=sid,
        last_client_ip=None,
    )
    player.username = username
    players[token] = player
    sio.enter_room(sid, room_name)
    if room_name not in rooms.keys():
        room = Room(room_name=room_name, players=[players[token]], host=username)
        rooms[room_name] = room
    else:
        room = rooms[room_name]
        room_players = [player.username for player in room.players]
        if username in room_players:
            if room.players[room_players.index(username)].token == players[token].token:
                room.players[room_players.index(username)].connected = True
                room.players[room_players.index(username)].last_sid = sid
                await sio.emit('update room', room.dict())
            else:
                return {'message': 'username already taken'}
        else:
            room.players.append(players[token])
            await sio.emit('update room', room.dict())
    return room.dict()


@sio.event
async def leave_room(sid: str, room_name: str, token: str):
    sio.leave_room(sid, room_name)
    for player in rooms[room_name].players:
        if player.token == token:                                   # TODO use compare digest
            if rooms[room_name].host == player.username:
                if len(rooms[room_name].players) > 1:
                    rooms[room_name].host = rooms[room_name].players[1].username
            rooms[room_name].players.remove(player)
            await sio.emit('update room', rooms[room_name].dict())
            break
    if len(rooms[room_name].players) == 0:
        del rooms[room_name]
