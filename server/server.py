"""
version 0.2
Refactored to use async redis (aioredis) as cache for objects instead of managing them in dictionaries.
To keep better track of instances the Pydantic models (Room/Player) are recreated from the cache when needed, updated and then
serialized and stored in the cache for when next needed.
See utils.py for redis funcs.
"""

import asyncio
from pprint import pprint
import socketio
from typing import List, Optional
from pydantic import BaseModel

from utils import set_object, get_object, create_token, get_keys, delete_key, set_item, get_item, set_sid

sio = socketio.AsyncServer(cors_allowed_origins='*', async_mode='asgi')
app = socketio.ASGIApp(sio)


class Player(BaseModel):
    last_sid: str
    token: str
    connected: bool = False
    host: bool = False
    username: Optional[str] = None
    room: Optional[str] = None


class Room(BaseModel):
    room_name: str
    players: List[Player]
    host: str
    words: List[str] = []


async def get_room_player(token):
    player = await get_object(token)
    player = Player(**player)
    if player.room:
        room = await get_object(player.room)
        room = Room(**room)
    else:
        room = None
    return room, player


@sio.event
async def connect(sid, environ, auth):
    player = Player(
        last_sid=sid,
        token=await create_token(environ['asgi.scope']['client'][0], environ['asgi.scope']['headers'][1][1])
    )
    await set_object(player.token, player)
    await set_sid(sid, player.token)
    await sio.emit('connected', player.dict(), to=sid)

@sio.event
async def connect_error(data):
    print("Connection failed!")


async def check_duplicate_players(token, room, sid, username):
    for player in room.players:
        if player.token == token:
            room.players.remove(player)
    player = await get_object(token)
    player = Player(**player)
    player.username = username
    player.last_sid = sid
    await set_object(token, player)
    return player


@sio.event
async def new_player(sid: str, room_name: str, username: str, token: str):
    print(token)
    player = await get_object(token)
    player = Player(**player)
    player = player if player is not None else Player(
        last_sid=sid,
        last_client_ip=None,
    )
    pprint(player)
    player.username = username
    player.room = room_name
    player.connected = True
    await set_object(token, player)
    sio.enter_room(sid, room_name)
    keys = await get_keys()
    if room_name not in keys:
        player.host = True
        room = Room(room_name=room_name, players=[player], host=username)
    else:
        room = await get_object(room_name)
        room = Room(**room)
        room_players = [player.username for player in room.players]
        pprint(room_players)
        if username in room_players:
            if room.players[room_players.index(username)].token == token:
                room.players[room_players.index(username)].connected = True
                room.players[room_players.index(username)].last_sid = sid
                await sio.emit('update room', room.dict())
            else:
                return {'message': 'username already taken'}
        else:
            player = await check_duplicate_players(player.token, room, sid, username)
            room.players.append(player)
            await sio.emit('update room', room.dict())
    await set_object(room_name, room)
    await set_object(token, player)
    return {'room': room.dict(), 'player': player.dict()}


async def pass_host(room, player):
    print('Passing host...')
    connected_players = [p for p in room.players if p.connected and not p.host]
    if connected_players:
        player.connected = False
        if player.host:
            player.host = False
            print('getting new host')
            new_host = Player(**await get_object(connected_players[-1].token))
            new_host.host = True
            rp = [p.username for p in room.players]
            room.players[rp.index(new_host.username)] = new_host
            room.host = new_host.username
            await set_object(new_host.token, new_host)
        await set_object(player.token, player)
        return room
    else:
        room_name = room.room_name
        await delete_key(room_name)
        print(f'{room_name} (room) deleted')


@sio.event
async def disconnect(sid):
    token = await get_item(sid)
    room, player = await get_room_player(token)
    if room:
        room_players = [p.username for p in room.players]
        room.players[room_players.index(player.username)] = player
        room = await pass_host(room, player)
        if room:
            await set_object(room.room_name, room)
            await sio.emit('update room', room.dict())
    await delete_key(sid)
    print(f"{player.username or player.token} disconnected!")


@sio.event
async def leave_room(sid: str, room_name: str, token: str):
    sio.leave_room(sid, room_name)
    room, player = await get_room_player(token)
    for _player in room.players:
        if _player.token == token:
            room = await pass_host(room, player)
            if room:
                room.players.remove(_player)
                _player.room = None
                await set_object(player.token, _player)

                if len([p.username for p in room.players if p.connected]):
                    await set_object(room.room_name, room)
                    await sio.emit('update room', room.dict())
                else:
                    room_name = room.room_name
                    await delete_key(room_name)
                    print(f'{room_name} (room) deleted')


if __name__ == '__main__':
    room = Room(room_name='test', players=[Player(last_sid='', last_client_ip='', platform='')], host='')
    asyncio.run(set_object('test_room', room))
    room = Room(**asyncio.run(get_object('test_room')))
    pprint(room.players[0])
