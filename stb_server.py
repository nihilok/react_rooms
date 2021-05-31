import random

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
    platform: str
    room: Optional[str] = None
    token: Optional[str] = None
    connected: bool = False
    host: bool = False

    def __str__(self):
        return self.username


class Room(BaseModel):
    room_name: str
    players: List[Player]
    host: str
    words: List[str] = []


async def get_player_by_sid(sid):
    player = [player for player in players.values() if player.last_sid == sid][0]
    return player


async def pass_host(room, player):
    if room.host == player.username:
        if len(room.players) > 1:
            connected_clients = [p for p in rooms[room.room_name].players if p.connected]
            if connected_clients:
                rooms[room.room_name].host = connected_clients[-1].username
                connected_clients[-1].host = True
            else:
                del rooms[room.room_name]


@sio.event
async def connect(sid, environ, auth):
    player = Player(last_client_ip=environ['asgi.scope']['client'][0], last_sid=sid, platform=environ['asgi.scope']['headers'][1][1])
    players[sid] = player


@sio.event
async def get_token(sid):
    player = players.get(sid)
    if player:
        sha_sig = hashlib.sha256((player.last_client_ip + player.platform).encode('utf-8')).hexdigest()
        player.token = sha_sig
        players[sha_sig] = player
        print(f'{player.token} connected...')
        del players[sid]
        return sha_sig
    else:
        print('Player not found')


@sio.event
async def connect_error(data):
    print("Connection failed!")


@sio.event
async def disconnect(sid):
    player = await get_player_by_sid(sid)
    room = rooms.get(player.room)
    if room:
        room_players = [p.username for p in room.players]
        if player.username in room_players:
            players[player.token].connected = False
            room.players[room_players.index(player.username)].connected = False
            await pass_host(room, players[player.token])
            await sio.emit('update room', room.dict())
    print(f"{player.username or player.token} disconnected!")


async def check_duplicate_players(token, room, sid, username):
    for player in room.players:
        if player.token == token:
            room.players.remove(player)
    players[token].username = username

@sio.event
async def new_player(sid: str, room_name: str, username: str, token: str):
    player = players.get(token)
    player = player if player is not None else Player(
        last_sid=sid,
        last_client_ip=None,
    )
    player.username = username
    player.room = room_name
    player.connected = True
    players[token] = player
    sio.enter_room(sid, room_name)
    if room_name not in rooms.keys():
        room = Room(room_name=room_name, players=[players[token]], host=username)
        player.host = True
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
            await check_duplicate_players(player.token, room, sid, username)
            room.players.append(players[token])
            await sio.emit('update room', room.dict())
    return {'room': room.dict(), 'player': player.dict()}


@sio.event
async def leave_room(sid: str, room_name: str, token: str):
    for player in rooms[room_name].players:
        if player.token == token:                                   # TODO use compare digest
            await pass_host(rooms[room_name], players[player.token])
            rooms[room_name].players.remove(player)
            player.host = False
            await sio.emit('update room', rooms[room_name].dict())
            break
    sio.leave_room(sid, room_name)
    if len(rooms[room_name].players) == 0:
        del rooms[room_name]
        print(f'room {room_name} deleted')



words = [
    'ambulance',
    'turbulence',
    'tumultuous',
    'ferocious',
    'charged',
    'biometric',
    'forecasting',
    'lecherously',
    'fiendishly',
    'coolant',
    'barking',
    'graph',
    'dog',
    'pears',
    'spot',
]


@sio.event
async def get_word(sid, room_name):
    player = await get_player_by_sid(sid)
    print(players[player.token].username == rooms[room_name].host)
    if players[player.token].username == rooms[room_name].host:
        if not rooms[room_name].words:
            rooms[room_name].words = words
        word = random.choice(rooms[room_name].words)
        anagram = list(word)
        random.shuffle(anagram)
        await sio.emit('receive_word', {'word': word, 'anagram': ''.join(anagram), 'room_name': room_name})
    else:
        await sio.emit('receive_word', {
            'message': 'You have to be the host to get a new word!'
        })

@sio.event
async def check_word(sid, room_name, word, anagram, submission):
    if len(submission) >= len(word):
        submission = submission[:len(word)]
    _anagram = list(anagram)
    for i, l in enumerate(submission):
        if l == word[i]:
            sub = _anagram[i]
            _anagram[_anagram.index(l)] = sub
            _anagram[i] = l
    _anagram = ''.join(_anagram)
    if _anagram != anagram:
        anagram = _anagram
        await sio.emit('receive_word', {'word': word, 'anagram': anagram, 'room_name': room_name})






