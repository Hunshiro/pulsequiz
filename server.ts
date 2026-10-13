import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { roomManager } from './server/rooms.ts';
import { ClientMessage } from './src/types/quiz.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  app.use(express.json());

  // WebSocket Server setup
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    let boundRoomCode: string | null = null;
    let boundParticipantId: string | null = null;
    let isHost = false;

    ws.on('message', (data: string) => {
      try {
        const msg: ClientMessage = JSON.parse(data.toString());

        switch (msg.type) {
          case 'HOST_CREATE_ROOM': {
            const { title, questions, settings, adminJoinAsPlayer, adminName, adminAvatar } = msg.payload;
            const created = roomManager.createRoom(
              ws, 
              title, 
              questions, 
              settings, 
              adminJoinAsPlayer !== false, // default to true so admin joins the room too
              adminName || 'Admin (Host)', 
              adminAvatar || '👑'
            );
            boundRoomCode = created.roomCode;
            isHost = true;
            if (created.adminParticipant) {
              boundParticipantId = created.adminParticipant.id;
            }

            ws.send(JSON.stringify({
              type: 'ROOM_CREATED',
              payload: created
            }));
            break;
          }

          case 'HOST_JOIN_AS_PLAYER': {
            const { roomCode, name, avatar } = msg.payload;
            const p = roomManager.joinHostAsPlayer(roomCode, name, avatar);
            if (p) {
              boundParticipantId = p.id;
              const room = roomManager.getRoom(roomCode);
              ws.send(JSON.stringify({
                type: 'JOIN_SUCCESS',
                payload: {
                  roomCode,
                  participantId: p.id,
                  state: roomManager.getPublicRoomState(room!),
                  participant: p
                }
              }));
            }
            break;
          }

          case 'HOST_TOGGLE_AUTO_ADVANCE': {
            const { roomCode } = msg.payload;
            const room = roomManager.getRoom(roomCode);
            if (room) {
              roomManager.toggleAutoAdvance(room);
            }
            break;
          }

          case 'HOST_RECONNECT': {
            const { roomCode, hostToken } = msg.payload;
            const room = roomManager.getRoom(roomCode);
            if (room && room.hostToken === hostToken) {
              room.hostWs = ws;
              boundRoomCode = roomCode;
              isHost = true;

              ws.send(JSON.stringify({
                type: 'STATE_UPDATE',
                payload: roomManager.getPublicRoomState(room)
              }));
            } else {
              ws.send(JSON.stringify({
                type: 'ERROR',
                payload: { message: 'Invalid host credentials or room expired.' }
              }));
            }
            break;
          }

          case 'HOST_START_QUIZ': {
            const { roomCode } = msg.payload;
            const room = roomManager.getRoom(roomCode);
            if (room) {
              roomManager.startQuiz(room);
            }
            break;
          }

          case 'HOST_NEXT_QUESTION': {
            const { roomCode } = msg.payload;
            const room = roomManager.getRoom(roomCode);
            if (room) {
              roomManager.nextAction(room);
            }
            break;
          }

          case 'HOST_REVEAL_ANSWER': {
            const { roomCode } = msg.payload;
            const room = roomManager.getRoom(roomCode);
            if (room && room.phase === 'QUESTION_ACTIVE') {
              roomManager.revealQuestion(room);
            }
            break;
          }

          case 'HOST_SHOW_LEADERBOARD': {
            const { roomCode } = msg.payload;
            const room = roomManager.getRoom(roomCode);
            if (room) {
              roomManager.showIntervalLeaderboard(room);
            }
            break;
          }

          case 'HOST_END_QUIZ': {
            const { roomCode } = msg.payload;
            const room = roomManager.getRoom(roomCode);
            if (room) {
              roomManager.finishQuiz(room);
            }
            break;
          }

          case 'PARTICIPANT_JOIN': {
            const { roomCode, name, avatar, participantId } = msg.payload;
            const joinResult = roomManager.joinRoom(ws, roomCode, name, avatar, participantId);
            if ('error' in joinResult) {
              ws.send(JSON.stringify({
                type: 'JOIN_ERROR',
                payload: { message: joinResult.error }
              }));
            } else {
              boundRoomCode = roomCode;
              boundParticipantId = joinResult.participantId;
              ws.send(JSON.stringify({
                type: 'JOIN_SUCCESS',
                payload: joinResult
              }));
            }
            break;
          }

          case 'PARTICIPANT_SUBMIT_ANSWER': {
            const { roomCode, participantId, questionId, optionId, timeTakenMs } = msg.payload;
            roomManager.submitAnswer(roomCode, participantId, questionId, optionId, timeTakenMs);
            break;
          }

          case 'PING': {
            ws.send(JSON.stringify({ type: 'PONG' }));
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      roomManager.handleDisconnect(ws);
    });

    ws.on('error', (err) => {
      console.error('WebSocket client error:', err);
    });
  });

  // REST API Routes
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.get('/api/room/:code', (req, res) => {
    const code = req.params.code;
    const room = roomManager.getRoom(code);
    if (!room) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }
    res.json({
      code: room.code,
      title: room.title,
      phase: room.phase,
      totalQuestions: room.questions.length,
      participantsCount: room.participants.size
    });
  });

  // Vite middleware in dev or static files in production
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT} (dev: ${!isProduction})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
